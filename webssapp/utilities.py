from flask import g
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson import json_util, ObjectId
import pprint

# opens/makes a connection to the database
def get_db():
    if not hasattr(g, "db_connection"):
        g.db_connection = MongoClient("localhost", 27017)["test"]
    return g.db_connection

def get_roles():

    db = get_db()

    roles = list(db.roles.find())

    return {str(index): role for index, role in enumerate([role_dict['name'] for role_dict in roles])}


def get_schedule(schedule_id):
    if schedule_id is None:
        return

    db = get_db()
    print("Getting schedule JSON for schedule with _id: {}".format(schedule_id))
    schedule = dict(db.schedules.find_one({"_id": ObjectId(schedule_id)}))

    # TODO: Make this traverse the schedule to find and change any objectids rather than hardcoding
    schedule['_id'] = str(schedule['_id'])

    for emp in schedule['employees']:
        for key in emp.keys():
            if "_id" in key:
                emp[key] = str(emp[key])

    return schedule
