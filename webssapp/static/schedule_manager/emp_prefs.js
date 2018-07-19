var schedule_id = SCHEDULE['_id']
var selected_user_id = 'initial assignment'
var employee_names = {}
var shift_dict = {}
var pref_dict = {}
var last_tab = null
var eligible_employees = {}

$(function () {
    viewShiftsModal = new jBox('Modal', {
        id: "view-shifts-jBox",
        attach: ".pref-calendar-pref",
        closeButton: 'box',
        //offset: {x: 20, y: 35},
        animation: {open: 'zoomIn', close: 'zoomIn'}
    });
    //$('#pref-availability').bootstrapToggle();
})

function renderEmpTable(data) {
    data = data['employees'];
    console.log(data);
    for (i = 0; i < data.length; i++) {
        createRow(".emp-prefs", data[i]["name"], data[i]["_id"]);
        employee_names[data[i]["_id"]] = data[i]["name"];
    }
};

function renderPrefCalendar(data) {
    console.log(data)
    employees = data["employees"]
    shifts = data["shifts"]

    // creates eligible employees dict
    for (j = 0; j < shifts.length; j++) {
        eligible_employees_shift = []
        for (k = 0; k < employees.length; k++) {
            for (l = 0; l < employees[k]["roles"].length; l++) {
                console.log()
                if (employees[k]["roles"][l]['role_name'] == shifts[j]['role']) {
                    eligible_employees_shift.push(employees[k]['_id'])
                }
            }
        }
        eligible_employees[shifts[j]["_id"]] = eligible_employees_shift
    }

    console.log(eligible_employees);

    // days row
    let pref_calendar_labels = document.createElement("div")
    $(pref_calendar_labels).addClass("pref-calendar-labels")
    let pref_calendar_day_label = document.createElement("div")
    $(pref_calendar_day_label).addClass("pref-calendar-label").text("Days:")
    $(pref_calendar_labels).append(pref_calendar_day_label)
    for (i = 0; i < employees.length; i ++) {
        let pref_calendar_name_label = document.createElement("div")
        $(pref_calendar_name_label).addClass("pref-calendar-name-label");
        $(pref_calendar_name_label).append($("<div />").text(employees[i]['name'])
                                                       .addClass("pref-calendar-name-label-text"));
        $(pref_calendar_labels).append(pref_calendar_name_label)
    }
    $(".pref-calendar").append(pref_calendar_labels)

    let pref_calendar_content = document.createElement("div")
    $(pref_calendar_content).addClass("pref-calendar-content")

    // content
    pref_calendar_data = getPrefCalendarData(data)
    console.log(pref_calendar_data)
    days = data["days"]
    for (i = 0; i < days.length; i ++) {
        let pref_calendar_day = document.createElement("div")
        $(pref_calendar_day).addClass("pref-calendar-day")

        let pref_calendar_day_title = document.createElement("div")
        $(pref_calendar_day_title).addClass("pref-calendar-title").text(dateToAbbreviatedString(days[i]))
                                                                  .attr("data-date", days[i]);
        $(pref_calendar_day).append(pref_calendar_day_title)

        let pref_calendar_all_prefs = document.createElement("div")
        $(pref_calendar_all_prefs).addClass("pref-calendar-all-prefs")

        let pref_calendar_prefs = document.createElement("div")
        $(pref_calendar_prefs).addClass("pref-calendar-prefs")

        for (l = 0; l < employees.length; l++) {
            emp_id = employees[l]["_id"]
            emp_name = employees[l]["name"]
            emp_prefs = data["prefs"][emp_id]
            pref = {}

            for (j = 0; j < emp_prefs.length; j++) {
                if (emp_prefs[j]["date"] == days[i]) {
                    pref = emp_prefs[j]
                }
            }

            let day_info = pref_calendar_data[days[i]]

            let pref_calendar_pref = document.createElement("div")
            $(pref_calendar_pref).addClass("pref-calendar-pref")
            //$(pref_calendar_pref).data("shift-id", shift_id)
            $(pref_calendar_pref).data("date", days[i])
            $(pref_calendar_pref).data("emp-name", emp_name)
            $(pref_calendar_pref).data("all-info", day_info)
            $(pref_calendar_pref).data("emp-id", emp_id)
            $(pref_calendar_pref).data("prefs", pref)

            let expand_icon = document.createElement("img")
            $(expand_icon).addClass("pref-calendar-expand-icon")
            $(expand_icon).attr("src", "/static/assets/expand_icon.png")

            //let eligible_employees = $(".emp-shift-prefs").find("#" + shift_id).data("eligible")

            function thisDay(day) {
                return day.date == days[i];
            }

            let day = data["prefs"][emp_id].find(thisDay)

            if (Object.keys(day).length == 2) {
                $(pref_calendar_pref).addClass("pref-ineligible")
            }
            else if (day["status"] == "Empty") {
                $(pref_calendar_pref).addClass("pref-empty")
            } else if (day["status"] == "Available") {
                $(pref_calendar_pref).addClass("pref-available")

                let has_preferred_shift = false;
                let has_not_preferred_shift = false;

                for (pref_value=0; pref_value < Object.values(pref).length; pref_value++){

                    if (Object.values(pref)[pref_value] == 5){
                        has_preferred_shift = true;
                    };

                    if (Object.values(pref)[pref_value] == 1){
                        has_not_preferred_shift = true;
                    };

                    if (has_preferred_shift && has_not_preferred_shift){
                        $(pref_calendar_pref).addClass("pref-split");
                        break;
                    }
                }

                if (has_preferred_shift && !has_not_preferred_shift){
                    $(pref_calendar_pref).addClass("pref-prefer");
                } else if (!has_preferred_shift && has_not_preferred_shift){
                    $(pref_calendar_pref).addClass("pref-dont-prefer");
                };
            } else if (day["status"] == "Unavailable") {
                $(pref_calendar_pref).addClass("pref-unavailable")
            };

            $(pref_calendar_pref).on("click", viewShifts)
            let wrapped_pref = $("<div />").append($(pref_calendar_pref)).addClass("pref-calendar-pref-wrapper");
            $(pref_calendar_prefs).append(wrapped_pref);

            $(pref_calendar_all_prefs).append(pref_calendar_prefs)

            $(pref_calendar_day).append(pref_calendar_all_prefs)
            $(pref_calendar_content).append(pref_calendar_day)
        }
    };
    $(".pref-calendar").append(pref_calendar_content)
};

$(document).on({
    mouseenter: function(){
        highlightColumnHeader($($(this).children()[0]));
        highlightRowLabel($($(this).children()[0]));
        highlightColumn($(this));
        highlightRow($(this));
    },
    mouseleave: function(){
        removeHighlights();
    }
}, ".pref-calendar-pref-wrapper");


// Mouseover column highlighting for pref calendar
function highlightColumnHeader(pref_cell){
    $(".pref-calendar-title").each(function(){
        if ($(this).attr("data-date") == pref_cell.data("date")){
            $(this).addClass("highlight-grid-cell");
        };
    });
};

function highlightColumn(pref_cell_wrapper){
    pref_cell_wrapper.parent().addClass('highlight-grid-cell');
};

function highlightRow(pref_cell_wrapper){
    $(".pref-calendar-pref").filter(function () {
        return $(this).data("emp-name") == $(pref_cell_wrapper.children()[0]).data("emp-name");
    }).each(function(){
        $(this).parent().addClass("highlight-grid-cell");
    });
};

// Mouseover row highlighting for pref calendar
function highlightRowLabel(pref_cell){
    $(".pref-calendar-name-label").each(function(){
        if ($(this).text() == pref_cell.data("emp-name")){
            $(this).addClass("highlight-grid-cell");
        };
    });
};

function removeHighlights(){
    $(".highlight-grid-cell").removeClass("highlight-grid-cell");
};

function renderShiftPrefModal(){

    // Make the header block
    let header = renderModalHeader($(this));

    // Make the table body
        // rows = shifts, role/start/end to left, smile/frown buttons to right
            //make sure scrolling / overflow works in an ok way

    // Make a button to click in and view all of an emps prefs
}

function renderModalHeader(pref_calendar_cell){
    let header = $("<div />").addClass("pref-modal-header");
    let name_cell = $("<div />").addClass("pref-modal-header-name")
                                .text(pref_calendar_cell.data("emp-name"));
    let date_cell = $("<div />").addClass("pref-modal-header-date")
                                .text(pref_calendar_cell.data("date"));
    let available_cell = $("<div />").addClass("pref-modal-header-available")
                                     .text("Available");

    header.append(name_cell);
    header.append(date_cell);
    header.append(available_cell);
    header.append(renderAvailabilityButtons(pref_calendar_cell));

    return header
};

function renderAvailabilityButtons(pref_calendar_cell){
    let button_container = $("<div />").addClass("pref-modal-header-button-container");
    let available_button = $("<button />").addClass("btn btn-success pref-modal-header-yes-btn")
                                          .prop("type", "button")
                                          .text("Yes");
    let unavailable_button = $("<button />").addClass("btn btn-danger pref-modal-header-no-btn")
                                            .prop("type", "button")
                                            .text("Yes");
    button_container.append(available_button).append(unavailable_button);
    return button_container
};

function viewShifts() {
    // variables
    let emp_name = $(this).data("emp-name")
    let date = $(this).data("date")
    let all_info = $(this).data("all-info")
    let prefs = $(this).data("prefs")
    let emp_id = $(this).data("emp-id")
    let roles = Object.keys(all_info)
    let outerButton = $(this)
    console.log(all_info)
    console.log(prefs)

    // title elements
    let main_div = document.createElement("div")
    let title_div = document.createElement("div")
    let toggle_div = document.createElement("div")
    let name_p = document.createElement("p")
    let date_p = document.createElement("p")
    let pref_availability = document.createElement("input")

    // building title functionality
    $(main_div).addClass("row")

    $(toggle_div).addClass("col-md-5")
    $(pref_availability).prop("type", "checkbox")
    //$(pref_availability).attr("id", "pref-availability")
    $(pref_availability).attr("data-toggle", "toggle")
    if (prefs["status"] == "Available") {
        $(pref_availability).prop('checked', true)
    }
    else {
        $(pref_availability).prop('checked', false)
    }

    $(toggle_div).append(pref_availability)

    $(title_div).addClass("col-md-7")
    $(name_p).text(emp_name).css("margin-bottom", "0")
    $(date_p).text(date).css("margin-bottom", "0").css("font-size", "13px")

    $(title_div).append(name_p)
    $(title_div).append(date_p)

    $(main_div).append(title_div)
    $(main_div).append(toggle_div)

    // building body content
    $("#view-shifts-modal-table-body").empty()

    let counter = 1
    for (i = 0; i < roles.length; i++) {
        for (j = 0; j < all_info[roles[i]].length; j++) {
            //eligible_employees = $(".emp-shift-prefs").find("#" + all_info[roles[i]][j]["_id"]).data("eligible")
            shift_id = all_info[roles[i]][j]["_id"]
            if (eligible_employees[shift_id].includes(emp_id)) {

                let tr = document.createElement("tr")
                let pref_td = document.createElement("td")
                let role_td = document.createElement("td")
                let start_td = document.createElement("td")
                let end_td = document.createElement("td")
                let pref_img = document.createElement("img")

                console.log(outerButton.find("svg:nth-child(" + counter + ")"))
                console.log(outerButton.find("svg:nth-child(" + counter + ")").hasClass("circle-icon-not-prefer"))
                if (outerButton.find("svg:nth-child(" + counter + ")").hasClass("circle-icon-not-prefer")) {
                    $(pref_img).addClass("far fa-meh").css("color", "#ffa900")
                }
                if (outerButton.find("svg:nth-child(" + counter + ")").hasClass("circle-icon-prefer")) {
                    $(pref_img).addClass("far fa-smile").css("color", "green")
                }

                $(pref_td).append(pref_img)

                $(role_td).text(roles[i])
                $(start_td).text(all_info[roles[i]][j]["start"])
                $(end_td).text(all_info[roles[i]][j]["end"])

                $(tr).append(pref_td)
                $(tr).append(role_td)
                $(tr).append(start_td)
                $(tr).append(end_td)

                $(tr).data("emp_id", emp_id)
                $(tr).data("date", date)
                $(tr).data("shift-id", shift_id)
                $(tr).data("outer-button", outerButton)
                $(tr).data("row-index", counter)

                $(tr).on("click", togglePrefs)

                $("#view-shifts-modal-table-body").append(tr)

                counter++
            }
        }
    }

    // toggling availability status
    $(pref_availability).change(function () {
        if ($(this).is(":checked")) {
            $("#view-shifts-jBox .jBox-title").css("background", "green").css("color", "#fff")
            $("#view-shifts-modal-table").removeClass("greyed-out")
            $("#view-shifts-modal-table svg").removeClass("greyed-out")
            let data = {"status": "Available",
                        "emp_id": emp_id,
                        "schedule_id": schedule_id,
                        "date": date}
            $.ajax({
                type: "POST",
                url: "/update_pref",
                data: JSON.stringify(data),
                contentType: 'application/json;charset=UTF-8',
                dataType: "json",
            })
            prefs["status"] = "Available"
            outerButton.removeClass("pref-available").removeClass("pref-unavailable").removeClass("pref-empty")
            outerButton.addClass("pref-available")

            let counter = 1;
            $("#view-shifts-modal-table-body tr").each(function () {
                console.log($(this).find("td:first-child"))
                console.log($(this).find("td:first-child").hasClass("fa-meh"))
                if ($(this).find("td:first-child svg").hasClass("fa-meh")) {
                    console.log("IN IF MY DUDE")
                    outerButton.find(".pref-text:nth-child(" + counter + ")").css("color", "yellow")
                }
                else {
                    console.log("IN ELSE MY DUDE")
                    outerButton.find(".pref-text:nth-child(" + counter + ")").css("color", "green")
                }
                counter++
            })
        }
        if (!$(this).is(":checked")) {
            $("#view-shifts-jBox .jBox-title").css("background", "red").css("color", "#fff")
            $("#view-shifts-modal-table").addClass("greyed-out")
            $("#view-shifts-modal-table svg").addClass("greyed-out")
            let data = {"status": "Unavailable",
                        "emp_id": emp_id,
                        "schedule_id": schedule_id,
                        "date": date}
            $.ajax({
                type: "POST",
                url: "/update_pref",
                data: JSON.stringify(data),
                contentType: 'application/json;charset=UTF-8',
                dataType: "json",
            })
            prefs["status"] = "Unavailable"
            outerButton.removeClass("pref-available").removeClass("pref-unavailable").removeClass("pref-empty")
            outerButton.addClass("pref-unavailable")
            outerButton.find(".pref-text").css("color", "red")
        }
    })

    viewShiftsModal.setTitle($(main_div)).setContent($("#view-shifts-modal-body"));

    // changing header background color based on availability
    if (prefs["status"] == "Available") {
        $("#view-shifts-jBox .jBox-title").css("background", "green").css("color", "#fff")
        $("#view-shifts-modal-table").removeClass("greyed-out")
    }
    else if (prefs["status"] == "Unavailable") {
        $("#view-shifts-jBox .jBox-title").css("background", "red").css("color", "#fff")
        $("#view-shifts-modal-table").addClass("greyed-out")
        $("#view-shifts-modal-table .fa-meh").addClass("greyed-out")
    }
    else {
        $("#view-shifts-jBox .jBox-title").css("background", "#808080").css("color", "#fff")
        $("#view-shifts-modal-table").addClass("greyed-out")
        $("#view-shifts-modal-table .fa-meh").addClass("greyed-out")
    }

    viewShiftsModal.open({target: $(this)})
}

function togglePrefs() {
    let outerButton = $(this).data("outer-button")
    console.log(outerButton)
    let hasMeh = $(this).find("svg").hasClass("fa-meh")
    let row_index = $(this).data("row-index")
    $(this).find("svg").remove()
    if (hasMeh) {
        let pref_img = document.createElement("img")
        $(pref_img).addClass("far fa-smile").css("color", "green")
        $(this).find("td").first().append(pref_img)
        let data = {"emp_id": $(this).data("emp_id"),
                    "schedule_id": schedule_id,
                    "date": $(this).data("date"),
                    "pref": 5,
                    "shift_id": $(this).data("shift-id")}
        $.ajax({
            type: "POST",
            url: "/update_shift_pref",
            data: JSON.stringify(data),
            contentType: 'application/json;charset=UTF-8',
            dataType: "json",
        })
        console.log(row_index)
        outerButton.find("svg:nth-child(" + row_index + ")").css("color", "green").removeClass("circle-icon-not-prefer").addClass("circle-icon-prefer")
    }
    else {
        let pref_img = document.createElement("img")
        $(pref_img).addClass("far fa-meh").css("color", "#ffa900")
        $(this).find("td").first().append(pref_img)
        let data = {"emp_id": $(this).data("emp_id"),
                    "schedule_id": schedule_id,
                    "date": $(this).data("date"),
                    "pref": 1,
                    "shift_id": $(this).data("shift-id")}
        $.ajax({
            type: "POST",
            url: "/update_shift_pref",
            data: JSON.stringify(data),
            contentType: 'application/json;charset=UTF-8',
            dataType: "json",
        })
        outerButton.find("svg:nth-child(" + row_index + ")").css("color", "yellow").removeClass("circle-icon-prefer").addClass("circle-icon.not-prefer")
    }
}

function getPrefCalendarData(data) {
    roles = []
    days = data["days"]
    shifts = data["shifts"]
    employees = data["employees"]

    for (i = 0; i < shifts.length; i++) {
        if (roles.includes(shifts[i]["role"]) == false) {
            roles.push(shifts[i]["role"])
        }
    }
    prefs = {}

    for (i = 0; i < days.length; i++) {
        temp_roles = {}
        for (k = 0; k < roles.length; k++) {
            day_shifts = []
            for (j = 0; j < shifts.length; j++) {
                if (shifts[j]["date"] == days[i] && shifts[j]["role"] == roles[k]) {
                    day_shifts.push(shifts[j])
                }
            }
            if (day_shifts.length != 0) {
                temp_roles[roles[k]] = day_shifts
            }
        }
        prefs[days[i]] = temp_roles
    }
    return prefs
}

function dateToString(date) {
    var date_array = date.split("/");
    date_array[0] = Number(date_array[0])
    var month_array = ["January",
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
    return month_array[date_array[0] - 1] + " " + date_array[1] + ", " + date_array[2]
};

function dateToAbbreviatedString(date) {
    var date_array = date.split("/");
    date_array[0] = Number(date_array[0])
    var month_array = ["Jan.",
                       "Feb.",
                       "Mar.",
                       "Apr.",
                       "May",
                       "Jun.",
                       "Jul.",
                       "Aug.",
                       "Sept.",
                       "Oct.",
                       "Nov.",
                       "Dec."]
    return month_array[date_array[0] - 1] + " " + date_array[1]
};