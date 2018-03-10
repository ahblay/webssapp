from pymongo import MongoClient
from flask import g
import zephyr_build_schedule as algorithm
from bson import ObjectId


class ScheduleProcessor:

    # shifts is a dict of dicts a la
    # {shift: {"start": start_time, "end": end_time, "role": role, "num_employees": self.num_employees}, ...}

    # employees is a dict a la
    # {employee: {"shift_pref":
    #                 {day: {shift: pref, ..., "lock_in_role": ???}, ...}
    #             "seniority": {role: int},
    #             "max_hours": max_hours,
    #             "min_hours": min_hours,
    #             "training": {role: boolean},
    #             "roles": roles}, ...}

    def __init__(self,
                 name=None,
                 start_date=None,
                 end_date=None,
                 employees=None,
                 shifts=None,
                 days=None,
                 roles=None):
        self.name = name
        self.employees = employees
        self.shifts = shifts
        self.days = days
        self.roles = roles
        self.start_date = start_date
        self.end_date = end_date

        self.num_employees = self.get_length(employees)
        self.num_shifts = self.get_length(shifts)
        self.num_roles = self.get_length(roles)
        self.num_days = self.get_length(days)

        self.management_data = None
        self.employee_info = None
        self.training = None

        self.create_variables(self.employees, self.days, self.shifts, self.roles)

    def get_length(self, item):
        if item is not None:
            return len(item)
        else:
            return 0

    def create_variables(self, employees, days, shifts, roles):
        if employees is not None and \
            days is not None and \
            shifts is not None and \
            roles is not None:

            self.management_data = [
                {day:
                     {"num_employees": [1 for shift in range(self.num_shifts)],
                      "shift_times": ["don't matter" for _ in range(self.num_shifts)]}
                 for day in range(self.num_days)}
                for role in range(self.num_roles)]
            self.employee_info = [{"min_shifts": employees[employee]["min_shifts"],
                                   "max_shifts": employees[employee]["max_shifts"],
                                   "shift_pref": [
                                       [{"pref": employees[employee]["shift_pref"][day][shift], "lock_in_role": None}
                                        for shift in shifts]
                                       for day in days],
                                   "role_seniority": employees[employee]["seniority"]}
                                  for employee in employees]
            self.training = [[employees[employee]["training"][role]
                              for role in range(self.num_roles)]
                             for employee in employees]

    def build_schedule(self):
        s = algorithm.Schedule(self.num_employees,
                               self.num_shifts,
                               self.num_roles,
                               self.num_days,
                               self.employee_info,
                               self.management_data,
                               self.training)
        return s.get_schedule()

    def build_employer_setup_dict(self):
        employer_setup = {day: self.shifts
                          for day in self.days}
        return employer_setup

    def build_employee_setup_dict(self):
        employee_setup = self.employees
        return employee_setup

    #def build_availability_dict(self):

    def get_db(self):
        if not hasattr(g, "db_connection"):
            g.db_connection = MongoClient("localhost", 27017)["test"]
        return g.db_connection

    def save_schedule_data(self, username):
        db = self.get_db()

        db.schedules.insert({"username": username,
                             "name": self.name,
                             "start_date": self.start_date,
                             "end_date": self.end_date,
                             "employees": self.employees,
                             "shifts": self.shifts,
                             "days": self.days,
                             "roles": self.roles})

        print("Saved schedule data to database.")

    def get_schedule_data(self):
        db = self.get_db()
        schedules = db.schedules

        schedules.find_one({"name": self.name})