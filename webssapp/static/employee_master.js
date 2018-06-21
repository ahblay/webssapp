var GLOBAL_ROLES;

//On load
$.getJSON("/api/get_employees", function(data){
    refresh_table_data(data);
});

$.getJSON("/_api/get_roles", function(data){
    GLOBAL_ROLES = data;
});

$(document).ready(function () {
    new jBox('Tooltip', {
        attach: '#previous-schedule-icon',
        content: $("#previous-schedules-tooltip"),
        closeOnMouseleave: true
    });
    new jBox('Tooltip', {
        attach: '#current-schedule-icon',
        content: $("#current-schedules-tooltip"),
        closeOnMouseleave: true
    });
    new jBox('Tooltip', {
        attach: '#upcoming-schedule-icon',
        content: $("#upcoming-schedules-tooltip"),
        closeOnMouseleave: true
    });
})

function openSchedule(id) {
    console.log(id)
    //var scheduleID = $(this).data("schedule-id")
    window.location.href = "/view_schedule/" + id
}

// Main table functionality
$("#check-all-employees").on("click", function(){

    $(".emp-setup-row-select-checkbox").not(this).prop("checked", this.checked)

    var num_boxes_selected = $(".emp-setup-row-select-checkbox:checked").length

    if (num_boxes_selected > 0){
        $("#edit-employees").removeAttr("disabled");
        $("#remove-employees").removeAttr("disabled");
    } else {
        $("#edit-employees").attr("disabled", "disabled");
        $("#remove-employees").attr("disabled", "disabled");
    };
});

$(document).on("change", ".emp-setup-row-select-checkbox", function(){
    console.log("Checkbox selected, updating #edit-employees button.")
    var num_boxes_selected = $(".emp-setup-row-select-checkbox:checked").length
    if ( num_boxes_selected > 0) {
        $("#edit-employees").removeAttr("disabled");
        $("#remove-employees").removeAttr("disabled");
    } else {
        $("#edit-employees").attr("disabled", "disabled")
        $("#remove-employees").attr("disabled", "disabled")
    };
});

function refresh_table_data(employees){

    console.log("Refreshing employee master table.")

    for (i=0; i < employees.length; i++){
        let tr = document.createElement("tr");
        let db_keys = $("#emp-info thead tr th").map(function(){return $(this).data("dbkey")}).toArray();

        for (key=0; key < db_keys.length; key++){
            let td = document.createElement("td");
            $(td).css("border-top", "1px solid")
            if (db_keys[key] == "checkbox"){
            let label = document.createElement("label");
                $(label).addClass("checkbox-container");
                let span = document.createElement("span");
                $(span).addClass("custom-checkbox");
                let input = $(document.createElement("input"));
                input.addClass("emp-setup-row-select-checkbox");
                input.attr("type", "checkbox");
                input.attr("id", employees[i]["_id"]);
                input.val("");
                console.log(input);
                $(label).append(input);
                $(label).append(span);
                $(td).append(label);
                $(tr).append(td);
                continue;
            };

            if (db_keys[key] == "training" || db_keys[key] == "inactive"){
                let html = render_boolean(employees[i][db_keys[key]]);
                $(td).append(html);
                $(tr).append(td);
                continue;
            };

            if (db_keys[key] == "roles"){
                for (role=0; role<employees[i][db_keys[key]].length; role++){
                    employees[i][db_keys[key]][role] = employees[i][db_keys[key]][role]['role_name'] + "\n";
                };
                let html = employees[i][db_keys[key]].join()
                $(td).css("white-space", "pre")
                $(td).html(html.replace(/,/g, ""));
                $(tr).append(td);
                continue;
            };

            $(td).append(employees[i][db_keys[key]]);
            $(tr).append(td);
        };
        $("#employee-table-body").append(tr);
    };
};

// Main table helper functions
function render_boolean(value){
    if (value == true){
        return "<strong>YES</strong>"
    }else {
        return "No"
    };
};


// Add employees modal functions
$(document).on("click", "#add-employee", function () {
    let em_add_emp_role_grid = $(".em-add-emp-roles-row");
    em_add_emp_role_grid.empty();

    em_add_emp_role_grid.append($("<div />").addClass("em-add-emp-roles-row-header")
                                            .text("Choose Eligible Roles and Training Status"));
    console.log(GLOBAL_ROLES);

    for (role=0; role < GLOBAL_ROLES.length; role++){
        let role_cell = $("<div />").addClass("em-add-emp-role-cell");

        role_cell.css("background", GLOBAL_ROLES[role]['color']);

        role_cell.append($("<div />").append($("<input />").prop("type", "checkbox")
                                                           .attr("data-role", role)
                                                           .addClass("em-add-emp-role-check")));

        role_cell.append($("<div />").text(GLOBAL_ROLES[role]['name']))

        let toggle=$(document.createElement("input"));
        toggle.prop("type", "checkbox");
        toggle.attr("data-toggle", "toggle");
        toggle.prop("checked", false);
        toggle.addClass("em-add-emp-train-check");

        role_cell.append($("<div />").append("T? :").append(toggle));


        em_add_emp_role_grid.append(role_cell);
    }
});

$("#add-employee-submit").on("click", function() {
    // posts the modal form data to /_add_employee, where the associated function adds an employee to the table
    var data = {
                    name: $("#em-add-emp-first-name").val() + " " + $("#em-add-emp-last-name").val(),
                    first_name: $("#em-add-emp-first-name").val(),
                    last_name: $("#em-add-emp-last-name").val(),
                    email: $("#em-add-emp-email").val(),
                    phone: $("#em-add-emp-phone").val(),
                    min_shifts: $("#em-add-emp-min-shifts").val(),
                    max_shifts: $("#em-add-emp-max-shifts").val(),
                    seniority: $("#em-add-emp-seniority").val(),
                    roles: process_role_selection(),
                    inactive: document.getElementById("em-add-emp-inactive-flag").checked
               };
    console.log(data);
    $.ajax({
        type: "POST",
        url: "/_add_employee",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(){
            $("#edit-employees").attr("disabled", "disabled");
            $("#remove-employees").attr("disabled", "disabled");
            $("#employee-table-body").empty();
            $.getJSON("/api/get_employees", function(data){
                refresh_table_data(data);
            });
        }
    });
});

function process_role_selection() {
    console.log("Processing role selection")
    let eligible_roles = $(".em-add-emp-role-check").map(function (){return this.checked}).get();
    let training_status_for_roles = $(".em-add-emp-train-check").map(function (){return this.checked}).get();

    let role_selections = [];

    for (role=0; role < GLOBAL_ROLES.length; role++){
        if (eligible_roles[role]) {
            role_selections.push({"role_name": GLOBAL_ROLES[role]['name'], "training": training_status_for_roles[role]})
        };
    };

    return role_selections;
};

// Edit employee(s) modal functions
$("#edit-employees").on('click', function(){
    if ($(".emp-setup-row-select-checkbox:checked").length > 1){
        $("#multi-name-change-alert").show()
    }else{
        $("#multi-name-change-alert").hide()
    };
});

$(document).on("click", "#edit-emps-submit", function() {
    // posts the modal form data to /_add_employee, where the associated function adds an employee to the table
    var data = {
                    _ids: $(".emp-setup-row-select-checkbox:checked").map(function(){return this.id}).get(),
                    name: $("#edit-emps-name-input").val(),
                    min_shifts: $("#edit-emps-min-shifts-input").val(),
                    max_shifts: $("#edit-emps-max-shifts-input").val(),
                    seniority: $("#edit-emps-seniority-input").val(),
                    roles: $("#edit-emps-role-input").val().split(",").map(function(item){return item.trim()}),
                    training: document.getElementById("edit-emps-training-flag").checked,
                    inactive: document.getElementById("edit-emps-inactive-flag").checked,
                    no_change: document.getElementById("edit-emps-no-change-flag").checked
               };
    console.log(data);
    $.ajax({
        type: "POST",
        url: "/_edit_employees",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(){
            $("#edit-employees").attr("disabled", "disabled");
            $("#remove-employees").attr("disabled", "disabled");
            $("#employee-table-body").empty();
            $.getJSON("/api/get_employees", function(data){
                refresh_table_data(data);
            });
        }
    });
});

//Remove employee functions
$(document).on("click", "#remove-employees", function() {
    var message = "Are you sure that you wish to remove these employees from the master list? All data associated" +
     " with these employees will be deleted."
    var confirmed = confirm(message);
    if (confirmed){

        data = {
            "_ids": $(".emp-setup-row-select-checkbox:checked").map(function(){return this.id}).get()
        };
        console.log("Attempting to remove the following employees from master list:")
        console.log(data["_ids"])
        let success = function() {
                $("#edit-employees").attr("disabled", "disabled");
                $("#remove-employees").attr("disabled", "disabled");
                $("#employee-table-body").empty();
                $.getJSON("/api/get_employees", function(data){
                    refresh_table_data(data);
                });
        };

        $.ajax({
        type: "POST",
        url: "/_remove_employees",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: success
        });
    };
});

