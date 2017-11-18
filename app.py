from flask import Flask, render_template, jsonify, g, request
import datetime
from pymongo import MongoClient
from bson import json_util, ObjectId
import json

app = Flask(__name__)

app.config["TEMPLATES_AUTO_RELOAD"] = True

# list of possible levels of seniority
seniority_levels = list(range(10))

today = datetime.date.today()
monday = today - datetime.timedelta(today.weekday())


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

if __name__ == '__main__':
    app.run(debug=True)