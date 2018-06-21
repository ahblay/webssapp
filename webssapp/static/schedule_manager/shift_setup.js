console.log("shift_setup.js is running.")

$.getScript("/static/ObjectId.js").fail("Script 'ObjectId.js' failed to load.")

var schedule_id = "default assignment";
var schedule_dates = "default assignment";
var master_roles = []
var master_roles_color_data = {}
var day_index = 0;
var all_schedule_data = "default assignment";
var selectedDay = {}
var addShiftModal

$.fn.exists = function () {
    return this.length !== 0;
}

$(function () {
    addShiftModal = new jBox('Modal', {
        id: "add-shift-jBox",
        attach: ".add-shift-icon",
        closeButton: 'title'
    });
    editShiftModal = new jBox('Modal', {
        id: "edit-shift-jBox",
        attach: ".big-calendar-shift",
        closeButton: 'title',
        offset: {x: 20, y: 35},
        animation: {open: 'zoomIn', close: 'zoomIn'}
    });
})

$(function () {
    Date.prototype.addDays = function(days)
        {
            var dat = new Date(this.valueOf());
            dat.setDate(dat.getDate() + days);
            return dat;
        }
})

$(function () {
    schedule_id = $("#shift-setup-tab").data("schedule-id")
    $.getJSON("/api/get_schedule/" + schedule_id, function(data){
        all_schedule_data = data;
    });
    schedule_dates = $("#shift-setup-tab").data("schedule-dates").split(" ")
    $.getJSON("/_api/get_roles", getRoles)
    //the code below runs, although pycharm interprets it as being commented out
    $.getJSON("/api/get_all_shift_data/" + schedule_id, loadShiftCalendar)
        .done(function () {
                console.log('Calendar loaded.');
        });
});

$(function () {
    if (!$('.calendar-highlighted').exists()){
        $("*[data-calendar-date='"+ schedule_dates[0] + "']").click();
    };
});

$(() => {
    schedule_length = [... new Set(schedule_dates)].length;
    if (schedule_length > 1){
        $("#page-right").prop("disabled", false);
    };
});


function getRoles(data) {
    for (i = 0; i < data.length; i++) {
        master_roles.push(data[i]["name"])
        master_roles_color_data[data[i]["name"]] = data[i]["color"]
    }
    buildShiftModalContent(data)
}

function createDates(list) {
    var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var month = ["January",
                 "February",
                 "March",
                 "April",
                 "May",
                 "June",
                 "July",
                 "August",
                 "September",
                 "October",
                 "November",
                 "December"]
    var allDates = new Array();
    var start = new Date(list[0])
    var end = new Date(list[1])
    var currentDate = start;
    while (currentDate <= end) {
        dateString = weekday[currentDate.getDay()] + ", " + month[currentDate.getMonth()] + " " + currentDate.getDate();
        dateNumber = ("0" + (currentDate.getMonth() + 1)).slice(-2)
                    + "/" + ("0" + currentDate.getDate()).slice(-2)
                    + "/" + currentDate.getFullYear()
        both = [dateString, dateNumber]
        allDates.push(both);
        currentDate = currentDate.addDays(1);
    }
    return allDates
};

$(function () {
    allDates = createDates(schedule_dates);
    $("#date").attr("style", "vertical-align: middle;");
    $("#date").html("<b>" + allDates[0][0] + "</b>");
});

function loadShiftCalendar (data) {

    var allDates = createDates(schedule_dates)
    calendar_dates = findCalendarDates()

    $(".big-calendar").children().each(function () {
        if ($(this).hasClass("big-calendar-week")) {
            $(this).remove()
        }
    })

    date_counter = 0
    for (i = 0; i < calendar_dates.length; i++) {
        var calendar_week = document.createElement("div")
        $(calendar_week).addClass("big-calendar-week")
        var calendar_date_row = document.createElement("div")
        $(calendar_date_row).addClass("big-calendar-date-row")
        for (j = 0; j < calendar_dates[i].length; j++) {
            var calendar_day = document.createElement("div")
            $(calendar_day).addClass("big-calendar-day").addClass("day")
            if (calendar_dates[i][j] == "") {
                $(calendar_day).addClass("calendar-empty")
                var calendar_date_label = document.createElement("div")
                $(calendar_date_label).addClass("calendar-date-label").addClass("calendar-date-empty")
                $(calendar_date_row).append(calendar_date_label)
            }
            else {
                $(calendar_day).attr("data-calendar-date", allDates[date_counter][1])
                $(calendar_day).attr("data-calendar-day", allDates[date_counter][0])
                $(calendar_day).click(highlightDay)
                for (k = 0; k < data.length; k++) {
                    if (data[k]["date"] == allDates[date_counter][1]) {
                        var calendar_shift = document.createElement("div")
                        var shift_role = data[k]["role"]
                        $(calendar_shift).addClass("big-calendar-shift").css("background-color", master_roles_color_data[shift_role])
                        console.log(master_roles_color_data[shift_role])
                        if (master_roles_color_data[shift_role] == "#f1ead1" || master_roles_color_data[shift_role] == "#f8bf39") {
                            console.log("HITTING THE IFFFFF")
                            $(calendar_shift).css("color", "#000")
                        }
                        $(calendar_shift).text(data[k]["role"] + " " + data[k]["start"])
                        $(calendar_shift).attr("id", data[k]["_id"])
                        $(calendar_shift).data("all-info", data[k])
                        $(calendar_shift).click(openEditShiftModal)
                        $(calendar_day).append(calendar_shift)
                    }
                }
                var calendar_date_label = document.createElement("div")
                $(calendar_date_label).addClass("calendar-date-label").text(calendar_dates[i][j])
                var add_shift_icon = document.createElement("img")
                $(add_shift_icon).attr("src", "/static/assets/plus.png").addClass("add-shift-icon")
                $(add_shift_icon).attr("data-calendar-day", allDates[date_counter][0])
                $(add_shift_icon).attr("data-calendar-date", allDates[date_counter][1])
                $(add_shift_icon).click(openAddShiftModal)
                //$(add_shift_icon).on("click", openAddShiftModal())
                $(calendar_date_label).append(add_shift_icon)
                $(calendar_date_row).append(calendar_date_label)
                date_counter++
            }

            $(calendar_week).append(calendar_day)
        }
        $(".big-calendar").append(calendar_date_row)
        $(".big-calendar").append(calendar_week)
    }
    return console.log("success");
}

function buildShiftModalContent(data) {
    // build recurrence functionality, including calendar graphic
    openShiftModal()

    // build endtime select dropdown
    let endInput = document.createElement("input")
    let endLabel = document.createElement("label")
    $(endLabel).text("End:").css("font-size", "13px").css("padding-right", "5px")
    $(function() {
        $(endInput).timepicker()
        $(endInput).timepicker('option', { useSelect: true });
    })
    let end_div = document.createElement("div")
    $(end_div).attr("id", "add-shift-end-time")
    $(end_div).append(endLabel).append(endInput)
    $("#add-shift-modal-content").prepend(end_div)

    // build starttime select dropdown
    let startInput = document.createElement("input")
    let startLabel = document.createElement("label")
    $(startLabel).text("Start:").css("font-size", "13px").css("padding-right", "5px")
    $(function() {
        $(startInput).timepicker()
        $(startInput).timepicker('option', { useSelect: true });
    })
    let start_div = document.createElement("div")
    $(start_div).attr("id", "add-shift-start-time")
    $(start_div).append(startLabel).append(startInput)
    $("#add-shift-modal-content").prepend(start_div)

    // build number of employees dropdown select
    let numEmpsLabel = document.createElement("label")
    $(numEmpsLabel).text("Employees:").css("font-size", "13px").css("padding-right", "5px")
    let number_emps_div = document.createElement("div");
    let numEmpsOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let numEmpsSelect = document.createElement("select");

    for (let i=0; i < numEmpsOptions.length; i++) {
        let option = document.createElement("option");
        option.value = numEmpsOptions[i];
        option.text = numEmpsOptions[i];
        numEmpsSelect.appendChild(option);
    };

    $(number_emps_div).attr("id", "add-shift-number-emps")
    $(number_emps_div).append(numEmpsLabel).append(numEmpsSelect);
    $("#add-shift-modal-content").prepend(number_emps_div)

    // build role dropdown select
    let roleOptions = master_roles;
    let roleSelect = document.createElement("select");
    let roleLabel = document.createElement("label")
    $(roleLabel).text("Role:").css("font-size", "13px").css("padding-right", "5px")

    for (let i=0; i < roleOptions.length; i++) {
        let option = document.createElement("option");
        option.value = roleOptions[i];
        option.text = roleOptions[i];
        roleSelect.appendChild(option);
    };

    let roles_div = document.createElement("div")
    $(roles_div).attr("id", "add-shift-role")
    $(roles_div).append(roleLabel).append(roleSelect)
    $("#add-shift-modal-content").prepend(roles_div)
}

function openAddShiftModal() {
    let day = $(this).data("calendar-day")
    let date = $(this).data("calendar-date")
    selectedDay["day"] = day
    selectedDay["date"] = date
    addShiftModal.setTitle(day).setContent($("#create-template-modal-body"));
    addShiftModal.open();
}

function openEditShiftModal () {
    $("#edit-shift-modal-content").empty()

    let shift_data = $(this).data("all-info")

    // build endtime select dropdown
    let endInput = document.createElement("input")
    let endLabel = document.createElement("label")
    $(endLabel).text("End:").css("font-size", "13px").css("padding-right", "5px")
    $(function() {
        $(endInput).timepicker()
        $(endInput).timepicker('option', { useSelect: true });
    })
    $(endInput).val(shift_data["end"])
    let end_div = document.createElement("div")
    $(end_div).attr("id", "edit-shift-end-time")
    $(end_div).append(endLabel).append(endInput)
    $("#edit-shift-modal-content").prepend(end_div)

    // build starttime select dropdown
    let startInput = document.createElement("input")
    let startLabel = document.createElement("label")
    $(startLabel).text("Start:").css("font-size", "13px").css("padding-right", "5px")
    $(function() {
        $(startInput).timepicker()
        $(startInput).timepicker('option', { useSelect: true });
    })
    $(startInput).val(shift_data["start"])
    let start_div = document.createElement("div")
    $(start_div).attr("id", "edit-shift-start-time")
    $(start_div).append(startLabel).append(startInput)
    $("#edit-shift-modal-content").prepend(start_div)

    // build number of employees dropdown select
    let numEmpsLabel = document.createElement("label")
    $(numEmpsLabel).text("Employees:").css("font-size", "13px").css("padding-right", "5px")
    let number_emps_div = document.createElement("div");
    let numEmpsOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let numEmpsSelect = document.createElement("select");

    for (let i=0; i < numEmpsOptions.length; i++) {
        let option = document.createElement("option");
        option.value = numEmpsOptions[i];
        option.text = numEmpsOptions[i];
        numEmpsSelect.appendChild(option);
    };

    $(numEmpsSelect).val(shift_data["num_employees"])
    $(number_emps_div).attr("id", "edit-shift-number-emps")
    $(number_emps_div).append(numEmpsLabel).append(numEmpsSelect);
    $("#edit-shift-modal-content").prepend(number_emps_div)

    // build role dropdown select
    let roleOptions = master_roles;
    let roleSelect = document.createElement("select");
    let roleLabel = document.createElement("label")
    $(roleLabel).text("Role:").css("font-size", "13px").css("padding-right", "5px")

    for (let i=0; i < roleOptions.length; i++) {
        let option = document.createElement("option");
        option.value = roleOptions[i];
        option.text = roleOptions[i];
        roleSelect.appendChild(option);
    };

    $(roleSelect).val(shift_data["role"])
    let roles_div = document.createElement("div")
    $(roles_div).attr("id", "edit-shift-role")
    $(roles_div).append(roleLabel).append(roleSelect)
    $("#edit-shift-modal-content").prepend(roles_div)

    console.log(shift_data)
    $("#save-edit-shift-modal").data("all-info", shift_data)

    editShiftModal.setTitle(shift_data["role"]).setContent($("#edit-shift-modal-body"));

    $("#edit-shift-jBox .jBox-title").css("background", master_roles_color_data[shift_data["role"]]).css("color", "#fff")
    $("#edit-shift-jBox").css("position", "absolute")

    editShiftModal.open({target: $(this)});
}

function highlightDay () {
    /*
    new jBox('Notice', {
        content: 'I\'m up here!',
        color: 'black',
        target: $("#quick-info-panel")
    });
    */

    var allDates = createDates(schedule_dates)
    $('#check-all-shifts').prop('checked', false);
    $(".big-calendar").find(".calendar-highlighted").removeClass("calendar-highlighted")
    $(this).addClass("calendar-highlighted")
    var date = $(this).data("calendar-date")
    var day = $(this).data("calendar-day")
    $("#date").empty().append("<b>" + day + "</b>")
    //$.getJSON("/api/get_shift_data/" + date.replace(/\//g, "") + "/" + schedule_id, renderShiftTable)
}

function findCalendarDates () {
    var allDates = createDates(schedule_dates)
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    start_date_day_index = days.indexOf(allDates[0][0].split(",")[0])
    start_date = Number(allDates[0][1].split("/")[1])
    var month = []
    var date_counter = 1
    //var length = (allDates.length + 6) - ((allDates.length + 6) % 7)
    if (start_date_day_index + allDates.length <= 7) {
        var length = 7;
    } else {
        var length = (start_date_day_index + allDates.length + 6) - ((start_date_day_index + allDates.length + 6) % 7)
    }
    for (i = 0; i < length; i++) {
        if (i < start_date_day_index) {
            month.push("")
        }
        else if (i == start_date_day_index) {
            month.push(start_date)
        }
        else {
            if (date_counter <= (allDates.length - 1)) {
                month.push(Number(allDates[date_counter][1].split("/")[1]))
            }
            else {month.push("")}
            date_counter++
        }
    }
    var for_calendar = []
    for (i = 0; i < month.length - 6; i += 7) {
        for_calendar.push(month.slice(i, i + 7))
    }
    return for_calendar
}

function openShiftModal () {
    var allDates = createDates(schedule_dates)

    $("#recurrence-options").data("shift-id", $(this).data("shift-id"))

    calendar_dates = findCalendarDates()

    $(".calendar").children().each(function () {
        if ($(this).hasClass("calendar_week")) {
            $(this).remove()
        }
    })

    var select_day_previous = "";
    $("#select-day").click(function () {
        select_day_previous = $(this).val()
    }).change(function () {
        removeRecurrence(select_day_previous)
        applyRecurrence($(this).val())
    })

    var select_frequency_previous = "";
    $("#select-frequency").click(function () {
        select_frequency_previous = $(this).val()
    }).change(function () {
        removeRecurrence(select_frequency_previous)
        applyRecurrence($(this).val())
    })

    date_counter = 0
    for (i = 0; i < calendar_dates.length; i++) {
        var calendar_week = document.createElement("div")
        $(calendar_week).addClass("calendar_week")
        for (j = 0; j < calendar_dates[i].length; j++) {
            var calendar_day = document.createElement("div")
            $(calendar_day).addClass("calendar_day").addClass("day")
            $(calendar_day).text(calendar_dates[i][j])
            if (calendar_dates[i][j] == "") {
                $(calendar_day).addClass("calendar-empty-day")
            }
            else {
                $(calendar_day).click(selectDay)
                $(calendar_day).data("date", allDates[date_counter][1])
                date_counter++
            }
            $(calendar_week).append(calendar_day)
        }
        $(".calendar").append(calendar_week)
    }
    return console.log("success");
}

function selectDay () {
    if ($(this).hasClass("calendar-selected")) {
        $(this).removeClass("calendar-selected")
    }
    else {
        $(this).addClass("calendar-selected")
    }
}

function selectDayNoDeselect (element) {
    if ($(element).hasClass("calendar-selected") || $(element).hasClass("calendar-empty-day")) {
        return;
    }
    else {
        $(element).addClass("calendar-selected")
    }
}

function deselectDayNoSelect (element) {
    if (!$(element).hasClass("calendar-selected") || $(element).hasClass("calendar-empty-day")) {
        return;
    }
    else {
        $(element).removeClass("calendar-selected")
    }
}

$(document).on("click", "#recurrence-options tr", function () {
    var recurrence_type = $(this).children().text()

    if ($(this).hasClass("selected")) {
        $(this).removeClass("selected")
        removeRecurrence(recurrence_type)
    }
    else {
        $(this).addClass("selected")
        applyRecurrence(recurrence_type)
    }
})

function applyRecurrence(recurrence_type) {
    if (recurrence_type == "Select day") {
        return
    }
    if (recurrence_type == "Weekends") {
        $(".calendar .calendar_week").each(function() {
            selectDayNoDeselect($(this).find(":nth-child(1)"))
            selectDayNoDeselect($(this).find(":nth-child(7)"))
        })
    }
    if (recurrence_type == "Weekdays") {
        $(".calendar .calendar_week").each(function() {
            selectDayNoDeselect($(this).find(":nth-child(2)"))
            selectDayNoDeselect($(this).find(":nth-child(3)"))
            selectDayNoDeselect($(this).find(":nth-child(4)"))
            selectDayNoDeselect($(this).find(":nth-child(5)"))
            selectDayNoDeselect($(this).find(":nth-child(6)"))
        })
    }
    if (recurrence_type == "Sunday") {
        $(".calendar .calendar_week").each(function() {
            selectDayNoDeselect($(this).find(":nth-child(1)"))
        })
    }
    if (recurrence_type == "Monday") {
        $(".calendar .calendar_week").each(function() {
            selectDayNoDeselect($(this).find(":nth-child(2)"))
        })
    }
    if (recurrence_type == "Tuesday") {
        $(".calendar .calendar_week").each(function() {
            selectDayNoDeselect($(this).find(":nth-child(3)"))
        })
    }
    if (recurrence_type == "Wednesday") {
        $(".calendar .calendar_week").each(function() {
            selectDayNoDeselect($(this).find(":nth-child(4)"))
        })
    }
    if (recurrence_type == "Thursday") {
        $(".calendar .calendar_week").each(function() {
            selectDayNoDeselect($(this).find(":nth-child(5)"))
        })
    }
    if (recurrence_type == "Friday") {
        $(".calendar .calendar_week").each(function() {
            selectDayNoDeselect($(this).find(":nth-child(6)"))
        })
    }
    if (recurrence_type == "Saturday") {
        $(".calendar .calendar_week").each(function() {
            selectDayNoDeselect($(this).find(":nth-child(7)"))
        })
    }
    if (recurrence_type == "Every day") {
        $(".calendar .calendar_week").each(function() {
            for (i = 0; i < $(this).find(":nth-child(n)").length; i++) {
                selectDayNoDeselect($(this).find(":nth-child(n)")[i])
            }
        })
    }
    if (recurrence_type == "Every 2nd day") {
        $(".calendar .calendar_week").each(function() {
            for (i = 0; i < $(this).find(":nth-child(2n)").length; i++) {
                selectDayNoDeselect($(this).find(":nth-child(2n)")[i])
            }
        })
    }if (recurrence_type == "Every 3rd day") {
        $(".calendar .calendar_week").each(function() {
            for (i = 0; i < $(this).find(":nth-child(3n)").length; i++) {
                selectDayNoDeselect($(this).find(":nth-child(3n)")[i])
            }
        })
    }if (recurrence_type == "Every 4th day") {
        $(".calendar .calendar_week").each(function() {
            for (i = 0; i < $(this).find(":nth-child(4n)").length; i++) {
                selectDayNoDeselect($(this).find(":nth-child(4n)")[i])
            }
        })
    }
}

function removeRecurrence(recurrence_type) {
    if (recurrence_type == "Select day") {
        return
    }
    if (recurrence_type == "Weekends") {
        $(".calendar .calendar_week").each(function() {
            deselectDayNoSelect($(this).find(":nth-child(1)"))
            deselectDayNoSelect($(this).find(":nth-child(7)"))
        })
    }
    if (recurrence_type == "Weekdays") {
        $(".calendar .calendar_week").each(function() {
            deselectDayNoSelect($(this).find(":nth-child(2)"))
            deselectDayNoSelect($(this).find(":nth-child(3)"))
            deselectDayNoSelect($(this).find(":nth-child(4)"))
            deselectDayNoSelect($(this).find(":nth-child(5)"))
            deselectDayNoSelect($(this).find(":nth-child(6)"))
        })
    }
    if (recurrence_type == "Sunday") {
        $(".calendar .calendar_week").each(function() {
            deselectDayNoSelect($(this).find(":nth-child(1)"))
        })
    }
    if (recurrence_type == "Monday") {
        $(".calendar .calendar_week").each(function() {
            deselectDayNoSelect($(this).find(":nth-child(2)"))
        })
    }
    if (recurrence_type == "Tuesday") {
        $(".calendar .calendar_week").each(function() {
            deselectDayNoSelect($(this).find(":nth-child(3)"))
        })
    }
    if (recurrence_type == "Wednesday") {
        $(".calendar .calendar_week").each(function() {
            deselectDayNoSelect($(this).find(":nth-child(4)"))
        })
    }
    if (recurrence_type == "Thursday") {
        $(".calendar .calendar_week").each(function() {
            deselectDayNoSelect($(this).find(":nth-child(5)"))
        })
    }
    if (recurrence_type == "Friday") {
        $(".calendar .calendar_week").each(function() {
            deselectDayNoSelect($(this).find(":nth-child(6)"))
        })
    }
    if (recurrence_type == "Saturday") {
        $(".calendar .calendar_week").each(function() {
            deselectDayNoSelect($(this).find(":nth-child(7)"))
        })
    }
    if (recurrence_type == "Every day") {
        $(".calendar .calendar_week").each(function() {
            for (i = 0; i < $(this).find(":nth-child(n)").length; i++) {
                deselectDayNoSelect($(this).find(":nth-child(n)")[i])
            }
        })
    }
    if (recurrence_type == "Every 2nd day") {
        $(".calendar .calendar_week").each(function() {
            for (i = 0; i < $(this).find(":nth-child(2n)").length; i++) {
                deselectDayNoSelect($(this).find(":nth-child(2n)")[i])
            }
        })
    }if (recurrence_type == "Every 3rd day") {
        $(".calendar .calendar_week").each(function() {
            for (i = 0; i < $(this).find(":nth-child(3n)").length; i++) {
                deselectDayNoSelect($(this).find(":nth-child(3n)")[i])
            }
        })
    }if (recurrence_type == "Every 4th day") {
        $(".calendar .calendar_week").each(function() {
            for (i = 0; i < $(this).find(":nth-child(4n)").length; i++) {
                deselectDayNoSelect($(this).find(":nth-child(4n)")[i])
            }
        })
    }
}

$(document).on("click", "#create-template-submit", function () {
    addShiftModal.close()
    saveShift()
});

$(document).on("click", "#save-edit-shift-modal", function () {
    editShiftModal.close()
    var edit_type = $(this).text();
    editShift(edit_type);
});

$(document).on("click", "#delete-edit-shift-modal", function () {
    editShiftModal.close()
    var edit_type = $(this).text();
    editShift(edit_type);
});

$(document).on("click", "#save-all-edit-shift-modal", function () {
    editShiftModal.close()
    var edit_type = $(this).text();
    editShift(edit_type);
});

$(document).on("click", "#delete-all-edit-shift-modal", function () {
    editShiftModal.close()
    var edit_type = $(this).text();
    editShift(edit_type);
});

$(document).on("click", "#close-add-shift-modal", function () {
    addShiftModal.close()
});

function timeDifference (start, end) {

    function to24 (time) {
        time_period = time.slice(-2)
        time_array = time.slice(0, -2).split(":")
        if (time_period == "pm" && time_array[0] < 12) {
            time_array[0] = Number(time_array[0]) + 12
            time_array[1] = Number(time_array[1])
        }
        if (time_period == "am" && time_array[0] == 12) {
            time_array[0] = 0
            time_array[1] = Number(time_array[1])
        }
        else {
            time_array[0] = Number(time_array[0])
            time_array[1] = Number(time_array[1])
        }
        return time_array
    }

    start_time = to24(start)
    end_time = to24(end)

    diff = end_time[0] - start_time[0]
    if (start_time[1] != end_time[1]) {
        if (start_time[1] == 30) {
            diff = diff - 0.5
        }
        if (start_time[1] == 0) {
            diff = diff + 0.5
        }
    }
    if (diff < 0) {
        return "time-traveler!"
    }
    if (diff == 1) {
        return diff + " hr"
    }
    return diff + " hrs"
}

var counter = 1

function editShift (edit_type) {
    var shift_info = $("#save-edit-shift-modal").data("all-info")

    var role = $("#edit-shift-role").find("select").val()
    var number_emps = $("#edit-shift-number-emps").find("select").val()
    var start = $("#edit-shift-start-time").find("select").val()
    var end = $("#edit-shift-end-time").find("select").val()

    var data = {"date": shift_info["date"],
                "schedule_id": schedule_id,
                "role": role,
                "num_employees": number_emps,
                "start": start,
                "end": end,
                "_id": shift_info["_id"],
                "parent_shift": shift_info["parent_shift"],
                "edit_type": edit_type}

    console.log(data)

    $.ajax({
        type: "POST",
        url: "/update_shift_data",
        data: JSON.stringify(data),
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
        success: function(callback_data) {
            console.log(callback_data)
            console.log($(".big-calendar").find("#" + callback_data["date_id"][0][1]))
            if (callback_data["edit_type"] == "Apply" || callback_data["edit_type"] == "Apply All") {
                for (i = 0; i < callback_data["date_id"].length; i++) {
                    let shift = $(".big-calendar").find("#" + callback_data["date_id"][i][1])
                    console.log(shift)
                    shift.css("background-color", master_roles_color_data[role]).text(role + " " + start)
                    shift.data("all-info", data)
                    console.log(shift)
                }
            }
            if (callback_data["edit_type"] == "Delete" || callback_data["edit_type"] == "Delete All") {
                for (i = 0; i < callback_data["date_id"].length; i++) {
                    let shift = $(".big-calendar").find("#" + callback_data["date_id"][i][1])
                    console.log(shift)
                    shift.remove()
                }
            }
        }
    }).done(function(){
        console.log("Sent to server.")
    }).fail(function(jqXHR, status, error){
        alert(status + ": " + error);
    });
}

function saveShift () {
    var date = selectedDay["date"]
    var role = $("#add-shift-role").find("select").val()
    var number_emps = $("#add-shift-number-emps").find("select").val()
    var start = $("#add-shift-start-time").find("select").val()
    var end = $("#add-shift-end-time").find("select").val()

    var selectedDates = [];
    $(".calendar").children().each(function () {
        if ($(this).hasClass("calendar_week")) {
            $(this).children().each(function () {
                if ($(this).hasClass("calendar-selected")) {
                    selectedDates.push($(this).data("date"));
                }
            })
        }
    })

    var shift_id = new ObjectId()

    var data = {"date": date,
                "schedule_id": schedule_id,
                "role": role,
                "num_employees": number_emps,
                "start": start,
                "end": end,
                "_id": shift_id.toString(),
                "parent_shift": shift_id.toString(),
                "recurrence_dates": selectedDates}

    $.ajax({
        type: "POST",
        url: "/save_shift_data",
        data: JSON.stringify(data),
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
        success: function(callback_data) {
            for (i = 0; i < callback_data.length; i++) {
                var calendar_shift = document.createElement("div")
                $(calendar_shift).addClass("big-calendar-shift").css("background-color", master_roles_color_data[role])
                $(calendar_shift).text(role + " " + start)
                $(calendar_shift).attr("id", callback_data[i][1])
                $(calendar_shift).data("all-info", data)
                $(calendar_shift).click(openEditShiftModal)
                $("*[data-calendar-date='" + callback_data[i][0] + "']").append(calendar_shift)
            }
        }
    }).done(function(){
        console.log("Sent to server.")
    }).fail(function(jqXHR, status, error){
        alert(status + ": " + error);
    });
}

function getIndexOf(arr, k) {
    for (var i = 0; i < arr.length; i++) {
        var index = arr[i].indexOf(k);
        if (index > -1) {
          return i;
        }
    }
};

$(document).on("click", "#page-right", function(){
    day_index++;
    $('#page-left').prop('disabled', false);
    var allDates = createDates(schedule_dates)
    var current = $("#date").text()
    var i = getIndexOf(allDates, current)
    $("#date").empty().append("<b>" + allDates[i + 1][0] + "</b>")
    if (i == allDates.length - 2) {
        $(this).prop('disabled', true);
    }
    $(".shift-table-body").empty()
    $.getJSON("/api/get_shift_data/" + allDates[i + 1][1].replace(/\//g, "") + "/" + schedule_id, renderShiftTable)
});

$(document).on("click", "#page-left", function(){
    day_index--;
    $('#page-right').prop('disabled', false);
    var allDates = createDates(schedule_dates)
    var current = $("#date").text()
    var i = getIndexOf(allDates, current)
    $("#date").empty().append("<b>" + allDates[i - 1][0] + "</b>")
    if (i == 1) {
        $(this).prop('disabled', true);
    }
    $(".shift-table-body").empty()
    $.getJSON("/api/get_shift_data/" + allDates[i - 1][1].replace(/\//g, "") + "/" + schedule_id, renderShiftTable)
});

$(document).on("click", "#remove-shifts", function() {
    var message = "Are you sure that you wish to remove these shift from your schedule? All data associated" +
     " with these shifts will be deleted."
    var confirmed = confirm(message);
    if (confirmed){

        data = {
            "_ids": $(".shift-select-checkbox:checked").map(function(){return this.id}).get(),
            "schedule_id": schedule_id,
        };
        console.log("Attempting to remove the following shifts from schedule:")
        let success = function() {
                for (i = 0; i < data["_ids"].length; i++) {
                    $(".big-calendar").find("#" + data["_ids"][i]).remove()
                }
                $("#remove-shifts").attr("disabled", "disabled");
                $(".shift-table-body").empty();
                $.getJSON("/api/get_shift_data/" + createDates(schedule_dates)[day_index][1].replace(/\//g, "") + "/" + schedule_id,
                    renderShiftTable
                );
        };

        $.ajax({
        type: "POST",
        url: "/_remove_schedule_shifts",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: success
        });
    };
    $(".shift-select-checkbox:checked").parents("tr").empty()
});
