from itertools import product

def product_range(*args):
    return product(*(range(x) if type(x) is int else range(*x) for x in args))

class ConstraintError(Exception):
    name = "Constraint Error"
    pass

class ManagementDictError(Exception):
    name = "Critical Management Tab Error"
    pass

class EmployeeDictError(Exception):
    name = "Critical Employee Tab Error"
    pass

def check_employee_data(employee_info, num_employees, num_days, num_roles, num_shifts):
    # check we have all the employees
    if type(employee_info) is not list:
        raise EmployeeDictError("Employee_data is not a list. Recieved Employee_data as {}. Please contact a representative of SlobodinScheduling for assistance.". format(type(employee_info)))
    if len(employee_info) != num_employees:
        raise EmployeeDictError("Employee_data is of length ({}) when expected is length ({}). Please contact a representative of SlobodinScheduling for assistance.".format(len(employee_info), num_employees))

    for i, employee in enumerate(employee_info):
        # check name
        if "name" not in employee:
            raise EmployeeDictError("Employee: {} is missing 'name'. Please contact a representative of SlobodinScheduling for assistance.".format(i))
        if type(employee["name"]) is not str:
            raise EmployeeDictError("Employee: {}'s 'name' is not string. Recieved Employee: {}'s 'name' as {}. Please contact a representative of SlobodinScheduling for assistance.".format(i, i, type(employee["name"])))

        # min/max shifts
        for limit in ("min_shifts", "max_shifts"):
            if limit not in employee:
                raise EmployeeDictError("Employee: {} is missing '{}'. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], limit))
            if type(employee[limit]) is not int:
                raise EmployeeDictError("Employee: {}'s '{}' is not integer. Recieved Employee {}'s '{}' as {}. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], limit, employee["name"], limit, type(employee[limit])))
            if employee[limit] < 0:
                raise EmployeeDictError("Employee: {}'s '{}' less than 0. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], limit))
        if employee["min_shifts"] > employee["max_shifts"]:
            raise ConstraintError("In Employee Tab, {}'s Min Shift is greater than Max Shift.\n\nPlease make {}'s Max Shift greater than their Min Shift.".format(employee["name"], employee["name"]))

        # role seniority
        if "role_seniority" not in employee:
            raise EmployeeDictError("Employee: {} is missing 'role_seniority'. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"]))
        if type(employee["role_seniority"]) is not list:
            raise EmployeeDictError("Employee: {}'s 'role_seniority' is not list. Recieved Employee {}'s 'role_seniority' as {}. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], employee["name"], type(employee["role_seniority"])))
        if len(employee["role_seniority"]) != num_roles:
            raise EmployeeDictError("Employee: {}'s 'role_seniority' is of length ({}) when expected is length ({}). Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], len(employee["role_seniority"]), num_roles))
        for rs in employee["role_seniority"]:
            if type(rs) is not int:
                raise EmployeeDictError("Employee: {}'s 'role_seniority' is not integer. Recieved Employee {}'s 'role_seniority' as {}. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], employee["name"], type(rs)))
            if rs < 0:
                raise EmployeeDictError("Employee: {}'s 'role_seniority' contains a value less than 0. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"]))

        # shift preferences
        if "shift_pref" not in employee:
            raise EmployeeDictError("Employee: {} is missing 'shift_pref'. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"]))
        if type(employee["shift_pref"]) is not list:
            raise EmployeeDictError("Employee: {}'s 'shift_pref' is not list. Recieved Employee {}'s 'shift_pref' as {}. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], employee["name"], type(employee["shift_pref"])))
        if len(employee["shift_pref"]) != num_days:
            raise EmployeeDictError("Employee: {}'s 'shift_pref' is of length ({}) when expected is length ({}). Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], len(employee["shift_pref"]), num_days))
        for sp in employee["shift_pref"]:
            if type(sp) is not list:
                raise EmployeeDictError("Employee: {}'s 'shift_pref' is not list. Recieved Employee {}'s 'shift_pref' as {}. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], employee["name"], type(rs)))
            if len(sp) != num_shifts:
                raise EmployeeDictError("Employee: {}'s 'shift_pref' contains a list of length ({}) when expected is length ({}). Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], len(sp), num_shifts))
            index = -1
            for s in sp:
                index += 1
                if type(s) is not dict:
                    raise EmployeeDictError("Employee: {}'s 'shift_pref'[{}] is not a dict. Recieved Employee {}'s 'shift_pref'[{}] as {}. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], index, employee["name"], index, type(s)))
                if "lock_in_role" not in s:
                    raise EmployeeDictError("Employee: {}'s 'shift_pref'[{}]['lock_in_role'] does not exist. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], index))
                if not (s["lock_in_role"] is None or type(s["lock_in_role"]) is int):
                    raise EmployeeDictError("Employee: {}'s 'shift_pref'[{}]['lock_in_role'] has type {} and value {}. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], index, type(s["lock_in_role"]), s["lock_in_role"]))
                if "pref" not in s:
                    raise EmployeeDictError("Employee: {}'s 'shift_pref'[{}]['pref'] does not exist. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], index))
                if s["pref"] not in (0, 1, 2):
                    raise EmployeeDictError("Employee: {}'s 'shift_pref'[{}]['pref'] is invalid. Recieved Employee {}'s 'shift_pref'[{}]['pref'] as {}. Please contact a representative of SlobodinScheduling for assistance.".format(employee["name"], index, employee["name"], index, s["pref"]))

def check_management_data(config_data, management_data):
#Check that 'management_data' is correct format
    if type(management_data) is not list:
        raise ManagementDictError("'Management_data' is not a list. Recieved 'Management_data' as {}. Please contact a representative of SlobodinScheduling for assistance.". format(type(management_data)))
#Check if 'management_data' contains information on the correct number of roles
    if len(management_data) != config_data['num_roles']:
        raise ManagementDictError("'Management_data' is of length ({}) when expected is length ({}). Please contact a representative of SlobodinScheduling for assistance.".format(len(management_data), config_data['num_roles']))
#Check that 'management_data'[role] is correct format
    for role in range(config_data['num_roles']):
        if type(management_data[role]) is not dict:
            raise ManagementDictError("'Management_data'[{}] is not a dict. Recieved 'Management_data'[{}] as {}. Please contact a representative of SlobodinScheduling for assistance.".format(str(role), str(role), type(management_data[role])))
        #Check if 'management_data' contains information on the correct number of days
        for day in range(config_data['num_days']):
            #Check if management_data[role] contains information on each day 
            if day not in management_data[role]:
                print(management_data[role])
                raise ManagementDictError( "'Management_data'[{}] does not contain information on day ({}). Please contact a representative of SlobodinScheduling for assistance.". format(str(role), str(day)))
            #Check if management_data[role][day] is a dict
            if type(management_data[role][day]) is not dict:
                raise ManagementDictError("'Managment_data'[{}][{}] is not a dict. Recieved 'Managment_data'[{}][{}] as {}. Please contact a representative of SlobodinScheduling for assistance.". format(str(role), str(day), str(role), str(day), type(management_data[role][day])))
            #Check if 'management_data'[role][day]['num_employees'] is a list
            if type(management_data[role][day]['num_employees']) is not list:
                raise ManagementDictError("'Manangemet_data'[{}][{}]['num_employees'] is not a list. Recieved 'Manangemet_data'[{}][{}]['num_employees'] as {}. Please contact a representative of SlobodinScheduling for assistance.". format(str(role), str(day), str(role), str(day), type(management_data[role][day]['num_employees'])))
            #Check if 'management_data'[role][day]['num_employees'] is the correct length (number of shifts)
            if len(management_data[role][day]['num_employees']) != config_data['num_shifts']:
                print(len(management_data[role][day]['num_employees']))
                raise ManagementDictError("'Manangemet_data'[{}][{}]['num_employees'] is length ({}) when expected is length ({}). Please contact a representative of SlobodinScheduling for assistance.". format(str(role), str(day), len(management_data[role][day]['num_employees']), str(config_data['num_shifts'])))
            #Check if 'management_data'[role][day]['shift_times'] is the correct length (number of shifts)
            if type(management_data[role][day]['shift_times']) is not list:
                raise ManagementDictError("'Management_data[{}][{}]['shift_times] is not a list. Recieved 'Management_data[{}][{}]['shift_times] as {}. Please contact a representative of SlobodinScheduling for assistance.". format(str(role), str(day), str(role), str(day), type(management_data[role][day]['shift_times'])))
            #Check if 'management_data'[role][day]['shift_times'] is the correct length (number of shifts)
            if len(management_data[role][day]['shift_times']) != config_data['num_shifts']:
                raise ManagementDictError("'Manangemet_data[{}][{}]['shift_times'] is length ({}) when expected is length ({}). Please contact a representative of SlobodinScheduling for assistance.". format(str(role), str(day), len(management_data[role][day]['num_employees']), str(config_data['num_shifts'])))
            #Check if 'management_data'[role][day] containts correct information
            for shift in range(config_data['num_shifts']):
                #Check if 'management_data'[role][day]['num_employees'] is a list of integers
                if type(management_data[role][day]['num_employees'][shift]) is not int:
                    raise ManagementDictError("'Management_data'[{}][{}]['num_employees'][{}] is not an integer. Recieved 'Management_data'[{}][{}]['num_employees'][{}] as {}. Please contact a representative of SlobodinScheduling for assistance.". format(str(role), str(day), str(shift), str(role), str(day), str(shift), type(management_data[role][day]['num_employees'][shift])))
                if management_data[role][day]['num_employees'][shift] < 0:
                    raise ManagementDictError("'Management_data'[{}][{}]['num_employees'][{}] is an negative integer. Please contact a representative of SlobodinScheduling for assistance.". format(str(role), str(day), str(shift)))
                #Check if management_data'[role][day]['shift_times'] is a list of strings
                if type(management_data[role][day]['shift_times'][shift]) is not str:
                    raise ManagementDictError("'Management_data'[{}][{}]['shift_times'][{}] is not an string. Recieved 'Management_data'[{}][{}]['shift_times'][{}] as {}. Please contact a representative of SlobodinScheduling for assistance.". format(str(role), str(day), str(shift), str(role), str(day), str(shift), type(management_data[role][day]['shift_times'][shift]) ))

def check_management_employee_constraints(config_data, management_data, employee_data):
    required_num_employees = sum(management_data[role][day]['num_employees'][shift] for role, day, shift in product_range(config_data['num_roles'],config_data['num_days'], config_data['num_shifts']))
    employees_maximum_shift_availability = sum(employee_data[employee]['max_shifts'] for employee in range(config_data['num_employees']))
    employees_minimum_shift_availability = sum(employee_data[employee]['min_shifts'] for employee in range(config_data['num_employees']))

    # Check if required number of employees in management tab exceeds maximum availabilty of employees in employee tab
    if required_num_employees > employees_maximum_shift_availability:
        raise ConstraintError("In Management Tab, required number of employees to work is ({}). This value exceeds the maximum availability of employees in Employee Information Tab: ({}).\n\nPlease reduce the required number of employees to work in Management Tab or increase your employees' maximum availability in Employee Information Tab.". format(str(required_num_employees), str(employees_maximum_shift_availability)))
    # Check if required number of employees in management tab is less than minimum availabilty of employees in employee tab
    if required_num_employees < employees_minimum_shift_availability: 
        raise ConstraintError("In Employee Information Tab, the minimum availability of your employees is ({}). This value exceeds the required number of employees to work in Management Tab: ({}).\n\nPlease reduce your employees' minimum availability in Employee Information Tab or increase the required number of employees to work in Management Tab.". format(str(employees_minimum_shift_availability), str(required_num_employees)))

    for role in range(config_data['num_roles']):
        required_num_employees_per_role = sum(management_data[role][day]['num_employees'][shift] for day, shift in product_range(config_data['num_days'], config_data['num_shifts']))
        #Check if required employees per role in management tab exceeds maximum shift availability of employees who can work that role
        employees_maximum_shift_availability_per_role = 0
        for employee in range(config_data['num_employees']):
            if employee_data[employee]['role_seniority'][role] != 0:
                employees_maximum_shift_availability_per_role += employee_data[employee]['role_seniority'][role]
                #CHECK THIS THIGN 
        if employees_maximum_shift_availability_per_role < required_num_employees_per_role:
            raise ConstraintError("In Management Tab, required number of employees to work as {} role is ({}). This value exceeds the maximum availability of employees who can work as {} role in Employee Information Tab: ({}).\n\nPlease reduce the required number of employees to work as {} role in Management Tab or increase the number of employees who can work as {} role in Employee Tab.". format(config_data['role_names'][role], str(required_num_employees_per_role), config_data['role_names'][role], str(employees_maximum_shift_availability_per_role), config_data['role_names'][role], config_data['role_names'][role]))

    # Check if number of employees to work a given role on a given day on a given shift exceeds possible number of employees who can work that role
    for role in range(config_data['num_roles']):
        num_employees_able_to_work_role = 0
        for employee in range(config_data['num_employees']):
            if employee_data[employee]['role_seniority'][role] != 0:
                num_employees_able_to_work_role = num_employees_able_to_work_role + 1
        for day in range(config_data['num_days']):
            for shift in range(config_data['num_shifts']):
                if num_employees_able_to_work_role < management_data[role][day]['num_employees'][shift]:
                    raise ConstraintError("In Management Tab, required number of employees to work as {} role on {} during {} shift is ({}). This value exceeds the number of employees who can work as {} role in Employee Tab: ({}).\n\nPlease reduce the required number of employees to work as {} role on {} during {} shift in Management Tab or increase the number of employees who can work as {} role.".format(config_data['role_names'][role], config_data['day_names'][day], config_data['shift_names'][shift], str(management_data[role][day]['num_employees'][shift]),config_data['role_names'][role], str(num_employees_able_to_work_role), config_data['role_names'][role], config_data['day_names'][day], config_data['shift_names'][shift], config_data['role_names'][role]))

    # ASSUMING PEOPLE CAN ONLY WORK ONE SHIFT A DAY!!!!!!!!!!!!
    # Check if number of employees to work a given role on a given day exceeds possible number of employees who can work that role
    for role in range(config_data['num_roles']):
        num_employees_able_to_work_role = 0
        for employee in range(config_data['num_employees']):
            if employee_data[employee]['role_seniority'][role] != 0:
                num_employees_able_to_work_role = num_employees_able_to_work_role + 1
        for day in range(config_data['num_days']):
            num_employees_required_to_work_role = sum(management_data[role][day]['num_employees'][shift] for shift in range(config_data['num_shifts']))
            if num_employees_able_to_work_role < num_employees_required_to_work_role:
                raise ConstraintError("In Management Tab, required number of employees to work as {} role on {} is ({}). This value exceeds the number of employees who can work as {} role in Employee Tab: ({}).\n\nPlease reduce the number of employees required to work as {} role on {} in Management Tab or increase the number of employees who can work as {} role in Employee Tab.".format(config_data['role_names'][role], config_data['day_names'][day], str(num_employees_required_to_work_role), config_data['role_names'][role], str(num_employees_able_to_work_role), config_data['role_names'][role], config_data['day_names'][day], config_data['role_names'][role]))

    # ASSUMING PEOPLE CAN ONLY WORK ONE SHIFT A DAY!!!!!!!!!!!!
    # Check if number of employees to work on a given day exceeds total number of employees 
    for day in range(config_data['num_days']):
        total_employees_required = sum(management_data[role][day]['num_employees'][shift] for role, shift in product_range(config_data['num_roles'], config_data['num_shifts']))
        if total_employees_required > config_data['num_employees']:
            raise ConstraintError("In Management Tab, required number of employees to work on {} is ({}). This value exceeds the total number of employees: ({}).\n\nPlease reduce the required number of employees to work on {} in Management Tab or increase total number of employees in Employee Tab.". format(str(config_data['day_names'][day]), str(total_employees_required), str(config_data['num_employees']), str(config_data['day_names'][day])))









