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

// new schedule modal-related adventures
var modal = document.getElementById("create-schedule-modal");
var newScheduleButton = document.getElementById("new-schedule-button");
var closeModal = document.getElementById("close-new-schedule-modal");
var bd = $('<div class="modal-backdrop fade show"></div>');

newScheduleButton.onclick = function() {
    console.log("New schedule button clicked.")
    modal.style.display = "block";
    bd.appendTo($("#outer-wrapper"));
}

closeModal.onclick = function() {
    modal.style.display = "none";
    bd.remove();
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        bd.remove();
    }
}

// the following block of functions ensures that a schedule's end date cannot come before its start date
$(function () {
    $('#datepickerstart').datepicker({
        format: 'mm/dd/yyyy',
        startDate: '0d',
        autoclose: true
    }).on("changeDate", function (e) {
        $('#datepickerend').datepicker("setStartDate", e.date);
    });
});

var d = new Date();
var now = new Date(d.getFullYear(), d.getMonth(), d.getDate());

$(function () {
    $('#datepickerstart').datepicker('update', now);
});

$(function () {
    $('#datepickerend').datepicker({
        format: 'mm/dd/yyyy',
        autoclose: true
    }).on('changeDate', function (e) {
        $('#datepickerstart').datepicker('setEndDate', e.date);
    });
});

$(function () {
    $('#datepickerend').datepicker('update', now);
});

$("#submit-new-schedule").on("click", function () {
    console.log("Button clicked.")
    $.ajax({
        type: "POST",
        url: "/add_schedule",
        data: {schedule_name: $("#name").val(), start: $("#start-date").val(), end: $("#end-date").val()},
        success: function(json_response) {
            console.log(json_response);
                if (json_response["success"] == true) {
                    location.reload(true);
                }
                else {
                    console.log("Failed to send data to server.");
                }
        }
    });
})

$(".close-schedule").on("click", function () {
    var scheduleID = $(this).data("schedule-id")
    removeScheduleModal.style.display = "block";
    bd.appendTo($("#outer-wrapper"));
    console.log(scheduleID)

    $("#confirm-delete").on("click", function () {
        $.post("/delete_schedule/" + scheduleID)
        location.reload(true);
    })
})

var removeSchedule = $("[data-schedule-id='test']")
var removeScheduleModal = document.getElementById("confirm-delete-schedule")


$("#cancel-delete").on("click", function () {
    removeScheduleModal.style.display = "none";
    bd.remove();
})

function dateToString(date) {
    var date_array = date.split("/");
    date_array[0] = Number(date_array[0])
    var month_array = ["January",
                       "February",
                       "March",
                       "April",
                       "May",
                       "June",
                       "July",
                       "August",
                       "September",
                       "October",
                       "November",
                       "December"]
    return month_array[date_array[0] - 1] + " " + date_array[1] + ", " + date_array[2]
}

$(".card-text").each(function(){
    dates = $(this).data("dates").split(" ")
    $(this).append("<b>Start: </b>" + dateToString(dates[0]) + "<br /><b>End: </b>" + dateToString(dates[1]))});

$(".fa-folder-open").on("click", function () {
    
})
