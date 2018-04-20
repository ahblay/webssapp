console.log("shift_setup.js is running.")

$.getScript("/static/ObjectId.js").fail("Script 'ObjectId.js' failed to load.")

var schedule_id = "default assignment";
var schedule_dates = "default assignment";
var master_roles = []
var day_index = 0;

$.fn.exists = function () {
    return this.length !== 0;
}

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
    schedule_dates = $("#shift-setup-tab").data("schedule-dates").split(" ")
    $.getJSON("/_api/get_roles", getRoles)
    //the code below runs, although pycharm interprets it as being commented out
    //$.getJSON("/api/get_shift_data/" + schedule_dates[0].replace(/\//g, "") + "/" + schedule_id, renderShiftTable)
    $.getJSON("/api/get_all_shift_data/" + schedule_id, loadShiftCalendar)
        .done(function () {
                console.log('Checking for selection.');
                console.log($('.calendar-selected'));
                console.log($('.calendar-selected').exists());
                if (!$('.calendar-highlighted').exists()){
                    console.log('Clicking calendar day!');
                    $("*[data-calendar-date='"+ schedule_dates[0] + "']").click();
                }
        });
});

$(function () {
    console.log('Checking for selection.');
    console.log($('.calendar-selected'));
    console.log($('.calendar-selected').exists());
    if (!$('.calendar-highlighted').exists()){
        console.log('Clicking calendar day!');
        console.log(schedule_dates);
        console.log(schedule_dates[0]);
        console.log($('.big-calendar-day'));
        $("*[data-calendar-date='"+ schedule_dates[0] + "']").click();
    };
});

$(() => {
    schedule_length = [... new Set(schedule_dates)].length;
    console.log('Schedule Length')
    console.log(schedule_length)
    if (schedule_length > 1){
        $("#page-right").prop("disabled", false);
    };
});


function getRoles(data) {
    for (i = 0; i < data.length; i++) {
        master_roles.push(data[i]["name"])
    }
}

function renderShiftTable(data) {
    console.log(data)
    $(".shift-table-body").empty()
    //if statement because jsonify error message is used as data to create a row
    for (let i = 0; i < data.length; i++) {
        shift_name = data[i]["name"]
        console.log(shift_name)
        shift_data = data[i]
        create_row(".shift-table-body", shift_name, shift_data)
    }
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
    console.log(allDates[0][0]);
    $("#date").attr("style", "vertical-align: middle;");
    $("#date").html("<b>" + allDates[0][0] + "</b>");
    console.log($("#date").text());
});

function create_row(attribute, name, shift){
    if (typeof(name) === 'undefined') name = "";
    if (typeof(shift) === "undefined") shift = {"start": "", "end": "", "num_employees": "", "role": "", "_id": "", "name": ""};

    console.log(shift)
    let row = document.createElement("tr");

    if (shift["_id"] == "")  {
        var row_id = new ObjectId()
        $(row).data("id", row_id.toString())
    }
    else {
        $(row).data("id", shift["_id"])
    }

    //checkbox
    let checkCell = document.createElement("td");
    $(checkCell).css("border-top", "1px solid")
    let label = document.createElement("label");
    $(label).addClass("checkbox-container");
    let span = document.createElement("span");
    $(span).addClass("custom-checkbox");
    let input = $(document.createElement("input"));
    input.addClass("shift-select-checkbox");
    input.attr("id", shift["_id"])

    input.attr("type", "checkbox");
    input.val("");
    console.log(input);
    $(label).append(input);
    $(label).append(span);
    $(checkCell).append(label);
    $(row).append(checkCell);

    //shift name
    let nameCell = document.createElement("td");
    $(nameCell).css("border-top", "1px solid")
    let nameField = document.createElement("input");
    $(nameField).addClass("shift-name")
    if (name != "") {
        $(nameField).attr("value", name);
    }
    nameCell.append(nameField);
    row.append(nameCell);

    //manage start time dropdown
    let startTime = document.createElement("td");
    $(startTime).css("border-top", "1px solid")
    let startHourOptions = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
    let startInput = document.createElement("input")
    $(startInput).val(shift["start"])

    $(function() {
        $(startInput).timepicker()
        $(startInput).timepicker('option', { useSelect: true });
    })

    let startSelect = document.createElement("select");

    startTime.append(startInput)
    row.append(startTime);

    //manage end time dropdown
    let endTime = document.createElement("td");
    $(endTime).css("border-top", "1px solid")
    let endOptions = [10, 11, 12, 1, 2, 3, 4, 5];
    let endInput = document.createElement("input")
    $(endInput).val(shift["end"])

    $(function() {
        $(endInput).timepicker()
        $(endInput).timepicker('option', { useSelect: true });
    })

    let endSelect = document.createElement("select")

    $(endTime).append(endInput)
    row.append(endTime);

    //determine length
    let length = document.createElement("td");
    $(length).css("border-top", "1px solid")
    length.append(timeDifference($(startInput).val(), $(endInput).val()))

    $(startInput).on("change", function () {
        $(length).empty()
        length.append(timeDifference($(startInput).val(), $(endInput).val()))
    })
    $(endInput).on("change", function () {
        $(length).empty()
        length.append(timeDifference($(startInput).val(), $(endInput).val()))
    })

    row.append(length);

    //select number of employees
    let numberEmps = document.createElement("td");
    $(numberEmps).css("border-top", "1px solid")
    let numEmpsOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let numEmpsSelect = document.createElement("select");

    for (let i=0; i < numEmpsOptions.length; i++) {
        let option = document.createElement("option");
        option.value = numEmpsOptions[i];
        option.text = numEmpsOptions[i];
        if (numEmpsOptions[i] == shift["num_employees"]) {
            $(option).prop("selected", true)
        }
        numEmpsSelect.appendChild(option);
    };

    numberEmps.append(numEmpsSelect);
    row.append(numberEmps);

    //select role
    let roles = document.createElement("td");
    $(roles).css("border-top", "1px solid")

    row.append(roles);
    let roleOptions = master_roles;
    let roleSelect = document.createElement("select");

    for (let i=0; i < roleOptions.length; i++) {
        let option = document.createElement("option");
        option.value = roleOptions[i];
        option.text = roleOptions[i];
        if (roleOptions[i] == shift["role"]) {
            $(option).prop("selected", true)
        }
        roleSelect.appendChild(option);
    };

    roles.append(roleSelect);

    //template button
    let template = document.createElement("td");
    $(template).css("border-top", "1px solid");
    let createTemplateButton = $("<button/>", {
        "data-target": "#create-template-modal",
        "data-toggle": "modal",
        "data-shift-id": $(row).data("id"),
        class: "btn btn-outline-dark shift-btn",
        text: "Create Template",
        click: openShiftModal
    });
    $(template).append(createTemplateButton);
    row.append(template);

    $(attribute).append(row);
};

function loadShiftCalendar (data) {

    var allDates = createDates(schedule_dates)
    console.log(data)
    console.log(allDates)
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
        for (j = 0; j < calendar_dates[i].length; j++) {
            var calendar_day = document.createElement("div")
            $(calendar_day).addClass("big-calendar-day").addClass("day")
            if (calendar_dates[i][j] == "") {
                $(calendar_day).addClass("calendar-empty")
            }
            else {
                $(calendar_day).attr("data-calendar-date", allDates[date_counter][1])
                $(calendar_day).attr("data-calendar-day", allDates[date_counter][0])
                $(calendar_day).click(highlightDay)
                for (k = 0; k < data.length; k++) {
                    if (data[k]["date"] == allDates[date_counter][1]) {
                        var calendar_shift = document.createElement("div")
                        $(calendar_shift).addClass("big-calendar-shift")
                        $(calendar_shift).text(data[k]["role"] + " " + data[k]["start"])
                        $(calendar_day).append(calendar_shift)
                    }
                }
                var calendar_date_label = document.createElement("div")
                $(calendar_date_label).addClass("calendar-date-label").text(calendar_dates[i][j])
                $(calendar_day).append(calendar_date_label)
                date_counter++
            }

            $(calendar_week).append(calendar_day)
        }
        $(".big-calendar").append(calendar_week)
    }
    return console.log("success");
}

function highlightDay () {
    var allDates = createDates(schedule_dates)
    $('#check-all-shifts').prop('checked', false);
    $(".big-calendar").find(".calendar-highlighted").removeClass("calendar-highlighted")
    $(this).addClass("calendar-highlighted")
    var date = $(this).data("calendar-date")
    var day = $(this).data("calendar-day")
    console.log(date)
    $("#date").empty().append("<b>" + day + "</b>")
    $.getJSON("/api/get_shift_data/" + date.replace(/\//g, "") + "/" + schedule_id, renderShiftTable)
}

function findCalendarDates () {
    var allDates = createDates(schedule_dates)
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    start_date_day_index = days.indexOf(allDates[0][0].split(",")[0])
    start_date = Number(allDates[0][1].split("/")[1])
    var month = []
    var date_counter = 1
    var length = (allDates.length + 6) - ((allDates.length + 6) % 7)
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
    console.log(month)
    var for_calendar = []
    for (i = 0; i < month.length - 6; i += 7) {
        console.log(month.slice(i, i + 7))
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

    date_counter = 0
    for (i = 0; i < calendar_dates.length; i++) {
        var calendar_week = document.createElement("div")
        $(calendar_week).addClass("calendar_week")
        for (j = 0; j < calendar_dates[i].length; j++) {
            var calendar_day = document.createElement("div")
            $(calendar_day).addClass("calendar_day").addClass("day")
            $(calendar_day).text(calendar_dates[i][j])
            if (calendar_dates[i][j] == "") {
                $(calendar_day).css("background-color", "#72777a")
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

$(document).on("click", "#recurrence-options tr", function () {
    if ($(this).hasClass("selected")) {
        $(this).removeClass("selected").siblings().removeClass("selected")
    }
    else {
        $(this).addClass("selected").siblings().removeClass("selected")
    }
})

$(document).on("click", "#create-template-submit", function () {
    var selectedDates = [];
    $(".calendar").children().each(function () {
        console.log("In calendar!")
        if ($(this).hasClass("calendar_week")) {
            console.log("In calendar week!!")
            $(this).children().each(function () {
                if ($(this).hasClass("calendar-selected")) {
                    console.log("Found selected date!!")
                    selectedDates.push($(this).data("date"));
                }
            })
        }
    })
    var recurrenceType = "";
    $("#recurrence-options tbody").children().each(function () {
        if ($(this).hasClass("selected")) {
            $(this).children().each(function () {
                if ($(this).find("select").length > 0) {
                    recurrenceType = $(this).find("select").val()
                }
                else {
                    recurrenceType = $(this).text()
                }
            })
        }
    })
    var data = {"dates": selectedDates,
                "shift_id": $("#recurrence-options").data("shift-id"),
                "schedule_id": schedule_id,
                "recurrenceType": recurrenceType}
    console.log(data);
    $.ajax({
        type: "POST",
        url: "/update_shift_data",
        data: JSON.stringify(data),
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
    }).done(function(){
        console.log("Sent to server.")
    }).fail(function(jqXHR, status, error){
        alert(status + ": " + error);
    });
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

function collectShiftData () {
    var shift_data = [];
    $(".shift-table-body tr").each(function () {
        var shift = []
        $(this).children().each(function () {
            if ($(this).find("input").hasClass("shift-name")) {
                console.log($(this).find("input").val())
                shift.push($(this).find("input").val())
            }
            if ($(this).find("select").length > 0) {
                console.log($(this).find("select").val())
                shift.push($(this).find("select").val())
            }
        })
        shift.push($(this).data("id"))
        shift_data.push(shift)
    })
    return shift_data;
}

$(document).on("click", "#add-shift", function () {
    console.log('Adding shift.')
    create_row(".shift-table-body")
});

$(document).on("click", "#save-shifts", function () {
    var allDates = createDates(schedule_dates)
    var current = $("#date").text()
    var i = getIndexOf(allDates, current)
    date = allDates[i][1]
    shift_data = {"_id": schedule_id, "shift_data": collectShiftData(), "date": date}
    roles = []
    starts = []
    for (i = 0; i < shift_data["shift_data"].length; i++) {
        roles.push(shift_data["shift_data"][i][4])
        starts.push(shift_data["shift_data"][i][2])
    }
    console.log(role)

    $.ajax({
        type: "POST",
        url: "/save_shift_data",
        data: JSON.stringify(shift_data),
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
    }).done(function(){
        console.log("Sent to server.")
        $('*[data-calendar-date="' + date + '"]').children().each(function () {
            if ($(this).hasClass("big-calendar-shift")) {
                $(this).remove()
            }
        })
        for (j = 0; j < roles.length; j++) {
            var calendar_shift = document.createElement("div")
            $(calendar_shift).addClass("big-calendar-shift")
            $(calendar_shift).text(roles[j] + " " + starts[j])
            $('*[data-calendar-date="' + date + '"]').prepend(calendar_shift)
        }
    }).fail(function(jqXHR, status, error){
        alert(status + ": " + error);
    });
});

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

$("#check-all-shifts").on("click", function(){
    $(".shift-select-checkbox").not(this).prop("checked", this.checked)
    console.log("Check-all selected, updating buttons.")
    var num_boxes_selected = $(".shift-select-checkbox:checked").length
    if ( num_boxes_selected > 0) {
        $("#remove-shifts").removeAttr("disabled");
    } else {
        $("#remove-shifts").attr("disabled", "disabled")
    };
});

$(document).on("change", ".shift-select-checkbox", function(){
    console.log("Checkbox selected, updating buttons.")
    var num_boxes_selected = $(".shift-select-checkbox:checked").length
    if ( num_boxes_selected > 0) {
        $("#remove-shifts").removeAttr("disabled");
    } else {
        $("#remove-shifts").attr("disabled", "disabled")
    };
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
        console.log(data)
        console.log("Attempting to remove the following shifts from schedule:")
        console.log(data["_ids"])
        let success = function() {
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
