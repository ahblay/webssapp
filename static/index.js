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

render_action_bar(build_index_bar());
refresh_table();
refresh_emp_setup_table();


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

// Builds employee setup table body

function render_emp_setup_table(options, employees) {
    console.log("Rendering emp-setup-table")
    $("#emp-setup-table").empty()

    for (let employee_id in options){

        console.log(employee_id)

        let option_row = document.createElement("tr");
        $("#emp-setup-table").append(option_row);

        let emp_name = $("<th/>", {scope: "row"});
        option_row.append(emp_name[0]);
        emp_name.append($("<button/>", {
            type: "button",
            class: "btn btn-primary",
            text: employees[employee_id].name,
        })[0]);

        for (let week in [0,1]){
            Object.keys(options[employee_id][week]).forEach(function (key){
                let td = $("<td/>")
                let input_field = $("<input>", {
                    type: "number",
                    name: employee_id + "-" + key + "-" + week,
                    value: options[employee_id][week][key],
                    class: "form-control"
                });
                td.append(input_field);
                option_row.append(td[0]);
            })
        }

        let sen_td = $("<td/>");
        sen_td.addClass("align-middle")

        let sen_options = [.25, .5, .75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10];
        let sen_select = document.createElement("select");
        sen_select.name = employee_id + "-seniority";
        sen_select.className += " form-control sen-select";

        for (let i=0; i < sen_options.length; i++){
            let option = document.createElement("option");
            option.value = sen_options[i];
            option.text = sen_options[i];
            sen_select.appendChild(option);
        };
        option_row.append(sen_select);

        let rp_td = $("<td/>");

        let rp_options = ['None']
        let rp_select = $("<select>", {
            name: employee_id + "-roompref",
            class: "form-control rp-select"
        })

        for (let i=0; i < rp_options.length; i++){
            let option = document.createElement("option");
            option.value = rp_options[i];
            option.text = rp_options[i];
            rp_select.append(option)
        }
        rp_td.append(rp_select)
        option_row.append(rp_td[0]);
    }
}

function refresh_emp_setup_table(){

    console.log("Refreshing emp-setup-table")
    fetch("/_get_emp_options")
        .then(response => response.json())
        .then((json_options) => {
            console.log(json_options);
            render_emp_setup_table(json_options.option_data, json_options.employees);
        })
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

    render_emp_setup_bar();

    $('#pref-table-shell').fadeOut();

});

//View selector scripts

$("#view-select").on("change", function() {
    $("option[value=" + this.value + "]", this)
        .attr("selected", true).siblings()
        .removeAttr("selected");

    change_view($(this).val())
});

function change_view(selected_option) {

    if (selected_option == "avail-setup"){
        show_avail_setup()
    } else if (selected_option == "emp-setup") {
        show_emp_setup()
    } else if (selected_option == "schedule-viewer") {
        show_schedule_viewer()
    }
}

//Show view scripts

// TODO: Make a helper function for these

function show_avail_setup(){
    let action_bar = $("#action-bar");
    let active_view = $(".viewframe:visible");
    active_view.add(action_bar);
    active_view.fadeOut(function (){
        action_bar.empty();
        let new_view = $("#pref-table-shell", build_index_bar);
        new_view.fadeIn();
    });
}

function show_emp_setup(){
    let action_bar = $("#action-bar");
    let active_view = $(".viewframe:visible");
    active_view.add(action_bar);
    active_view.fadeOut(function (){
        action_bar.empty();
        let new_view = $("#emp-setup-shell").add(build_emp_setup_bar());
        new_view.fadeIn();
    });

}

function show_schedule_viewer(){
    let action_bar = $("#action-bar");
    let active_view = $(".viewframe:visible");
    active_view.add(action_bar);
    active_view.fadeOut(function (){
        action_bar.empty();
        let new_view = $("#schedule-viewer-shell").add(build_schedule_viewer_bar());
        new_view.fadeIn();
    });

}

//Action bar scripts
function render_action_bar(action_bar){
    action_bar.show()
}

function build_emp_setup_bar(){
    let emp_setup_bar = $("#action-bar");

    let save_data = document.createElement("button");
    let choose_template = document.createElement("button");
    let save_template = document.createElement("button");

    $(save_data).addClass("btn btn-outline-dark")
        .text("Save Data")
        .on("click", function () {
            console.log("Save data clicked!")
            let table_data = {serialized_data: $("input, .sen-select, .rp-select").serialize()}
            console.log($("input, .sen-select, .rp-select"))
            console.log(table_data)
            $.ajax({
                type: "POST",
                url: "/_save_emp_data",
                data: JSON.stringify(table_data),
                contentType: 'application/json;charset=UTF-8',
                dataType: "json",
            })
    });

    $(choose_template).addClass("btn btn-outline-dark")
        .text("Choose Template")
        .on("click", function () {
            console.log("Opening template chooser!");
    });

    $(save_template).addClass("btn btn-outline-dark")
        .text("Save as Template")
        .on("click", function () {
            console.log("Opening save template modal!");
    });

    emp_setup_bar.append(save_data);
    emp_setup_bar.append(choose_template);
    emp_setup_bar.append(save_template);

    return emp_setup_bar
}

function build_index_bar(){
    let index_bar = $("#action-bar")

    let add_emp = document.createElement("button")
    let optimize = document.createElement("button")

    $(add_emp).addClass("btn btn-outline-dark")
        .text("Add Employee")
        .attr("id", "add-employee-button")
        .attr("data-toggle", "modal")
        .attr("data-target", "#add-employee-modal");

    $(optimize).addClass("btn btn-outline-dark")
        .text("Optimize!")
        .on("click", function(){
            console.log("Optimizing schedule!")
        })

    index_bar.append(add_emp)
    index_bar.append(optimize)

    return index_bar
}

function build_schedule_viewer_bar(){
    let sv_bar = $("#action-bar")

    let notify = document.createElement("button")

    $(notify).addClass("btn btn-outline-dark")
        .text("Notifications")
        .on("click", function(){
            console.log("Opening notification modal!")
        })

    sv_bar.append(notify)

    return sv_bar
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
