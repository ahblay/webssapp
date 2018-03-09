// Main table functionality
$("#check-all-employees").on("click", function(){
    $(".row-select-checkbox").not(this).prop("checked", this.checked)
});

$(".row-select-checkbox").change(function(){
    var num_boxes_selected = $(".row-select-checkbox:checked").length
    if ( num_boxes_selected > 0) {
        $("#edit-employees").removeAttr("disabled")
    } else {
        $("#edit-employees").attr("disabled", "disabled")
    };
});

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
        encode: "true"
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

$("#edit-emps-submit").on("click", function() {
    // posts the modal form data to /_add_employee, where the associated function adds an employee to the table
    var data = {
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
        url: "/_edit_employees",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true"
    });
});
