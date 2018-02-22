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
    $("#div2").append("<table id=\"duration_table\"></table>");
    $("#duration_table").append("<tr>",
                           "<td>Day</td>",
                           "<td><input type=text name=day></td>",
                           "</tr>");
});

$("#add_shifts").on("click", function() {
    $("#div3").append("<table id=\"shifts_table\"></table>");
    $("#shifts_table").append("<tr>",
                           "<td>Name</td>",
                           "<td><input type=text name=name></td>",
                           "<td>Info</td>",
                           "<td><input type=text name=info></td>",
                           "</tr>");
});

$("#add_roles").on("click", function() {
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

$("#submit_all").on("click", function() {
    let info = {"employee_data": $("#employee_form").serialize(),
                "duration_data": $("#duration_form").serialize(),
                "shifts_data": $("#shifts_form").serialize(),
                "roles_data": $("#roles_form").serialize(),
                "name_data": $("#name_form").serialize()};
    console.log(info);
    $.ajax({
        type: "POST",
        url: "/data_to_database",
        data: JSON.stringify(info),
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
    });
});
