import Schedule
import random

name = "test_schedule"
days = ["mon", "tues", "wed", "thurs", "fri", "sat", "sun"]
roles = ["kitchen", "barista"]
shifts = {"morning": "blah", "evening": "blah"}
employees = {"A": {"min_shifts": 1,
                   "max_shifts": 100,
                   "min_hours": 1,
                   "max_hours": 100,
                   "shift_pref": {day: {shift: random.randint(1, 2)
                                        for shift in shifts.keys()}
                                  for day in days},
                   "seniority": [4, 5],
                   "training": [False for role in roles]
                   },
             "B": {"min_shifts": 1,
                   "max_shifts": 100,
                   "min_hours": 1,
                   "max_hours": 100,
                   "shift_pref": {day: {shift: random.randint(1, 2)
                                        for shift in shifts.keys()}
                                  for day in days},
                   "seniority": [4, 5],
                   "training": [False for role in roles]
                   },
             "C": {"min_shifts": 1,
                   "max_shifts": 100,
                   "min_hours": 1,
                   "max_hours": 100,
                   "shift_pref": {day: {shift: random.randint(1, 2)
                                        for shift in shifts.keys()}
                                  for day in days},
                   "seniority": [4, 5],
                   "training": [False for role in roles]
                   },
             "D": {"min_shifts": 1,
                   "max_shifts": 100,
                   "min_hours": 1,
                   "max_hours": 100,
                   "shift_pref": {day: {shift: random.randint(1, 2)
                                        for shift in shifts.keys()}
                                  for day in days},
                   "seniority": [4, 5],
                   "training": [False for role in roles]
                   },
             "E": {"min_shifts": 1,
                   "max_shifts": 100,
                   "min_hours": 1,
                   "max_hours": 100,
                   "shift_pref": {day: {shift: random.randint(1, 2)
                                        for shift in shifts.keys()}
                                  for day in days},
                   "seniority": [4, 5],
                   "training": [False for role in roles]
                   },
             "F": {"min_shifts": 1,
                   "max_shifts": 100,
                   "min_hours": 1,
                   "max_hours": 100,
                   "shift_pref": {day: {shift: random.randint(1, 2)
                                        for shift in shifts.keys()}
                                  for day in days},
                   "seniority": [4, 5],
                   "training": [False for role in roles]
                   },
             "G": {"min_shifts": 1,
                   "max_shifts": 100,
                   "min_hours": 1,
                   "max_hours": 100,
                   "shift_pref": {day: {shift: random.randint(1, 2)
                                        for shift in shifts.keys()}
                                  for day in days},
                   "seniority": [4, 5],
                   "training": [False for role in roles]
                   },
             "H": {"min_shifts": 1,
                   "max_shifts": 100,
                   "min_hours": 1,
                   "max_hours": 1,
                   "shift_pref": {day: {shift: random.randint(1, 2)
                                        for shift in shifts.keys()}
                                  for day in days},
                   "seniority": [4, 5],
                   "training": [False for role in roles]
                   }
             }

s = Schedule.ScheduleProcessor(name, employees, shifts, days, roles)
s.build_schedule()
