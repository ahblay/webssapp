from webssapp.errors import user_errors

#checked
def check_for_shift_info(schedule):

    if not schedule.shifts:
        return [user_errors.NoShiftInfo()]

#checked
def check_for_emp_info(schedule):

    if not schedule.employees:
        return [user_errors.NoEmpInfo()]

#checked
def check_num_shifts(schedule):

    if len(schedule.shifts) > sum([int(emp["max_shifts"]) for emp in schedule.employees]):
        return [user_errors.TooManyShifts()]

#checked
def check_num_shifts_for_role(schedule):
    errors = []
    for role in list(schedule.roles.keys()):
        if len(schedule.get_shifts_for_role(role)) > sum([int(emp['max_shifts']) for emp in schedule.get_emps_for_role(role)]):
            errors.append(user_errors.TooManyShiftsForRole(schedule.roles[role]))

    return errors

#checked
def check_num_shifts_for_day(schedule):
    # Assumes employees are limited to 1 shift per day.
    # TODO: Make this general with an arg for max_shifts_per_day
    errors = []
    for day in range(len(schedule.days)):
        if len(schedule._get_shifts_by_day()[day]) > schedule.num_employees:
            errors.append(user_errors.TooManyShiftsOnDay(schedule.days[day]))

    return errors


def check_num_shifts_for_role_and_day(schedule):
    errors = []
    for role in list(schedule.roles.keys()):
        for day in range(len(schedule.days)):
            shifts_for_role_and_day = [shift for shift in schedule._get_shifts_by_day()[day]
                                       if shift['role'] == schedule.roles[role]]

            if len(shifts_for_role_and_day) > len(schedule.get_emps_for_role(role)):
                errors.append(user_errors.TooManyRoleShiftsOnDay(schedule.roles[str(role)], schedule.days[day]))

    return errors





