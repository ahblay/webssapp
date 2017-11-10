// passes ordinal date of first Monday (Monday at beginning of schedule)
let initial_day = $("#initial-day").attr("data-day");
let next_week_initial_day = $("#next_week_initial-day").attr("data-day");

// updates table
function refresh_table(date) {
    date = typeof date !== 'undefined' ? date: initial_day;
    fetch("/_get_preferences/" + date)

        // converts response to json
        .then(response => response.json())

        .then((json_pref_table) => {
            // prints table info???
            console.log(json_pref_table);
            // sets dates according to set_dates function
            set_dates(json_pref_table.dates);
            // renders table according to render_pref_table function
            render_pref_table(json_pref_table.pref_table, json_pref_table.dates, json_pref_table.employees);
    });
}

// refreshes table
refresh_table();

// when you click on a option in the "Available/Unavailable" dropdown, the dropdown button changes accordingly
$(".available-dropdown-select").on("click", function () {
    // add data to button: if "available" is selected, available==True; otherwise, available==False
    $("#available-dropdown").data("available", $(this).data("val"))
        // changes button text to "available" or "unavailable"
        .text($(this).data("text"));
});

// when you click "save" in the "add employee" modal, the submitted information is saved and the employee preference
// table is refreshed
$("#add-employee-submit").on("click", function() {
    console.log("hi");
    // posts the modal form data to /_add_employee, where the associated function adds an employee to the table
    $.ajax({
        type: "POST",
        url: "/_add_employee",
        data: {name: $("#add-employee-name-input").val()},
        success: function(json_response) {
            console.log(json_response);
            refresh_table();
        }
    });
});

// takes a list of dates and adds them as column headers in the employees preference table
function set_dates(dates) {
    for (d = 0; d < 7; d++) {
        $("#date-" + d).text(dates[d]);
    }
}

// converts a number from 0 to 23 to 12-hour time (i.e. XX AM/PM)
function hour_to_12_hour(h) {
    if (h == 0) {
        return {hour: 12, half: "AM"};
    }
    else if (h < 12) {
        return {hour: h, half: "AM"};
    }
    else if (h == 12) {
        return {hour: 12, half: "PM"};
    }
    else {
        return {hour: h - 12, half: "PM"};
    }
}

// converts an XX AM/PM pair to a number form 0 to 23
function hour_to_24_hour(h) {
    // if h.half == "AM" then offset = 0, else offset = 12
    let offset = h.half == "AM" ? 0 : 12;
    if (h.hour == 12 && h.half == "AM") {
        offset = -12;
    }
    else if (h.hour == 12 && h.half == "PM") {
        offset = 0;
    }
    return h.hour + offset;
}

// takes dict output of hour_to_12_hour and returns a string
function hour_to_str(h) {
    let t = hour_to_12_hour(h);
    return t.hour + t.half;
}

/*
        {% for employee in employees %}
            {% set employee_loop = loop %}
        <tr id="employee-row-{{ employee._id }}">
            <th scope="row"><button type="button" class="btn btn-primary"> {{ employee.name }} </th>
            {% for d in range(7) %}
            <td class="employee-pref-box-{{ d }}">
                <button class="btn" data-toggle="modal" data-target="#preference-modal"></button>
            </td>
            {% endfor %}
        </tr>
        {% endfor %}
*/

// renders an updated preference table
// arguments: dict, list, dict
function render_pref_table(pref_table, dates, employees) {
    // clears all entries in pref_table
    $("#pref-table-body").empty();

    // for each key _id key in pref_table
    for (let employee_id in pref_table) {
        console.log(employee_id);

        // creates html row
        let emp_row = document.createElement("tr");
        // adds row to table
        $("#pref-table-body").append(emp_row);

        let emp_name = $("<th/>", { scope: "row" });
        emp_row.append(emp_name[0]);
        emp_name.append($("<button/>", {
            type: "button",
            class: "btn btn-primary",
            text: employees[employee_id].name,
        })[0]);

        for (let [day, shift] of pref_table[employee_id].entries()) {
            let td = $("<td/>");
            emp_row.append(td[0]);

            if (shift.available) {
                var btn_text = hour_to_str(shift.prefs[0][0]) + " - " + hour_to_str(shift.prefs[0][1]);
                if (shift.prefs.length > 1) {
                    btn_text += ", ...";
                }
                var btn_class = "btn-info";
            }
            else {
                var btn_text = "Add availability";
                var btn_class = "btn-light";
            }

            td.append($("<button/>", {
                class: "btn " + btn_class,
                "data-toggle": "modal",
                "data-target": "#preference-modal",
                text: btn_text,
            }).click(function() {
                // note the modal get's opened anyway, just need
                // to modify the info in it
                open_pref_modal(employee_id, day, this);
            }));
        }
    }

    function open_pref_modal(employee_id, day, button_element) {
        let employee_data = pref_table[employee_id][day];
        let available = employee_data.available;

        $("#preference-modal-title").html("<strong>" + employees[employee_id].name + "</strong>: " + dates[day]);

        $("#available-dropdown").text(available ? "Available" : "Unavailable")
            .data("available", available);

        $("#preference-table").empty();
        for (let pref of employee_data.prefs) {
            create_availability_row(pref);
        }

        $("#save-pref-button").off("click").on("click", function() {
            // get the new pref data
            let new_pref = [];
            $("#preference-table").children().each((row_index, row) => {
                let tds = $(row).children();
                let start_time_selects = $(tds[0]).find("select");
                let start_hour = hour_to_24_hour({hour: parseInt($(start_time_selects[0]).val()),
                                                  half: $(start_time_selects[1]).val()});
                let end_time_selects = $(tds[1]).find("select");
                let end_hour = hour_to_24_hour({hour: parseInt($(end_time_selects[0]).val()),
                                                half: $(end_time_selects[1]).val()});

                new_pref.push([start_hour, end_hour]);
            });

            let available = $("#available-dropdown").data("available");

            pref_table[employee_id][day] = {
                prefs: new_pref,
                available: available
            }

            $.ajax({
                type: "POST",
                url: "/add_preferences",
                data: {'id': employee_id, 'day': day, 'prefs': new_pref, 'available': available},
                success: function(json_response) {
                    console.log(json_response);
                }
            });

            render_pref_table(pref_table, dates, employees);
        });
    }
}

$("#add-availability-button").on("click", function() {
    create_availability_row([0, 1]);
});

function create_availability_row(pref) {
    let pref_row = document.createElement("tr");
    let remove_button = document.createElement("button");
    $(remove_button).addClass("btn btn-danger")
        .text("Remove")
        .on("click", function () {
            pref_row.remove();
        });

    for (let [s, hour_type] of ["start", "end"].entries()) {
        let hour_select = document.createElement("select");
        let t = hour_to_12_hour(pref[s]);
        for (let hour = 1; hour < 13; hour++) {
            $(hour_select).append("<option value="+hour+">"+hour+"</option>");
        }
        $(hour_select).addClass("form-control")
            .val(t.hour);
        let half_select = document.createElement("select");
        $(half_select).addClass("form-control")
            .append('<option value="AM">AM</option>')
            .append('<option value="PM">PM</option>')
            .val(t.half);
        let td = document.createElement("td");
        let div = document.createElement("div");
        $(div).addClass("form-row");
        [hour_select, half_select].forEach(elem => {
            let col = document.createElement("div");
            $(col).addClass("col")
                .append(elem);
            $(div).append(col);
        });
        $(td).append(div);
        $(pref_row).append(td);
    }

    $(pref_row).append(remove_button);

    $("#preference-table").append(pref_row);
}

$("#employee-setup-button").on("click", function() {

    $('#add-employee-button').fadeOut()
    $('#pref-table-shell').fadeOut()

})

function render_emp_setup_bar(){
    let action_bar = $("#action-bar")

    let save = document.createElement("button")
    let cancel = document.createElement("button")

    action_bar.fadeOut()
    action_bar.empty()

    $(save).addClass("btn btn-info")
        .text("< Back")
        .on("click", function () {
            $("#pref-table-shell").fadeIn();
        });

    action_bar.append(save)

    $(cancel).addClass("btn btn-danger")
        .text("Cancel")
        .on("click", function () {
            console.log("Cancelled!");
        });

    action_bar.append(cancel)
    action_bar.fadeIn()
}

function render_index_bar(){

}

$('#first_week').on('click', function() {
    $('#pref_table_body').empty();
    refresh_table(initial_day);
    $(this).prop('disabled', true);
    $('#second_week').prop('disabled', false);
})

$('#second_week').on('click', function() {
    $('#pref_table_body').empty();
    refresh_table(next_week_initial_day);
    $(this).prop('disabled', true);
    $('#first_week').prop('disabled', false);
})
