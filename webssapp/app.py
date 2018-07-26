import datetime
import json
import logging
import pprint
from bson import ObjectId
from flask import Flask, render_template, jsonify, g, request, flash, redirect, url_for, session
from flask_login import LoginManager, login_user, logout_user, current_user
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from raven import Client
from werkzeug.security import generate_password_hash, check_password_hash
from webssapp.Schedule import ScheduleProcessor
from pathlib import Path
from webssapp.models import BusinessClient
from webssapp.models.shift_templates import ShiftTemplateCollection, ShiftTemplate
from functools import wraps

app = Flask(__name__)

app.config.update(dict(
    DEBUG=True,
    SECRET_KEY="Peter, that bulge in your pants is causing a tidal wave.",
))

# list of possible levels of seniority
seniority_levels = list(range(10))

today = datetime.date.today()
monday = today - datetime.timedelta(today.weekday())

# instantiates and initializes a login_manager object from the LoginManager class
# more info at https://flask-login.readthedocs.io/en/latest/
login_manager = LoginManager()
login_manager.init_app(app)

#Raven setup (used to send info to Sentry)
client = Client('https://39e5a61f3f7d493da5f2087caa1bdf4a:53334c7ea4a94c9da23e8c83969528bd@sentry.io/1229898')

# create logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# create file handler and set level to info
fh_info = logging.FileHandler(str(Path.home()) + '/scheduling/webssapp/data/logs/fh_info.log', 'w')
fh_info.setLevel(logging.INFO)

# create file handler and set level to debug
fh_debug = logging.FileHandler(str(Path.home()) + '/scheduling/webssapp/data/logs/fh_debug.log', 'w')
fh_debug.setLevel(logging.DEBUG)

# create console handler and set level to info
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)

# create formatter
formatter = logging.Formatter('%(levelname)s: line %(lineno)i in %(funcName)s() (%(asctime)s) - %(message)s')

# add formatter to ch
fh_info.setFormatter(formatter)
fh_debug.setFormatter(formatter)
ch.setFormatter(formatter)

# add ch to logger
logger.addHandler(fh_info)
logger.addHandler(fh_debug)
logger.addHandler(ch)


class User:
    def __init__(self, username, level, id):
        self.username = username
        self.level = level
        self.id = id

    def is_employee(self):
        if self.level.values()[0] == "employee":
            return True
        else:
            return False

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return self.username

    @staticmethod
    def validate_login(password_hash, password):
        return check_password_hash(password_hash, password)


def login_required(roles=["ANY"]):
    def wrapper(fn):
        @wraps(fn)
        def decorated_view(*args, **kwargs):
            if not current_user.is_authenticated():
                return login_manager.unauthorized()
            if (current_user.level[session['business']] not in roles) or (roles == ["ANY"]):
                return login_manager.unauthorized()
            return fn(*args, **kwargs)
        return decorated_view
    return wrapper


@login_manager.user_loader
def load_user(user_id):

    db = get_db()

    user = db.users.find_one({"username": user_id})
    if not user:
        return None

    return User(user['username'], user['level'], user["_id"])


@app.route("/new_user")
def render_new_user():
    return render_template("new_user.html")


@app.route("/create_account", methods=['GET', 'POST'])
def create_account():

    db = get_db()
    users = db.users

    # TODO: error out if fields don't exist rather than returning none since that indicates validation issue
    first_name = request.form.get("first_name", None)
    last_name = request.form.get("last_name", None)
    phone = request.form.get("phone", None)
    username = request.form.get("username", None)
    email = request.form.get('email', None)
    password = request.form.get('password', None)
    level = request.form.get('user_role', None)
    business = request.form.get('business', None)

    pass_hash = generate_password_hash(password, method='pbkdf2:sha256')

    # Check if business exists
    business_client_names = [business['name'] for business in list(db.business_clients.find())]
    print(business_client_names)
    if business not in business_client_names:
        # TODO: Make these messages appear as alerts on the website
        return jsonify({"success": False, "message": 'Sorry, that business name does not exist.'})

    print("Business found, attempting to add account.")

    try:
        users.insert({
            "first_name": first_name,
            "last_name": last_name,
            "phone": phone,
            "username": username,
            "email": email,
            "pwd": pass_hash,
            "level": {business: level}
        })
        session['business'] = business
        print("User created.")

        # Add users id to business client
        business_client = BusinessClient.BusinessClient().load_from_db(db, business)
        for loc in business_client.locations.values():
            loc.add_account(username, level)
        business_client.update_db(db)

        create_employee_entry(first_name, last_name, phone, username, email)

        return jsonify({"success": True, "message": "User added successfully"})
    except DuplicateKeyError:
        print("The user {} already exists").format(username)
        return jsonify({"success": False, "message": "User already created"})


def create_employee_entry(first_name, last_name, phone, username, email):

    db = get_db()
    employees = db.employees

    employees.insert({
        "username": username,
        "name": first_name + " " + last_name,
        "first_name": first_name,
        "last_name": last_name,
        "phone": phone,
        "email": email,
        "min_shifts": 0,
        "max_shifts": 100,
        "seniority": 1,
        "roles": [],
        "inactive": False
    })

    logger.info('%s added to employee database.',
                first_name + ' ' + last_name)


@app.route("/login_page")
def render_login_page():
    return render_template("login.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    db = get_db()

    username = request.form.get("username", None)
    password = request.form.get('password', None)

    user = db.users.find_one({"username": username})
    logger.info("Attempting login: " + user['username'])
    if user and User.validate_login(user['pwd'], password):
        user_obj = User(user['username'], user['level'], user["_id"])
        login_user(user_obj)
        session["logged_in"] = True
        session["username"] = username
        session["business"] = list(user["level"].keys())[0]
        flash("Logged in successfully", category='success')
        logger.info('Login successful: ' + user['username'])
        return jsonify({"success": True, "message": "Logged in successfully.",
                        "level": user["level"][session["business"]]})
    else:
        flash("Wrong username or password", category='error')
        logger.error('Login failed. Incorrect username or password: ' +
                     json.dumps({'username': user['username'], 'password': password}, indent=4))
        return jsonify({"success": False, "message": "Incorrect username or password."})


@app.route('/logout')
def logout():
    logout_user()
    logger.info("User logged out.")
    session['business'] = None
    return redirect(url_for('open_landing_page'))


# opens/makes a connection to the database
def get_db():
    if not hasattr(g, "db_connection"):
        g.db_connection = MongoClient("localhost", 27017)["test"]
    return g.db_connection


# goes into the db collection and returns a list of all existing employees
def get_employees():
    db = get_db()
    employees = db.employees.find()
    return list(employees)


def get_business_employees(client_name):

    db = get_db()

    business_client = get_business_client(client_name)
    print([loc.accounts for loc in business_client.locations.values()])
    business_emps = []
    for loc in business_client.locations.values():
        business_emps += loc.get_all_accounts()

    employees = list(db.employees.find())

    filtered_employees = [emp for emp in employees if emp['username'] in business_emps]
    for emp in filtered_employees:
        emp['_id'] = str(emp['_id'])

    return filtered_employees

@app.route('/_get_business_emp_json')
def get_business_emp_json():
    return jsonify(get_business_employees(session['business']))


def load_employees_by_id(_ids):
    db = get_db()
    return list(db.employees.find({"_id": {"$in": _ids}}))


# goes into collection and returns a dict {emp_id: employee}
def get_employees_dict():
    db = get_db()
    return {str(emp["_id"]): emp for emp in db.employees.find()}


def get_business_client(client_name):
    db = get_db()
    return BusinessClient.BusinessClient().load_from_db(db, client_name)


# adds employee to the database
@app.route("/_add_employee", methods=["POST"])
def add_employee():

    # if form is empty, return jsonify object indicating failure
    if request.json is None:
        logger.error("No employee data submitted: request.json is None.")
        return jsonify({"success": False, "message": "No JSON received by the server."})

    # create new employee entry in collection with the name entered in the form and all other fields default
    db = get_db()
    employees = db.employees
    employees.insert({
        "username": current_user.username,
        "name": request.json['name'],
        "first_name": request.json['first_name'],
        "last_name": request.json['last_name'],
        "min_shifts": request.json['min_shifts'],
        "max_shifts": request.json['max_shifts'],
        "seniority": request.json['seniority'],
        "roles": request.json['roles'],
        "inactive": request.json['inactive']
        })

    logger.info('%s added to employee database.',
                request.json['first_name'] + ' ' + request.json['last_name'])

    # return a jsonify success object1
    return jsonify({"success": True, "message": "Employee added successfully"})


@app.route('/_add_role', methods=['POST'])
def add_role():
    if request.json is None:
        logger.error("No role data submitted: request.json is None.")
        return jsonify({"success": False, "message": "No JSON received by the server."})

    db = get_db()
    db.roles.insert({
        "name": request.json['name'],
        "color": request.json["color"]
    })

    print(list(db.roles.find()))

    print("Role {} has been added to the database.".format(request.json['name']))
    logger.info('%s added to role database.', request.json['name'])

    # return a jsonify success object1
    return jsonify({"success": True, "message": "Role added successfully"})


@app.route('/edit_role', methods=['POST'])
def edit_role():
    db = get_db()
    db.roles.update({"name": request.json['name']},
                    {"$set": {"color": request.json["color"]}}
                    )

    logger.info("Role color updated.")
    logger.debug('Role color updated: ' +
                json.dumps({'name': request.json['name'], 'color': request.json['color']}, indent=4))
    return jsonify({"success": True, "message": "Role updated successfully"})


@app.route("/_save_emp_data", methods=['POST'])
def save_emp_data():

    print('Saving employee data.')

    db = get_db()

    data = request.json['serialized_data']

    vals = data.split("&")

    for val in vals:
        data = val.split("-")

        if len(data) == 3:
            _id, field, week = data
            week, value = week.split("=")
            db.employees.update({"_id": ObjectId(_id)}, {"$set": {"option_entries." + week + "." + field: value}})

        if len(data) == 2:
            _id, field = data
            field, value = field.split("=")
            db.employees.update({"_id": ObjectId(_id)}, {"$set": {"option_entries." + field: value}})

    return jsonify({"success": True, "message": "Data saved successfully"})


@app.route("/landing_page")
def open_landing_page():
    logger.info("Redirecting to /landing_page.")
    return render_template("landing_page.html")


@app.route("/select_schedule")
@login_required(roles=["admin", "owner"])
def select_schedule():
    db = get_db()

    reformatted_today = today.strftime('%m/%d/%Y')

    business_client = get_business_client(session['business'])
    schedule_ids = []
    for loc in business_client.locations.values():
        schedule_ids.append(loc.schedules)
    schedule_ids = [ObjectId(_id) for sublist in schedule_ids for _id in sublist]
    schedules = list(db.schedules.find({'_id': {'$in': schedule_ids}}))

    for schedule in schedules:
        if schedule['start_date'].date() <= today <= schedule['end_date'].date():
            schedule['status'] = 'active'
        elif schedule['start_date'].date() >= today:
            schedule['status'] = 'upcoming'
        else:
            schedule['status'] = 'default'

        db.schedules.update({"_id": schedule["_id"]},
                            {"$set": {
                                "status": schedule["status"]
                            }})

        schedule['start_date'] = schedule['start_date'].strftime('%m/%d/%Y')
        schedule['end_date'] = schedule['end_date'].strftime('%m/%d/%Y')

    logger.info("Redirecting to /select_schedule.")

    return render_template("select_schedule.html", schedules=schedules, today=reformatted_today)


@app.route("/get_user_schedules")
def get_user_schedules():

    db = get_db()
    business_client = get_business_client(session['business'])
    schedule_ids = []
    for loc in business_client.locations.values():
        schedule_ids.append(loc.schedules)
    schedule_ids = [ObjectId(_id) for sublist in schedule_ids for _id in sublist]
    schedules = list(db.schedules.find({'_id': {'$in': schedule_ids}}))
    schedules = [schedule for schedule in schedules if current_user.username in
                 [emp['username'] for emp in schedule['employees']]]

    schedule_dicts = []
    for schedule in schedules:
        if schedule['start_date'].date() <= today <= schedule['end_date'].date():
            schedule['status'] = 'active'
        elif schedule['start_date'].date() >= today:
            schedule['status'] = 'upcoming'
        else:
            schedule['status'] = 'default'

        db.schedules.update({"_id": schedule["_id"]},
                            {"$set": {
                                "status": schedule["status"]
                            }})

        schedule = ScheduleProcessor(schedule)
        schedule_dicts.append(schedule.to_dict())

    info = {"schedule_dicts": schedule_dicts, "username": current_user.username, "id": str(current_user.id)}

    return jsonify(info)


@app.route("/view_schedule/<_id>", methods=['GET'])
@login_required(roles=["admin", "owner"])
def view_schedule(_id=None):
    if _id is None:
        logger.error("Schedule cannot be viewed: No ID associated with selected schedule.")
        return jsonify({"success": False, "message": "No schedule id associated with button."})
    db = get_db()

    schedule = db.schedules.find_one({"_id": ObjectId(_id)})
    if schedule:
        schedule['start_date'] = schedule['start_date'].strftime('%m/%d/%Y')
        schedule['end_date'] = schedule['end_date'].strftime('%m/%d/%Y')
        logger.info("Redirecting to /view_schedule/%s", _id)
        return render_template("/schedule_manager/schedule_manager_base.html", schedule=schedule)
    else:
        logger.error("Schedule ID %s not found in schedules database.", _id)
        return jsonify({"success": False, "message": "Schedule id is not in database."})


@app.route('/load_html/<path:path_to_html>')
def load_html(path_to_html=None):
    
    if path_to_html is None:
        return jsonify({"success": False, "message": "No path specified."})

    return render_template(path_to_html)


@app.route('/add_schedule', methods=["POST"])
def add_schedule():
    schedule = {}

    schedule['_id'] = ObjectId()
    schedule['name'] = request.form.get("schedule_name", None)
    schedule['start_date'] = datetime.datetime.strptime(request.form.get("start", None), '%m/%d/%Y')
    schedule['end_date'] = datetime.datetime.strptime(request.form.get("end", None), '%m/%d/%Y')

    if schedule['start_date'].date() <= today <= schedule['end_date'].date():
        schedule['status'] = 'active'
    elif schedule['start_date'].date() >= today:
        schedule['status'] = 'upcoming'
    else:
        schedule['status'] = 'default'

    db = get_db()
    business_client = BusinessClient.BusinessClient().load_from_db(db, session['business'])
    employee_master = [loc.get_all_accounts() for loc in business_client.locations.values()]
    employee_master = [account for loc in employee_master for account in loc]
    print(employee_master)
    employee_master = list(db.employees.find({"username": {"$in": employee_master}}))

    business_client = get_business_client(session['business'])
    for loc in business_client.locations.values():
        loc.add_schedule(str(schedule['_id']))
    business_client.update_db(db)

    for emp in employee_master:

        emp['master_id'] = emp['_id']
        emp['_id'] = ObjectId()

    schedule['employees'] = employee_master

    delta = schedule['end_date'] - schedule['start_date']
    dates = []
    for i in range(delta.days + 1):
        dates.append(schedule['start_date'] + datetime.timedelta(days=i))

    emp_prefs = []
    for date in dates:
        emp_prefs.append({"date": date, "status": "Empty"})

    prefs = {}
    for emp in employee_master:
        prefs[str(emp['_id'])] = emp_prefs

    schedule["prefs"] = prefs

    schedule = ScheduleProcessor(schedule)
    schedule.save_schedule_data(current_user.username)

    logger.info("New schedule saved.")
    return jsonify({"success": True, "message": "New schedule saved."})


@app.route('/delete_schedule/<_id>', methods=["POST"])
@login_required(roles=["admin", "owner"])
def delete_schedule(_id=None):
    if _id is None:
        logger.error("Schedule cannot be deleted: No ID associated with schedule.")
        return jsonify({"success": False, "message": "No schedule id associated with button."})
    db = get_db()
    db.schedules.remove({"_id": ObjectId(_id)}, {"justOne": True})
    schedules = db.schedules.find({"username": current_user.username})
    logger.info("Schedule removed from database: " +
                json.dumps({"id": _id}, indent=4))
    return render_template("select_schedule.html", schedules=schedules)


@app.route('/employees')
@login_required(roles=["admin", "owner"])
def employee_setup():
    employees = get_employees()

    db = get_db()

    schedules = list(db.schedules.find({"username": current_user.username}))
    for schedule in schedules:
        schedule['start_date'] = schedule['start_date'].strftime('%m/%d/%Y')
        schedule['end_date'] = schedule['end_date'].strftime('%m/%d/%Y')

    logger.info("Redirecting to /employees.")
    return render_template("employee_master.html", employees=employees, schedules=schedules)


@app.route('/roles')
@login_required(roles=["admin", "owner"])
def role_setup():
    db = get_db()

    schedules = list(db.schedules.find({"username": current_user.username}))
    for schedule in schedules:
        schedule['start_date'] = schedule['start_date'].strftime('%m/%d/%Y')
        schedule['end_date'] = schedule['end_date'].strftime('%m/%d/%Y')
    logger.info("Redirecting to /roles.")
    return render_template("role_setup.html", schedules=schedules)


@app.route('/_edit_employees', methods=['POST'])
def edit_employees():
    # gets name from form in add employee modal

    _ids = request.json['_ids']

    # if form is empty, return jsonify object indicating failure
    if request.json is None:
        logger.error("No employee data submitted: request.json is None.")
        return jsonify({"success": False, "message": "No JSON received by the server."})

    db = get_db()

    filtered_dict = {}
    no_change = request.json['no_change']
    for key in request.json.keys():
        if key == 'training' or key == "inactive":
            if no_change:
                continue
            else:
                filtered_dict[key] = request.json[key]
                continue

        if key == 'no_change' or key == '_ids':
            continue

        if request.json[key] != "":
            if request.json[key][0] == "":
                continue

            filtered_dict[key] = request.json[key]

    for key in filtered_dict:
        for _id in _ids:
            print("_id: {} | Key: {} | Value: {}".format(_id, key, filtered_dict[key]))
            db.employees.update({"_id": ObjectId(_id)}, {"$set": {key: filtered_dict[key]}})

    logger.info("Employees' info successfully updated.")
    logger.debug("Employees' info successfully updated: " +
                json.dumps({"ids": _ids}, indent=4))
    # return a jsonify success object
    return jsonify({"success": True, "message": "Employee added successfully"})


@app.route('/api/get_shift_data/<date>/<_id>')
def get_shift_data(date=None, _id=None):
    db = get_db()
    if date is None:
        shifts = db.schedules.find_one({"_id": ObjectId(_id)})["shifts"]
        logger.info("Returning shift data for all schedule dates.")
        return jsonify(shifts)
    if _id is None:
        logger.error("Shift data cannot be found: No schedule associated with ID.")
        return jsonify({"success": False, "message": "No schedule id."})
    date = datetime.datetime.strptime(date, '%m%d%Y')
    shifts = db.schedules.find_one({"_id": ObjectId(_id)})["shifts"]
    shifts_for_day = []
    for shift in shifts:
        if shift['date'] == date.strftime('%m/%d/%Y'):
            shifts_for_day.append(shift)
    logger.info("Returning shift data for date %s", date)
    return jsonify(shifts_for_day)


@app.route('/api/get_all_shift_data/<_id>')
def get_all_shift_data(_id=None):
    db = get_db()
    if _id is None:
        logger.error("Shift data cannot be found: No schedule associated with ID.")
        return jsonify({"success": False, "message": "No schedule id."})
    shifts = db.schedules.find_one({"_id": ObjectId(_id)})["shifts"]
    logger.info("Returning shift data for all schedule dates.")
    return jsonify(shifts)


@app.route("/_api/get_prefs/<_id>")
def _get_prefs(_id=None):
    db = get_db()
    if _id is None:
        logger.error("Preference data cannot be found: No schedule associated with ID.")
        return jsonify({"success": False, "message": "No schedule id."})
    prefs = db.schedules.find_one({"_id": ObjectId(_id)})["prefs"]
    print("----------------")
    pprint.pprint(prefs)
    print("----------------")
    logger.info("Returning preference data for all schedule dates.")
    logger.debug("Returning preference data for all schedule dates: " + json.dumps(prefs, indent=4))
    return jsonify(prefs)


@app.route('/_api/get_shifts/<_id>')
def _get_shifts(_id=None):
    db = get_db()
    if _id is None:
        logger.error("Shift data cannot be found: No schedule associated with ID.")
        return jsonify({"success": False, "message": "No schedule id."})
    shifts = db.schedules.find_one({"_id": ObjectId(_id)})["shifts"]
    employees = get_employees()
    for emp in employees:
        emp["_id"] = str(emp["_id"])
    logger.info("Returning shift data for schedule %s.", _id)
    logger.debug("Returning shift data for schedule %s: " + json.dumps([shifts, employees], indent=4), _id)
    return jsonify([shifts, employees])


@app.route('/_api/get_employees')
def _get_employees():

    employees = get_employees()
    for emp in employees:
        emp["_id"] = str(emp["_id"])

    print(employees)
    logger.info("Returning master employees.")
    logger.debug("Returning master employees: " + json.dumps(employees, indent=4))
    return jsonify(employees)


@app.route('/_api/get_roles')
def _get_roles():
    db = get_db()
    roles = list(db.roles.find())
    for role in roles:
        role["_id"] = str(role["_id"])
    logger.info("Returning master roles.")
    logger.debug("Returning master roles: " + json.dumps(roles, indent=4))
    return jsonify(roles)


@app.route('/save_shift_data', methods=["POST"])
def save_shift_data():
    schedule_id = request.json["schedule_id"]
    date = request.json["date"]
    role = request.json["role"]
    number_emps = int(request.json["num_employees"])
    start = request.json["start"]
    end = request.json["end"]
    shift_id = request.json["_id"]
    parent_shift = request.json["parent_shift"]
    recurrence_dates = request.json["recurrence_dates"]
    db = get_db()

    if date in recurrence_dates:
        recurrence_dates.remove(date)

    print('Saving shift data.')

    entry = {"_id": shift_id,
             "start": start,
             "end": end,
             "num_employees": number_emps,
             "role": role,
             "date": date,
             "parent_shift": parent_shift}

    db.schedules.update({'_id': ObjectId(schedule_id)},
                        {'$pull': {'shifts': {'_id': entry['_id']}}})
    db.schedules.update({'_id': ObjectId(schedule_id)},
                        {'$push': {"shifts": entry}})

    logger.info("Saved shift data to database.")

    emp_ids = []
    prefs = dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})["prefs"])
    for emp in list(db.schedules.find_one({'_id': ObjectId(schedule_id)})["employees"]):
        pprint.pprint(emp["roles"])
        emp_roles = [role['role_name'] for role in emp['roles']]
        emp_ids.append([str(emp['_id']), emp_roles])

    print("Updating eligible shifts.")
    pprint.pprint(emp_ids)
    for emp_id in emp_ids:
        if role in emp_id[1]:
            for day in prefs[emp_id[0]]:
                print(day["date"] == datetime.datetime.strptime(date, '%m/%d/%Y'))
                if day["date"] == datetime.datetime.strptime(date, '%m/%d/%Y'):
                    if day["status"] == "Unavailable":
                        day[shift_id] = -1000
                    elif day["status"] == "Available":
                        day[shift_id] = 5
                    else:
                        day[shift_id] = 1
                    db.schedules.update({'_id': ObjectId(schedule_id)},
                                        {'$pull': {"prefs." + emp_id[0]: {'date': datetime.datetime.strptime(date, '%m/%d/%Y')}}})
                    db.schedules.update({'_id': ObjectId(schedule_id)},
                                        {'$push': {"prefs." + emp_id[0]: day}})

    logger.info("Updated employee eligibility.")

    date_id_for_callback = [[date, shift_id]]

    for date in recurrence_dates:
        entry["date"] = date
        entry["_id"] = str(ObjectId())
        date_id_for_callback.append([entry["date"], entry["_id"]])
        db.schedules.update({'_id': ObjectId(schedule_id)},
                            {'$push': {"shifts": entry}})

        for emp_id in emp_ids:
            if role in emp_id[1]:
                for day in prefs[emp_id[0]]:
                    if day["date"] == datetime.datetime.strptime(date, '%m/%d/%Y'):
                        if day["status"] == "Unavailable":
                            day[entry["_id"]] = -1000
                        elif day["status"] == "Available":
                            day[entry["_id"]] = 5
                        else:
                            day[entry["_id"]] = 1
                        db.schedules.update({'_id': ObjectId(schedule_id)},
                                            {'$pull': {"prefs." + emp_id[0]: {
                                                'date': datetime.datetime.strptime(date, '%m/%d/%Y')}}})
                        db.schedules.update({'_id': ObjectId(schedule_id)},
                                            {'$push': {"prefs." + emp_id[0]: day}})

    logger.info("Updated employee eligibility for recurring shifts.")
    print("+++++++++++++++++++++++++++")
    pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})))
    print("+++++++++++++++++++++++++++")

    return jsonify(date_id_for_callback)


@app.route('/update_shift_data', methods=['POST'])
def update_shift_data():
    schedule_id = request.json["schedule_id"]
    date = request.json["date"]
    role = request.json["role"]
    number_emps = int(request.json["num_employees"])
    start = request.json["start"]
    end = request.json["end"]
    shift_id = request.json["_id"]
    parent_shift = request.json["parent_shift"]
    edit_type = request.json["edit_type"]

    db = get_db()
    shifts = list(db.schedules.find_one({"_id": ObjectId(schedule_id)})["shifts"])
    role_to_be_updated = ""
    for shift in shifts:
        if shift["_id"] == shift_id:
            role_to_be_updated = shift["role"]
            break

    date_id_for_callback = [[date, shift_id]]

    entry = {"_id": shift_id,
             "start": start,
             "end": end,
             "num_employees": number_emps,
             "role": role,
             "date": date,
             "parent_shift": parent_shift}

    emp_ids = []
    prefs = dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})["prefs"])
    for emp in list(db.schedules.find_one({'_id': ObjectId(schedule_id)})["employees"]):
        emp_roles = [role['role_name'] for role in emp['roles']]
        emp_ids.append([str(emp['_id']), emp_roles])

    if edit_type == "Apply":
        db.schedules.update({'_id': ObjectId(schedule_id)},
                            {'$pull': {'shifts': {'_id': entry['_id']}}})
        db.schedules.update({'_id': ObjectId(schedule_id)},
                            {'$push': {"shifts": entry}})

        if role_to_be_updated != role:
            for emp_id in emp_ids:
                if role in emp_id[1]:
                    for day in prefs[emp_id[0]]:
                        if day["date"] == datetime.datetime.strptime(date, '%m/%d/%Y'):
                            if day["status"] == "Unavailable":
                                day[shift_id] = -1000
                            elif day["status"] == "Available":
                                day[shift_id] = 5
                            else:
                                day[shift_id] = 1
                            db.schedules.update({'_id': ObjectId(schedule_id)},
                                                {'$pull': {"prefs." + emp_id[0]: {
                                                    'date': datetime.datetime.strptime(date, '%m/%d/%Y')}}})
                            db.schedules.update({'_id': ObjectId(schedule_id)},
                                                {'$push': {"prefs." + emp_id[0]: day}})

        print("+++++++++++++++++++++++++++")
        pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})))
        print("+++++++++++++++++++++++++++")
        logger.info("Changes applied to shift with ID %s.", shift_id)
        return jsonify({"date_id": date_id_for_callback, "edit_type": edit_type})

    if edit_type == "Apply All":
        for shift in shifts:
            if shift["role"] == role_to_be_updated:
                db.schedules.update({'shifts._id': shift["_id"]},
                                    {'$set': {'shifts.$.role': entry['role']}})
                db.schedules.update({'shifts._id': shift["_id"]},
                                    {'$set': {'shifts.$.start': entry['start']}})
                db.schedules.update({'shifts._id': shift["_id"]},
                                    {'$set': {'shifts.$.end': entry['end']}})
                db.schedules.update({'shifts._id': shift["_id"]},
                                    {'$set': {'shifts.$.num_employees': entry['num_employees']}})
                date_id_for_callback.append([shift["date"], shift["_id"]])

                if role_to_be_updated != role:
                    for emp_id in emp_ids:
                        if role in emp_id[1]:
                            for day in prefs[emp_id[0]]:
                                if day["date"] == datetime.datetime.strptime(shift["date"], '%m/%d/%Y'):
                                    del day[shift_id]
                                    if day["status"] == "Unavailable":
                                        day[shift["_id"]] = -1000
                                    elif day["status"] == "Available":
                                        day[shift["_id"]] = 5
                                    else:
                                        day[shift["_id"]] = 1
                                    db.schedules.update({'_id': ObjectId(schedule_id)},
                                                        {'$pull': {"prefs." + emp_id[0]: {
                                                            'date': datetime.datetime.strptime(shift["date"], '%m/%d/%Y')}}})
                                    db.schedules.update({'_id': ObjectId(schedule_id)},
                                                        {'$push': {"prefs." + emp_id[0]: day}})

        print("+++++++++++++++++++++++++++")
        pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})))
        print("+++++++++++++++++++++++++++")
        logger.info("Changes applied to all shifts with role %s.", role_to_be_updated)
        return jsonify({"date_id": date_id_for_callback, "edit_type": edit_type})

    if edit_type == "Delete":
        db.schedules.update({'_id': ObjectId(schedule_id)},
                            {'$pull': {'shifts': {'_id': entry['_id']}}})

        for emp_id in emp_ids:
            if role in emp_id[1]:
                for day in prefs[emp_id[0]]:
                    if day["date"] == datetime.datetime.strptime(date, '%m/%d/%Y'):
                        del day[shift_id]
                        db.schedules.update({'_id': ObjectId(schedule_id)},
                                            {'$pull': {"prefs." + emp_id[0]: {
                                                'date': datetime.datetime.strptime(date, '%m/%d/%Y')}}})
                        db.schedules.update({'_id': ObjectId(schedule_id)},
                                            {'$push': {"prefs." + emp_id[0]: day}})

        print("+++++++++++++++++++++++++++")
        pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})))
        print("+++++++++++++++++++++++++++")
        logger.info("Deleted shift with ID %s.", shift_id)
        return jsonify({"date_id": date_id_for_callback, "edit_type": edit_type})

    if edit_type == "Delete All":
        for shift in shifts:
            if shift["role"] == role_to_be_updated:
                db.schedules.update({'_id': ObjectId(schedule_id)},
                                    {'$pull': {'shifts': {'_id': shift['_id']}}})
                date_id_for_callback.append([shift["date"], shift["_id"]])

                for emp_id in emp_ids:
                    if role in emp_id[1]:
                        for day in prefs[emp_id[0]]:
                            if day["date"] == datetime.datetime.strptime(shift["date"], '%m/%d/%Y'):
                                pprint.pprint(day)
                                if shift["_id"] in day:
                                    del day[shift["_id"]]
                                db.schedules.update({'_id': ObjectId(schedule_id)},
                                                    {'$pull': {"prefs." + emp_id[0]: {
                                                        'date': datetime.datetime.strptime(shift["date"], '%m/%d/%Y')}}})
                                db.schedules.update({'_id': ObjectId(schedule_id)},
                                                    {'$push': {"prefs." + emp_id[0]: day}})

        print("+++++++++++++++++++++++++++")
        pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})))
        print("+++++++++++++++++++++++++++")
        logger.info("Deleted all shifts with role %s.", role_to_be_updated)
        return jsonify({"date_id": date_id_for_callback, "edit_type": edit_type})

    print("+++++++++++++++++++++++++++")
    pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})))
    print("+++++++++++++++++++++++++++")
    logger.error("Shift update failed: No changes applied.")

    return jsonify({"success": False, "message": "Failed to apply any changes."})


@app.route('/save_pref_data', methods=['POST'])
def save_pref_data():
    pref_data = request.json["pref_data"]
    employee = request.json["employee"]

    _id = request.json["_id"]
    db = get_db()
    db.schedules.update({"_id": ObjectId(_id)},
                        {"$set": {"prefs." + employee: pref_data[employee]}})
    logger.info("Preferences saved for employee with ID %s.", employee)
    return jsonify({"success": True, "message": "Database updated with prefs."})


@app.route('/update_pref', methods=['POST'])
def update_pref():
    status = request.json["status"]
    date = request.json["date"]
    emp_id = request.json["emp_id"]
    schedule_id = request.json["schedule_id"]

    db = get_db()

    prefs = dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})["prefs"])

    for day in prefs[emp_id]:
        if day["date"] == datetime.datetime.strptime(date, '%m/%d/%Y'):
            day["status"] = status
            db.schedules.update({'_id': ObjectId(schedule_id)},
                                {'$pull':
                                     {"prefs." + emp_id: {'date': datetime.datetime.strptime(date, '%m/%d/%Y')}}})
            db.schedules.update({'_id': ObjectId(schedule_id)},
                                {'$push': {"prefs." + emp_id: day}})

    logger.info("Day preference updated for employee with ID %s.", emp_id)
    return jsonify({"success": True, "message": "Database updated with new day preference."})


@app.route('/update_shift_pref', methods=['POST'])
def update_shift_pref():
    date = request.json["date"]
    emp_id = request.json["emp_id"]
    schedule_id = request.json["schedule_id"]
    pref = request.json["pref"]
    shift_id = request.json["shift_id"]
    status = "Available"

    db = get_db()

    prefs = dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})["prefs"])

    for day in prefs[emp_id]:
        if day["date"] == datetime.datetime.strptime(date, '%m/%d/%Y'):
            day[shift_id] = pref
            day["status"] = status
            db.schedules.update({'_id': ObjectId(schedule_id)},
                                {'$pull':
                                     {"prefs." + emp_id: {'date': datetime.datetime.strptime(date, '%m/%d/%Y')}}})
            db.schedules.update({'_id': ObjectId(schedule_id)},
                                {'$push': {"prefs." + emp_id: day}})

    logger.info("Shift preference updated for employee with ID %s.", emp_id)
    return jsonify({"success": True, "message": "Database updated with new day preference."})


@app.route('/settings')
@login_required(roles=["admin", "owner"])
def settings():
    logger.info("Redirecting to /settings.")
    return render_template("settings.html")


@app.route('/clear_database')
def clear():
    db = get_db()
    db.employees.delete_many({})
    db.users.delete_many({})
    db.schedules.delete_many({})
    db.business_clients.delete_many({})
    return render_template('landing_page.html')


@app.route('/_remove_schedule_shifts', methods=['POST'])
def remove_schedule_shifts():
    db = get_db()

    post_data = request.get_json()

    for _id in post_data['_ids']:
        schedule_name = dict(db.schedules.find_one({"_id": ObjectId(post_data["schedule_id"])}))['name']
        print("Removing shift: {} from schedule: {}".format(_id, schedule_name))
        db.schedules.update({"_id": ObjectId(post_data["schedule_id"])},
                            {"$pull": {"shifts": {"_id": _id}}})

    logger.info("Removed selected shifts from schedule.")
    return jsonify({"success": True, "message": "Request received by server."})


@app.route('/_remove_schedule_employees', methods=['POST'])
def remove_schedule_employees():
    db = get_db()

    post_data = request.get_json()

    for _id in post_data['_ids']:
        schedule_name = dict(db.schedules.find_one({"_id": ObjectId(post_data["schedule_id"])}))['name']
        print("Removing emp: {} from schedule: {}".format(_id, schedule_name))
        db.schedules.update({"employees._id": ObjectId(_id)}, {"$unset": {"prefs." + _id: 1}})
        db.schedules.update({"employees._id": ObjectId(_id)}, {"$pull": {"employees": {"_id": ObjectId(_id)}}})

    pprint.pprint(dict(db.schedules.find_one({"_id": ObjectId(post_data["schedule_id"])})))

    logger.info("Removed selected employees from schedule.")
    return jsonify({"success": True, "message": "Request received by server."})


@app.route('/_remove_employees', methods=['POST'])
def remove_employees():

    db = get_db()

    post_data = request.get_json()

    for _id in post_data['_ids']:

        print("Removing {} from MASTER".format(_id))
        db.employees.remove({"_id": ObjectId(_id)})

    logger.info("Removed selected employees from master list.")
    return jsonify({"success": True, "message": "Request received by server."})


@app.route('/_remove_roles', methods=['POST'])
def remove_roles():

    db = get_db()

    post_data = request.get_json()
    print(post_data)

    for _id in post_data['_ids']:
        print("Removing role: {}".format(_id))
        db.roles.remove({"_id": ObjectId(_id)})

    logger.info("Removed selected roles from master list.")
    return jsonify({"success": True, "message": "Request received by server."})


@app.route('/edit_schedule_status', methods=['POST'])
def edit_schedule_status():
    status = request.form.get("status", None)
    id = request.form.get("_id", None)
    db = get_db()
    db.schedules.update({"_id": ObjectId(id)},
                        {"$set": {
                            "status": status
                        }})

    logger.info("Updated schedule status to %s.", status)
    return jsonify({"success": True, "message": "Schedule status updated."})


@app.route('/_edit_schedule_employees', methods=['POST'])
def edit_schedule_employees():
    # gets name from form in add employee modal
    _ids = request.json['_ids']
    schedule_id = request.json['schedule_id']
    roles = request.json['roles']
    emp_eligible_role_names = [role['role_name'] for role in roles]

    # if form is empty, return json object indicating failure
    if request.json is None:
        return jsonify({"success": False, "message": "No JSON received by the server."})

    db = get_db()
    schedule = db.schedules.find_one({'_id': ObjectId(request.json['schedule_id'])})

    emps_to_edit = [emp for emp in schedule['employees'] if str(emp['_id']) in _ids]

    pprint.pprint(request.json)

    filtered_dict = {}
    for key in request.json.keys():

        if key == "_ids" or key == "change_roles":
            continue

        if key == "roles":
            if request.json["change_roles"]:
                filtered_dict[key] = request.json[key]
            continue

        if request.json[key] != "":
            filtered_dict[key] = request.json[key]

    for key in filtered_dict:
        for emp in emps_to_edit:
            emp[key] = filtered_dict[key]
            db.schedules.update({'employees._id': ObjectId(emp['_id'])}, {'$pull': {"employees":
                                                                                   {'_id': ObjectId(emp['_id'])}}})
            db.schedules.update({'_id': ObjectId(request.json['schedule_id'])}, {'$push': {"employees": emp}})

    logger.info("Updated selected employee information.")

    if request.json['change_roles']:
        emp_ids = []
        prefs = dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})["prefs"])
        shifts = list(db.schedules.find_one({'_id': ObjectId(schedule_id)})["shifts"])
        shifts_to_add = []
        shifts_to_remove = []
        for shift in shifts:
            if shift["role"] in emp_eligible_role_names:
                shifts_to_add.append([shift["_id"], shift["date"]])
            elif shift["role"] not in emp_eligible_role_names:
                shifts_to_remove.append(shift["_id"])
        for employee_id in _ids:
            emp_ids.append([employee_id, roles])
        for emp_id in emp_ids:
            for day in prefs[emp_id[0]]:
                for shift_to_remove in shifts_to_remove:
                    if shift_to_remove in day:
                        del day[shift_to_remove]
                for shift_to_add in shifts_to_add:
                    if shift_to_add[0] not in day and day["date"] == datetime.datetime.strptime(shift_to_add[1], '%m/%d/%Y'):
                        if day["status"] == "Unavailable":
                            day[shift_to_add[0]] = -1000
                        elif day["status"] == "Available":
                            day[shift_to_add[0]] = 5
                        else:
                            day[shift_to_add[0]] = 1
                db.schedules.update({'_id': ObjectId(schedule_id)},
                                    {'$pull': {"prefs." + emp_id[0]:
                                                   {'date': day["date"]}}})
                db.schedules.update({'_id': ObjectId(schedule_id)},
                                    {'$push': {"prefs." + emp_id[0]: day}})

    print("+++++++++++++++++++++++++++")
    pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})))
    print("+++++++++++++++++++++++++++")
    logger.info("Updated selected employee preferences.")

    # return a jsonify success object
    return jsonify({"success": True, "message": "Employee added successfully"})


@app.route('/_add_emps_to_schedule', methods=['POST'])
def add_emps_to_schedule():

    db = get_db()
    employees = list(db.employees.find())

    emps_to_add = [emp for emp in employees if str(emp['_id']) in request.json['_ids']]

    for emp in emps_to_add:
        emp['master_id'] = emp['_id']
        emp['_id'] = ObjectId()
        emp['inactive'] = False

        db.schedules.update({'_id': ObjectId(request.json['schedule_id'])}, {'$push': {'employees': emp}})

    logger.info("Employee(s) added to schedule.")

    schedule_dates = list(db.schedules.find_one({'_id': ObjectId(request.json['schedule_id'])})["days"])
    shifts = list(db.schedules.find_one({'_id': ObjectId(request.json['schedule_id'])})["shifts"])

    for emp in emps_to_add:
        emp_prefs = []
        for date in schedule_dates:
            emp_prefs.append({"date": date, "status": "Empty"})
        emp_role_names = [role['role_name'] for role in emp['roles']]
        pprint.pprint(emp_role_names)
        for shift in shifts:
            if shift["role"] in emp_role_names:
                for day in emp_prefs:
                    if day["date"] == datetime.datetime.strptime(shift["date"], '%m/%d/%Y'):
                        if day["status"] == "Unavailable":
                            day[shift["_id"]] = -1000
                        elif day["status"] == "Available":
                            day[shift["_id"]] = 5
                        else:
                            day[shift["_id"]] = 1
        db.schedules.update({'_id': ObjectId(request.json['schedule_id'])},
                                {'$set': {"prefs." + str(emp["_id"]): emp_prefs}})

    print("+++++++++++++++++++++++++++")
    pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(request.json['schedule_id'])})))
    print("+++++++++++++++++++++++++++")
    logger.info("Default preferences added for new employee(s).")

    return jsonify({"success": True, "message": "Employee added successfully"})


@app.route('/api/get_employees')
def send_all_employees_json():

    db = get_db()
    employees = list(db.employees.find())

    for employee in employees:
        employee['_id'] = str(employee['_id'])
    print(employees)
    logger.info("Returning all employee data as JSON.")
    return jsonify(employees)


# Returns a JSON object containing the employees who are on the master list but not on the schedule list
@app.route('/_get_employee_delta/<schedule_id>')
def get_employee_delta(schedule_id=None):

    if schedule_id is None:
        return jsonify({"success": False, "message": "You must provide a schedule id to get the associated employees."})

    db = get_db()
    master_emps = list(db.employees.find())
    schedule_emps = list(db.schedules.find_one({'_id': ObjectId(schedule_id)})['employees'])
    schedule_emp_ids = [schedule_emp['master_id'] for schedule_emp in schedule_emps]

    delta = []

    for emp in master_emps:
        if emp['_id'] not in schedule_emp_ids:
            delta.append(emp)

    for emp in delta:
        emp['_id'] = str(emp['_id'])

    logger.info("Returning all data for employees in master list and not in schedule list as JSON.")
    return jsonify(delta)


@app.route('/api/get_schedule/<schedule_id>')
def get_schedule_json(schedule_id=None):

    if schedule_id is None:
        return jsonify({"success": False, "message": "You must provide a schedule id to get the associated employees."})

    db = get_db()
    print("Getting schedule JSON for schedule with _id: {}".format(schedule_id))
    schedule = dict(db.schedules.find_one({"_id": ObjectId(schedule_id)}))

    # TODO: Make this traverse the schedule to find and change any objectids rather than hardcoding
    schedule['_id'] = str(schedule['_id'])

    for emp in schedule['employees']:
        for key in emp.keys():
            if "_id" in key:
                emp[key] = str(emp[key])

    logger.info("Returning all schedule data as JSON.")
    return jsonify(schedule)


@app.route('/api/get_sorted_schedule/<schedule_id>')
def get_sorted_schedule(schedule_id=None):
    if schedule_id is None:
        return jsonify({"success": False, "message": "You must provide a schedule id to get the associated schedule."})

    db = get_db()
    print("Getting schedule JSON for schedule with _id: {}".format(schedule_id))
    schedule_dict = dict(db.schedules.find_one({"_id": ObjectId(schedule_id)}))

    # TODO: Make this traverse the schedule to find and change any objectids rather than hardcoding
    schedule_dict['_id'] = str(schedule_dict['_id'])

    emps = schedule_dict["employees"]
    prefs = schedule_dict["prefs"]


    for emp in emps:
        days = prefs[str(emp["_id"])]
        for day in days:
            datetime_day = day["date"]
            day["date"] = datetime_day.strftime("%m/%d/%Y")


    schedule = ScheduleProcessor(schedule_dict)
    schedule.sort('shifts', 'chronological')
    logger.info("Returning schedule with chronologically sorted shifts as JSON.")
    return jsonify(schedule.to_dict())


@app.route('/api/create_schedule/<schedule_id>')
def create_schedule(schedule_id=None):

    print("Creating schedule.")

    if schedule_id is None:
        return jsonify({"success": False, "message": "No schedule id in URL."})

    db = get_db()
    schedule_dict = dict(db.schedules.find_one({"_id": ObjectId(schedule_id)}))
    pprint.pprint(schedule_dict)

    roles = list(db.roles.find())
    schedule_dict['roles'] = [role['name'] for role in roles]

    schedule = ScheduleProcessor(schedule_dict)
    schedule.preprocess()
    schedule.build_schedule()
    print('Schedule output created.')
    schedule.to_csv()

    return jsonify(schedule.to_dict())


@app.route('/_change_shift_assignment', methods=['POST'])
def change_shift_assignment():

    schedule_id = request.json['schedule_id']
    date = request.json['date']
    emp_id = request.json['emp_id']
    shift = request.json['shift']

    db = get_db()

    schedule = dict(db.schedules.find_one({'_id': ObjectId(schedule_id)}))
    output = schedule['output']

    dates = [day.strftime("%m/%d/%Y") for day in schedule['days']]
    print(dates)
    day_index = dates.index(date)

    emp_index = schedule['employees'].index(next((emp for emp in schedule['employees'] if str(emp['_id']) == emp_id)))
    print(day_index, emp_index)

    emps_work_for_day = {}
    if shift == "OFF":
        emps_work_for_day = {"working": False}
    else:
        emps_work_for_day = {
            "working": True,
            "employee_id": emp_id,
            "shift_id": shift['_id'],
            "role": list(schedule["roles"].values()).index(shift["role"]),
            "declined": False,
            "shift": shift['start'] + "-" + shift['end']}
    print(emps_work_for_day)
    output[emp_index][day_index] = emps_work_for_day
    pprint.pprint(output)

    db.schedules.update({'_id': ObjectId(schedule_id)}, {'$set': {'output': output}})
    schedule = dict(db.schedules.find_one({'_id': ObjectId(schedule_id)}))
    pprint.pprint(schedule)
    schedule = ScheduleProcessor(schedule)
    schedule.preprocess()

    return jsonify(schedule.to_dict())


@app.route("/check_errors/<schedule_id>")
def check_schedule(schedule_id=None):

    if schedule_id is None:
        return jsonify({"success": False, "message": "No schedule id in URL."})
    db = get_db()
    schedule_dict = dict(db.schedules.find_one({"_id": ObjectId(schedule_id)}))
    schedule = ScheduleProcessor(schedule_dict)

    return jsonify(schedule.check_errors())


@app.route("/_log_to_server")
def log_to_server():
    source = request.json['source']
    level = request.json['level']
    msg = request.json['msg']
    json_data = request.json['json_data']

    if level == "debug":
        logger.debug(msg)
    elif level == "info":
        logger.info(msg)
    elif level == "warning":
        logger.warning(msg)
    elif level == "error":
        logger.error(msg)
    elif level == "critical":
        logger.critical(msg)


@app.route("/employee_portal")
@login_required(roles=["admin", "owner", "employee"])
def render_emp_portal():
    return render_template("/employee_portal/emp_portal_base.html")


def build_test_client(client_name):
    with app.app_context():
        db = get_db()
        if not db.business_clients.find().count() > 0:
            new_client = BusinessClient.BusinessClient(client_name)
            new_loc = build_test_location('Squamish')
            new_client.add_location(new_loc)
            new_client.save_new_client(db)
        else:
            print("Skipping test BusinessClient creation, businesses exist.")


def build_test_location(loc_name):
    return BusinessClient.BusinessLocation(loc_name)


# error pages
@app.errorhandler(401)
def unauthorized(e):
    return render_template("/error_pages/401.html"), 401


@app.errorhandler(404)
def page_not_found(e):
    return render_template("/error_pages/404.html"), 404


@app.errorhandler(500)
def internal_server_error(e):
    return render_template("/error_pages/404.html"), 500


@app.route("/get_shift_templates")
def get_shift_templates():
    db = get_db()
    business_templates = list(db.shift_templates.find({"business_client": session['business']}))
    if business_templates:
        return jsonify({"success": True, "message": "Retrieved shift templates.",
                        "templates": ShiftTemplateCollection().load_dicts(business_templates)})
    else:
        return jsonify({"success": True, "message": "Retrieved shift templates.",
                        "templates": []})

@app.route("/save_shift_template")
def save_shift_template():
    pass

@app.route("/apply_shift_template")
def apply_shift_template():
    pass

build_test_client('Zephyr Cafe')

