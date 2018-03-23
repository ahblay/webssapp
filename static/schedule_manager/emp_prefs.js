var schedule_id = 'initial assignment'
var selected_user_id = 'initial assignment'
var employee_names = {}
var shift_dict = {}
var pref_dict = {}

$(function () {
    schedule_id = $("#employee-prefs-tab").data("schedule-id")
    $.getJSON("/_api/get_employees", renderEmpTable)
    $.getJSON("/_api/get_shifts/" + schedule_id, renderShiftPrefsTable)
})

function renderEmpTable(data) {
    for (i = 0; i < data.length; i++) {
        createRow(".emp-prefs", data[i]["name"], data[i]["_id"])
        employee_names[data[i]["_id"]] = data[i]["name"]
    }
}

function renderShiftPrefsTable(data) {
    shifts = data[0]
    employees = data[1]

    console.log(shifts)
    for (i = 0; i < Object.keys(shifts).length; i++) {
        createDayShiftPrefs(".emp-shift-prefs", shifts[Object.keys(shifts)[i]], Object.keys(shifts)[i], employees)
    }
}

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

function createDayShiftPrefs(attribute, shift, start, employees) {
    let date_row = document.createElement("tr");
    $(date_row).addClass("table-active")
    date_cell = document.createElement("td");
    $(date_cell).css("border-top", "1px solid")
    $(date_cell).attr("colspan", "5")
    $(date_cell).append("<b>" + dateToString(start) + "</b>")
    $(date_row).append(date_cell)
    $(attribute).append(date_row)

    for (j = 0; j < Object.entries(shift).length; j++) {

        let shift_row = document.createElement("tr");
        $(shift_row).css("display", "none")

        //marks shifts with the ids of employees eligible to work them
        let eligible_employees = []
        for (k = 0; k < employees.length; k++) {
            for (l = 0; l < employees[k]["roles"].length; l++) {
                console.log()
                if (employees[k]["roles"][l] == Object.entries(shift)[j][1]["role"]) {
                    eligible_employees.push(employees[k]['_id'])
                }
            }
        }
        $(shift_row).attr("data-eligible", JSON.stringify(eligible_employees))

        //shift name
        let shift_name = document.createElement("td");
        $(shift_name).css("border-top", "1px solid")
        $(shift_name).append(Object.entries(shift)[j][0]);
        $(shift_row).append(shift_name)

        //role
        let shift_role = document.createElement("td");
        $(shift_role).css("border-top", "1px solid")
        $(shift_role).append(Object.entries(shift)[j][1]["role"])
        $(shift_row).append(shift_role)

        //unavailable button
        let unavailable = $('<input/>',
            {
                type: "radio",
            });
        let unavailable_label = $('<label/>',
            {
                class: "btn btn-outline-dark",
                "data-shift-id": Object.entries(shift)[j][1]["_id"],
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
                "data-shift-id": Object.entries(shift)[j][1]["_id"],
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
                "data-shift-id": Object.entries(shift)[j][1]["_id"],
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
}

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

    console.log(pref_dict)
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
}

function resetPrefButtons () {
    $(".emp-shift-prefs tr").find(".btn.btn-outline-dark.active").removeClass("active")
}

function assignPrefButtons (initial_prefs) {
    //stores db preferences locally as a global variable and toggles corresponding pref buttons
    pref_dict = initial_prefs
    let buttons = $(".emp-shift-prefs tr").find(".btn.btn-outline-dark")
    for (i = 0; i < buttons.length; i++) {
        shift_id = buttons[i].dataset["shiftId"]
        if (initial_prefs[selected_user_id] != undefined) {
            if (initial_prefs[selected_user_id][shift_id] == -1000 && $(buttons[i]).text() == "Unavailable") {
                $(buttons[i]).addClass("active")
                console.log(pref_dict)
            }
            if (initial_prefs[selected_user_id][shift_id] == 1 && $(buttons[i]).text() == "Available") {
                $(buttons[i]).addClass("active")
                console.log(pref_dict)

            }
            if (initial_prefs[selected_user_id][shift_id] == 5 && $(buttons[i]).text() == "Prefer") {
                $(buttons[i]).addClass("active")
                console.log(pref_dict)
            }
        }
    }
}

$(document).on("click", ".employee", function () {
    id = $(this).data("id")
    selected_user_id = id
    $(".title").text(employee_names[selected_user_id])
    $(".emp-prefs-table").css("display", "none")
    $(".emp-shift-prefs-table").css("display", "table")
    $("#pref-options").css("display", "block")
    showEmployeeShifts(id)
    $.getJSON("/_api/get_prefs/" + schedule_id, assignPrefButtons)
})

$(document).on("click", "#back-button", function () {
    $(".title").text("Employees")
    $(".emp-prefs-table").css("display", "table")
    $(".emp-shift-prefs-table").css("display", "none")
    $("#pref-options").css("display", "none")
    shift_dict = {}
    pref_dict = {}
    resetPrefButtons()
})

$(document).on("click", "#save-prefs", function () {
    prefs = {"_id": schedule_id, "pref_data": pref_dict, "employee": selected_user_id}
    $.ajax({
        type: "POST",
        url: "/save_pref_data",
        data: JSON.stringify(prefs),
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
    }).done(function(){
        console.log("Sent to server.")
    }).fail(function(jqXHR, status, error){
        alert(status + ": " + error);
    });
})