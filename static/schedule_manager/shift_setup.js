console.log("shift_setup.js is running.")

var schedule_id = "default assignment";
var schedule_dates = "default assignment";

$(function () {
    schedule_id = $("#shift-setup-tab").data("schedule-id")
    schedule_dates = $("#shift-setup-tab").data("schedule-dates")
    $.getJSON("/api/get_shift_data/" + schedule_id, renderShiftTable)
})

function renderShiftTable(data) {
    console.log(data)
    for (let i = 0; i < Object.keys(data).length; i++) {
        create_row("tbody", Object.keys(data)[i], data[Object.keys(data)[i]])
    }
}

function createDates(dates) {
    var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
    list = dates.split(" ")
    var allDates = new Array();
    var start = new Date(list[0])
    var end = new Date(list[1])
    var currentDate = start;

    console.log(allDates)
    console.log(weekday[start.getDay()])

}

/*
$(function () {
    createDates(schedule_dates)
})
*/

function create_row(attribute, name, shift){
    if (typeof(name) === 'undefined') name = "";
    if (typeof(shift) === "undefined") shift = {"start": "", "end": "", "num_employees": "", "role": ""};

    let row = document.createElement("tr");

    //shift name
    let nameCell = document.createElement("td");
    let nameField = document.createElement("input");
    if (name != "") {
        $(nameField).attr("value", name);
    }
    nameCell.append(nameField);
    row.append(nameCell);

    //manage start time dropdown
    let startTime = document.createElement("td");
    $(startTime).addClass("text-center")
    let startHourOptions = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
    let startSelect = document.createElement("select");


    for (let i=0; i < startHourOptions.length; i++) {
        let option = document.createElement("option");
        option.value = startHourOptions[i];
        option.text = startHourOptions[i];
        if (startHourOptions[i] == shift["start"]) {
            $(option).prop("selected", true)
        }
        startSelect.appendChild(option);
    };

    startTime.append(startSelect);
    row.append(startTime);

    //manage end time dropdown
    let endTime = document.createElement("td");
    $(endTime).addClass("text-center")
    let endOptions = [10, 11, 12, 1, 2, 3, 4, 5];
    let endSelect = document.createElement("select");

    for (let i=0; i < endOptions.length; i++) {
        let option = document.createElement("option");
        option.value = endOptions[i];
        option.text = endOptions[i];
        if (endOptions[i] == shift["end"]) {
            $(option).prop("selected", true)
        }
        endSelect.appendChild(option);
    };

    endTime.append(endSelect);
    row.append(endTime);

    //determine length
    let length = document.createElement("td");
    length.append($(startSelect).val() - $(endSelect).val())
    $(startSelect).on("change", function () {
        console.log($(startSelect).val())
        $(length).empty()
        length.append($(startSelect).val() - $(endSelect).val())
    })
    $(endSelect).on("change", function () {
        console.log($(startSelect).val())
        $(length).empty()
        length.append($(startSelect).val() - $(endSelect).val())
    })
    row.append(length);

    //select number of employees
    let numberEmps = document.createElement("td");
    $(numberEmps).addClass("text-center")
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

    row.append(roles);
    $(roles).addClass("text-center")
    let roleOptions = ["Boiler", "Ovid", "Scandinavian", "Sauce Designer"];
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
    $(attribute).append(row);
}

var counter = 1

function collectShiftData () {
    var shift_data = [];
    $("tbody tr").each(function () {
        var shift = []
        $(this).children().each(function () {
            if ($(this).find("input").length > 0) {
                shift.push($(this).find("input").val())
            }
            if ($(this).find("select").length > 0) {
                shift.push($(this).find("select").val())
            }
        })
        shift_data.push(shift)
    })
    return shift_data;
}

$("#add-shift").on("click", function () {
    create_row("tbody")
})

$("#save-shifts").on("click", function () {
    shift_data = {"_id": schedule_id, "shift_data": collectShiftData()}
    console.log(shift_data)
    $.ajax({
        type: "POST",
        url: "/save_shift_data",
        data: JSON.stringify(shift_data),
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
    }).done(function(){
        console.log("Sent to server.")
    }).fail(function(jqXHR, status, error){
        alert(status + ": " + error);
    });
});

$("#page-right").on("click", function(){
    console.log("Page right clicked.")
    //$(this).prop('disabled', true);
    $('#page-left').prop('disabled', false);
});
