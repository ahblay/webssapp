from webssapp.coefficients.Coefficients import Coefficient


class SeniorityCoefficient(Coefficient):
    def __init__(self):
        self.description = "Modifies coefficient score based on employees' seniority."

    def apply(self, seniority):
        return seniority

    def get_description(self):
        return self.description

    def set_description(self, description):
        self.description = description

    def test(self):
        pass

    def errors(self):
        pass