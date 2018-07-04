import pytest
from webssapp.constraints.ConMinShifts import ConMinShifts
from webssapp.constraints.ConEmpsPerShift import ConEmpsPerShift
from webssapp.constraints.ConEligibleRoles import ConEligibleRoles
from webssapp.constraints.ConMaxShifts import ConMaxShifts
from webssapp.constraints.ConMaxShiftsPerDay import ConMaxShiftsPerDay
from webssapp.build_schedule import Scheduler
from webssapp.test_data import TestSchedule
from webssapp.Schedule import ScheduleProcessor
import datetime
from pprint import pprint as pp

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
num_shifts_per_day = 3

# int
num_emps_per_shift = 3

my_schedule = TestSchedule("Test", start, end, "active")
my_schedule.set_roles(num_roles)
my_schedule.set_employees(num_employees, False, max_shifts, min_shifts, seniority)
my_schedule.set_shifts(num_shifts_per_day, num_emps_per_shift)
my_schedule.set_prefs()

my_schedule_object = ScheduleProcessor(my_schedule.to_dict())
test_scheduler = Scheduler(my_schedule_object)


def test_min_shifts():
    ConMinShifts().build(test_scheduler.prob, test_scheduler.x, test_scheduler.schedule)
    constraints = test_scheduler.prob.constraints
    pp(constraints)
    return constraints

# basically, we want to assert that the constraints formed on the test schedule are of the type we'd expect. In this
# case, we want constraints of the form "x1 + x2 + ... + xn >= min_shifts" where xn represents every role/day/shift
# combo for a given employee.


def test_emps_per_shift():
    ConEmpsPerShift().build(test_scheduler.prob, test_scheduler.x, test_scheduler.schedule)
    constraints = test_scheduler.prob.constraints
    pp(constraints)
    return constraints


def test_eligible_roles():
    ConEligibleRoles().build(test_scheduler.prob, test_scheduler.x, test_scheduler.schedule)
    constraints = test_scheduler.prob.constraints
    pp(constraints)
    return constraints


def test_max_shifts():
    ConMaxShifts().build(test_scheduler.prob, test_scheduler.x, test_scheduler.schedule)
    constraints = test_scheduler.prob.constraints
    pp(constraints)
    return constraints


def test_max_shifts_per_day():
    ConMaxShiftsPerDay().build(test_scheduler.prob, test_scheduler.x, test_scheduler.schedule)
    constraints = test_scheduler.prob.constraints
    pp(constraints)
    return constraints

test_min_shifts()
print("%" * 200)
test_emps_per_shift()
print("%" * 200)
test_eligible_roles()
print("%" * 200)
test_max_shifts()
print("%" * 200)
test_max_shifts_per_day()
