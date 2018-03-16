$(function () {
    $.getJSON("/_api/get_employees", renderEmpTable)
    $.getJSON("/_api/get_shifts", renderShiftPrefsTable)
})

function renderEmpTable(data) {
    for (i = 0; i < data.length; i++) {
        createRow(".emp-prefs", data[i]["name"], data[i]["_id"])
    }
}

function renderShiftPrefsTable(data) {
    shifts = data[0]
    employees = data[1]
    for (i = 0; i < Object.keys(shifts).length; i++) {
        createDayShiftPrefs(".emp-shift-prefs", shifts[Object.keys(shifts)[i]], Object.keys(shifts)[i], employees)
    }
}

function createRow(attribute, name, id) {
    let row = document.createElement("tr");

    let nameCell = document.createElement("td");
    $(nameCell).attr("class", "employee")
    $(nameCell).attr("data-id", id)
    $(nameCell).append("<b>" + name + "</b>")
    row.append(nameCell)

    $(attribute).append(row)
}

function createDayShiftPrefs(attribute, shift, start, employees) {
    let date_row = document.createElement("tr");
    date_cell = document.createElement("td");
    $(date_cell).attr("colspan", "5")
    $(date_cell).append("<b>" + dateToString(start) + "</b>")
    $(date_row).append(date_cell)
    $(attribute).append(date_row)
    console.log(employees)

    for (j = 0; j < Object.entries(shift).length; j++) {

        let shift_row = document.createElement("tr");
        $(shift_row).attr("style", "display: none;")

        //marks shifts with the ids of employees eligible to work them
        let eligible_employees = []
        for (k = 0; k < employees.length; k++) {
            console.log(employees[k])
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
        $(shift_name).append(Object.entries(shift)[j][0]);
        $(shift_row).append(shift_name)

        //role
        let shift_role = document.createElement("td");
        $(shift_role).append(Object.entries(shift)[j][1]["role"])
        $(shift_row).append(shift_role)

        //unavailable button
        let unavailable = $('<button/>',
            {
                type: "button",
                class: "btn btn-danger",
                text: 'Unavailable',
            });

        unavailable_cell = document.createElement("td");
        $(unavailable_cell).append(unavailable);
        $(shift_row).append(unavailable_cell);

        //available button
        let available = $('<button/>',
            {
                type: "button",
                class: "btn btn-warning",
                text: 'Available',
            });

        available_cell = document.createElement("td");
        $(available_cell).append(available);
        $(shift_row).append(available_cell);

        //prefer button
        let prefer = $('<button/>',
            {
                type: "button",
                class: "btn btn-success",
                text: 'Prefer',
            });

        prefer_cell = document.createElement("td");
        $(prefer_cell).append(prefer);
        $(shift_row).append(prefer_cell);

        $(attribute).append(shift_row)
    }
}

function showEmployeeShifts(id) {
    $(".emp-shift-prefs tr").each(function () {
        if ($(this).attr("data-eligible") != undefined) {
            eligible_employees = $(this).data("eligible")
            console.log(eligible_employees)
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

$(document).on("click", ".employee", function () {
    id = $(this).data("id")
    console.log(id)
    $(".emp-prefs-table").attr("style", "display: none;")
    $(".emp-shift-prefs-table").css("display", "table")
    showEmployeeShifts(id)
})