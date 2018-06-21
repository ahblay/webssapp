//Path from root/templates/
let SCHEDULE_MANAGER_TEMPLATE_DIR_PATH = "schedule_manager/";

var SCHEDULE = {};
var split_url = window.location.href.split("/")
var SCHEDULE_ID = split_url[split_url.length - 1];
console.log("Schedule ID: " + SCHEDULE_ID)
var GLOBAL_ROLES = [];
$.getJSON("/api/get_sorted_schedule/" + SCHEDULE_ID, function(data) {
    SCHEDULE = data;
    console.log(SCHEDULE);
});
$.getJSON("/_api/get_roles", function(data){
    GLOBAL_ROLES = data;
});
console.log(SCHEDULE);
$(function () {
    let status = $("#navbar-line").data("status")
    console.log(status)
    if (status == "active") {
        $('#navbar-line').addClass("line-active").addClass("alert-active")
        //$('tab-select').addClass("below-line-active")
    }
    else if (status == "upcoming") {
        $('#navbar-line').addClass("line-upcoming").addClass("alert-upcoming")
        //$('#tab-select').addClass("below-line-upcoming")
    }
    else {
        $('#navbar-line').addClass("line-default").addClass("alert-default")
        //$('#tab-select').addClass("below-line-default")
    }
});

$(function () {
    $("#shift-setup-tab").click()
})

$('.sidenav .sidenav-item').on('click', function(){

    let current_view = $(".sidenav-item.active");

    if ($(this).hasClass('active')){
        return;
    };

    if ($(this).data("view-id") == "schedule-options"){
        alert("This tab is under development and currently unavailable.")
        return;
    };

    current_view.removeClass("active");
    current_view.removeClass("selected-tab");
    $(this).addClass("active");
    $(this).addClass("selected-tab");

    change_view(current_view.data("view-id"), $(this).data("view-id"));
});

function change_view(current_view_id, new_view_id){

    let current_view = $("#" + current_view_id)
    console.log(current_view)
    current_view.fadeOut().promise().done(function(){
        console.log(current_view.attr("id") + " faded out.");
        let new_view = $("#" + new_view_id);
        new_view.fadeIn();
    });
};

function fetch_tab_bodies(){
    var tab_ids = $(".smgr-tab").map(function(){return $(this).attr("id");}).get();
    for (i=0; i<tab_ids.length; i++){
        let html_path = SCHEDULE_MANAGER_TEMPLATE_DIR_PATH + tab_ids[i].replace("-", "_") + ".html";
        $("#" + tab_ids[i]).load("/load_html/" + html_path);
        console.log("Loaded html from " + html_path + " to #" + tab_ids[i]);
    };
};

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

$(function () {
    dates = $(".dates").data("dates").split(" ")
    $(".dates").append(dateToString(dates[0]) + "<b> to </b>" + dateToString(dates[1]))
});

$("#back-to-home").on("click", function(){
    window.location.assign("/new_prefs");
});

// refresh emp prefs when tab is clicked
$(document).on("click", "#employee-prefs-tab", function() {
    $(".emp-prefs-select-emp-tab").remove()
    $(".emp-shift-prefs").empty()
    $(".emp-prefs").empty()
    $(".pref-calendar").empty()
    schedule_id = $(this).data("schedule-id")
    /*
    $.getJSON("/api/get_sorted_schedule/" + schedule_id, success= function(data) {
        console.log(data);
        console.log(data["employees"]);
        renderEmpSelectTabs(data["employees"]);
        renderShiftPrefsTable(data);
    });
    */
    $.getJSON("/api/get_sorted_schedule/" + schedule_id, renderPrefCalendar)
})

/*
$(".sidenav").hover(function () {
        $(".sidenav-small").addClass("sidenav-hidden")
        $(".sidenav-expanded").removeClass("sidenav-hidden")
    },
    function () {
        $(".sidenav-small").removeClass("sidenav-hidden")
        $(".sidenav-expanded").addClass("sidenav-hidden")
    })
*/

$(document).on("click", "#shift-setup-tab", function () {
    $(this).siblings().removeClass("select-view-highlighted")
    $(this).addClass("select-view-highlighted")
    $("[id$='-page-icon']").css("color", "#ababab")
    $("#shifts-page-icon").css("color", "#d75749")
})
$(document).on("click", "#emp-management-tab", function () {
    $(this).siblings().removeClass("select-view-highlighted")
    $(this).addClass("select-view-highlighted")
    $("[id$='-page-icon']").css("color", "#ababab")
    $("#employees-page-icon").css("color", "#d75749")
})
$(document).on("click", "#employee-prefs-tab", function () {
    $(this).siblings().removeClass("select-view-highlighted")
    $(this).addClass("select-view-highlighted")
    $("[id$='-page-icon']").css("color", "#ababab")
    $("#preferences-page-icon").css("color", "#d75749")
})
$(document).on("click", "#options-tab", function () {
    /*
    $(this).siblings().removeClass("select-view-highlighted")
    $(this).addClass("select-view-highlighted")
    $("[id$='-page-icon']").css("color", "#ababab")
    $("#options-page-icon").css("color", "#d75749")
    */
})

$(document).on("click", "#view-schedule-tab", function () {
    $(this).siblings().removeClass("select-view-highlighted");
    $(this).addClass("select-view-highlighted");
    $("[id$='-page-icon']").css("color", "#ababab");
    $("#schedule-page-icon").css("color", "#d75749");
})




