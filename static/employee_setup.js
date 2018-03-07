$("#add-employee-submit").on("click", function() {
    // posts the modal form data to /_add_employee, where the associated function adds an employee to the table
    $.ajax({
        type: "POST",
        url: "/_add_employee",
        data: {name: $("#add-employee-name-input").val()},
        success: function(json_response) {
            console.log(json_response);
            refresh_emp_setup_table();
            refresh_table();
        }
    });
});