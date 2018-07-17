// Today's date for calendar
var today = new Date();
var m = ("0" + (today.getMonth() + 1)).slice(-2);
var yy = today.getFullYear();
var d = today.getDate();
var d_index = today.getDay();
var today_str = m + "/" + ("0" + d).slice(-2) + "/" + yy

// logged in user's username
var current_username;

// logged in user's id
var user_id;

// Load user schedules
let emp_schedules = [];

$.getJSON("/get_user_schedules", function(data){
    emp_schedules = data["schedule_dicts"];
    current_username = data["username"];
    user_id = data["id"];
    active_schedules = getActiveSchedules(emp_schedules);
    upcoming_schedules = getUpcomingSchedules(emp_schedules);
    eligible_shifts = getEligibleShifts(upcoming_schedules[0])

    console.log(eligible_shifts)
    console.log(data);

    renderCalendarDates(14);
    renderUpcomingShifts(active_schedules);
    renderPreferenceTable(upcoming_schedules[0]);
})

// get active schedules
function getActiveSchedules(schedules) {
    let active_schedules = [];
    for (let i=0; i < schedules.length; i++) {
        if (schedules[i]["output_for_emp_portal"] != null) {
            active_schedules.push(schedules[i]);
        }
    }
    return active_schedules;
}

// get upcoming schedules
function getUpcomingSchedules(schedules) {
    let upcoming_schedules = [];
    for (let i=0; i < schedules.length; i++) {
        if (schedules[i]["output_for_emp_portal"] == null) {
            upcoming_schedules.push(schedules[i]);
        }
    }
    return upcoming_schedules;
}

// get user's schedule id by username
function getUserScheduleId(username, schedule) {
    let employees = schedule["employees"];
    let schedule_id;
    for (let employee = 0; employee < employees.length; employee++) {
        if (employees[employee]["username"] == username) {
            schedule_id = employees[employee]["_id"];
        }
    }
    return schedule_id;
}

// get schedule from schedule list by id
function getScheduleById(id, schedules) {
    let queried_schedule;
    for (let schedule = 0; schedule < schedules.length; schedule++) {
        if (schedules[schedule]["_id"] == id) {
            queried_schedule = schedules[schedule];
        }
    }
    return queried_schedule;
}

// get daily availability for a schedule
function getDailyAvailability(schedule, emp_id, date) {
    let status;
    let prefs = schedule["prefs"][emp_id];
    for (let day = 0; day < prefs.length; day++) {
        if (datetimeToString(prefs[day]["date"]) == date) {
            status = prefs[day]["status"];
        }
    }
    return status;
}

// get shift preference for a schedule
function getShiftPreference(schedule, emp_id, shift_id) {
    let preference;
    let prefs = schedule["prefs"][emp_id];
    for (let day = 0; day < prefs.length; day++) {
        if (shift_id in prefs[day]) {
            preference = prefs[day][shift_id];
        }
    }
    return preference;
}

// get shifts in a given schedule that current user is eligible to work
function getEligibleShifts(schedule) {
    let eligible_shifts = [];
    let shifts = schedule["shifts"];
    let roles = [];
    for (let emp=0; emp < schedule["employees"].length; emp++) {
        if (schedule["employees"][emp]["username"] == current_username) {
            for (let role=0; role < schedule["employees"][emp]["roles"].length; role++) {
                if (schedule["employees"][emp]["roles"][role]["training"] == false) {
                    roles.push(schedule["employees"][emp]["roles"][role]["role_name"])
                }
            }
        }
    }
    for (let shift=0; shift < shifts.length; shift++) {
        if (roles.includes(shifts[shift]["role"])) {
            eligible_shifts.push(shifts[shift]);
        }
    }
    return eligible_shifts;
}

// get shift color from pref value
function getShiftColorFromPref(pref) {
    let color;
    if (pref == 5) {
        color = "#1f9a1f";
    }
    else if (pref == 1) {
        color = "#ffbc00";
    }
    else {
        color = "#939b9e";
    }
    return color;
}

// get opacity of day pref from availability status
function getOpacityFromStatus(status) {
    let opacity;
    if (status == "Available") {
        opacity = 1;
    }
    else if (status == "Unavailable") {
        opacity = 0.4;
    }
    else {
        opacity = 1;
    }
    return opacity;
}

// create new week in calendar
function createCalendarWeek() {
    let week = document.createElement("div");
    let date_row = document.createElement("div");
    $(week).addClass("big-calendar-week");
    $(date_row).addClass("big-calendar-date-row");
    for (let i = 0; i < 7; i++) {
        let date_label = document.createElement("div");
        $(date_label).addClass("calendar-date-label");
        date_row.append(date_label)
        let day = document.createElement("div");
        $(day).addClass("big-calendar-day").addClass("day");
        week.append(day)
    }
    return {"week": week, "date_row": date_row}
}

// create preference shift
function createPreferenceShift(shift_info, schedule) {
    let user_id = getUserScheduleId(current_username, schedule);
    let pref = getShiftPreference(schedule, user_id, shift_info["_id"]);
    let color = getShiftColorFromPref(pref);

    let shift = document.createElement("div");
    let info = document.createElement("div");
    let prefer = document.createElement("div");
    let dislike = document.createElement("div");
    $(shift).addClass("us-prefs-shift");
    $(shift).attr("data-id", shift_info["_id"]);
    $(shift).attr("data-date", shift_info["date"]);
    $(shift).css("background", color);
    $(info).addClass("us-prefs-shift-info");
    $(prefer).addClass("us-prefs-shift-prefer");
    $(dislike).addClass("us-prefs-shift-dislike");
    $(info).append("<p>" + shift_info["role"] + "<br>" + shift_info["start"] + " - " + shift_info["end"] + "</p>");
    $(prefer).append("<img class='thumbs-up' src='/static/assets/thumbs-up.png'>");
    $(dislike).append("<img class='thumbs-down' src='/static/assets/thumbs-down.png'>");
    shift.append(info);
    shift.append(prefer);
    shift.append(dislike);
    return shift;
}

// create availability button
function createAvailabilityButton(status) {
    let button = document.createElement("button");
    $(button).addClass("btn");
    $(button).addClass("btn-sm");
    $(button).addClass("availability-button");
    if (status == "Available") {
        $(button).addClass("btn-danger");
        $(button).text("Unavailable");
    }
    else {
        $(button).addClass("btn-secondary");
        $(button).text("Available");
    }
    return button;
}

// create preference day
// shifts_info = {"date": "Monday, August 1", "shifts": [{"date": ..., "start": ..., "role": ..., ...}]}
function createPreferenceDay(shifts_info, schedule) {
    let user_id = getUserScheduleId(current_username, schedule);
    let status = getDailyAvailability(schedule, user_id, shifts_info["date"]);
    let opacity = getOpacityFromStatus(status);

    let cell = document.createElement("div");
    let date = document.createElement("div");
    let unavailable = document.createElement("div");
    let shifts = document.createElement("div");
    let button = createAvailabilityButton(status);
    $(cell).addClass("us-prefs-cell");
    $(cell).attr("data-date", shifts_info["date"]);
    $(date).addClass("us-prefs-date");
    $(unavailable).addClass("us-prefs-unavailable");
    $(shifts).addClass("us-prefs-shifts");
    $(shifts).css("opacity", opacity);
    $(unavailable).append(button);
    $(date).text(shifts_info["date"]);
    for (let shift = 0; shift < shifts_info["shifts"].length; shift++) {
        let html_shift = createPreferenceShift(shifts_info["shifts"][shift], schedule);
        shifts.append(html_shift);
    }
    cell.append(date);
    cell.append(unavailable);
    cell.append(shifts);
    return cell;
}

// create schedule thumbnail
function createScheduleThumbnail(schedule) {
    let start_date = schedule["start_date"].slice(0, -18);
    let end_date = schedule["end_date"].slice(0, -18);
    let thumbnail = document.createElement("div");
    let name = document.createElement("div");
    let dates = document.createElement("div");
    let location = document.createElement("div");
    $(thumbnail).addClass("us-thumbnail");
    $(name).addClass("us-name");
    $(dates).addClass("us-dates");
    $(location).addClass("us-location");
    $(name).text(schedule["name"]);
    $(dates).text(start_date + " - " + end_date);
    $(location).text("Timbuktoo");
    thumbnail.append(name);
    thumbnail.append(dates);
    thumbnail.append(location);
    return thumbnail;
}

// create schedule preferences
function createSchedulePreferences(schedule) {
    let eligible_shifts = getEligibleShifts(schedule);
    let prefs = document.createElement("div");
    $(prefs).addClass("us-prefs");
    for (let day=0; day < schedule["days"].length; day++) {
        let shifts_info = {"date": schedule["days"][day]};
        let shifts = [];
        for (let shift = 0; shift < eligible_shifts.length; shift++) {
            if (eligible_shifts[shift]["date"] == schedule["days"][day]) {
                shifts.push(eligible_shifts[shift]);
            }
        }
        shifts_info["shifts"] = shifts;
        let cell = createPreferenceDay(shifts_info, schedule);
        prefs.append(cell);
    }
    return prefs;
}

// render calendar dates
function renderCalendarDates(num_days) {
    let date = d;
    let counter = 0;
    if (d_index > 0) {
        elements = createCalendarWeek();
        $(elements["date_row"]).addClass("extra");
        $(elements["week"]).addClass("extra");
        $(".big-calendar").append(elements["date_row"]).append(elements["week"]);
    }
    $(".calendar-date-label").each(function() {
        if (counter >= d_index && date < d + num_days) {
            $(this).append(date);
            $(this).attr("data-calendar-date", m + "/" + ("0" + date).slice(-2) + "/" + yy)
            date++;
        }
        else {
            $(this).addClass("calendar-date-empty")
            $(".one .big-calendar-day:nth-child(" + (counter + 1) + ")").addClass("calendar-empty");
            if (counter > num_days - 1) {
                $(".extra .big-calendar-day:nth-child(" + ((counter % 7) + 1) + ")").addClass("calendar-empty");
            }
        }
        counter++;
    })
}

// Populate shifts this week
function renderUpcomingShifts(schedules) {
    for (let schedule=0; schedule < schedules.length; schedule++) {
        let counter = 0;
        let work_info = schedules[schedule]["output_for_emp_portal"]
        if (work_info[current_username]) {
            $(".big-calendar-day").each(function() {
                if (!$(this).hasClass("calendar-empty")) {
                    if (work_info[current_username].length > counter) {
                        while (work_info[current_username][counter]["upcoming"] == false ||
                               work_info[current_username][counter]["upcoming"] == undefined) {
                            counter++;
                        }
                        let working_info = work_info[current_username][counter];
                        if (working_info["working"] == true) {
                            let shift = document.createElement("div");
                            $(shift).addClass("big-calendar-shift");
                            $(shift).css("background-color", "#555");
                            shift.append(working_info["role"] + " " + working_info["shift_start"]);

                            $(this).append(shift);
                        }
                        counter++;
                    }
                }
            })
        }
    }
}

// Mark preference day as unavailable
function markDayUnavailable(clicked_button) {
    clicked_button.parent().parent().find(".us-prefs-shifts").css("opacity", 0.4);
    clicked_button.removeClass("btn-danger").addClass("btn-secondary");
    clicked_button.text("Available");
    clicked_button.parent().parent().find(".thumbs-down").css("opacity", 1);
    clicked_button.parent().parent().find(".thumbs-up").css("opacity", 1);
}

// Mark preference day as available
function markDayAvailable(clicked_button) {
    clicked_button.parent().parent().find(".us-prefs-shifts").css("opacity", 1);
    clicked_button.removeClass("btn-secondary").addClass("btn-danger");
    clicked_button.text("Unavailable");
}

// Mark shift prefer
function markShiftPrefer(clicked_button) {
    clicked_button.parent().parent().css("background", "#1f9a1f");
    clicked_button.css("opacity", 0.4);
    clicked_button.parent().parent().find(".thumbs-down").css("opacity", 1);
}

// Mark shift dislike
function markShiftDislike(clicked_button) {
    clicked_button.parent().parent().css("background", "#ffbc00");
    clicked_button.css("opacity", 0.4);
    clicked_button.parent().parent().find(".thumbs-up").css("opacity", 1);
}

// Add shift preference data
function updateShiftPreference(clicked_button, value) {
    let schedule_id = clicked_button.closest($(".upcoming-schedule")).data("id");
    let schedule = getScheduleById(schedule_id, emp_schedules);
    let data = {"emp_id": getUserScheduleId(current_username, schedule),
                "schedule_id": schedule_id,
                "date": clicked_button.parent().parent().data("date"),
                "pref": value,
                "shift_id": clicked_button.parent().parent().data("id")};
    console.log(data);
    $.ajax({
        type: "POST",
        url: "/update_shift_pref",
        data: JSON.stringify(data),
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
    });
};

// Update daily availability
function updateDailyAvailability(clicked_button, availability) {
    let schedule_id = clicked_button.closest($(".upcoming-schedule")).data("id");
    let schedule = getScheduleById(schedule_id, emp_schedules);
    let data = {"status": availability,
                "emp_id": getUserScheduleId(current_username, schedule),
                "schedule_id": schedule_id,
                "date": clicked_button.closest($(".us-prefs-cell")).data("date")};
    console.log(data)
    $.ajax({
        type: "POST",
        url: "/update_pref",
        data: JSON.stringify(data),
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
    });
};

// Populate upcoming schedules
function renderPreferenceTable(schedule) {
    let us = document.createElement("div");
    $(us).addClass("upcoming-schedule");
    $(us).attr("data-id", schedule["_id"]);
    let thumbnail = createScheduleThumbnail(schedule);
    let prefs = createSchedulePreferences(schedule);
    us.append(thumbnail);
    us.append(prefs);
    $(".emp-portal-upcoming-schedules").append(us);
}

// Convert from datetime string to mm/dd/yyyy
function datetimeToString(datetime) {
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    date_array = datetime.slice(5, -13).split(" ");
    day = date_array[0];
    month = date_array[1];
    year = date_array[2];
    month = ("0" + (months.indexOf(month) + 1)).slice(-2);
    string = month + "/" + day + "/" + year;
    return string;
}

// Populate schedule history

// onClick event for daily unavailability
$(document).on("click", ".availability-button", function() {
    if ($(this).hasClass("btn-secondary")) {
        let clicked_button = $(this);
        markDayAvailable(clicked_button);
        updateDailyAvailability(clicked_button, "Available");
    }
    else if ($(this).hasClass("btn-danger")) {
        let clicked_button = $(this);
        markDayUnavailable(clicked_button);
        updateDailyAvailability(clicked_button, "Unavailable");
    }
})

// onClick event for shift preference prefer
$(document).on("click", ".thumbs-up", function() {
    let clicked_button = $(this);
    markShiftPrefer(clicked_button);
    updateShiftPreference(clicked_button, 5);
});

// onClick event for shift preference dislike
$(document).on("click", ".thumbs-down", function() {
    let clicked_button = $(this);
    markShiftDislike(clicked_button);
    updateShiftPreference(clicked_button, 1);
});