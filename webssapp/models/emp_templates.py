from flask import current_app as app
from bson import ObjectId
import webssapp.utilities as utilities


class EmpTemplateCollection:
    def __init__(self):
        self.templates = None

    def load_dicts(self, template_dicts):
        self.templates = [EmpTemplate(temp_dict) for temp_dict in template_dicts]
        return self

    def load_templates(self, templates):
        self.templates = templates
        return self

    # TODO: Make this capable of filtering on multiple fields
    def filter(self, field_name, field_value):
        if not self.templates:
            return []
        else:
            return [template for template in self.templates if vars(template)[field_name] == field_value]

    def to_dicts(self):
        return [template.to_dict() for template in self.templates]


class EmpTemplate:
    def __init__(self, from_dict=None, name=None, _id=None, employees=None, business_client=None):

        if from_dict:
            self.name = from_dict['name']
            self.employees = from_dict['employees']
            self._id = str(from_dict['_id'])
            self.business_client = from_dict['business_client']
            self.num_emps = from_dict['num_emps']
        else:
            self.name = name
            self._id = _id
            self.employees = employees
            self.business_client = business_client
            self.num_emps = len(self.employees)

    def to_dict(self):
        dict_of_vars = vars(self)
        for emp in dict_of_vars['employees']:
            emp['_id'] = str(emp['_id'])
            emp['master_id'] = str(emp['master_id'])
        return dict_of_vars

    def update_db(self):
        if not self._id:
            with app.app_context():
                db = utilities.get_db()
                self._id = ObjectId()
                db.emp_templates.save(vars(self))
        else:
            with app.app_context():
                db = utilities.get_db()
                template_data = vars(self)
                template_data['_id'] = ObjectId(template_data['_id'])
                db.emp_templates.update({"_id": ObjectId(self._id)}, {"$set": vars(self)})

    def remove_employee(self):
        pass

    def add_employee(self):
        pass
