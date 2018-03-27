//On load
let SCHEDULE_ID = window.location.pathname.split("/");
SCHEDULE_ID = SCHEDULE_ID[SCHEDULE_ID.length-1]
$.getJSON("/api/get_schedule/" + SCHEDULE_ID, function(data){
    refresh_table_data(data['employees']);
});

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
                let input = $(document.createElement("input"));
                input.addClass("row-select-checkbox");
                input.attr("type", "checkbox");
                input.attr("id", employees[i]["_id"]);
                input.val("");
                console.log(input);
                $(td).append(input);
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
                    employees[i][db_keys[key]][role] = employees[i][db_keys[key]][role] + "\n";
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
        status_td.append(render_boolean(available_emps[i]['inactive']));

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
                employees = data['employees']
                refresh_table_data(employees);
            });
        }
    });
});


// Edit employee(s) modal functions
$("#edit-employees").on('click', function(){
    if ($(".row-select-checkbox:checked").length > 1){
        $("#multi-name-change-alert").show()
    }else{
        $("#multi-name-change-alert").hide()
    };
});

$(document).on("click", "#edit-emps-submit", function() {
    // posts the modal form data to /_add_employee, where the associated function adds an employee to the table
    var data = {
                    schedule_id: SCHEDULE_ID,
                    _ids: $(".row-select-checkbox:checked").map(function(){return this.id}).get(),
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
        url: "/_edit_schedule_employees",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(){
            $("#edit-employees").attr("disabled", "disabled");
            $("#remove-employees").attr("disabled", "disabled");
            $.getJSON("/api/get_schedule/" + SCHEDULE_ID, function(data){
                employees = data['employees']
                refresh_table_data(employees);
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
            "_ids": $(".row-select-checkbox:checked").map(function(){return this.id}).get()
        };
        console.log("Attempting to remove the following employees from master list:")
        console.log(data["_ids"])
        let success = function() {
                $("#edit-employees").attr("disabled", "disabled");
                $("#remove-employees").attr("disabled", "disabled");
                $.getJSON("/api/get_schedule/" + SCHEDULE_ID, function(data){
                    employees = data['employees'];
                    refresh_table_data(employees);
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
