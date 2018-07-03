from webssapp.constraints.Constraints import Constraint, lpSum
from webssapp.utilities import product_rang


class ConEligibleRoles(Constraint):
    def __init__(self):
        self.description = "Prevents employees from being assigned to roles they are ineligible for."

    def build(self, prob, x, s):
        print("Building ConEligibleRoles.")
        for employee, role in product_rang(num_emps=s.num_employees, num_roles=s.num_roles):
            if s.roles[str(role)] not in [role['role_name'] for role in s.employees[employee]['roles']]:
                # Becuase employee has seniority 0, it is assumed they are not able to
                # work this role at all
                prob += lpSum(x[employee][role][day][shift] for day, shift in product_rang(num_days=s.num_days, num_shifts_per_day=s.num_shifts_per_day)) == 0