from webssapp.constraints.Constraints import Constraint, lpSum
import pprint
from webssapp.utilities import product_rang


class ConEmpsPerShift(Constraint):
    def __init__(self):
        self.description = "Assigns proper number of employees to each shift."

    def build(self, prob, x, s):
        print("Building ConEmpsPerShift.")
        shifts_by_day = s._get_shifts_by_day()
        for role, day, shift in product_rang(num_roles=s.num_roles,
                                             num_days=s.num_days,
                                             num_shifts_per_day=s.num_shifts_per_day):
            pprint.pprint(shifts_by_day[day][shift]['role'])
            pprint.pprint(s.roles)
            if s.roles[role] == shifts_by_day[day][shift]['role']:
                shift_info = shifts_by_day[day][shift]
                prob += lpSum(x[employee][role][day][shift]
                              for employee in range(s.num_employees)) == shift_info['num_employees']
            else:
                prob += lpSum(x[employee][role][day][shift]
                              for employee in range(s.num_employees)) == 0
