from flask import Flask, render_template, jsonify, g, request
import datetime
from pymongo import MongoClient
from bson import json_util
import json

app = Flask(__name__)

app.config["TEMPLATES_AUTO_RELOAD"] = True

seniority_levels = list(range(10))

today = datetime.datetime.today()

def get_db():
    if not hasattr(g, "db_connection"):
        g.db_connection = MongoClient("localhost", 27017)["test"]
    return g.db_connection

def get_employees():
    db = get_db()
    return list(db.employees.find())

def get_employees_dict():
    db = get_db()
    return {str(emp["_id"]): emp for emp in db.employees.find()}

@app.route("/_add_employee", methods=["POST"])
def add_employee():
    name = request.form.get("name", None)
    if name is None:
        return jsonify({"success": False, "message": "No POST name"})

    db = get_db()
    _id = db.employees.insert({
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

    return jsonify({"success": True, "message": "Employee added successfully"})

@app.route("/")
def base():
    db = get_db()
    # get the date of the previous monday
    today = datetime.date.today()
    monday = today - datetime.timedelta(today.weekday())

    employees = list(db.employees.find())

    return render_template("index.html",
            employees = employees,
            seniority_levels = seniority_levels,
            date_ordinal = monday.toordinal(),
            )

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


if __name__ == '__main__':
    app.run(debug=True)
