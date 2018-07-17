import pprint

from pulp import *
from pulp import solvers
from webssapp.constraints.ConEmpsPerShift import ConEmpsPerShift
from webssapp.constraints.ConMinShifts import ConMinShifts
from webssapp.constraints.ConMaxShifts import ConMaxShifts
from webssapp.constraints.ConMaxShiftsPerDay import ConMaxShiftsPerDay
from webssapp.constraints.ConEligibleRoles import ConEligibleRoles
from webssapp.coefficients.CoeffSeniority import SeniorityCoefficient
from webssapp.coefficients import coeffcombine
from webssapp.utilities import product_rang
from datetime import datetime


class InfeasibleProblem(Exception):
    name = "No Solution Possible"
    pass


class VarMatrix:
    def __init__(self, base_name, dimensions):
        def build_matrix(dimensions):
            return [[[[LpVariable("{}.{}.{}.{}".format(emp, role, day, shift), cat=LpBinary) for shift in range(dimensions[-1][day])]
                                                           for day in range(dimensions[-2])]
                                                           for role in range(dimensions[-3])]
                                                           for emp in range(dimensions[-4])]
        self.matrix = build_matrix(dimensions)

    def __getitem__(self, i):
        return self.matrix[i]


class Scheduler:
    def __init__(self, schedule):
        self.schedule = schedule
        self.x = VarMatrix("x", [self.schedule.num_employees,
                                 self.schedule.num_roles,
                                 self.schedule.num_days,
                                 self.schedule.num_shifts_per_day])
        self.prob = LpProblem("Schedule", LpMaximize)
        self.schedule = schedule
        self.output = []
        self.output_for_emp_portal = {}

    def build_constraints(self):
        pprint.pprint(self.x.matrix)
        ConEmpsPerShift().build(self.prob, self.x, self.schedule)
        ConMinShifts().build(self.prob, self.x, self.schedule)
        ConMaxShifts().build(self.prob, self.x, self.schedule)
        ConMaxShiftsPerDay().build(self.prob, self.x, self.schedule)
        ConEligibleRoles().build(self.prob, self.x, self.schedule)

    def build_coefficient(self, variable):

        sen_coeff = int(SeniorityCoefficient().apply(self.schedule.employees[variable[0]]['seniority']))

        return coeffcombine.coeff_sum(sen_coeff, 0)

    def build_objective(self):
        self.prob += lpSum(self.build_coefficient([employee, role, day, shift]) * self.x[employee][role][day][shift]
            for employee, role, day, shift in product_rang(num_emps=self.schedule.num_employees,
                                                           num_roles=self.schedule.num_roles,
                                                           num_days=self.schedule.num_days,
                                                           num_shifts_per_day=self.schedule.num_shifts_per_day))

    def solve(self):
        self.prob.solve(solvers.PULP_CBC_CMD())

    def output(self):
        dimensions = [self.schedule.num_employees, self.schedule.num_roles, self.schedule.num_days,
                      self.schedule.num_shifts_per_day]
        output_matrix = [[[[int(value(self.x[emp][role][day][shift])) for shift in range(dimensions[-1][day])]
                                                                     for day in range(dimensions[-2])]
                                                                     for role in range(dimensions[-3])]
                                                                     for emp in range(dimensions[-4])]

        pprint.pprint(output_matrix)
        print(LpStatus[self.prob.status])
        pprint.pprint(self.prob.constraints)

    def retrieve_declined_requests(self, employee, role, day, shift):
        return self.build_coefficient([employee, role, day, shift]) < 0 and value(self.x[employee][role][day][shift]) == 1

    def get_schedule(self):

        print("Status:", LpStatus[self.prob.status])
        print("Score:", sum(self.build_coefficient([employee, role, day, shift])*value(self.x[employee][role][day][shift])
                            for employee, role, day, shift
                            in product_rang(num_emps=self.schedule.num_employees,
                                             num_roles=self.schedule.num_roles,
                                             num_days=self.schedule.num_days,
                                             num_shifts_per_day=self.schedule.num_shifts_per_day)))

        if LpStatus[self.prob.status] == "Infeasible":
            raise InfeasibleProblem("Oops. It appears that you have attempted an impossible problem. " 
                                    "Would you like to bury your head in the sand?!?")

        # employee, day: {"working": True/False, "role": role, "shift": shift}
        output = [[{"working": False} for _ in range(self.schedule.num_days)] for _ in range(self.schedule.num_employees)]

        for employee, role, day, shift in product_rang(num_emps=self.schedule.num_employees,
                                                       num_roles=self.schedule.num_roles,
                                                       num_days=self.schedule.num_days,
                                                       num_shifts_per_day=self.schedule.num_shifts_per_day):
            if value(self.x[employee][role][day][shift]):
                shift_info = self.schedule._get_shifts_by_day()[day][shift]
                output[employee][day]["employee_id"] = str(self.schedule.employees[employee]['_id'])
                output[employee][day]["working"] = True
                output[employee][day]["shift_id"] = str(shift_info['_id'])
                output[employee][day]["shift"] = shift_info['start'] + " - " + shift_info['end']
                output[employee][day]["role"] = role
                output[employee][day]["declined"] = self.retrieve_declined_requests(employee, role, day, shift)

        self.output = output
        return output

    def get_output_for_emp_portal(self):
        output = {str(self.schedule.employees[employee]["username"]): [{"working": False} for _ in range(self.schedule.num_days)]
                  for employee in range(self.schedule.num_employees)}

        for employee, role, day, shift in product_rang(num_emps=self.schedule.num_employees,
                                                       num_roles=self.schedule.num_roles,
                                                       num_days=self.schedule.num_days,
                                                       num_shifts_per_day=self.schedule.num_shifts_per_day):
            if value(self.x[employee][role][day][shift]):
                shift_info = self.schedule._get_shifts_by_day()[day][shift]
                emp_username = str(self.schedule.employees[employee]['username'])
                output[emp_username][day]["working"] = True
                output[emp_username][day]["shift_id"] = str(shift_info['_id'])
                output[emp_username][day]["shift_start"] = shift_info['start']
                output[emp_username][day]["shift_end"] = shift_info['end']
                output[emp_username][day]["role"] = self.schedule.roles[role]
                output[emp_username][day]["declined"] = self.retrieve_declined_requests(employee, role, day, shift)
                output[emp_username][day]["date"] = self.schedule.days[day].strftime("%m/%d/%Y")
                output[emp_username][day]["upcoming"] = True if self.schedule.days[day].date() >= datetime.today().date() else False

        self.output_for_emp_portal = output
        return output