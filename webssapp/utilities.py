from flask import g
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson import json_util, ObjectId
import pprint
from itertools import product


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


def product_rang(num_emps=None, num_roles=None, num_days=None, num_shifts=None, num_shifts_per_day=None):
    if num_shifts_per_day is not None and num_days is None:
        raise Exception("num_days must be provided with shifts_per_day")

    if num_shifts is not None and num_shifts_per_day is not None:
        raise Exception("num_shifts and shifts_per_day cannot both be provided")

    provided_args = [num_emps, num_roles, num_days, num_shifts, num_shifts_per_day]
    provided_args = [arg for arg in provided_args if arg is not None]

    if type(provided_args[-1]) is list:
        var_space = []
        for day in range(len(num_shifts_per_day)):
            print(provided_args[-1])
            var_space += list(product(*(range(x) for x in provided_args[:-2]), [day], range(provided_args[-1][day])))
        return var_space
    else:
        return list(product(*(range(x) for x in provided_args)))