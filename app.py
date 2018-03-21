from flask import Flask, render_template, jsonify, g, request, flash, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson import json_util, ObjectId
from collections import defaultdict
from Schedule import ScheduleProcessor
import pprint

app = Flask(__name__)
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

    print(list(db.users.find()))

    username = request.form.get("username", None)
    email = request.form.get('email', None)
    password = request.form.get('password', None)
    print(password)
    print(username)
    print(email)
    pass_hash = generate_password_hash(password, method='pbkdf2:sha256')
    print(pass_hash)

    try:
        users.insert({"username": username, "email": email, "pwd": pass_hash})
        print("user created")
        return jsonify({"success": True, "message": "User added successfully"})
    except DuplicateKeyError:
        print("user already created")
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
        print("logged in")
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
    # gets name from form in add employee modal
    print(request.json)

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


@app.route("/add_preferences", methods=["POST", "GET"])
def add_preferences():

    employee_id = request.json['id']
    prefs = request.json['prefs']
    day = request.json['day']
    available = request.json['available']
    date = request.json['date']

    employee_objectId = ObjectId(str(employee_id))

    # PROBLEM HERE
    # date_ordinal1 = int(datetime.datetime.strptime(date, '%a %b %d').toordinal())
    date_ordinal = int(date)

    print(available)
    print(employee_id)
    print(prefs)
    print(day)
    print(date_ordinal)
    print(employee_objectId)
    print(int(monday.toordinal()))

    db = get_db()

    if date_ordinal == int(monday.toordinal()):
        print('if statement entered')
        db.employees.update({'_id': employee_objectId},
                            {"$set":
                                {"total_prefs.week_one.{}".format(day): {"prefs": prefs, "available": available}}
                             })
    else:
        print('else statement entered')
        db.employees.update({'_id': employee_objectId},
                            {"$set":
                                {"total_prefs.week_two.{}".format(day): {"prefs": prefs, "available": available}}
                             })

    print(db.employees.find_one({'_id': employee_objectId}))
    return jsonify({"success": True, "message": "preferences updated"})


# defines the homepage
@app.route("/")
@login_required
def base():

    # open db collection
    db = get_db()

    # db.employees.delete_many({})

    # get the date of the subsequent monday
    next_monday = monday + datetime.timedelta(7)

    # list employees from collection
    employees = list(db.employees.find())

    # generate the html for the homepage using the employees listed in the collection, the predefined seniority levels
    # and the ordinal for the previous Monday
    return render_template("index.html",
            employees = employees,
            seniority_levels = seniority_levels,
            date_ordinal = monday.toordinal(),
            next_week_date_ordinal = next_monday.toordinal()
            )


# gets the preferences for an employee on a specific day
@app.route("/_get_preferences/<date_ordinal>")
def get_preferences(date_ordinal=None):
    if date_ordinal is None:
        return

    db = get_db()

    date_ordinal = int(date_ordinal)

    # make sure we're starting from monday
    date_ordinal -= datetime.date.fromordinal(date_ordinal).weekday()

    pref_table = {}
    employees = get_employees()

    if date_ordinal == int(monday.toordinal()):
        for emp in employees:
            # pref_entry = db.employees.find_one({"employee_id": emp["_id"], "week": date_ordinal})
            pref_entry = db.employees.find_one({"_id": emp["_id"]}, {"total_prefs.week_one": 1, "_id": 0})
            pref_table[str(emp["_id"])] = pref_entry['total_prefs']['week_one']
            print(pref_table)
    else:
        for emp in employees:
            # pref_entry = db.employees.find_one({"employee_id": emp["_id"], "week": date_ordinal})
            pref_entry = db.employees.find_one({"_id": emp["_id"]}, {"total_prefs.week_two": 1, "_id": 0})
            pref_table[str(emp["_id"])] = pref_entry['total_prefs']['week_two']
            print(pref_table)

    dates = [(datetime.date.fromordinal(o).strftime("%a %b %d"), o)
             for o in range(date_ordinal, date_ordinal + 7)]

    return_data = {
        "pref_table": pref_table,
        "dates": dates,
        "employees": get_employees_dict()
        }

    return json_util.dumps(return_data, default=json_util.default)


@app.route("/_get_emp_options")
def get_emp_options():

    db = get_db()

    options = {}
    employees = get_employees()

    for emp in employees:
        emp_data = db.employees.find_one({'_id': emp['_id']})

        if 'option_entries' in emp_data.keys():
            option_entries = emp_data['option_entries']
        else:
            # return defaults
            option_entries = {week: {
                "shift_length": 8,
                "max_hours": 40,
                "max_days": 5
            } for week in [0, 1]}

            option_entries['seniority'] = .25
            option_entries['room_preferences'] = []

        options[str(emp['_id'])] = option_entries

    return_data = {
        "option_data": options,
        "employees": get_employees_dict()
    }

    return json_util.dumps(return_data, default=json_util.default)


@app.route("/_save_emp_data", methods=['POST'])
def save_emp_data():

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

    print(list(db.employees.find()))

    return jsonify({"success": True, "message": "Data saved successfully"})


@app.route("/landing_page")
def open_landing_page():
    return render_template("landing_page.html")


@app.route("/new_prefs")
def open_new_prefs():
    db = get_db()
    print(current_user.username)

    schedules = db.schedules.find({"username": current_user.username})
    print(schedules)
    return render_template("employer_prefs.html",
                           schedules=schedules)


@app.route("/view_schedule/<_id>")
def view_schedule(_id=None):
    if _id is None:
        return jsonify({"success": False, "message": "No schedule id associated with button."})
    db = get_db()

    schedules = db.schedules.find({"username": current_user.username})
    for schedule in schedules:
        if schedule["_id"] == ObjectId(_id):
            print(schedule)
            return render_template("/schedule_manager/schedule_manager_base.html", schedule=schedule)
    return jsonify({"success": False, "message": "Schedule id is not in database."})


@app.route("/data_entry")
def add_data():
    return render_template("data.html")


@app.route('/data_to_database', methods=["POST"])
def test():
    employees = {}
    days = []
    shifts = {}
    roles = []

    # temporary variables because I can't be bothered to do this in a smarter way
    seniority = {}
    prefs = defaultdict(lambda: defaultdict(lambda: {}))
    names = []
    min_shifts = []
    max_shifts = []
    training = []
    shift_names = []
    shift_info = []

    def restore_whitespace(str):
        return str.replace("%20", " ")

    employee_data = restore_whitespace(request.json["employee_data"])
    duration_data = restore_whitespace(request.json["duration_data"])
    shifts_data = restore_whitespace(request.json["shifts_data"])
    roles_data = restore_whitespace(request.json["roles_data"])
    name_data = restore_whitespace(request.json["name_data"])
    employee_prefs_data = restore_whitespace(request.json["employee_prefs_data"])
    seniority_data = restore_whitespace(request.json["seniority_data"])

    employee_values = list(item.split("=") for item in employee_data.split("&"))
    duration_values = list(item.split("=") for item in duration_data.split("&"))
    shifts_values = list(item.split("=") for item in shifts_data.split("&"))
    roles_values = list(item.split("=") for item in roles_data.split("&"))
    name_value = list(item.split("=") for item in name_data.split("&"))
    employee_prefs_values = list(item.split("=") for item in employee_prefs_data.split("&"))
    seniority_values = list(item.split("=") for item in seniority_data.split("&"))

    for i in seniority_values:
        i[0] = tuple(i[0].split("_"))

    print(seniority_values)

    for i in employee_prefs_values:
        i[0] = tuple(i[0].split("_"))

    for item in employee_values:
        if item[0] == 'name':
            names.append(item[1])
        if item[0] == 'min_shifts':
            min_shifts.append(item[1])
        if item[0] == 'max_shifts':
            max_shifts.append(item[1])
        if item[0] == 'training':
            training.append(item[1])

    for item in duration_values:
        days.append(item[1])

    for item in shifts_values:
        if item[0] == "name":
            shift_names.append(item[1])
        if item[0] == "info":
            shift_info.append(item[1])

    for item in roles_values:
        roles.append(item[1])

    for i in range(len(shift_names)):
        shifts[shift_names[i]] = shift_info[i]

    for item in seniority_values:
        info = item[0]
        employee = int(info[0])
        seniority[names[employee]] = [int(sen[1]) for sen in seniority_values if int(sen[0][0]) == employee]

    for item in employee_prefs_values:
        info = item[0]
        employee = int(info[0])
        day = int(info[1])
        shift = int(info[2])
        prefs[names[employee]][days[day]][shift_names[shift]] = int(item[1])

    # silly code to convert from defaultdict back to dict
    # might not be necessary but don't want to have an obscure undiagnosable error in the future
    prefs = dict(prefs)
    for name in names:
        prefs[name] = dict(prefs[name])

    name = name_value[0][1].replace("%20", " ")

    for i in range(len(names)):
        employees[names[i]] = {"min_shifts": int(min_shifts[i]),
                               "max_shifts": int(max_shifts[i]),
                               #"training": training[i],
                               "training": [False for _ in roles],
                               "shift_pref": prefs[names[i]],
                               "seniority": seniority[names[i]]}

    print(employees)

    schedule_test = ScheduleProcessor(name, employees, shifts, days, roles)
    schedule_test.build_schedule()
    schedule_test.save_schedule_data(current_user.username)
    print("Schedule added to database.")

    return jsonify({"success": True, "message": "Data saved successfully"})


@app.route('/load_html/<path:path_to_html>')
def load_html(path_to_html=None):
    
    if path_to_html is None:
        return jsonify({"success": False, "message": "No path specified."})
    
    print(path_to_html)

    return render_template(path_to_html)


@app.route('/add_schedule', methods=["POST"])
def add_schedule():
    schedule_name = request.form.get("schedule_name", None)
    start = request.form.get("start", None)
    end = request.form.get("end", None)

    db = get_db()
    employee_master = list(db.employees.find({"username": current_user.username, "inactive": False}))

    for emp in employee_master:

        emp['master_id'] = emp['_id']
        emp['_id'] = ObjectId()

    print(employee_master)
    schedule = ScheduleProcessor(schedule_name, start, end, employee_master)
    schedule.save_schedule_data(current_user.username)

    return jsonify({"success": True, "message": "New schedule saved."})


@app.route('/delete_schedule/<_id>', methods=["POST"])
def delete_schedule(_id=None):
    if _id is None:
        return jsonify({"success": False, "message": "No schedule id associated with button."})
    db = get_db()
    db.schedules.remove({"_id": ObjectId(_id)}, {"justOne": True})
    schedules = db.schedules.find({"username": current_user.username})
    return render_template("employer_prefs.html", schedules=schedules)


@login_required
@app.route('/employees')
def employee_setup():
    employees = get_employees()
    return render_template("employee_setup.html", employees=employees)


@login_required
@app.route('/_edit_employees', methods=['POST'])
def edit_employees():
    # gets name from form in add employee modal
    print(request.json)
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

    pprint.pprint(db.users.find_one({'_id': current_user.username}))

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
    date = date[0:2] + "/" + date[2:4] + "/" + date[4:8]
    shifts = db.schedules.find_one({"_id": ObjectId(_id)})["shifts"]
    print(shifts)
    for i in shifts.keys():
        if i == date:
            return jsonify(shifts[i])
    return jsonify({"jsonify": {"success": False, "message": "Could not find shift for " + date}})


@app.route("/_api/get_prefs/<_id>")
def _get_prefs(_id=None):
    db = get_db()
    if _id is None:
        return jsonify({"success": False, "message": "No schedule id."})
    prefs = db.schedules.find_one({"_id": ObjectId(_id)})["prefs"]
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
    pprint.pprint(shifts)
    return jsonify([shifts, employees])


@app.route('/_api/get_employees')
def _get_employees():
    employees = get_employees()
    for emp in employees:
        emp["_id"] = str(emp["_id"])
    pprint.pprint(employees)
    return jsonify(employees)


@app.route('/save_shift_data', methods=["POST"])
def save_shift_data():
    shift_data = request.json["shift_data"]
    id = request.json["_id"]
    date = request.json["date"]
    shifts = {shift[0]: {"_id": str(ObjectId()),
                         "start": int(shift[1]),
                         "end": int(shift[2]),
                         "num_employees": int(shift[3]),
                         "role": shift[4]}
              for shift in shift_data}
    db = get_db()
    db.schedules.update({"_id": ObjectId(id)},
                        {"$set": {"shifts." + date: shifts}})
    dbshifts = db.schedules.find_one({"_id": ObjectId(id)})
    pprint.pprint(dbshifts)
    return jsonify({"success": True, "message": "Database updated with shifts."})


@app.route('/save_pref_data', methods=['POST'])
def save_pref_data():
    pref_data = request.json["pref_data"]
    employee = request.json["employee"]
    id = request.json["_id"]
    db = get_db()
    db.schedules.update({"_id": ObjectId(id)},
                        {"$set": {"prefs." + employee: pref_data[employee]}})
    pprint.pprint(db.schedules.find_one({"_id": ObjectId(id)}))
    return "blah"


@login_required
@app.route('/settings')
def settings():
    return render_template("settings.html")


@app.route('/clear_database')
def clear():
    db = get_db()
    db.employees.delete_many({})
    db.users.delete_many({})
    db.schedules.delete_many({})
    return render_template('index.html')


@app.route('/_remove_schedule_employees', methods=['POST'])
def remove_schedule_employees():
    db = get_db()

    post_data = request.get_json()

    print(post_data)

    for _id in post_data['_ids']:
        print("Removing {} from {}".format(_id, db.schedules.find_one({"employees._id": ObjectId(_id)})))
        db.schedules.update({"employees._id": ObjectId(_id)}, {"$pull": {"employees": {"_id": ObjectId(_id)}}})

    return jsonify({"success": True, "message": "Request received by server."})


@app.route('/_remove_employees', methods=['POST'])
def remove_employees():

    db = get_db()

    post_data = request.get_json()

    for _id in post_data['_ids']:
        print("Removing {} from {}".format(_id, db.schedules.find_one({"_id": ObjectId(_id)})))
        db.employees.remove({"_id": ObjectId(_id)})

    return jsonify({"success": True, "message": "Request received by server."})


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
        for emp in emps_to_edit:
            emp[key] = filtered_dict[key]
            db.schedules.update({'employees._id': ObjectId(emp['_id'])}, {'$pull': {"employees":
                                                                                   {'_id': ObjectId(emp['_id'])}}})
            db.schedules.update({'_id': ObjectId(request.json['schedule_id'])}, {'$push': {"employees": emp}})

    # return a jsonify success object
    return jsonify({"success": True, "message": "Employee added successfully"})


@app.route('/_add_emps_to_schedule', methods=['POST'])
def add_emps_to_schedule():

    print(request.json['schedule_id'])
    print(request.json['_ids'])

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

    print("The delta is:")
    print(delta)

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


if __name__ == '__main__':
    app.run(debug=True)
