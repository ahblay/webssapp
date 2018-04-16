//On load
$.getJSON("/api/get_employees", function(data){
    refresh_table_data(data);
});

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


// Add employees modal functions
$("#add-employee-submit").on("click", function() {
    // posts the modal form data to /_add_employee, where the associated function adds an employee to the table
    var data = {
                    name: $("#add-employee-name-input").val(),
                    min_shifts: $("#min-shifts-input").val(),
                    max_shifts: $("#max-shifts-input").val(),
                    seniority: $("#seniority-input").val(),
                    roles: $("#role-input").val().split(",").map(function(item){return item.trim()}),
                    training: document.getElementById("training-flag").checked,
                    inactive: document.getElementById("inactive-flag").checked,
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
