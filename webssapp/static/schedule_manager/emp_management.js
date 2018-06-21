//On load
refresh_table_data(SCHEDULE['employees']);


//Main table functions
$("#check-all-employees").on("click", function(){
    $(".row-select-checkbox").not(this).prop("checked", this.checked)
    console.log("Check-all selected, updating buttons.")
    var num_boxes_selected = $(".row-select-checkbox:checked").length
    if ( num_boxes_selected > 0) {
        $("#edit-employees").removeAttr("disabled");
        $("#remove-employees").removeAttr("disabled");
    } else {
        $("#edit-employees").attr("disabled", "disabled")
        $("#remove-employees").attr("disabled", "disabled")
    };
});

$(document).on("change", ".row-select-checkbox", function(){
    console.log("Checkbox selected, updating buttons.")
    var num_boxes_selected = $(".row-select-checkbox:checked").length
    if ( num_boxes_selected > 0) {
        $("#edit-employees").removeAttr("disabled");
        $("#remove-employees").removeAttr("disabled");
    } else {
        $("#edit-employees").attr("disabled", "disabled")
        $("#remove-employees").attr("disabled", "disabled")
    };
});

function refresh_table_data(employees){

    console.log("Refreshing schedule employee table.");
    console.log(employees);

    $("#employee-table-body").empty();

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
                input.addClass("row-select-checkbox");
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

            if (db_keys[key] == "training"){
                let toggle = $(document.createElement("input"));
                toggle.prop("type", "checkbox")
                toggle.attr("data-toggle", "toggle")
                let value = employees[i][db_keys[key]];
                toggle.prop("checked", value)
                $(td).append(toggle);
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

            if (db_keys[key] == "inactive"){
                continue;
            }

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

// Add employee(s) modal functions
$("#add-employees").on("click", function(){
    $.getJSON("/_get_employee_delta/" + SCHEDULE_ID, function(data){
        refresh_add_emps_table(data);
    });
});

function refresh_add_emps_table(available_emps){

    $("#add-emps-tbody").empty();

    if (available_emps.length == 0){
        $("#all-emps-added-alert").show()
    }else{
        $("#all-emps-added-alert").hide()
    };

    for (i=0; i < available_emps.length; i++){
        let tr = document.createElement("tr");

        let checkbox_td = document.createElement("td");
        let name_td = document.createElement("td");
        let status_td = document.createElement("td");

        let input = $(document.createElement("input"));
        input.addClass("emp-select-checkbox");
        input.attr("type", "checkbox");
        input.attr("id", available_emps[i]["_id"]);
        input.val("");

        name_td.append(available_emps[i]['name']);
        status_td.innerHTML = render_boolean(available_emps[i]['inactive']);

        $(checkbox_td).append(input);
        $(name_td).append();
        $(status_td).append();

        $(tr).append(checkbox_td);
        $(tr).append(name_td);
        $(tr).append(status_td);

        $("#add-emps-tbody").append(tr)
    };
};

$(document).on("change", ".emp-select-checkbox", function(){
    console.log("Checkbox selected, updating buttons.")
    var num_boxes_selected = $(".emp-select-checkbox:checked").length
    if ( num_boxes_selected > 0) {
        $("#add-emps-submit").removeAttr("disabled");
    } else {
        $("#add-emps-submit").attr("disabled", "disabled");
    };
});

$(document).on("click", "#add-all-emps", function() {
    $(".emp-select-checkbox").not(this).prop("checked", this.checked)
});

// Send list of employees to add to current schedule to /_add_emps_to_schedule
$(document).on("click", "#add-emps-submit", function() {
    // posts the modal form data to /_add_employee, where the associated function adds an employee to the table
    var data = {
                    schedule_id: SCHEDULE_ID,
                    _ids: $(".emp-select-checkbox:checked").map(function(){return this.id}).get(),
               };
    console.log(data);
    $.ajax({
        type: "POST",
        url: "/_add_emps_to_schedule",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(){
            $("#edit-employees").attr("disabled", "disabled");
            $("#remove-employees").attr("disabled", "disabled");
            $.getJSON("/api/get_schedule/" + SCHEDULE_ID, function(data){
                SCHEDULE = data;
                refresh_table_data(SCHEDULE['employees']);
            });
        }
    });
});


// Edit employee(s) modal functions
$(document).on("click", "#edit-employees", function () {
    let em_add_emp_role_grid = $(".em-add-emp-roles-row");
    em_add_emp_role_grid.empty();

    em_add_emp_role_grid.append($("<div />").addClass("em-add-emp-roles-row-header")
                                            .text("Choose Eligible Roles and Training Status")
                                            .append($("<input />").prop("type", "checkbox")
                                                                  .attr("id", "emp-man-edit-change-roles")));
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

$(document).on("click", "#edit-emps-submit", function() {
    // posts the modal form data to /_add_employee, where the associated function adds an employee to the table
    var data = {
                    schedule_id: SCHEDULE_ID,
                    _ids: $(".row-select-checkbox:checked").map(function(){return this.id}).get(),
                    min_shifts: $("#emp-man-edit-min-shifts").val(),
                    max_shifts: $("#emp-man-edit-max-shifts").val(),
                    seniority: $("#emp-man-edit-seniority").val(),
                    change_roles: $("#emp-man-edit-change-roles").prop("checked"),
                    roles: process_role_selection(),
                    inactive: $("#emp-man-edit-inactive").prop("checked")
               };
    console.log(data);
    $.ajax({
        type: "POST",
        url: "/_edit_schedule_employees",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(){
            $("#edit-employees").attr("disabled", "disabled");
            $("#remove-employees").attr("disabled", "disabled");
            $.getJSON("/api/get_schedule/" + SCHEDULE_ID, function(data){
                SCHEDULE = data;
                refresh_table_data(SCHEDULE['employees']);
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

//Remove employee functions
$(document).on("click", "#remove-employees", function() {
    var message = "Are you sure that you wish to remove these employees from the master list? All data associated" +
     " with these employees will be deleted."
    var confirmed = confirm(message);
    if (confirmed){

        data = {
            "_ids": $(".row-select-checkbox:checked").map(function(){return this.id}).get(),
            "schedule_id": SCHEDULE_ID
        };
        console.log("Attempting to remove the following employees from master list:")
        console.log(data["_ids"])
        let success = function() {
                $("#edit-employees").attr("disabled", "disabled");
                $("#remove-employees").attr("disabled", "disabled");
                $.getJSON("/api/get_schedule/" + SCHEDULE_ID, function(data){
                    SCHEDULE = data;
                    refresh_table_data(SCHEDULE['employees']);
                });
        };

        $.ajax({
        type: "POST",
        url: "/_remove_schedule_employees",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: success
        });
    };
});
