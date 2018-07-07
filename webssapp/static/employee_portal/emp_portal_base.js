// Today's date for calendar
var today = new Date();
var d = today.getDate();
var d_index = today.getDay();

// temporary example of logged in user's id
var current_user_id = "5b3fe5845aea85052f837343"

// Load user schedules
let emp_schedules = [];
$.getJSON("/get_user_schedules", function(data){
    emp_schedules = data;
    console.log(data);
    renderCalendarDates(14);
    renderUpcomingShifts(data);
})

// create new week in calendar
function createCalendarWeek() {
    let week = document.createElement("div");
    let date_row = document.createElement("div");
    $(week).addClass("big-calendar-week");
    $(date_row).addClass("big-calendar-date-row");
    for (i = 0; i < 7; i++) {
        let date_label = document.createElement("div");
        $(date_label).addClass("calendar-date-label");
        date_row.append(date_label)
        let day = document.createElement("div");
        $(day).addClass("big-calendar-day").addClass("day");
        week.append(day)
    }
    return {"week": week, "date_row": date_row}
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
    for (schedule=0; schedule < schedules.length; schedule++) {
        let counter = 0;
        if (schedules[schedule]["output_for_emp_portal"][current_user_id]) {
            $(".big-calendar-day").each(function() {
                if (!$(this).hasClass("calendar-empty")) {
                    if (schedules[schedule]["output_for_emp_portal"][current_user_id].length > counter) {
                        let working_info = schedules[schedule]["output_for_emp_portal"][current_user_id][counter];
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
// Populate upcoming schedules

// Populate schedule history