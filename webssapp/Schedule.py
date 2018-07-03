import datetime
import pprint
import webssapp.utilities as utilities
from flask import g
from pymongo import MongoClient

from webssapp import build_schedule


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

        self._id = schedule['_id'] if '_id' in schedule.keys() else None
        self.status = schedule['status'] if 'status' in schedule.keys() else None
        self.name = schedule['name'] if 'name' in schedule.keys() else None
        self.employees = schedule['employees'] if 'employees' in schedule.keys() else None
        self.shifts = schedule['shifts'] if 'shifts' in schedule.keys() else []
        self.days = self.get_days(schedule['start_date'], schedule['end_date']) if schedule else None
        self.roles = utilities.get_roles()
        self.start_date = schedule['start_date'] if 'start_date' in schedule.keys() else None
        self.end_date = schedule['end_date'] if 'end_date' in schedule.keys() else None
        self.prefs = schedule['prefs'] if 'prefs' in schedule.keys() else {}

        self.num_employees = self.get_length(self.employees)
        self.num_days = self.get_length(self.days)
        self.num_roles = self.get_length(self.roles)
        self.num_shifts = self.build_num_shifts()
        self.num_shifts_per_day = self.get_num_shifts_per_day()

        self.management_data = []
        self.employee_info = []
        self.training = []

        self.output = schedule['output'] if 'output' in schedule.keys() else None

    def get_length(self, item):
        if item is not None:
            return len(item)
        else:
            return 0

    def get_days(self, start_date, end_date):

        delta = end_date - start_date

        dates = []
        for i in range(delta.days + 1):
            dates.append(start_date + datetime.timedelta(days=i))

        return dates

    def build_num_shifts(self):

        if self.shifts == []:
            return

        daily_shifts = [0] * self.num_days

        for index, _ in enumerate(daily_shifts):
            for shift in self.shifts:
                if shift['date'] == self.days[index].strftime('%m/%d/%Y'):
                    daily_shifts[index] += 1

        return max(daily_shifts)

    def get_num_shifts_per_day(self):

        if self.shifts == []:
            return None

        daily_shifts = [0] * self.num_days

        for index, _ in enumerate(daily_shifts):
            for shift in self.shifts:
                if shift['date'] == self.days[index].strftime('%m/%d/%Y'):
                    daily_shifts[index] += 1

        return daily_shifts

    def build_management_data(self):
        print("Building management data.")
        print("Num shifts: {} | Num roles: {}".format(self.num_shifts, self.num_roles))

        shifts_by_day = self._get_shifts_by_day()
        pprint.pprint(shifts_by_day)
        pprint.pprint(self.roles)

        management_data = []
        for role in self.roles.values():
            role_dict = {}
            day_index = 0
            for day in shifts_by_day:
                day_dict = {
                    "num_employees": [day[shift]['num_employees'] for shift in range(len(day)) if day[shift]['role'] == role],
                    "shift_times": ['{} - {}'.format(day[shift]['start'], day[shift]['end']) for shift in range(len(day)) if day[shift]['role'] == role]}
                role_dict[day_index] = day_dict
                day_index += 1
            management_data.append(role_dict)
        pprint.pprint(management_data)
        return management_data

    def build_employee_info(self):

        #if self.prefs == {}:
         #   return

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

    def _get_shifts_by_day(self):

        shifts_by_day = []
        for day in self.days:
            daily_shifts = []
            for shift in self.shifts:
                if shift['date'] == day.strftime('%m/%d/%Y'):
                    daily_shifts.append(shift)
            shifts_by_day.append(daily_shifts)

        return shifts_by_day

    def _init_role_seniority(self, employee):

        emp_role_names = [role['role_name'] for role in employee['roles']]
        return [int(employee['seniority']) if role in emp_role_names else 0 for role in self.roles.values()]

    def _init_shift_prefs(self, employee):

        def gen_pref_val(_id, emp):

            emp_id = str(emp['_id'])

            if emp_id in self.prefs.keys():
                for day_prefs in self.prefs[emp_id]:
                    if day_prefs['status'] == "Unavailable":
                        return -1000

                    if str(_id) in day_prefs.keys():
                        return day_prefs[_id]

            return -1000

        shift_prefs = []

        shifts_by_day = self._get_shifts_by_day()

        for day in shifts_by_day:
            day_prefs = []
            shift_ids = [shift['_id'] for shift in day]
            for _id in shift_ids:
                pref = {'pref': gen_pref_val(_id, employee), 'lock_in_role': None}
                day_prefs.append(pref)
            shift_prefs.append(day_prefs)

        return shift_prefs

    def build_training(self):
        training = []
        pprint.pprint(self.employees)
        for emp in self.employees:
            emp_roles = [role['role_name'] for role in emp['roles']]
            emp_training = [False] * len(self.roles)
            for loc, role in enumerate(self.roles.values()):
                if role in emp_roles:
                    emp_role_index = next((index for (index, emp_role) in enumerate(emp['roles']) if emp_role["role_name"] == role), None)
                    emp_training[loc] = emp['roles'][emp_role_index]['training']

            training.append(emp_training)
        return training

    def build_schedule(self):
        s = build_schedule.Scheduler(self)

        s.build_constraints()
        s.build_objective()
        s.solve()

        self.output = s.get_schedule()
        self.save_output_to_db()

    def build_employer_setup_dict(self):
        employer_setup = {day: self._get_shifts_by_day()[day]
                          for day in self.days}
        return employer_setup

    def build_employee_setup_dict(self):
        employee_setup = self.employees
        return employee_setup

    def get_db(self):
        if not hasattr(g, "db_connection"):
            g.db_connection = MongoClient("localhost", 27017)["test"]
        return g.db_connection

    def save_schedule_data(self, username):
        db = self.get_db()

        payload = {
                    "username": username,
                     "name": self.name,
                     "start_date": self.start_date,
                     "end_date": self.end_date,
                     "employees": self.employees,
                     "shifts": self.shifts,
                     "days": self.days,
                     "roles": self.roles,
                     "prefs": self.prefs,
                     "status": self.status
        }

        pprint.pprint(payload)
        db.schedules.insert(payload)

        print("Saved schedule data to database.")

    def save_output_to_db(self):
        db = self.get_db()
        print("saving output to db")
        db.schedules.update({"_id": self._id}, {"$set": {"output": self.output}})
        pprint.pprint(dict(db.schedules.find_one({"_id": self._id})))

    def to_dict(self):

        schedule_dict = self.__dict__.copy()

        schedule_dict['employees'] = self._emps_to_str()
        schedule_dict['days'] = self._days_to_str()
        schedule_dict['_id'] = str(self._id)

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

    '''
    Sorts a field of the Schedule object.
    
    Args:
        attribute: The field of the schedule object to sorted [Accepts: 'shifts', 'employees']
        order: The sort order to be applied to the attribute.
    '''
    def sort(self, attribute, order):

        def chrono_sort(shift):
            time_str = shift['start']
            parts = time_str.split(':')
            time_parts = {'hr': int(parts[0]), 'min': int(parts[1][:2]), 'am_pm': parts[1][-2:]}
            if time_parts['am_pm'] == 'pm' and time_parts['hr'] != 12:
                time_parts['hr'] += 12
            if time_parts['am_pm'] == 'am' and time_parts['hr'] == 12:
                time_parts['hr'] = 0

            date_parts = {
                            'yr': int(shift['date'][-4:]),
                            'mo': int(shift['date'][:2]),
                            'day': int(shift['date'][3:5])
                         }
            date = datetime.date(date_parts['yr'], date_parts['mo'], date_parts['day'])
            time = datetime.time(time_parts['hr'], time_parts['min'])
            return datetime.datetime.combine(date, time)

        attributes = {
            'shifts': {'data': self.shifts,
                       'orders': {'chronological': lambda x: chrono_sort(x)}},
            'employees': {'data': self.employees,
                          'orders': {'alphabetical': lambda x: x['name']}}
        }

        if attribute not in attributes.keys():
            raise ValueError('No sorting is available for that field.')
        else:
            if order not in attributes[attribute]['orders']:
                raise ValueError('The specified sort order is not defined for the attribute {}. Try {} instead.'
                                 .format(attribute, attributes[attribute]['orders']))

        obj_to_sort = attributes[attribute]['data']

        obj_to_sort.sort(key=attributes[attribute]['orders'][order])

    def preprocess(self):

        self.sort('shifts', 'chronological')
        #self.sort('employees', 'alphabetical')

        self._rebuild_alg_data()

    def _rebuild_alg_data(self):

        self.management_data = self.build_management_data()
        self.employee_info = self.build_employee_info()
        self.training = self.build_training()



