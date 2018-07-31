from flask import current_app as app
from bson import ObjectId
from datetime import datetime
import webssapp.utilities as utilities


class ShiftTemplateCollection:
    def __init__(self):
        self.templates = None

    def load_dicts(self, template_dicts):
        self.templates = [ShiftTemplate(temp_dict) for temp_dict in template_dicts]
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


class ShiftTemplate:
    def __init__(self, from_dict=None, name=None, _id=None, shifts=None, business_client=None, num_days=None):

        if from_dict:
            self.name = from_dict['name']
            self.shifts = from_dict['shifts']
            self._id = str(from_dict['_id'])
            self.business_client = from_dict['business_client']
            self.num_shifts = from_dict['num_shifts']
            self.num_days = from_dict['num_days']
        else:
            self.name = name
            self._id = _id
            self.shifts = shifts
            self.business_client = business_client
            self.num_shifts = len(self.shifts)
            self.num_days = num_days

    def to_dict(self):
        return vars(self)

    def apply_dates_to_shifts(self, dates):
        for shift in self.shifts:
            shift['date'] = dates[shift['day_index']]

    def convert_dates_to_index(self, dates):
        for shift in self.shifts:
            shift['day_index'] = dates.index(datetime.strptime(shift['date'], "%m/%d/%Y"))

    def remove_shift_dates(self):
        for shift in self.shifts:
            shift['date'] = None

    def update_db(self):
        if not self._id:
            with app.app_context():
                db = utilities.get_db()
                self._id = ObjectId()
                db.shift_templates.save(vars(self))
        else:
            with app.app_context():
                db = utilities.get_db()
                template_data = vars(self)
                template_data['_id'] = ObjectId(template_data['_id'])
                db.shift_templates.update({"_id": ObjectId(self._id)}, {"$set": vars(self)})
