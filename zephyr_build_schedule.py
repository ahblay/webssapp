import sys, os
from pulp import *
from pulp import solvers
from itertools import product
from sanity_checks import *
import pprint


class InfeasibleProblem(Exception):
    name = "No Solution Possible"
    pass


def product_range(*args):
    return product(*(range(x) if type(x) is int else range(*x) for x in args))


class VarMatrix:
    def __init__(self, base_name, dimensions):

        def var_name(indexes):
            return ".".join(map(str, [base_name] + indexes))
        
        def create_dim(previous_indexes, depth):
            if depth == len(dimensions) - 1:
                return [LpVariable(var_name(previous_indexes + [i]), cat=LpBinary) for i in range(dimensions[-1])]
            return [create_dim(previous_indexes + [i], depth + 1) for i in range(dimensions[depth])]

        self.matrix = create_dim([], 0)

    def __getitem__(self, i):
        return self.matrix[i]


class Schedule:
    def __init__(self, num_employees, num_shifts, num_roles, num_days, employee_info, management_data, training, schedule):
        self.num_employees, self.num_shifts, self.num_roles, self.num_days = num_employees, \
                                                                             num_shifts, num_roles, num_days
        # x holds the main variables
        # employee, role, day, shift
        self.x = x = VarMatrix("x", [num_employees, num_roles, num_days, num_shifts])

        self.management_data = management_data

        self.prob = prob = LpProblem("Schedule", LpMaximize)

        shifts = schedule.shifts

        print('Management Data ---------------------------')
        pprint.pprint(management_data)
        print('Shifts ---------------------')
        pprint.pprint(shifts)
        print('Employee Information ----------------------')
        pprint.pprint(employee_info)
        print('Schedule ----------------------')
        pprint.pprint(schedule.to_dict())

        # correct number of employees in each shift
        for day, shift, role in product_range(num_days, num_shifts, num_roles):

            if shift >= len(self.management_data[role][day]["num_employees"]):
                continue


            # TODO: change to shifts[_id][role]
            if shift < len(self.management_data[role][day]["num_employees"]) and \
                schedule.roles[role] == shifts[shift]['role']:
                prob += lpSum(x[employee][role][day][shift] for employee in range(num_employees)) \
                    == self.management_data[role][day]["num_employees"][shift]

        # min/max shifts
        for employee in range(num_employees):
            prob += lpSum(x[employee][role][day][shift]
                          for role, day, shift in product_range(num_roles, num_days, num_shifts)) \
                    >= employee_info[employee]["min_shifts"]
            prob += lpSum(x[employee][role][day][shift]
                          for role, day, shift in product_range(num_roles, num_days, num_shifts)) \
                    <= employee_info[employee]["max_shifts"]

        # one shift per day
        for employee, day in product_range(num_employees, num_days):
            prob += lpSum(x[employee][role][day][shift] for role, shift in product_range(num_roles, num_shifts)) <= 1

        # no more than one person training per shift/role
        for role, day, shift in product_range(num_roles, num_days, num_shifts):
            prob += lpSum(x[employee][role][day][shift] for employee in range(num_employees) if training[employee][role]) <= 1

        # zero on roles
        for employee, role in product_range(num_employees, num_roles):
            if employee_info[employee]["role_seniority"][role] == 0:
                # Becuase employee has seniority 0, it is assumed they are not able to
                # work this role at all
                prob += lpSum(x[employee][role][day][shift] for day, shift in product_range(num_days, num_shifts)) == 0
        '''
        # not evening then morning
        for employee, day in product_range(num_employees, num_days-1):
            prob += lpSum(x[employee][role][day][-1] + x[employee][role][day+1][0] for role in range(num_roles)) <= 1, ""
        '''
        '''
        # Zephyr: not more than role/shift per week
        for employee, role, shift in product_range(num_employees, num_roles, num_shifts):
            prob += lpSum(x[employee][role][day][shift] for day in range(num_days)) <= 2, ""
        '''
        def coeff(employee, role, day, shift):

            if shift >= len(self.management_data[role][day]["num_employees"]):
                return -7500


            if shift < len(self.management_data[role][day]["num_employees"]):
                # TODO: Change to shifts[_id][role]
                if schedule.roles[role] == shifts[shift]['role']:
                    if employee_info[employee]["shift_pref"][day][shift]["lock_in_role"] == role:
                        c = 1000
                    else:
                        if employee_info[employee]["shift_pref"][day][shift]["pref"] == 5:
                            c = 5
                        elif employee_info[employee]["shift_pref"][day][shift]["pref"] == 1:
                            c = 1
                        elif employee_info[employee]["shift_pref"][day][shift]["pref"] == -1000:
                            c = -1000
                        else:
                            raise ValueError("`employee_info` array had a bad pref value for employee", employee, "day", day, "shift", shift)
                    c *= employee_info[employee]["role_seniority"][role]
                else:
                    c = -7500

                return c

        self.coeff = coeff

        prob += lpSum(coeff(employee, role, day, shift)*x[employee][role][day][shift]
                      for employee, role, day, shift in product_range(num_employees, num_roles, num_days, num_shifts))

        prob.solve(solvers.PULP_CBC_CMD())

    def retrieve_declined_requests(self, employee, role, day, shift):
        return self.coeff(employee, role, day, shift) < 0 and value(self.x[employee][role][day][shift]) == 1

    def get_schedule(self):
        """
        assert self.is_solution is not None, "Haven't completed optimization yet"
        if not self.is_solution:
            print("Schedule had no solution")
            return False
            """

        print("Status:", LpStatus[self.prob.status])
        print("Score:", sum(self.coeff(employee, role, day, shift)*value(self.x[employee][role][day][shift])
                            for employee, role, day, shift
                            in product_range(self.num_employees, self.num_roles, self.num_days, self.num_shifts)))

        if LpStatus[self.prob.status] == "Infeasible":
            raise InfeasibleProblem("Oops. It appears that you have attempted an impossible problem. " 
                                    "Would you like to bury your head in the sand?!?")

        # employee, day: {"working": True/False, "role": role, "shift": shift}
        schedule = [[{"working": False} for _ in range(self.num_days)] for _ in range(self.num_employees)]
        for employee, role, day, shift in product_range(self.num_employees, self.num_roles, self.num_days, self.num_shifts):
            print('{} --> {}'.format(self.coeff(employee, role, day, shift), self.x[employee][role][day][shift]))
            if value(self.x[employee][role][day][shift]):
                print("^^^^^^^^^^^^^^^^^^^")
                schedule[employee][day]["working"] = True
                schedule[employee][day]["shift"] = self.management_data[role][day]['shift_times'][shift]
                schedule[employee][day]["role"] = role
                schedule[employee][day]["declined"] = self.retrieve_declined_requests(employee, role, day, shift)

        self.schedule = schedule
        return schedule

if __name__ == "__main__":
    print("Running sample problem")

    from random import randint, seed
    import time

    seed(0)

    num_employees = 100
    num_shifts = 3
    num_roles = 5
    num_days = 7

    employee_names = ["employee"+str(e) for e in range(num_employees)]
    role_names = ["Role "+str(r) for r in range(num_roles)]
    shift_names = ["Shift "+str(s) for s in range(num_shifts)]

    # employee, day, shift: {"pref": preference (0 to 2), "role": locked in role}

    # day, shift, role
    management_data = [{day: {"num_employees": [1 for shift in range(num_shifts)],
                              "shift_times": ["don't matter" for _ in range(num_shifts)]}
                        for day in range(num_days)}
                       for role in range(num_roles)]

    max_shifts = [2 for _ in range(num_employees)]
    min_shifts = [0 for _ in range(num_employees)]

    # employee, role 
    training = [[False for role in range(num_roles)] for employee in range(num_employees)]

    # employee, role
    seniority = [[randint(0, 7) for role in range(num_roles)] for employee in range(num_employees)]

    employee_info = [{"min_shifts": min_shifts[employee],
                      "max_shifts": max_shifts[employee],
                      "shift_pref": [[{"pref": randint(1, 2), "lock_in_role": None} for shift in range(num_shifts)]
                                     for day in range(num_days)],
                      "role_seniority": seniority[employee]}
                      for employee in range(num_employees)]

    schedule = None
    s = Schedule(num_employees, num_shifts, num_roles, num_days, employee_info, management_data, training, schedule)

    schedule = s.get_schedule()

    '''
    with open("./table.html", "w") as f:
        f.write(html)

    import webbrowser
    webbrowser.open_new("./table.html")
    '''
