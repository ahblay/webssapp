var schedule_id = $("#employee-prefs-tab").data("schedule-id")
var selected_user_id = 'initial assignment'
var employee_names = {}
var shift_dict = {}
var pref_dict = {}
var last_tab = null

// no longer necessary due to the fact that prefs table is generated when the prefs tab is selected
/*
$(function () {
    schedule_id = $("#employee-prefs-tab").data("schedule-id")
    console.log(schedule_id)
    $.getJSON("/api/get_schedule/" + schedule_id, success= function(data) {
        console.log(data);
        renderEmpTable(data)
        renderShiftPrefsTable(data)
    });

    //$.getJSON("/api/get_schedule/" + schedule_id, renderEmpTable)
    //$.getJSON("/_api/get_shifts/" + schedule_id, renderShiftPrefsTable)
})
*/

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

    // days row
    employees = data["employees"]
    let pref_calendar_labels = document.createElement("div")
    $(pref_calendar_labels).addClass("pref-calendar-labels")
    let pref_calendar_day_label = document.createElement("div")
    $(pref_calendar_day_label).addClass("pref-calendar-label").text("Days:")
    $(pref_calendar_labels).append(pref_calendar_day_label)
    let pref_calendar_role_label = document.createElement("div")
    $(pref_calendar_role_label).addClass("pref-calendar-label").text("Roles:")
    $(pref_calendar_labels).append(pref_calendar_role_label)
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
        $(pref_calendar_day_title).addClass("pref-calendar-title").text(days[i])
        $(pref_calendar_day).append(pref_calendar_day_title)

        let pref_calendar_roles = document.createElement("div")
        $(pref_calendar_roles).addClass("pref-calendar-roles")

        for (j = 0; j < Object.keys(pref_calendar_data[days[i]]).length; j++) {
            let pref_calendar_role = document.createElement("div")
            $(pref_calendar_role).addClass("pref-calendar-role")

            let pref_calendar_role_title = document.createElement("div")
            $(pref_calendar_role_title).addClass("pref-calendar-title").text(Object.keys(pref_calendar_data[days[i]])[j].slice(0, 3) + ".")
            $(pref_calendar_role).append(pref_calendar_role_title)

            let pref_calendar_all_prefs = document.createElement("div")
            $(pref_calendar_all_prefs).addClass("pref-calendar-all-prefs")

            for (k = 0; k < pref_calendar_data[days[i]][Object.keys(pref_calendar_data[days[i]])[j]].length; k++) {
                let pref_calendar_prefs = document.createElement("div")
                $(pref_calendar_prefs).addClass("pref-calendar-prefs")

                for (l = 0; l < employees.length; l ++) {
                    emp_id = employees[l]["_id"]
                    shift_id = pref_calendar_data[days[i]][Object.keys(pref_calendar_data[days[i]])[j]][k]["_id"]

                    let pref_calendar_pref = document.createElement("div")
                    $(pref_calendar_pref).addClass("pref-calendar-pref").addClass("popup")

                    let pop_up_window = document.createElement("span")
                    $(pop_up_window).addClass("popuptext").text("<p><b>Start: </b>4:15</p>").text("<p><b>End: </b>6:15</p>")

                    if (Object.keys(data['prefs']).length === 0) {
                        $(pref_calendar_pref).addClass("pref-empty")
                        $(pref_calendar_pref).data("current-pref", "pref-empty")
                    } else if (!Object.keys(data['prefs']).includes(emp_id)) {
                        $(pref_calendar_pref).addClass("pref-empty")
                        $(pref_calendar_pref).data("current-pref", "pref-empty")
                    } else if (!Object.keys(data['prefs'][emp_id]).includes(shift_id)) {
                        $(pref_calendar_pref).addClass("pref-empty")
                        $(pref_calendar_pref).data("current-pref", "pref-empty")
                    } else if (data["prefs"][emp_id][shift_id] == -1000) {
                        $(pref_calendar_pref).addClass("pref-unavailable")
                        $(pref_calendar_pref).data("current-pref", "pref-unavailable")
                    } else if (data["prefs"][emp_id][shift_id] == 1) {
                        $(pref_calendar_pref).addClass("pref-available")
                        $(pref_calendar_pref).data("current-pref", "pref-available")
                    } else if (data["prefs"][emp_id][shift_id] == 5) {
                        $(pref_calendar_pref).addClass("pref-prefer")
                        $(pref_calendar_pref).data("current-pref", "pref-prefer")
                    } else {
                        $(pref_calendar_pref).addClass("pref-empty")
                        $(pref_calendar_pref).data("current-pref", "pref-empty")
                    }

                    $(pref_calendar_pref).on("click", togglePrefs)
                    $(pref_calendar_pref).hover(loadPopup)

                    $(pref_calendar_pref).append(pop_up_window)
                    $(pref_calendar_prefs).append(pref_calendar_pref)
                }

                $(pref_calendar_all_prefs).append(pref_calendar_prefs)
            }

            $(pref_calendar_role).append(pref_calendar_all_prefs)
            $(pref_calendar_roles).append(pref_calendar_role)
        }

        $(pref_calendar_day).append(pref_calendar_roles)
        $(pref_calendar_content).append(pref_calendar_day)
    }

    $(".pref-calendar").append(pref_calendar_content)

};

function togglePrefs() {
    let pref_options = ["pref-unavailable", "pref-available", "pref-prefer", "pref-empty"]
    let current_pref = $(this).data("current-pref")
    $(this).removeClass(current_pref)
    let index = pref_options.indexOf(current_pref)
    new_pref = pref_options[(index + 1) % pref_options.length]
    $(this).data("current-pref", new_pref)
    $(this).addClass(new_pref)
}

function loadPopup() {
    $(this).find(".popuptext").toggleClass("show");
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