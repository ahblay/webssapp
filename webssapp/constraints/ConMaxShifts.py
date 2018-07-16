from webssapp.constraints.Constraints import Constraint, lpSum
import pprint
from webssapp.utilities import product_rang


class ConMaxShifts(Constraint):
    def __init__(self):
        self.description = "Sets maximum shifts per schedule for each employee."

    def build(self, prob, x, s):
        print("Building ConMaxShifts.")
        for employee in range(s.num_employees):
            prob += lpSum(x[employee][role][day][shift]
                          for role, day, shift in product_rang(num_roles=s.num_roles,
                                                               num_days=s.num_days,
                                                               num_shifts_per_day=s.num_shifts_per_day)) \
                    <= int(s.employees[employee]["max_shifts"])
