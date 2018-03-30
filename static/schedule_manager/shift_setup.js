console.log("shift_setup.js is running.")

var schedule_id = "default assignment";
var schedule_dates = "default assignment";
var master_roles = []

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
    $.getJSON("/api/get_shift_data/" + schedule_dates[0].replace(/\//g, "") + "/" + schedule_id, renderShiftTable)
})

function getRoles(data) {
    for (i = 0; i < data.length; i++) {
        master_roles.push(data[i]["name"])
    }
}

function renderShiftTable(data) {
    console.log(data)
    //if statement because jsonify error message is used as data to create a row
    if (Object.keys(data)[0] !== "jsonify") {
        for (let i = 0; i < Object.keys(data).length; i++) {
            create_row(".shift-table-body", Object.keys(data)[i], data[Object.keys(data)[i]])
        }
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
    if (typeof(shift) === "undefined") shift = {"start": "", "end": "", "num_employees": "", "role": ""};

    let row = document.createElement("tr");

    //shift name
    let nameCell = document.createElement("td");
    $(nameCell).css("border-top", "1px solid")
    let nameField = document.createElement("input");
    if (name != "") {
        $(nameField).attr("value", name);
    }
    nameCell.append(nameField);
    row.append(nameCell);

    //manage start time dropdown
    let startTime = document.createElement("td");
    $(startTime).css("border-top", "1px solid")
    let startHourOptions = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
    let startSelect = document.createElement("select");


    for (let i=0; i < startHourOptions.length; i++) {
        let option = document.createElement("option");
        option.value = startHourOptions[i];
        option.text = startHourOptions[i];
        if (startHourOptions[i] == shift["start"]) {
            $(option).prop("selected", true);
        }
        startSelect.appendChild(option);
    };

    startTime.append(startSelect);
    row.append(startTime);

    //manage end time dropdown
    let endTime = document.createElement("td");
    $(endTime).css("border-top", "1px solid")
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
    $(length).css("border-top", "1px solid")
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
    $(attribute).append(row);
};

var counter = 1

function collectShiftData () {
    var shift_data = [];
    $(".shift-table-body tr").each(function () {
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

$(document).on("click", "#add-shift", function () {
    console.log('Adding shift.')
    create_row(".shift-table-body")
});

$(document).on("click", "#save-shifts", function () {
    var allDates = createDates(schedule_dates)
    var current = $("#date").text()
    var i = getIndexOf(allDates, current)
    console.log(allDates)
    console.log(i)
    console.log(current)
    date = allDates[i][1]
    console.log(date)
    shift_data = {"_id": schedule_id, "shift_data": collectShiftData(), "date": date}
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

function getIndexOf(arr, k) {
    for (var i = 0; i < arr.length; i++) {
        var index = arr[i].indexOf(k);
        if (index > -1) {
          return i;
        }
    }
}

$(document).on("click", "#page-right", function(){
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
