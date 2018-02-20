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