from math import factorial
from itertools import product
from pulp import *
import os, csv, subprocess, sys
class InfeasibleProblem(Exception):
    name = "No Solution Possible"

class GreedyFail(Exception):
    name = "Room assignment failed"

def product_range(*args):
    return product(*(range(x) if type(x) is int else range(*x) for x in args))

def choose2(n):
    return factorial(n)//(2 * factorial(n - 2))

class ShiftVarMatrix:
    def __init__(self, num_employees, num_days, num_slots, min_slots, max_slots, num_rooms):
        self.num_employees = num_employees
        self.num_days = num_days
        self.num_slots = num_slots
        self.min_slots = min_slots
        self.max_slots = max_slots
        self.num_rooms = num_rooms

        self.shifts = tuple((start, end) 
                              for start in range(num_slots) 
                                for end in range(start + min_slots, min(num_slots, start + max_slots) + 1)
                                if end <= num_slots + 1)

        self.num_shifts = num_shifts = len(self.shifts)
        self.shift_indexes = {shift: index for index, shift in enumerate(self.shifts)}

        self.x = [[[{} for room in range(num_rooms)]for day in range(num_days)] for emp in range(num_employees)]
        for emp, day, room, shift_index in product_range(num_employees, num_days, num_rooms, num_shifts):
            self.x[emp][day][room][shift_index] = LpVariable(self.get_var_name(emp, day, room, shift_index), cat=LpBinary)

    def get_var_name(self, emp, day, room, shift_index):
        return ".".join(map(str, (emp, day, room, shift_index)))

    def __getitem__(self, indexes):
        """
        Addressable by either [employee, day, room, shift] or by [employee, day, room, start_slot, end_slot]
        """
        if len(indexes) == 4:
            # [employee, day, room, shift]
            emp, day, room, shift_index = indexes
        elif len(indexes) == 5:
            # [employee, day, room, start_slot, end_slot]
            emp, day, room, start, end = indexes
            shift_index = self.shift_indexes[start, end]
        else:
            raise KeyError(*indexes)

        return self.x[emp][day][room][shift_index]

class IntegratedHealthSchedule:
    def __init__(self, num_employees, num_days, employee_data, schedule_start, schedule_end, min_slots, max_slots):
        self.num_employees, self.num_days, self.employee_data, self.schedule_start, self.schedule_end = num_employees, num_days, employee_data, schedule_start, schedule_end
        self.num_slots = num_slots = (schedule_end - schedule_start)*2
        self.num_rooms = num_rooms = 5

        # x holds the main variable. Organized by [employee, day, shift] or [employee, day, start_slot, end_slot]
        self.x = x = ShiftVarMatrix(num_employees, num_days, num_slots, min_slots, max_slots, num_rooms)

        self.problem = problem = LpProblem("Integrated Health Schedule", LpMaximize)

        
        # CONSTRAINTS
        # Employees can work at most 1 shift per day
        for employee, day in product_range(num_employees, num_days):
            problem += lpSum(x[employee, day, room, shift] for room, shift in product_range(num_rooms, x.num_shifts)) <= 1, ""

        # Employees can work at most their maximum availability of 30 minute slots throughout the week. 
        for employee in range(num_employees):
            # Week 1
            problem += lpSum(x[employee, day, room, shift[0], shift[1]]*(shift[1]-shift[0]) for day, room, shift in product(range(7), range(num_rooms), x.shifts)) <= self.employee_data[employee]['week_1_max_hours'] * 2, ""
            # Week 2
            problem += lpSum(x[employee, day + 7, room, shift[0], shift[1]]*(shift[1]-shift[0]) for day, room, shift in product(range(7), range(num_rooms), x.shifts)) <= self.employee_data[employee]['week_2_max_hours'] * 2, ""

        # There can be at most 1 employees working in a room at a time
        for room, day, slot in product_range(num_rooms, num_days, num_slots):
            problem += lpSum(x[employee, day, room, start, end] for start in range(max(0, slot - max_slots + 1), slot + 1) for end in range(max(slot + 1, start + min_slots), min(start + max_slots, num_slots) + 1) for employee in range(num_employees)) <= 1, ""

        # Employees can work at most their maximum desired number of days
        for employee in range(num_employees):
            # Week 1
            problem += lpSum(x[employee, day, room, shift[0], shift[1]] for day, room, shift in product(range(7), range(num_rooms), x.shifts)) <= self.employee_data[employee]['week_1_max_days'], ""
            # Week 2
            problem += lpSum(x[employee, day + 7, room, shift[0], shift[1]] for day, room, shift in product(range(7), range(num_rooms), x.shifts)) <= self.employee_data[employee]['week_2_max_days'], ""


        '''
        COEFFICIANT
        '''
        def preference_coefficent(employee, day, room, shift, avail_dict):
            # employee is unavailable on day
            if not self.employee_data[employee]['shift_pref'][day]["Available"]:
                return -1000
            # if shift length is to long
            # Week 1
            if day <= 6:
                if (x.shifts[shift][1] - x.shifts[shift][0]) > self.employee_data[employee]['week_1_max_shift_length'] * 2:
                    return -1000
            # Week 2
            else:
                if (x.shifts[shift][1] - x.shifts[shift][0]) > self.employee_data[employee]['week_2_max_shift_length'] * 2:
                    return -1000

            # determine which preference shift falls in
            shift_in_pref = None
            for path, pref in zip(avail_dict, range(len(avail_dict))):
                # shifts cannot start before employee availability
                if path['Start Time:'] <= x.shifts[shift][0] < path['End Time:'] and path['Start Time:'] < x.shifts[shift][1] <= path['End Time:']:
                    shift_in_pref = pref

            if shift_in_pref == None:
                return -1000

            else:
                if day <= 6:
                    c = 10 * ((x.shifts[shift][1] - x.shifts[shift][0]) / (self.employee_data[employee]['week_1_max_shift_length'] * 2))
                else:
                    c = 10 * ((x.shifts[shift][1] - x.shifts[shift][0]) / (self.employee_data[employee]['week_2_max_shift_length'] * 2))
                
                # alter senority due to room preference
                if self.employee_data[employee]['room_pref']['AnyPref']:
                    #Determine number of required and requested rooms
                    num_required = 0
                    num_requested = 0
                    for index in [1, 2, 3, 4, 5]:
                        if self.employee_data[employee]['room_pref']['Required'][index]:
                            num_required += 1
                        if self.employee_data[employee]['room_pref']['Requested'][index]:
                            num_requested += 1

                    # If employee requires a room
                    if num_required > 0:
                        if self.employee_data[employee]['room_pref']['Required'][room + 1]:
                            c = c * self.employee_data[employee]['role_seniority'][0]
                        else:
                            c = c * (self.employee_data[employee]['role_seniority'][0] * 0.5)
                        c = c * (1 - (room + 1)/100)
                        return c

                    elif num_requested > 0:
                        if self.employee_data[employee]['room_pref']['Requested'][room + 1]:
                            c = c * self.employee_data[employee]['role_seniority'][0]
                        else: 
                            c = c * (self.employee_data[employee]['role_seniority'][0] * 0.9)
                    else:
                        print("An error has occured")

                # if there were no room preferences
                else: 
                    c = c * self.employee_data[employee]['role_seniority'][0]
                
                # make it so the algorithim fills up the rooms from room 1 to room 5. Otherwise employee 1 could work 9am-3pm in room 1 and employee 2 could work 3pm-9pm in room 2 (assuming they are the only ones working) when really they both could be working in room 1
                c = c * (1 - (room + 1)/100)
                return c

        self.preference_coefficent = preference_coefficent

        problem += lpSum(preference_coefficent(employee, day, room, shift, self.avail_dict_function(employee, day)) * x[employee, day, room, shift] 
                for employee, day, room, shift in 
                    product_range(num_employees, num_days, num_rooms, x.num_shifts))

        print("Finished adding constraints, starting solve")
        

        problem.solve(solvers.PULP_CBC_CMD())

        self.make_schedule()

    def avail_dict_function(self, employee, day):
        avail_dict = [{} for _ in range(len(self.employee_data[employee]['shift_pref'][day]['prefs']))]
        for pref in range(len(self.employee_data[employee]['shift_pref'][day]['prefs'])):
            path = self.employee_data[employee]['shift_pref'][day]['prefs'][pref]
            for time in ['Start Time:', "End Time:"]:
                if path[time]['binary_day'] == "AM":
                    avail = (path[time]['hour'] + path[time]['minute']/10 - self.schedule_start) * 2
                else:
                    if path[time]['hour'] + path[time]['minute']/10 < 12:
                        avail = (path[time]['hour'] + path[time]['minute']/10 + 12 - self.schedule_start) * 2
                    else:
                        avail = (path[time]['hour'] + path[time]['minute']/10 + - self.schedule_start) * 2
                        
                avail_dict[pref][time] = avail
        return avail_dict

    def make_schedule(self):
        print("Status:", LpStatus[self.problem.status])
        print("Score:", sum(self.preference_coefficent(employee, day, room, shift, self.avail_dict_function(employee, day)) * value(self.x[employee, day, room, shift]) for employee, day, room, shift in product_range(self.num_employees, self.num_days, self.num_rooms, self.x.num_shifts)))

        if LpStatus[self.problem.status] == "Infeasible":
            raise InfeasibleProblem("A problem occured. Please contact a representative of Slobodin Scheduling")

        print(LpStatus[self.problem.status])

        # Format Schedule
        # Schedule organized by: employee, day: {"working": True/False, "shift": shift, "room": 1 through 5}
        schedule = [[{"id": employee, "working": False} for day in range(self.num_days)] for employee in range(self.num_employees)]
        for employee, day, room, shift in product_range(self.num_employees, self.num_days, self.num_rooms, self.x.num_shifts):
            if value(self.x[employee, day, room, shift]):
                schedule[employee][day]['working'] = True
                schedule[employee][day]['shift'] = shift
                schedule[employee][day]['room'] = room + 1
        #print("schedule!!", schedule)
        self.schedule = schedule
        
    def get_schedule(self):
        schedule_data = []
        schedule = self.schedule

        for employee in range(self.num_employees):
            schedule_data.append({"employee_id": employee,
                "days": []})
            for day in range(self.num_days): 
                if schedule[employee][day]["working"]:
                    starting = self.x.shifts[schedule[employee][day]['shift']][0]/2 + 7
                    ending = self.x.shifts[schedule[employee][day]['shift']][1]/2 + 7
                    starting_day_binary = "AM"
                    ending_day_binary = "AM"
                    if starting >= 12:
                        if starting >=13:
                            starting = starting - 12
                        starting_day_binary = "PM"
                    if ending >= 12:
                        if ending >= 13:
                            ending = ending - 12
                        ending_day_binary = "PM"
                    prior = str(starting) + " " + starting_day_binary + " - " + str(ending) + " " + ending_day_binary
                    prior = prior.replace(".5", ":30")
                    prior = prior.replace(".0", "")
                    schedule_data[employee]["days"].append(prior + ", Room "+str(schedule[employee][day]["room"]))
                else:
                    schedule_data[employee]["days"].append("")

        return schedule_data

