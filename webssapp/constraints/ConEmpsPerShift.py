from webssapp.constraints.Constraints import *


class ConEmpsPerShift(Constraint):
    def __init__(self):
        self.description = "Sets proper number of employees to each shift."

    def build(self, prob, x, s):
        shifts_by_day = s._get_shifts_by_day()
        for role, day, shift in product_range(s.num_roles, s.num_days, s.num_shifts):
            if s.roles[str(role)] == shifts_by_day[day][shift]['role']:
                shift_info = shifts_by_day[day][shift]
                prob += lpSum(x[employee][role][day][shift] for employee in range(s.num_employees)) == shift_info['num_employees']
