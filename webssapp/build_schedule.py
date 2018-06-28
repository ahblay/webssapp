import pprint

from pulp import *
from pulp import solvers

from webssapp.sanity_checks import *
from webssapp.constraints.ConEmpsPerShift import ConEmpsPerShift
from webssapp.coefficients.CoeffSeniority import SeniorityCoefficient
from webssapp.coefficients import coeffcombine


class InfeasibleProblem(Exception):
    name = "No Solution Possible"
    pass


def product_range(num_emps=None, num_roles=None, num_days=None, num_shifts=None, num_shifts_per_day=None):
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


class VarMatrix:
    def __init__(self, base_name, dimensions):
        def build_matrix(dimensions):
            return [[[[LpVariable(base_name, cat=LpBinary) for _ in range(dimensions[-1][day])]
                                                           for day in range(dimensions[-2])]
                                                           for _ in range(dimensions[-3])]
                                                           for _ in range(dimensions[-4])]
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

        sen_coeff = SeniorityCoefficient().apply(self.schedule.employees[variable[0]]['seniority'])

        return coeffcombine.coeff_sum(sen_coeff)

    def build_objective(self):
        self.prob += lpSum(self.build_coefficient([employee, role, day, shift]) * self.x[employee][role][day][shift]
            for employee, role, day, shift in product_range(num_emps=self.schedule.num_employees,
                                                          num_roles=self.schedule.num_roles,
                                                          num_days=self.schedule.num_days,
                                                          num_shifts_per_day=self.schedule.num_shifts_per_day))

    def solve(self):
        self.prob.solve(solvers.PULP_CBC_CMD())


var_mat = VarMatrix("x", [2, 3, 4, [2, 3, 4, 5]])
pprint.pprint(var_mat.matrix)

pprint.pprint(product_range(num_emps=2, num_roles=3, num_days=4, num_shifts_per_day=[2, 3, 4, 5]))