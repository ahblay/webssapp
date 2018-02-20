#from pymongo import MongoClient
from flask import g
import zephyr_build_schedule as algorithm


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

    def __init__(self, name, employees, shifts, days, roles):
        self.name = name
        self.employees = employees
        self.shifts = shifts
        self.days = days
        self.roles = roles

        self.num_employees = len(employees)
        self.num_shifts = len(shifts)
        self.num_roles = len(roles)
        self.num_days = len(days)

        self.management_data = [
                                {day:
                                     {"num_employees": [1 for shift in range(self.num_shifts)],
                                      "shift_times": ["don't matter" for _ in range(self.num_shifts)]}
                                 for day in range(self.num_days)}
                                for role in range(self.num_roles)]
        self.employee_info = [{"min_shifts": employees[employee]["min_shifts"],
                               "max_shifts": employees[employee]["max_shifts"],
                               "shift_pref": [[{"pref": employees[employee]["shift_pref"][day][shift], "lock_in_role": None}
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

    def save_schedule_data(self):
        db = self.get_db()
        schedules = db.schedules

        schedules.insert({"name": self.name,
                          "start": self.start_date,
                          "end": self.end_date,
                          "status": self.status,
                          "user": self.user,
                          "data": {"employer_setup": self.build_employer_setup_dict(),
                                   "employee_setup": self.build_employee_setup_dict(),
                                   "availability": self.build_availability_dict()
                                  }})

    def get_schedule_data(self):
        db = self.get_db()
        schedules = db.schedules

        schedules.find_one({"name": self.name})