$("#submit-new-user").on("click", function() {
    console.log("something is working");
    $.ajax({
        type: "POST",
        url: "/create_account",
        data: {username: $("#username").val(), email: $("#email").val(), password: $("#pwd").val()},
        success: function(json_response) {
            console.log(json_response);
                if (json_response["success"] == true) {
                    location.assign("/landing_page");
                }
                else {
                    location.assign("/new_user");
                }
        }
    });
});

$("#log-me-in").on("click", function() {
    console.log("Hello, Brandy! Your bosom is looking especially seductive today.");
    $.ajax({
        type: "POST",
        url: "/login",
        data: {username: $("#login-username").val(), password: $("#login-pwd").val()},
        success: function(json_response) {
            console.log(json_response);
                if (json_response["success"] == true) {
                    location.assign("/new_prefs");
                }
                else {
                    location.assign("/login_page");
                }
        }
    });
});

var days = 0
var shifts = 0
var roles = 0
var employees = 1
var roles_employees = 1

$("#additional_employee").on("click", function() {
    $("#div1").append("<table id=\"employee_table\"></table>");
    $("#employee_table").append("<tr>",
                           "<td>Name</td>",
                           "<td><input type=text name=name></td>",
                           "<td>Min Shifts</td>",
                           "<td><input type=text name=min_shifts></td>",
                           "<td>Max Shifts</td>",
                           "<td><input type=text name=max_shifts></td>",
                           "<td>Training</td>",
                           "<td><input type=text name=training></td>",
                           "</tr>");
});

$("#add_duration").on("click", function() {
    days = days + 1;
    $("#div2").append("<table id=\"duration_table\"></table>");
    $("#duration_table").append("<tr>",
                           "<td>Day</td>",
                           "<td><input type=text name=day></td>",
                           "</tr>");
});

$("#add_shifts").on("click", function() {
    shifts = shifts + 1;
    $("#div3").append("<table id=\"shifts_table\"></table>");
    $("#shifts_table").append("<tr>",
                           "<td>Name</td>",
                           "<td><input type=text name=name></td>",
                           "<td>Info</td>",
                           "<td><input type=text name=info></td>",
                           "</tr>");
});

$("#add_roles").on("click", function() {
    roles = roles + 1;
    $("#div4").append("<table id=\"roles_table\"></table>");
    $("#roles_table").append("<tr>",
                           "<td>Role</td>",
                           "<td><input type=text name=role></td>",
                           "</tr>");
});

$("#add_name").on("click", function() {
    $("#div5").append("<table id=\"name_table\"></table>");
    $("#name_table").append("<tr>",
                           "<td>Name</td>",
                           "<td><input type=text name=name></td>",
                           "</tr>");
});

$("#add_employee_prefs").on("click", function() {
    $("#div6").append("<table id=\"employee_prefs_table\"></table>");
    $("#employee_prefs_table").append("<th>Employee" + employees + "</th>");
    for (i = 0; i < shifts; i++) {
        $("#employee_prefs_table").append("<th>Shift" + (i+1) + "</th>");
    }
    $("#employee_prefs_table").append("<tr></tr>");
    for (i = 0; i < days; i++) {
        $("#employee_prefs_table").append("<td>Day" + (i+1) + "</td>");
        for (j = 0; j < shifts; j++) {
            $("#employee_prefs_table").append("<td><input type=text name=" +
                                              (employees - 1) +
                                              "_" + i +
                                              "_" + j +
                                              "></td>");
        }
        $("#employee_prefs_table").append("<tr></tr>");
    }
    employees = employees + 1
});

$("#add_seniority").on("click", function() {
    $("#div7").append("<table id=\"seniority_table\"></table>");
    console.log(roles)
    for (i = 0; i < roles; i++) {
        $("#seniority_table").append("<th>Role" + (i+1) + "</th>");
    }
    $("#seniority_table").append("<tr></tr>");
    for (i = 0; i < roles; i++) {
        $("#seniority_table").append("<td><input type=text name=" +
                                              (roles_employees - 1) +
                                              "_" + i +
                                              "></td>");
    }
    $("#seniority_table").append("<tr></tr>");
    roles_employees = roles_employees + 1;
});

$("#submit_all").on("click", function() {
    console.log("Submit button clicked.")
    let info = {"employee_data": $("#employee_form").serialize(),
                "duration_data": $("#duration_form").serialize(),
                "shifts_data": $("#shifts_form").serialize(),
                "roles_data": $("#roles_form").serialize(),
                "name_data": $("#name_form").serialize(),
                "employee_prefs_data": $("#employee_prefs_form").serialize(),
                "seniority_data": $("#seniority_form").serialize()};
    console.log(info);
    $.ajax({
        type: "POST",
        url: "/data_to_database",
        data: JSON.stringify(info),
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
    });
});

