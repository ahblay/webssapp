from flask import Flask, render_template, jsonify, g, request, flash, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson import json_util, ObjectId
import json

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

    user = db.users.find_one({"_id": user_id})
    if not user:
        return None

    return User(user['_id'])


@app.route("/new_user")
def render_new_user():
    return render_template("new_user.html")


@app.route("/create_account", methods=['GET', 'POST'])
def create_account():

    db = get_db()
    users = db.users

    #db.users.delete_many({})
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
        users.insert({"_id": username, "email": email, "pwd": pass_hash, "schedules": {}})
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

    user = db.users.find_one({"_id": username})
    print(user)
    if user and User.validate_login(user['pwd'], password):
        user_obj = User(user['_id'])
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
    return list(db.employees.find())


# goes into collection and returns a dict {emp_id: employee}
def get_employees_dict():
    db = get_db()
    return {str(emp["_id"]): emp for emp in db.employees.find()}


# adds employee to the database
@app.route("/_add_employee", methods=["POST"])
def add_employee():

    # gets name from form in add employee modal
    name = request.form.get("name", None)

    date_ordinal = monday.toordinal()

    week_one_ordinal_list = []
    for i in list(range(date_ordinal, date_ordinal + 7)):
        week_one_ordinal_list.append(str(i))

    week_two_ordinal_list = []
    for i in list(range(date_ordinal + 7, date_ordinal + 14)):
        week_two_ordinal_list.append(str(i))

    # if form is empty, return jsonify object indicating failure
    if name is None:
        return jsonify({"success": False, "message": "No POST name"})

    # create new employee entry in collection with the name entered in the form and all other fields default
    db = get_db()
    db.employees.insert({
        "name": name,
        "shift_length": 0,
        "max_hours": 0,
        "seniority": 0,
        "total_prefs": {"week_one": {day: {"prefs": [], "available": False} for day in week_one_ordinal_list},
                        "week_two": {day: {"prefs": [], "available": False} for day in week_two_ordinal_list}}
        })

    print(db.employees.find_one({'name': name}))

    """
    db.preferences.insert({
        "employee_id": _id,
        "available": False,
        "prefs": [],
        })
        """

    # return a jsonify success object
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

    user = db.users.find_one({"_id": current_user.username})
    schedules = user["schedules"]
    print(schedules)
    return render_template("employer_prefs.html",
                           schedules=schedules)


@app.route('/test')
def test():
    return render_template('test.html')


@app.route('/clear_database')
def clear():
    db = get_db()
    db.employees.delete_many({})
    db.users.delete_many({})
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)
