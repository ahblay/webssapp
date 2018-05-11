from flask import Flask, render_template, jsonify, g, request, flash, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson import json_util, ObjectId
from Schedule import ScheduleProcessor
import pprint
from flask_scss import Scss

app = Flask(__name__)
Scss(app, static_dir='static', asset_dir='assets')
app.secret_key = "Peter, that bulge in your pants is causing a tidal wave."

app.config["TEMPLATES_AUTO_RELOAD"] = True

# list of possible levels of seniority
seniority_levels = list(range(10))

today = datetime.date.today()
monday = today - datetime.timedelta(today.weekday())

# instantiates and initializes a login_manager object from the LoginManager class
# more info at https://flask-login.readthedocs.io/en/latest/
login_manager = LoginManager()
login_manager.init_app(app)


class User():

    def __init__(self, username):
        self.username = username

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


@login_manager.user_loader
def load_user(user_id):

    db = get_db()

    user = db.users.find_one({"username": user_id})
    if not user:
        return None

    return User(user['username'])


@app.route("/new_user")
def render_new_user():
    return render_template("new_user.html")


@app.route("/create_account", methods=['GET', 'POST'])
def create_account():

    db = get_db()
    users = db.users

    username = request.form.get("username", None)
    email = request.form.get('email', None)
    password = request.form.get('password', None)

    pass_hash = generate_password_hash(password, method='pbkdf2:sha256')

    try:
        users.insert({"username": username, "email": email, "pwd": pass_hash})
        print("User created.")
        return jsonify({"success": True, "message": "User added successfully"})
    except DuplicateKeyError:
        print("The user {} already exists").format(username)
        return jsonify({"success": False, "message": "User already created"})


@app.route("/login_page")
def render_login_page():
    return render_template("login.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    db = get_db()

    username = request.form.get("username", None)
    password = request.form.get('password', None)

    user = db.users.find_one({"username": username})
    print("Attempting to log " + user['username'] + " in.")
    if user and User.validate_login(user['pwd'], password):
        user_obj = User(user['username'])
        login_user(user_obj)
        flash("Logged in successfully", category='success')
        return jsonify({"success": True, "message": "Logged in successfully."})
    else:
        flash("Wrong username or password", category='error')
        return jsonify({"success": False, "message": "Incorrect username or password."})


@app.route('/logout')
def logout():
    logout_user()
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


def load_employees_by_id(_ids):
    db = get_db()
    return list(db.employees.find({"_id": {"$in": _ids}}))


# goes into collection and returns a dict {emp_id: employee}
def get_employees_dict():
    db = get_db()
    return {str(emp["_id"]): emp for emp in db.employees.find()}


# adds employee to the database
@app.route("/_add_employee", methods=["POST"])
def add_employee():

    # if form is empty, return jsonify object indicating failure
    if request.json is None:
        return jsonify({"success": False, "message": "No JSON received by the server."})

    # create new employee entry in collection with the name entered in the form and all other fields default
    db = get_db()
    employees = db.employees
    employees.insert({
        "username": current_user.username,
        "name": request.json['name'],
        "min_shifts": request.json['min_shifts'],
        "max_shifts": request.json['max_shifts'],
        "seniority": request.json['seniority'],
        "roles": request.json['roles'],
        "training": request.json['training'],
        "inactive": request.json['inactive']
        })

    print("{} has been added to the database.".format(request.json['name']))

    # return a jsonify success object1
    return jsonify({"success": True, "message": "Employee added successfully"})


@app.route('/_add_role', methods=['POST'])
def add_role():
    if request.json is None:
        return jsonify({"success": False, "message": "No JSON received by the server."})

    db = get_db()
    db.roles.insert({
        "name": request.json['name'],
        "color": request.json["color"]
    })

    print(list(db.roles.find()))

    print("Role {} has been added to the database.".format(request.json['name']))

    # return a jsonify success object1
    return jsonify({"success": True, "message": "Role added successfully"})


@app.route('/edit_role', methods=['POST'])
def edit_role():
    db = get_db()
    db.roles.update({"name": request.json['name']},
                    {"$set": {"color": request.json["color"]}}
                    )

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
    return render_template("landing_page.html")


@app.route("/select_schedule")
def select_schedule():
    db = get_db()

    reformatted_today = today.strftime('%m/%d/%Y')

    schedules = list(db.schedules.find({"username": current_user.username}))

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

    return render_template("select_schedule.html", schedules=schedules, today=reformatted_today)


@app.route("/view_schedule/<_id>", methods=['GET'])
def view_schedule(_id=None):
    if _id is None:
        return jsonify({"success": False, "message": "No schedule id associated with button."})
    db = get_db()

    schedules = db.schedules.find({"username": current_user.username})
    for schedule in schedules:
        if schedule["_id"] == ObjectId(_id):
            schedule['start_date'] = schedule['start_date'].strftime('%m/%d/%Y')
            schedule['end_date'] = schedule['end_date'].strftime('%m/%d/%Y')
            return render_template("/schedule_manager/schedule_manager_base.html", schedule=schedule)
    return jsonify({"success": False, "message": "Schedule id is not in database."})


@app.route('/load_html/<path:path_to_html>')
def load_html(path_to_html=None):
    
    if path_to_html is None:
        return jsonify({"success": False, "message": "No path specified."})

    return render_template(path_to_html)


@app.route('/add_schedule', methods=["POST"])
def add_schedule():
    schedule = {}

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
    employee_master = list(db.employees.find({"username": current_user.username, "inactive": False}))

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

    return jsonify({"success": True, "message": "New schedule saved."})


@app.route('/delete_schedule/<_id>', methods=["POST"])
def delete_schedule(_id=None):
    if _id is None:
        return jsonify({"success": False, "message": "No schedule id associated with button."})
    db = get_db()
    db.schedules.remove({"_id": ObjectId(_id)}, {"justOne": True})
    schedules = db.schedules.find({"username": current_user.username})
    return render_template("select_schedule.html", schedules=schedules)


@login_required
@app.route('/employees')
def employee_setup():
    employees = get_employees()

    db = get_db()

    schedules = list(db.schedules.find({"username": current_user.username}))
    for schedule in schedules:
        schedule['start_date'] = schedule['start_date'].strftime('%m/%d/%Y')
        schedule['end_date'] = schedule['end_date'].strftime('%m/%d/%Y')

    return render_template("employee_master.html", employees=employees, schedules=schedules)


@login_required
@app.route('/roles')
def role_setup():
    db = get_db()

    schedules = list(db.schedules.find({"username": current_user.username}))
    for schedule in schedules:
        schedule['start_date'] = schedule['start_date'].strftime('%m/%d/%Y')
        schedule['end_date'] = schedule['end_date'].strftime('%m/%d/%Y')
    return render_template("role_setup.html", schedules=schedules)


@login_required
@app.route('/_edit_employees', methods=['POST'])
def edit_employees():
    # gets name from form in add employee modal

    _ids = request.json['_ids']

    # if form is empty, return jsonify object indicating failure
    if request.json is None:
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

    # return a jsonify success object
    return jsonify({"success": True, "message": "Employee added successfully"})


@app.route('/api/get_shift_data/<date>/<_id>')
def get_shift_data(date=None, _id=None):
    db = get_db()
    if date is None:
        shifts = db.schedules.find_one({"_id": ObjectId(_id)})["shifts"]
        return jsonify(shifts)
    if _id is None:
        return jsonify({"success": False, "message": "No schedule id."})
    date = datetime.datetime.strptime(date, '%m%d%Y')
    shifts = db.schedules.find_one({"_id": ObjectId(_id)})["shifts"]
    shifts_for_day = []
    for shift in shifts:
        if shift['date'] == date.strftime('%m/%d/%Y'):
            shifts_for_day.append(shift)
    return jsonify(shifts_for_day)


@app.route('/api/get_all_shift_data/<_id>')
def get_all_shift_data(_id=None):
    db = get_db()
    if _id is None:
        return jsonify({"success": False, "message": "No schedule id."})
    shifts = db.schedules.find_one({"_id": ObjectId(_id)})["shifts"]
    return jsonify(shifts)


@app.route("/_api/get_prefs/<_id>")
def _get_prefs(_id=None):
    db = get_db()
    if _id is None:
        return jsonify({"success": False, "message": "No schedule id."})
    prefs = db.schedules.find_one({"_id": ObjectId(_id)})["prefs"]
    print("----------------")
    pprint.pprint(prefs)
    print("----------------")
    return jsonify(prefs)


@app.route('/_api/get_shifts/<_id>')
def _get_shifts(_id=None):
    db = get_db()
    if _id is None:
        return jsonify({"success": False, "message": "No schedule id."})
    shifts = db.schedules.find_one({"_id": ObjectId(_id)})["shifts"]
    employees = get_employees()
    for emp in employees:
        emp["_id"] = str(emp["_id"])
    return jsonify([shifts, employees])


@app.route('/_api/get_employees')
def _get_employees():
    employees = get_employees()
    for emp in employees:
        emp["_id"] = str(emp["_id"])
    return jsonify(employees)


@app.route('/_api/get_roles')
def _get_roles():
    db = get_db()
    roles = list(db.roles.find())
    for role in roles:
        role["_id"] = str(role["_id"])
    return jsonify(roles)


@app.route('/save_shift_data', methods=["POST"])
def save_shift_data():
    schedule_id = request.json["schedule_id"]
    date = request.json["date"]
    role = request.json["role"]
    number_emps = request.json["num_employees"]
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

    emp_ids = []
    prefs = dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})["prefs"])
    for emp in list(db.schedules.find_one({'_id': ObjectId(schedule_id)})["employees"]):
        emp_ids.append([str(emp['_id']), emp["roles"]])
    for emp_id in emp_ids:
        if role in emp_id[1]:
            for day in prefs[emp_id[0]]:
                if day["date"] == datetime.datetime.strptime(date, '%m/%d/%Y'):
                    if day["status"] == "Unavailable":
                        day[shift_id] = -1000
                    elif day["status"] == "Available":
                        day[shift_id] = 5
                    else:
                        day[shift_id] = "Empty"
                    db.schedules.update({'_id': ObjectId(schedule_id)},
                                        {'$pull': {"prefs." + emp_id[0]: {'date': datetime.datetime.strptime(date, '%m/%d/%Y')}}})
                    db.schedules.update({'_id': ObjectId(schedule_id)},
                                        {'$push': {"prefs." + emp_id[0]: day}})

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
                            day[entry["_id"]] = "Empty"
                        db.schedules.update({'_id': ObjectId(schedule_id)},
                                            {'$pull': {"prefs." + emp_id[0]: {
                                                'date': datetime.datetime.strptime(date, '%m/%d/%Y')}}})
                        db.schedules.update({'_id': ObjectId(schedule_id)},
                                            {'$push': {"prefs." + emp_id[0]: day}})

    print("+++++++++++++++++++++++++++")
    pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})))
    print("+++++++++++++++++++++++++++")

    return jsonify(date_id_for_callback)


@app.route('/update_shift_data', methods=['POST'])
def update_shift_data():
    schedule_id = request.json["schedule_id"]
    date = request.json["date"]
    role = request.json["role"]
    number_emps = request.json["num_employees"]
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
        emp_ids.append([str(emp['_id']), emp["roles"]])

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
                                day[shift_id] = "Empty"
                            db.schedules.update({'_id': ObjectId(schedule_id)},
                                                {'$pull': {"prefs." + emp_id[0]: {
                                                    'date': datetime.datetime.strptime(date, '%m/%d/%Y')}}})
                            db.schedules.update({'_id': ObjectId(schedule_id)},
                                                {'$push': {"prefs." + emp_id[0]: day}})

        print("+++++++++++++++++++++++++++")
        pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})))
        print("+++++++++++++++++++++++++++")
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
                                        day[shift["_id"]] = "Empty"
                                    db.schedules.update({'_id': ObjectId(schedule_id)},
                                                        {'$pull': {"prefs." + emp_id[0]: {
                                                            'date': datetime.datetime.strptime(shift["date"], '%m/%d/%Y')}}})
                                    db.schedules.update({'_id': ObjectId(schedule_id)},
                                                        {'$push': {"prefs." + emp_id[0]: day}})

        print("+++++++++++++++++++++++++++")
        pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})))
        print("+++++++++++++++++++++++++++")
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
        return jsonify({"date_id": date_id_for_callback, "edit_type": edit_type})

    print("+++++++++++++++++++++++++++")
    pprint.pprint(dict(db.schedules.find_one({'_id': ObjectId(schedule_id)})))
    print("+++++++++++++++++++++++++++")

    return jsonify({"success": False, "message": "Failed to apply any changes."})


@app.route('/save_pref_data', methods=['POST'])
def save_pref_data():
    pref_data = request.json["pref_data"]
    employee = request.json["employee"]

    _id = request.json["_id"]
    db = get_db()
    db.schedules.update({"_id": ObjectId(_id)},
                        {"$set": {"prefs." + employee: pref_data[employee]}})
    return jsonify({"success": True, "message": "Database updated with prefs."})


@app.route('/update_pref', methods=['POST'])
def update_pref():
    pref_value = request.json["value"]
    emp_id = request.json["emp_id"]
    shift_id = request.json["shift_id"]
    schedule_id = request.json["schedule_id"]

    db = get_db()

    if pref_value != "empty":
        db.schedules.update({"_id": ObjectId(schedule_id)},
                            {"$set": {"prefs." + emp_id + "." + shift_id: pref_value}})

    else:
        db.schedules.update({"_id": ObjectId(schedule_id)},
                            {"$unset": {"prefs." + emp_id + "." + shift_id: ""}})

    pprint.pprint(dict(db.schedules.find_one({"_id": ObjectId(schedule_id)})))
    return jsonify({"success": True, "message": "Database updated on pref click."})


@login_required
@app.route('/settings')
def settings():
    return render_template("settings.html")


@app.route('/clear_database')
def clear():
    db = get_db()
    #db.employees.delete_many({})
    #db.users.delete_many({})
    db.schedules.delete_many({})
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


    return jsonify({"success": True, "message": "Request received by server."})


@app.route('/_remove_employees', methods=['POST'])
def remove_employees():

    db = get_db()

    post_data = request.get_json()

    for _id in post_data['_ids']:

        print("Removing {} from MASTER".format(_id))
        db.employees.remove({"_id": ObjectId(_id)})

    return jsonify({"success": True, "message": "Request received by server."})


@app.route('/_remove_roles', methods=['POST'])
def remove_roles():

    db = get_db()

    post_data = request.get_json()
    print(post_data)

    for _id in post_data['_ids']:
        print("Removing role: {}".format(_id))
        db.roles.remove({"_id": ObjectId(_id)})

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
    return jsonify({"success": True, "message": "Schedule status updated."})


@login_required
@app.route('/_edit_schedule_employees', methods=['POST'])
def edit_schedule_employees():
    # gets name from form in add employee modal
    _ids = request.json['_ids']

    # if form is empty, return json object indicating failure
    if request.json is None:
        return jsonify({"success": False, "message": "No JSON received by the server."})

    db = get_db()
    schedule = db.schedules.find_one({'_id': ObjectId(request.json['schedule_id'])})

    emps_to_edit = [emp for emp in schedule['employees'] if str(emp['_id']) in _ids]

    filtered_dict = {}
    for key in request.json.keys():

        if request.json[key] != "":
            if request.json[key][0] == "":
                continue

            filtered_dict[key] = request.json[key]

    for key in filtered_dict:
        for emp in emps_to_edit:
            emp[key] = filtered_dict[key]
            db.schedules.update({'employees._id': ObjectId(emp['_id'])}, {'$pull': {"employees":
                                                                                   {'_id': ObjectId(emp['_id'])}}})
            db.schedules.update({'_id': ObjectId(request.json['schedule_id'])}, {'$push': {"employees": emp}})

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

    return jsonify({"success": True, "message": "Employee added successfully"})


@app.route('/api/get_employees')
def send_all_employees_json():

    db = get_db()
    employees = list(db.employees.find())

    for employee in employees:
        employee['_id'] = str(employee['_id'])

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

    schedule = ScheduleProcessor(schedule_dict)
    schedule.sort('shifts', 'chronological')
    return jsonify(schedule.to_dict())


@app.route('/api/create_schedule/<schedule_id>')
def create_schedule(schedule_id=None):

    print("Creating schedule.")

    if schedule_id is None:
        return jsonify({"success": False, "message": "No schedule id in URL."})

    db = get_db()
    schedule_dict = dict(db.schedules.find_one({"_id": ObjectId(schedule_id)}))

    roles = list(db.roles.find())
    schedule_dict['roles'] = [role['name'] for role in roles]

    schedule = ScheduleProcessor(schedule_dict)
    schedule.preprocess()
    schedule.build_schedule()
    print('Schedule output created.')

    return jsonify(schedule.to_dict())


if __name__ == '__main__':
    app.run(debug=True)
