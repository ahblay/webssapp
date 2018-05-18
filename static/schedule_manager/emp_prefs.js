var schedule_id = $("#employee-prefs-tab").data("schedule-id")
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
                if (employees[k]["roles"][l] == shifts[j]['role']) {
                    eligible_employees_shift.push(employees[k]['_id'])
                }
            }
        }
        eligible_employees[shifts[j]["_id"]] = eligible_employees_shift
    }

    // days row
    let pref_calendar_labels = document.createElement("div")
    $(pref_calendar_labels).addClass("pref-calendar-labels")
    let pref_calendar_day_label = document.createElement("div")
    $(pref_calendar_day_label).addClass("pref-calendar-label").text("Days:")
    $(pref_calendar_labels).append(pref_calendar_day_label)
    for (i = 0; i < employees.length; i ++) {
        let pref_calendar_name_label = document.createElement("div")
        $(pref_calendar_name_label).addClass("pref-calendar-name-label").text(employees[i]["name"])
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
                for (k = 0; k < Object.keys(pref).length - 2; k++) {
                    let pref_text = document.createElement("p")
                    $(pref_text).addClass("pref-text")
                    $(pref_text).addClass("fa fa-circle").css("color", "grey")
                    $(pref_calendar_pref).append(pref_text)
                }
            }
            else if (day["status"] == "Available") {
                $(pref_calendar_pref).addClass("pref-available")
                for (k = 0; k < Object.keys(pref).length - 2; k++) {
                    let pref_text = document.createElement("p")
                    $(pref_text).addClass("pref-text")
                    $(pref_text).addClass("fa fa-circle").css("color", "green")
                    $(pref_calendar_pref).append(pref_text)
                }
            }
            else if (day["status"] == "Unavailable") {
                $(pref_calendar_pref).addClass("pref-unavailable")
                for (k = 0; k < Object.keys(pref).length - 2; k++) {
                    let pref_text = document.createElement("p")
                    $(pref_text).addClass("pref-text")
                    $(pref_text).addClass("fa fa-circle").css("color", "red")
                    $(pref_calendar_pref).append(pref_text)
                }
            }


            /*
            if (eligible_employees.includes(emp_id)) {
                $(pref_calendar_pref).prepend(expand_icon)
            }
            if (!eligible_employees.includes(emp_id)) {
                $(pref_calendar_pref).addClass("pref-ineligible")
            }
            else if (Object.keys(data['prefs']).length === 0) {
                $(pref_calendar_pref).addClass("pref-empty")
                $(pref_text).text("Empty")
                $(pref_calendar_pref).data("current-pref", "pref-empty")
            } else if (!Object.keys(data['prefs']).includes(emp_id)) {
                $(pref_calendar_pref).addClass("pref-empty")
                $(pref_text).text("Empty")
                $(pref_calendar_pref).data("current-pref", "pref-empty")
            } else if (!Object.keys(data['prefs'][emp_id]).includes(shift_id)) {
                $(pref_calendar_pref).addClass("pref-empty")
                $(pref_text).text("Empty")
                $(pref_calendar_pref).data("current-pref", "pref-empty")
            } else if (data["prefs"][emp_id][shift_id] == -1000) {
                $(pref_calendar_pref).addClass("pref-unavailable")
                $(pref_text).text("Unavailable")
                $(pref_calendar_pref).data("current-pref", "pref-unavailable")
            } else if (data["prefs"][emp_id][shift_id] == 1) {
                $(pref_calendar_pref).addClass("pref-available")
                $(pref_text).text("Available")
                $(pref_calendar_pref).data("current-pref", "pref-available")
            } else if (data["prefs"][emp_id][shift_id] == 5) {
                $(pref_calendar_pref).addClass("pref-prefer")
                $(pref_text).text("Prefer")
                $(pref_calendar_pref).data("current-pref", "pref-prefer")
            } else {
                $(pref_calendar_pref).addClass("pref-empty")
                $(pref_calendar_pref).data("current-pref", "pref-empty")
            }
            */

            $(pref_calendar_pref).on("click", viewShifts)

            $(pref_calendar_prefs).append(pref_calendar_pref)
        }

        $(pref_calendar_all_prefs).append(pref_calendar_prefs)

        $(pref_calendar_day).append(pref_calendar_all_prefs)
        $(pref_calendar_content).append(pref_calendar_day)
    }

    $(".pref-calendar").append(pref_calendar_content)

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
            outerButton.find(".pref-text").css("color", "green")
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

                if (prefs[shift_id] == 1) {
                    $(pref_img).addClass("far fa-meh").css("color", "#ffa900")
                }
                if (prefs[shift_id] == 5) {
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
        outerButton.find("svg:nth-child(" + row_index + ")").css("color", "green")
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
        outerButton.find("svg:nth-child(" + row_index + ")").css("color", "yellow")
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

/*
function renderShiftPrefsTable(data) {
    shifts_by_day = get_shifts_by_day(data['shifts']);
    employees = data['employees'];

    for (i = 0; i < shifts_by_day.length; i++) {
        createDayShiftPrefs(".emp-shift-prefs", shifts_by_day[i], shifts_by_day[i][0]['date'], employees);
    }
};

function get_shifts_by_day(shifts){

    let days = [];

    for (i=0; i<shifts.length; i++){
        if (!(days.includes(shifts[i]['date']))){
            days.push(shifts[i]['date']);
        };
    };

    console.log(days)

    shifts_by_day = []
    for (i=0; i<days.length; i++){
        daily_shifts = []
        for(shift=0; shift<shifts.length; shift++){
            if (shifts[shift]['date'] == days[i]){
                daily_shifts.push(shifts[shift])
            };
        };
        shifts_by_day.push(daily_shifts);
    };

    return shifts_by_day
};


function createRow(attribute, name, id) {
    let row = document.createElement("tr");

    let nameCell = document.createElement("td");
    $(nameCell).css("border-top", "1px solid")
    $(nameCell).attr("class", "employee")
    $(nameCell).attr("data-id", id)
    $(nameCell).append(name)
    row.append(nameCell)

    $(attribute).append(row)
}

function createDayShiftPrefs(attribute, shifts, start, employees) {
    console.log(shifts)

    let date_row = document.createElement("tr");
    $(date_row).addClass("table-active")
    date_cell = document.createElement("td");
    $(date_cell).css("border-top", "1px solid")
    $(date_cell).attr("colspan", "5")
    $(date_cell).append("<b>" + dateToString(start) + "</b>")
    $(date_row).append(date_cell)
    $(attribute).append(date_row)

    for (j = 0; j < shifts.length; j++) {

        let shift_row = document.createElement("tr");
        $(shift_row).css("display", "none")

        //marks shifts with the ids of employees eligible to work them
        let eligible_employees = []
        for (k = 0; k < employees.length; k++) {
            for (l = 0; l < employees[k]["roles"].length; l++) {
                console.log()
                if (employees[k]["roles"][l] == shifts[j]['role']) {
                    eligible_employees.push(employees[k]['_id'])
                }
            }
        }
        $(shift_row).attr("data-eligible", JSON.stringify(eligible_employees))
        $(shift_row).attr("id", shifts[j]["_id"])

        //shift name
        let shift_name = document.createElement("td");
        $(shift_name).css("border-top", "1px solid")
        $(shift_name).append(shifts[j]['name']);
        $(shift_row).append(shift_name)

        //role
        let shift_role = document.createElement("td");
        $(shift_role).css("border-top", "1px solid")
        $(shift_role).append(shifts[j]['role'])
        $(shift_row).append(shift_role)

        //unavailable button
        let unavailable = $('<input/>',
            {
                type: "radio",
            });
        let unavailable_label = $('<label/>',
            {
                class: "btn btn-outline-dark",
                "data-shift-id": shifts[j]['_id'],
                click: preferenceSelect,
            });
        $(unavailable_label).append(unavailable);
        $(unavailable_label).append("Unavailable");

        //available button
        let available = $('<input/>',
            {
                type: "radio",
            });
        let available_label = $('<label/>',
            {
                class: "btn btn-outline-dark",
                "data-shift-id": shifts[j]['_id'],
                click: preferenceSelect,
            });
        $(available_label).append(available);
        $(available_label).append("Available");

        //prefer button
        let prefer = $('<input/>',
            {
                type: "radio",
            });
        let prefer_label = $('<label/>',
            {
                class: "btn btn-outline-dark",
                "data-shift-id": shifts[j]['_id'],
                click: preferenceSelect,
            });
        $(prefer_label).append(prefer);
        $(prefer_label).append("Prefer");

        //radio button group
        let btn_group = $('<div/>',
            {
                class: 'btn-group btn-group-toggle',
                "data-toggle": 'buttons',
                style: "display: flex;",
            });

        btn_group.append(unavailable_label);
        btn_group.append(available_label);
        btn_group.append(prefer_label);
        btn_group_cell = document.createElement("td");
        $(btn_group_cell).addClass("text-center")
        $(btn_group_cell).css("border-top", "1px solid")
        $(btn_group_cell).append(btn_group);
        $(shift_row).append(btn_group_cell);

        $(attribute).append(shift_row)
    }
};

function preferenceSelect() {
    shift_id = $(this).data("shift-id")

    if ($(this).text() == "Unavailable") {
        shift_dict[shift_id] = -1000
    }
    if ($(this).text() == "Available") {
        shift_dict[shift_id] = 1
    }
    if ($(this).text() == "Prefer") {
        shift_dict[shift_id] = 5
    }

    //updates pref_dict without overwriting
    if (pref_dict[selected_user_id] != undefined) {
        pref_dict[selected_user_id][shift_id] = shift_dict[shift_id]
    } else {
        pref_dict[selected_user_id] = shift_dict
    }
}

function showEmployeeShifts(id) {
    $(".emp-shift-prefs tr").each(function () {
        if ($(this).attr("data-eligible") != undefined) {
            $(this).css("display", "none")
            eligible_employees = $(this).data("eligible")
            for (i = 0; i < eligible_employees.length; i++) {
                if (eligible_employees[i] == id) {
                    $(this).css("display", "table-row")
                }
            }
        }
    })
};
*/

/*
function resetPrefButtons () {
    $(".emp-shift-prefs tr").find(".btn.btn-outline-dark.active").removeClass("active")
};

function assignPrefButtons (initial_prefs) {
    //stores db preferences locally as a global variable and toggles corresponding pref buttons
    pref_dict = initial_prefs
    let buttons = $(".emp-shift-prefs tr").find(".btn.btn-outline-dark")
    for (i = 0; i < buttons.length; i++) {
        shift_id = buttons[i].dataset["shiftId"]
        if (initial_prefs[selected_user_id] != undefined) {
            if (initial_prefs[selected_user_id][shift_id] == -1000 && $(buttons[i]).text() == "Unavailable") {
                $(buttons[i]).addClass("active")
            }
            if (initial_prefs[selected_user_id][shift_id] == 1 && $(buttons[i]).text() == "Available") {
                $(buttons[i]).addClass("active")
            }
            if (initial_prefs[selected_user_id][shift_id] == 5 && $(buttons[i]).text() == "Prefer") {
                $(buttons[i]).addClass("active")
            }
        }
    }
};

function renderEmpSelectTabs(employees){

    console.log("Rendering #emp-prefs-tab-select.")

    tab_select = $("#emp-prefs-tab-select");

    for (emp=0;emp<employees.length;emp++){
        let tab = $('<button/>');

        tab.text(employees[emp]['name']);
        tab.addClass("btn-secondary emp-prefs-select-emp-tab no-hover");
        tab.attr("data-_id", employees[emp]["_id"]);

        console.log(tab);
        tab_select.append(tab);
    };

    if (last_tab != null){
        selectTab(last_tab);
    };
};

function selectTab(tab_data_id){
    $(document).ready(function (){
        $(".emp-prefs-select-emp-tab[data-_id='" + tab_data_id + "']")[0].click();
    });
};

$(document).on("click", ".emp-prefs-select-emp-tab", function () {
    _id = $(this).attr("data-_id");
    last_tab = _id;
    $('.emp-prefs-select-emp-tab').removeClass('selected-emp-tab');
    $(this).addClass('selected-emp-tab');
    selected_user_id = _id;
    $(".emp-shift-prefs-table").css("display", "table");
    $("#pref-options").css("display", "block");
    showEmployeeShifts(_id);
    resetPrefButtons();

    console.log(".emp-prefs-select-emp-tab clicked on")

    $.getJSON("/_api/get_prefs/" + schedule_id, assignPrefButtons);
});

$(document).on("click", "#save-prefs", function () {
    prefs = {"_id": schedule_id, "pref_data": pref_dict, "employee": selected_user_id};
    console.log("Sending prefs to server.")
    $.ajax({
        type: "POST",
        url: "/save_pref_data",
        data: JSON.stringify(prefs),
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
    }).done(function(){
        $("#save-prefs-success").show();
        setTimeout(function(){
            $("#save-prefs-success").fadeOut("250");
        }, 750);
    }).fail(function(jqXHR, status, error){
        alert(status + ": " + error);
    });
});
*/