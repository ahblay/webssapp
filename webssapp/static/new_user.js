$(function() {
    console.log("Validating sign-up form.")
    $("#signup-form").validate({
        rules: {
            username: {
                required: true
            },
            email: {
                required: true,
                email: true
            },
            pwd: {
                required: true,
                minlength: 5
            }
        },
        messages: {
            username: "Please enter a username.",
            password: {
                required: "Please provide a password.",
                minlength: "Your password must be at least 5 characters long."
            },
            email: "Please enter a valid email address."
        },
        submitHandler: function(form) {
            console.log("Creating new account.");
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
        }
    });
});

$(function() {
    console.log("Validating login form.")
    $("#login-form").validate({
        rules: {
            loginusername: {
                required: true
            },
            loginpassword: {
                required: true
            }
        },
        messages: {
            loginusername: "Please enter a username.",
            loginpassword: "Please provide a password."
        },
        submitHandler: function(form) {
            console.log("Logging in user.");
            $.ajax({
                type: "POST",
                url: "/login",
                data: {username: $("#login-username").val(), password: $("#login-pwd").val()},
                success: function(json_response) {
                    console.log(json_response);
                        if (json_response["success"] == true) {
                            location.assign("/select_schedule");
                        }
                        else {
                            location.assign("/login_page");
                        }
                }
            });
        }
    });
});

