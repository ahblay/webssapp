import pprint

from pulp import *
from pulp import solvers

from webssapp.sanity_checks import *
from webssapp.constraints.ConEmpsPerShift import ConEmpsPerShift
from webssapp.coefficients.CoeffSeniority import SeniorityCoefficient
from webssapp.coefficients import coeffcombine
from webssapp.utilities import product_rang


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
        self.x = VarMatrix("x", [self.schedule.num_employees, self.schedule.num_roles, self.schedule.num_days,
                                     self.schedule.num_shifts_per_day])
        self.prob = LpProblem("Schedule", LpMaximize)
        self.schedule = schedule

    def build_constraints(self):
        ConEmpsPerShift().build(self.prob, self.x, self.schedule)

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


var_mat = VarMatrix("x", [2, 3, 4, [2, 3, 4, 5]])
pprint.pprint(var_mat.matrix)

pprint.pprint(product_rang(num_roles=3, num_days=4, num_shifts_per_day=[2, 2, 3, 2]))