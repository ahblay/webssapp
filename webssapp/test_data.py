from faker import Faker
from bson import ObjectId
import datetime
from pprint import pprint as pp

fake = Faker()


class TestSchedule():
    def __init__(self, name, start, end, status):
        self.id = ObjectId()
        self.status = status
        self.name = name
        self.start_date = start
        self.end_date = end
        self.days = self.get_days(start, end)
        self.roles = []
        self.employees = []
        self.shifts = []
        self.prefs = {}
        self.management_data = []
        self.employee_info = []
        self.training = []

    def set_roles(self, num_roles):
        roles = []
        for _ in range(num_roles):
            roles.append(fake.job())
        self.roles = roles

    def set_employees(self,
                      num_emps,
                      auto=True,
                      max_shifts=None,
                      min_shifts=None,
                      seniority=None):
        emps = []
        if auto:
            for _ in range(num_emps):
                emp = {}
                emp["_id"] = ObjectId()
                emp["first_name"] = fake.first_name()
                emp["last_name"] = fake.last_name()
                emp["inactive"] = fake.boolean(chance_of_getting_true=10)
                emp["min_shifts"] = fake.random_int(min=0, max=2)
                emp["max_shifts"] = fake.random_int(min=50, max=52)
                emp["name"] = emp["first_name"] + " " + emp["last_name"]
                emp["seniority"] = fake.random_int(min=0, max=10)
                emp["roles"] = [{"role_name": role, "training": False} for role in self.roles]
                emps.append(emp)
            self.employees = emps
        else:
            for i in range(num_emps):
                emp = {}
                emp["_id"] = ObjectId()
                emp["first_name"] = fake.first_name()
                emp["last_name"] = fake.last_name()
                emp["inactive"] = fake.boolean(chance_of_getting_true=10)
                emp["min_shifts"] = min_shifts if type(min_shifts) is int \
                    else min_shifts[i] if type(min_shifts) is list \
                    else fake.random_int(min=0, max=2)
                emp["max_shifts"] = max_shifts if type(max_shifts) is int \
                    else max_shifts[i] if type(max_shifts) is list \
                    else fake.random_int(min=50, max=52)
                emp["name"] = emp["first_name"] + " " + emp["last_name"]
                emp["seniority"] = seniority if type(seniority) is int \
                    else seniority[i] if type(seniority) is list \
                    else fake.random_int(min=0, max=10)
                emp["roles"] = [{"role_name": role, "training": False} for role in self.roles]
                emps.append(emp)
            self.employees = emps

    def set_shifts(self,
                   num_shifts_per_day,
                   num_emps_per_shift,
                   auto=True,
                   num_roles_per_day=None,
                   ):
        shifts = []
        if auto:
            day_counter = 0
            for day in self.days:
                if type(num_shifts_per_day) is int:
                    for _ in range(num_shifts_per_day):
                        shift = {}
                        shift["_id"] = str(ObjectId())
                        shift["date"] = day.strftime("%m/%d/%Y")
                        shift["end"] = "5:00pm"
                        shift["num_employees"] = num_emps_per_shift
                        shift["parent_shift"] = shift["_id"]
                        shift["role"] = self.roles[0]
                        shift["start"] = "8:00am"
                        shifts.append(shift)
                if type(num_shifts_per_day) is list:
                    for _ in range(num_shifts_per_day[day_counter]):
                        shift = {}
                        shift["_id"] = str(ObjectId())
                        shift["date"] = day.strftime("%m/%d/%Y")
                        shift["end"] = "5:00pm"
                        shift["num_employees"] = num_emps_per_shift
                        shift["parent_shift"] = shift["_id"]
                        shift["role"] = self.roles[0]
                        shift["start"] = "8:00am"
                        shifts.append(shift)
                    day_counter += 1
            self.shifts = shifts

    def set_length(self, length):
        days = []
        base = datetime.datetime.today()
        for _ in range(length):
            days.append(base - datetime.timedelta(days=length))
        self.days = days

    def get_days(self, start_date, end_date):
        dates = []
        delta = end_date - start_date
        for i in range(delta.days + 1):
            dates.append(start_date + datetime.timedelta(days=i))

        return dates

    def set_prefs(self,
                  auto=True):
        prefs = {}
        if auto:
            for employee in self.employees:
                days = []
                for day in self.days:
                    day_pref_info = {}
                    day_pref_info["date"] = day
                    day_pref_info["status"] = "Available"
                    for shift in self.shifts:
                        if shift["date"] == day.strftime("%m/%d/%Y"):
                            day_pref_info[shift["_id"]] = 1
                    days.append(day_pref_info)
                prefs[str(employee["_id"])] = days
        self.prefs = prefs

    def set_training(self):
        pass

    def edit_employee(self,
                      employee_name,
                      inactive=None,
                      max_shifts=None,
                      min_shifts=None,
                      seniority=None,
                      roles=None):
        variables = locals()
        del variables["self"]

        for employee in self.employees:
            if employee["name"] == employee_name:
                for key, value in variables.items():
                    if value is not None:
                        employee[key] = value

    def to_dict(self):
        output = {}
        for attr, value in vars(self).items():
            output[attr] = value
        return output

# datetime object
start = datetime.datetime.strptime("06/30/2018", '%m/%d/%Y')
end = datetime.datetime.strptime("07/03/2018", '%m/%d/%Y')

# int
num_roles = 3
num_employees = 3

# int or array of length num_employees
max_shifts = [7, 8, 9]
min_shifts = 3
seniority = 5

# int or array of length num_days
num_shifts_per_day = [2, 3, 4, 5]

# int
num_emps_per_shift = 3

my_schedule = TestSchedule("Test", start, end, "active")
my_schedule.set_roles(num_roles)
my_schedule.set_employees(num_employees, False, max_shifts, min_shifts, seniority)
my_schedule.set_shifts(num_shifts_per_day, num_emps_per_shift)
my_schedule.set_prefs()

pp(my_schedule.to_dict())

my_schedule.edit_employee("bob")



