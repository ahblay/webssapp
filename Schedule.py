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

        self.status = schedule['status'] if 'status' in schedule.keys() else None
        self.name = schedule['name'] if 'name' in schedule.keys() else None
        self.employees = schedule['employees'] if 'employees' in schedule.keys() else None
        self.shifts = schedule['shifts'] if 'shifts' in schedule.keys() else []
        self.days = self.get_days(schedule['start_date'], schedule['end_date']) if schedule else None
        if 'shifts' in schedule.keys():
            roles = list(set([schedule['shifts'][day][_id]['role']
                              for day in schedule['shifts'].keys()
                              for _id in schedule['shifts'][day].keys()]))
        else:
            roles = []
        self.roles = {index: role for index, role in enumerate(roles)}
        self.start_date = schedule['start_date'] if 'start_date' in schedule.keys() else None
        self.end_date = schedule['end_date']if 'end_date' in schedule.keys() else None
        self.prefs = schedule['prefs'] if 'prefs' in schedule.keys() else {}

        self.num_employees = self.get_length(self.employees)
        self.num_shifts = self.build_num_shifts()
        self.num_roles = self.get_length(self.roles)
        self.num_days = self.get_length(self.days)

        self.management_data = self.build_management_data()
        self.employee_info = self.build_employee_info()
        self.training = self.build_training()

        self.output = None

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

        if self.shifts == []:
            return None

        daily_shifts = []
        for day in self.shifts.keys():
            daily_shifts.append(len(self.shifts[day].keys()))

        return max(daily_shifts)

    def build_management_data(self):
        print("Building management data.")
        print("Num shifts: {} | Num roles: {}".format(self.num_shifts, self.num_roles))
        print(self.roles)

        management_data = []
        for _ in self.roles:
            role_dict = {}
            day_index = 0
            for day in self.shifts.keys():
                day_dict = {
                    "num_employees": [self.shifts[day][_id]['num_employees'] for _id in self.shifts[day].keys()],
                    "shift_times": ['{} - {}'.format(self.shifts[day][_id]['start'], self.shifts[day][_id]['end']) for _id in self.shifts[day].keys()]}
                role_dict[day_index] = day_dict
                day_index += 1
            management_data.append(role_dict)
        return management_data

    def build_employee_info(self):

        employee_info = []

        for employee in self.employees:
            emp = {
                'min_shifts': int(employee['min_shifts']),
                'max_shifts': int(employee['max_shifts']),
                'shift_pref': self._init_shift_prefs(employee),
                'role_seniority': self._init_role_seniority(employee)
            }
            employee_info.append(emp)

        return employee_info

    def _init_role_seniority(self, employee):
        return [int(employee['seniority']) if role in employee['roles'] else 0 for role in self.roles.values()]

    def _init_shift_prefs(self, employee):

        def gen_pref_val(_id):

            emp_id = str(employee['_id'])
            emp_prefs = self.prefs[emp_id]
            pref_val = -1000

            if emp_id in self.prefs.keys():
                if str(_id) in self.prefs[emp_id].keys():
                    pref_val = emp_prefs[_id]

            return pref_val

        shift_prefs = []

        for index, day in enumerate(self.shifts.keys()):
            day_prefs = []
            for _id in self.shifts[day].keys():
                pref = {'pref': gen_pref_val(_id), 'lock_in_role': None}
                day_prefs.append(pref)
            shift_prefs.append(day_prefs)

        return shift_prefs

    def build_training(self):
        training = [[employee['training'] for _ in self.roles]
                    for employee in self.employees]

        return training

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
        employer_setup = {day: self.shifts[day]
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
                             "prefs": self.prefs,
                             "status": self.status})

        print("Saved schedule data to database.")

    def get_schedule_data(self):
        db = self.get_db()
        schedules = db.schedules

        schedules.find_one({"name": self.name})

    def to_dict(self):

        schedule_dict = self.__dict__.copy()

        schedule_dict['employees'] = self._emps_to_str()
        schedule_dict['days'] = self._days_to_str()

        return schedule_dict

    def _days_to_str(self):
        new_days = []

        for day in self.days:
            str_day = day.strftime('%m/%d/%Y')
            new_days.append(str_day)

        return new_days

    def _emps_to_str(self):

        emps = self.employees

        for index, emp in enumerate(self.employees):
            for key in emp.keys():
                if '_id' in key:
                    emps[index][key] = str(emp[key])

        return emps
