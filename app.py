from flask import Flask, render_template, jsonify, g, request
import datetime
from pymongo import MongoClient
from bson import json_util, ObjectId
import json

app = Flask(__name__)

app.config["TEMPLATES_AUTO_RELOAD"] = True

# list of possible levels of seniority
seniority_levels = list(range(10))

# today's date
today = datetime.datetime.today()


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

    # if form is empty, return jsonify object indicating failure
    if name is None:
        return jsonify({"success": False, "message": "No POST name"})

    # create new employee entry in collection with the name entered in the form and all other fields default
    db = get_db()
    db.employees.insert({
        "name": name,
        "shift_length": 0,
        "max_hours": 0,
        "seniority": 0
        })

    """
    db.preferences.insert({
        "employee_id": _id,
        "available": False,
        "prefs": [],
        })
        """

    # return a jsonify success object
    return jsonify({"success": True, "message": "Employee added successfully"})


@app.route("/add_preferences", methods=["POST"])
def add_preferences():

    employee_id = request.json['id']
    prefs = request.json['prefs']
    day = request.json['day']
    available = request.json['available']

    all_prefs = {}
    all_prefs[day] = prefs

    db = get_db()

    db.employees.update({'_id': employee_id},
                        {"$set":
                            {"prefs": all_prefs,
                             "available": available}
                         })


# defines the homepage
@app.route("/")
def base():

    # open db collection
    db = get_db()

    # get the date of the previous monday
    today = datetime.date.today()
    monday = today - datetime.timedelta(today.weekday())

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

    for emp in employees:
        pref_entry = db.employees.find_one({"employee_id": emp["_id"], "week": date_ordinal})
        if pref_entry is None:
            # doesn't exist, just return the default
            pref_entry = [{
                    "available": False,
                    "prefs": []
                    } for _ in range(7)]
        pref_table[str(emp["_id"])] = pref_entry

    dates = [datetime.date.fromordinal(o).strftime("%a %b %d")
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


if __name__ == '__main__':
    app.run(debug=True)
