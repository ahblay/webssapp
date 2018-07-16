from webssapp.coefficients.Coefficients import Coefficient


class PreferenceCoefficient(Coefficient):

    def __init__(self):
        self.description = "Modifies coefficient score based on employees' preferences for shift/day/role combos."

    def apply(self, pref):
        if pref is None:
            pass
        if pref == "unavailable":
            return -1000
        elif pref == "available":
            return 1
        else:
            return 5

    def get_description(self):
        return self.description

    def set_description(self, description):
        self.description = description

    def test(self):
        pass

    def errors(self):
        pass
