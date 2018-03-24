from pymongo import MongoClient
from flask import g
import zephyr_build_schedule as scheduling_algorithm
from datetime import date, timedelta, datetime
import pprint

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

    def __init__(self, schedule):

        self.name = schedule['name'] if 'name' in schedule.keys() else None
        self.employees = schedule['employees'] if 'employees' in schedule.keys() else None
        self.shifts = schedule['shifts'] if 'shifts' in schedule.keys() else {}
        print(schedule['start_date'])
        print(schedule['end_date'])
        self.days = self.get_days(schedule['start_date'], schedule['end_date']) if schedule else None
        print(self.days)
        if 'shifts' in schedule.keys():
            roles = list(set([schedule['shifts'][day][name]['role']
                              for day in schedule['shifts']
                              for name in schedule['shifts'][day].keys()]))
        else:
            roles = []
        print(roles)
        self.roles = {role: None for role in roles}
        self.start_date = schedule['start_date'] if 'start_date' in schedule.keys() else None
        self.end_date = schedule['end_date']if 'end_date' in schedule.keys() else None
        self.prefs = schedule['prefs'] if 'prefs' in schedule.keys() else {}

        self.num_employees = self.get_length(self.employees)
        self.num_shifts = self.build_num_shifts()
        #self.max_shifts_per_day = self.get_length([[shift for shift in self.shifts[day].keys] for day in self.shifts.keys()])
        self.num_roles = self.get_length(self.roles)
        self.num_days = self.get_length(self.days)

        self.management_data = self.build_management_data()
        self.employee_info = self.build_employee_info()
        self.training = self.build_training()


    def get_length(self, item):
        if item is not None:
            return len(item)
        else:
            return 0

    def get_days(self, start_date, end_date):

        delta = end_date - start_date

        dates = []
        for i in range(delta.days + 1):
            dates.append(start_date + timedelta(days=i))

        return dates

    def build_num_shifts(self):

        if self.shifts == {}:
            return None

        daily_shifts = []
        for day in self.shifts.keys():
            daily_shifts.append(len(self.shifts[day].keys()))

        return max(daily_shifts)

    def build_management_data(self):
        print("Building management data.")
        management_data = []
        print("Num shifts: {} | Num roles: {}".format(self.num_shifts, self.num_roles))
        for role in self.roles:
            role_dict = {}
            day_index = 0
            for day in self.shifts.keys():
                day_dict = {
                    "num_employees": [self.shifts[day][name]['num_employees'] for name in self.shifts[day].keys()],
                    "shift_times": ['Not Used' for _ in range(len(self.shifts[day].keys()))]}
                role_dict[day_index] = day_dict
                day_index += 1
            management_data.append(role_dict)
        pprint.pprint(management_data)
        return management_data

    def build_employee_info(self):

        employee_info = []

        for employee in self.employees:
            emp = {
                'min_shifts': int(employee['min_shifts']),
                'max_shifts': int(employee['max_shifts']),
                'shift_pref': self._build_shift_prefs(employee),
                'role_seniority': [int(employee['seniority']) for _ in self.roles]
            }
            employee_info.append(emp)

        return employee_info

    def _build_shift_prefs(self, employee):

        shift_prefs = []
        pprint.pprint(self.shifts)
        pprint.pprint(self.prefs)


        for day in self.shifts.keys():
            day_prefs = []
            for shift in self.shifts[day].keys():
                emp_prefs = self.prefs[str(employee['_id'])]
                shift_id = self.shifts[day][shift]['_id']

                pref_val = emp_prefs[shift_id]\
                    if str(employee['_id']) in self.prefs.keys() \
                       and shift_id in self.shifts[day][shift].keys() \
                    else -1000
                pref = {'pref': pref_val, 'lock_in_role': None}
                day_prefs.append(pref)
            shift_prefs.append(day_prefs)

        return shift_prefs

    def build_training(self):
        training = [[employee['training'] for _ in self.roles]
                    for employee in self.employees]

        return training


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

    def build_schedule(self, schedule):
        s = scheduling_algorithm.Schedule(self.num_employees,
                                    self.num_shifts,
                                    self.num_roles,
                                    self.num_days,
                                    self.employee_info,
                                    self.management_data,
                                    self.training,
                                    schedule)
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
                             "roles": self.roles,
                             "prefs": self.prefs})

        print("Saved schedule data to database.")

    def get_schedule_data(self):
        db = self.get_db()
        schedules = db.schedules

        schedules.find_one({"name": self.name})