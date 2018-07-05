from webssapp.constraints.Constraints import Constraint, lpSum
import pprint
from webssapp.utilities import product_rang


class ConMaxShiftsPerDay(Constraint):
    def __init__(self):
        self.description = "Sets maximum shifts per day for each employee."

    def build(self, prob, x, s):
        print("Building ConMaxShiftsPerDay.")
        for employee, day in product_rang(num_emps=s.num_employees,
                                          num_days=s.num_days):
            prob += lpSum(x[employee][role][day][shift] for role, shift in product_rang(num_roles=s.num_roles,
                                                                                        num_shifts_per_day=s.num_shifts_per_day)[day])<= 1
