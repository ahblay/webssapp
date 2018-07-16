import json


class UserError:

    def __init__(self, error_text="An error occurred.", error_data={}):
        self.error_type = "UserError"
        self.error_text = error_text
        self.error_data = error_data

    def send(self):
        return {"error_type": self.error_type, "error_text": self.error_text, "error_data": self.error_data}


class NoEmpInfo(UserError):

    def __init__(self):
        default_text = "You have not added any employees yet. Make sure to add employees and check preferences before continuing."
        default_data = {}
        UserError.__init__(self, default_text, default_data)
        self.error_type = "NoEmpInfo"


class NoShiftInfo(UserError):

    def __init__(self):
        default_text = "You have not added any shifts yet. Make sure to add shifts and check preferences before continuing."
        default_data = {}
        UserError.__init__(self, default_text, default_data)
        self.error_type = "NoShiftInfo"


class NoPrefChangesCheck(UserError):

    def __init__(self):
        default_text = "You have not made any changes to user preferences. If this is intentional, you can ignore this " + \
        "message. Otherwise, go to the Preferences tab to set up your employees' preferences."
        default_data = {}
        UserError.__init__(self, default_text, default_data)
        self.error_type = "NoPrefChangesCheck"


class TooManyShifts(UserError):

    def __init__(self):
        default_text = "The number of shifts exceeds the total number of shifts your employees are allowed to work. Add " + \
                       "employees or increase the maximum number of shifts your employees can work to continue."
        default_data = {}
        UserError.__init__(self, default_text, default_data)
        self.error_type = "TooManyShifts"


class TooManyShiftsOnDay(UserError):

    def __init__(self, shift_datetime):
        default_text = "The number of shifts on {} exceeds the total number of employees. Remove shifts or add employees " \
                        "to continue.".format(shift_datetime.strftime("%m/%d/%Y"))
        default_data = {}
        UserError.__init__(self, default_text, default_data)
        self.error_type = "TooManyShiftsOnDay"


class TooManyShiftsForRole(UserError):

    def __init__(self, role_name):
        default_text = ("The number of {} shifts exceeds the total number of {} shifts your employees are able to work. Add "
                        "more {}s or increase the maximum number of shifts your {} employees can work to "
                        "continue.").format(role_name, role_name, role_name, role_name)
        default_data = {}
        UserError.__init__(self, default_text, default_data)
        self.error_type = "TooManyShiftsForRole"


class TooManyRoleShiftsOnDay(UserError):
    def __init__(self, role_name, shift_datetime):
        default_text = ("The number of employees needed for {} shifts on {} exceeds the total number of {}s. "
                        "Add more {}s or reduce the number of {} shifts that day to "
                        "continue.").format(role_name, shift_datetime.strftime("%m/%d/%Y"),
                                            *[role_name for _ in range(3)])
        default_data = {}
        UserError.__init__(self, default_text, default_data)
        self.error_type = "TooManyRoleShiftsOnDay"






