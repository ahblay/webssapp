$(document).ready(function () {
    new jBox('Tooltip', {
        attach: '#previous-schedule-icon',
        content: $("#previous-schedules-tooltip"),
        closeOnMouseleave: true
    });
    new jBox('Tooltip', {
        attach: '#current-schedule-icon',
        content: $("#current-schedules-tooltip"),
        closeOnMouseleave: true
    });
    new jBox('Tooltip', {
        attach: '#upcoming-schedule-icon',
        content: $("#upcoming-schedules-tooltip"),
        closeOnMouseleave: true
    });
})

function openSchedule(id) {
    console.log(id)
    //var scheduleID = $(this).data("schedule-id")
    window.location.href = "/view_schedule/" + id
}

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

function preventClickPropogation(event){
    event.preventDefault();
    event.cancelBubble = true;
    if(event.stopPropagation) event.stopPropagation();
};

$(".card-text").each(function(){
    dates = $(this).data("dates").split(" ")
    $(this).append("<b>Start: </b>" + dateToString(dates[0]) + "<br /><b>End: </b>" + dateToString(dates[1]))});

$(document).on("click", ".schedule-card", function () {
    console.log("Clicked on load schedule icon.")
    var scheduleID = $(this).data("id")
    window.location.href = "/view_schedule/" + scheduleID
})

//changes background color of schedule thumbnail
$(document).on("click", ".d", function () {
    preventClickPropogation(event);

    var parent = $(this).closest($(".card"));
    parent.removeClass("schedule-default schedule-upcoming schedule-active")
    parent.addClass("schedule-default")
    schedule_id = parent.data("id")

    $.ajax({
        type: "POST",
        url: "/edit_schedule_status",
        data: {_id: schedule_id, status: "default"},
        success: function(json_response) {
            console.log(json_response);
        }
    });

})

$(document).on("click", ".a", function () {
    preventClickPropogation(event);

    console.log("clicked")
    var parent = $(this).closest($(".card"));
    parent.removeClass("schedule-default schedule-upcoming schedule-active")
    parent.addClass("schedule-active")
    schedule_id = parent.data("id")

    $.ajax({
        type: "POST",
        url: "/edit_schedule_status",
        data: {_id: schedule_id, status: "active"},
        success: function(json_response) {
            console.log(json_response);
        }
    });
})

$(document).on("click", ".u", function () {
    preventClickPropogation(event);

    var parent = $(this).closest($(".card"));
    parent.removeClass("schedule-default schedule-upcoming schedule-active")
    parent.addClass("schedule-upcoming")
    schedule_id = parent.data("id")

    $.ajax({
        type: "POST",
        url: "/edit_schedule_status",
        data: {_id: schedule_id, status: "upcoming"},
        success: function(json_response) {
            console.log(json_response);
        }
    });
})

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

$(".close-schedule").on("click", function (event) {
    preventClickPropogation(event);

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