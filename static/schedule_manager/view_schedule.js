var SCHEDULE = [];
var GLOBAL_ROLES;
var SHIFT_CHANGE_JBOX = null;
var VS_CALENDAR_DELAY_TIMER;
var VS_CALENDAR_CELL_HOVER_DELAY = 200;

$(document).on("click", "#view-schedule-tab", () => {
    $.getJSON("/_api/get_roles", function(data){
        GLOBAL_ROLES = data;
        console.log(GLOBAL_ROLES);
    });

    $.getJSON("/api/get_sorted_schedule/" + SCHEDULE_ID, function(data){
        SCHEDULE = data;
        console.log(SCHEDULE);
        if (SCHEDULE["output"] != null){
            console.log("Rendering saved output.");
            render_vs_calendar(SCHEDULE);
            render_schedule(SCHEDULE);
        };
    });

});

$(document).on("click", "#create-schedule", () => {
    if (SCHEDULE["output"]){
        confirm_reschedule = confirm("A schedule already exists. Recreating the schedule will cause the existing schedule to be" +
        " overwritten and any manual changes will be lost. Are you sure you would like to continue?")

        if (confirm_reschedule) {
            $.getJSON("/api/create_schedule/" + SCHEDULE_ID, function(data){
                SCHEDULE = data;
                render_schedule(SCHEDULE);
            });
        };
    } else {
        $.getJSON("/api/create_schedule/" + SCHEDULE_ID, function(data){
                SCHEDULE = data;
                render_vs_calendar(SCHEDULE);
                render_schedule(SCHEDULE);
        });
    };
});

function render_vs_calendar(schedule) {
    console.log("Rendering vs-calendar.");

    //Empty things as needed
    $("#vs-calendar-shifts").empty();
    $("#vs-calendar-emps").empty();
    $("#vs-calendar-emp-label").empty();
    $("#vs-calendar-header-row").empty();

    //Add emp list header
    $("#vs-calendar-emp-label").append($("<div />").addClass("vs-calendar-header-cell")
                                                   .append($("<div />").addClass("vs-calendar-header-text")
                                                   .text("Employees")));

    $("#vs-calendar-emps").css("grid-template-rows", "1fr ".repeat(schedule['employees'].length) + "15px");

    //populate employee list
    for (emp=0; emp<schedule['employees'].length; emp++){
        $("#vs-calendar-emps").append($("<div />").addClass("vs-calendar-emp")
                                                    .text(truncate_name(schedule['employees'][emp]['name'])));
    };

    //add assignments for each day
    //day headers
    //set width of grid based on number of days
    let header_row = $("#vs-calendar-header-row");

    header_row.css("grid-template-columns", "185px ".repeat(schedule['days'].length + 1));

    for (day=0; day<schedule['days'].length; day++){
        header_row.append($("<div />").addClass("vs-calendar-header-cell")
                                      .append($("<div />").addClass("vs-calendar-header-text")
                                      .text(schedule['days'][day])));
    };

    $("#vs-calendar-shifts").css("grid-template-columns", "185px ".repeat(schedule['days'].length));

    //fill shift information
    for (emp=0; emp<schedule['employees'].length; emp++){
        for (day=0; day<schedule['days'].length; day++){

            let shift_assignment = schedule["output"][emp][day];

            //Init cell_html with the shift change icon included
            let cell_html = "";

            if (shift_assignment['working'] == true){
                cell_html += schedule['roles'][shift_assignment['role']] + "<br>" + shift_assignment['shift'];
            } else {
                cell_html += "OFF";
            }

            let cell_content = $("<div />").addClass("vs-calendar-shift-cell");
            let text_area = $("<div />").addClass("vs-calendar-shift-cell-text")
                                            .html(cell_html);
            //Set cell background color based on role

            if (shift_assignment['working'] == true){
                cell_content.css("background", GLOBAL_ROLES[shift_assignment['role']]['color']);
            } else {
                cell_content.css("background", "#cccccc");
            };

            cell_content.append(text_area);

            cell_content.append($("<div />").addClass("vs-calendar-shift-change-icon")
                                            .attr("data-date", SCHEDULE['days'][day])
                                            .attr("data-emp-id", SCHEDULE['employees'][emp]['_id'])
                                            .append($("<span />").addClass("fas fa-exchange-alt")));

            cell_content.append($("<div />").addClass("vs-calendar-shift-status-icon"));
            /*
            cell_content.hover(function (){
                let current_cell = $(this);
                VS_CALENDAR_DELAY_TIMER = setTimeout(function() {
                    console.log("Entering hover state.");
                    current_cell.children(".vs-calendar-shift-change-icon").children().show();
                }, VS_CALENDAR_CELL_HOVER_DELAY)
            }, function () {
                let current_cell = $(this);
                clearTimeout(VS_CALENDAR_DELAY_TIMER);
                console.log("Leaving hover state.");
                current_cell.children(".vs-calendar-shift-change-icon").children().hide();
            });
            */

            $("#vs-calendar-shifts").append(cell_content);
        }
    };

};

function truncate_name(name){
    let split_name = name.split(" ");
    return split_name[0] + " " + split_name[1].charAt(0) + ".";
};

$(document).on("click", ".vs-calendar-shift-change-icon", function() {

    let shift_date = $(this).attr("data-date");
    let emp_id = $(this).attr("data-emp-id");

    set_shift_change_modal_content(shift_date, emp_id);

    SHIFT_CHANGE_JBOX = new jBox("Modal", {
        id: "shift-change-jbox",
        title: "Change Shift Assignment",
        content: $("#shift-change-modal-content"),
        footer: create_shift_change_modal_footer(shift_date, emp_id),
        onClose: function () {this.setContent("Modal failed to close.")},
        onCloseComplete: function () {
            console.log("Destroying jBox.")
            this.destroy()}
    });

    SHIFT_CHANGE_JBOX.open();

});

$("#vs-calendar-shifts").on('scroll', function(){
    $("#vs-calendar-header-row").scrollLeft($(this).scrollLeft());
});
/*
$(document).on("mouseenter", ".vs-calendar-shift-cell", function() {

});

$(document).on("mouseleave", ".vs-calendar-shift-cell", function() {
    console.log("Entering hover state.");
    $(this).children(".vs-calendar-shift-change-icon").children().hide();
});
*/
function render_schedule(schedule){
    console.log("Rendering view-schedule page.")

    $("#schedule-output-div").empty().addClass("col-md-12");

    $("#schedule-output-div").append($("<table />").attr("id", "schedule-output-table")
                                                   .addClass("table rounded-table-basic"));

    $("#schedule-output-table").append($("<thead />")
                                .attr("id", "schedule-output-header"));

    $("#schedule-output-table").append($("<tbody />")
                                .attr("id", "schedule-output-body"));

    let days = schedule["days"];

    let header_row = document.createElement("tr");
    $(header_row).append($('<th />', {text: "Employees"}));
    for (i=0; i<days.length; i++){
        $(header_row).append( $('<th />', {text: days[i]}) );
    };
    $("#schedule-output-header").append(header_row);

    for (emp=0; emp<schedule["employees"].length; emp++){
        let row = document.createElement('tr');
        $(row).append($('<td />', {text: schedule["employees"][emp]["name"]}).css("border-top", "1px solid"));
        $(row).attr("data-emp-id", schedule["employees"][emp]["_id"]);
        for (day=0; day<days.length; day++){
            let td = $('<td />');
            td.addClass("vs-table-cell");

            let shift_info = $("<div />").addClass("col-md-10");
            let shift_icons = $("<div />").addClass("col-md-2");
            let emps_work_for_day = schedule.output[emp][day];

            if (emps_work_for_day["working"]) {
                td.html(schedule["roles"][emps_work_for_day["role"]] + "<br>" +
                emps_work_for_day["shift"]);

                if (emps_work_for_day["declined"]) {
                    td.addClass("declined-shift");
                };
            } else {
                td.text('OFF');
            };

            let exchange_shifts_button = $("<button />").addClass("btn btn-default btn-xs shift-change-modal-toggle")
                                                        .attr("type", "button");
            let exchange_icon = $("<span />").addClass("fas fa-exchange-alt");
            exchange_shifts_button.append(exchange_icon);
            exchange_shifts_button.attr("data-date", days[day])
                                  .attr("data-emp-id", schedule['employees'][emp]['_id']);
            td.append(exchange_shifts_button);
            td.addClass("vs-shift-cell");

            $(row).append(td);
        };

        $("#schedule-output-body").append(row);
    };

    update_shift_issue_flags(SCHEDULE['shifts'], SCHEDULE['output']);
};

//Shift Change Modal jBox
$(document).on("click", "#shift-change-modal-change, #shift-change-modal-cancel", (e) => {
    console.log("Modal button clicked.");

    console.log(SHIFT_CHANGE_JBOX);
    console.log(this);

    if ($(e.currentTarget).attr("id") == "shift-change-modal-change") {
        console.log("Changing shift.");
        SHIFT_CHANGE_JBOX.options.onClose = function () {
            let shift_row = $(".shift-change-modal-checkbox:checked").parent().parent();
            let shift_id = shift_row.attr("data-shift-id");
            update_shift_assignment(SCHEDULE, shift_id);
        };
        SHIFT_CHANGE_JBOX.close();
    } else {
        SHIFT_CHANGE_JBOX.options.onClose = function () {};
        SHIFT_CHANGE_JBOX.close();
    }
});

$(document).on("change", ".shift-change-modal-checkbox", (e) => {

    console.log("Shift change checkbox clicked.");
    let calling_checkbox = $(e.currentTarget);
    console.log(calling_checkbox);
    console.log(calling_checkbox.prop("checked"));

    if (calling_checkbox.prop("checked")){
        console.log("Preventing default.");
    } else {
        console.log("Changing assignment.");
        $(".shift-change-modal-checkbox").prop("checked", false);
        calling_checkbox.prop("checked", true);
    };
});

$(document).on("click", ".shift-change-modal-toggle", function () {

    let shift_date = $(this).attr("data-date");
    let emp_id = $(this).attr("data-emp-id");

    set_shift_change_modal_content(shift_date, emp_id);

    SHIFT_CHANGE_JBOX = new jBox("Modal", {
        id: "shift-change-jbox",
        title: "Change Shift Assignment",
        content: $("#shift-change-modal-content"),
        footer: create_shift_change_modal_footer(shift_date, emp_id),
        onClose: function () {this.setContent("Modal failed to close.")},
        onCloseComplete: function () {
            console.log("Destroying jBox.")
            this.destroy()}
    });

    SHIFT_CHANGE_JBOX.open();
});


var set_shift_change_modal_content = (date, emp_id) => {
    console.log("Rebuilding shift change modal content.")
    console.log(date);
    console.log(emp_id);

    $("#shift-change-modal-content").remove();
    let modal_content = $("<div />").attr("id", "shift-change-modal-content")
                                    .css("display",  "none");

    let shift_change_table = $("<table />").addClass("table rounded-table-basic table-hover");
    let shift_change_table_head = $("<thead />");
    let shift_change_table_body = $("<tbody />").attr("id", "shift-change-table-body");

    let headers = ['Select', 'Role', 'Time', '# Assigned'];

    let emp = SCHEDULE["employees"].find(emp => emp._id === emp_id)

    modal_content.append($("<h3 />").text(emp['name'] + " - " + date));

    for (label=0; label < headers.length; label++){
        shift_change_table_head.append($("<th />").text(headers[label]));
    };

    let num_emps_per_shift = num_emps_assigned_per_shift(SCHEDULE['shifts'], SCHEDULE['output']);

    shift_change_table_body.append(build_off_row().attr("data-shift-date", date));
    let emp_role_names = [];
    for (role=0; role < emp['roles'].length; role++){
        emp_role_names.push(emp['roles'][role]['role_name']);
    }
    emp_shifts_for_day = get_emp_shifts_for_day(emp_role_names, SCHEDULE['shifts'], SCHEDULE['days'], date)

    console.log(emp_shifts_for_day);
    console.log(num_emps_per_shift);

    for (shift=0; shift < emp_shifts_for_day.length; shift++) {
        console.log(num_emps_per_shift[emp_shifts_for_day[shift]["_id"]]);
        let row = $("<tr />").attr("data-shift-id", emp_shifts_for_day[shift]['_id'])
                             .addClass('shift-change-modal-row');
        row.append($("<td />").append($("<input />").addClass("shift-change-modal-checkbox")
                                                    .attr("type", "checkbox")));
        row.append($("<td />").text(emp_shifts_for_day[shift]['role']));
        row.append($("<td />").text(emp_shifts_for_day[shift]['start'] + " - " + emp_shifts_for_day[shift]['end']));
        row.append($("<td />").text(num_emps_per_shift[emp_shifts_for_day[shift]["_id"]] + "/" + emp_shifts_for_day[shift]['num_employees']));

        shift_change_table_body.append(row);
    };

    let emp_index = SCHEDULE['employees'].indexOf(emp);
    let day_index = SCHEDULE['days'].indexOf(date);

    shift_change_table.append(shift_change_table_head)
                      .append(shift_change_table_body);

    modal_content.append(shift_change_table);

    $("body").append(modal_content);

    mark_current_shift(SCHEDULE['output'][emp_index][day_index]['shift_id']);
};

var create_shift_change_modal_footer = (shift_date, emp_id) => {
    let footer_content = $("<div />").addClass("col-md-12");

    footer_content.append($("<button />").attr("id", "shift-change-modal-cancel")
                                         .addClass("btn btn-default")
                                         .text("Cancel"));

    footer_content.append($("<button />").attr("id", "shift-change-modal-change")
                                         .attr("data-shift-date", shift_date)
                                         .attr("data-emp-id", emp_id)
                                         .addClass("btn btn-success")
                                         .text("Change"));

    return footer_content
};

var mark_current_shift = (shift_id) => {
    console.log("Marking current shift: " + shift_id);
    console.log($(".shift-change-modal-row"));
    let shift_ids = $(".shift-change-modal-row").map(function () { return $(this).attr("data-shift-id")}).get();
    console.log(shift_id);
    console.log(shift_ids);

    if (shift_ids.indexOf(shift_id) >= 0) {
        console.log("Found shift id.");
        $("tr[data-shift-id='" + shift_id + "']").children().last().append($("<span />").addClass("fas fa-check"));
        $("tr[data-shift-id='" + shift_id + "']").children().first().find("input").prop("checked", true);
    } else {
        console.log("No assigned shift.");
        $(".shift-change-off-row").children().first().find("input").prop("checked", true);
        $(".shift-change-off-row").children().last().append($("<span />").addClass("fas fa-check"));
    };
};

var build_off_row = () => {
    let row = $("<tr />");
    row.append($("<td />").append($("<input />").addClass("shift-change-modal-checkbox")
                                                .attr("type", "checkbox")));
    row.append($("<td />").text("OFF"));
    row.append($("<td />").text("-----"));
    row.append($("<td />").text("-----"));
    row.addClass("shift-change-off-row");

    return row
};

// Schedule update functions
var update_shift_assignment = (schedule, shift_id) => {
    console.log("Updating shift assignment.");

    let date = $("#shift-change-modal-change").attr("data-shift-date");
    let emp_id = $("#shift-change-modal-change").attr("data-emp-id");
    let cell_to_edit = get_cell_to_edit(date, emp_id);
    let role_index = -1;

    let shift = null;

    if (shift_id) {
        shift = SCHEDULE["shifts"].find(shift => shift._id === shift_id);
        role_index = GLOBAL_ROLES.indexOf(GLOBAL_ROLES.find(role => role.name === shift['role']));
        cell_to_edit.css("background", GLOBAL_ROLES[role_index]['color']);
    } else {
        shift = "OFF";
        cell_to_edit.css("background", "#cccccc")
    };

    let text_area = cell_to_edit.children(".vs-calendar-shift-cell-text");

    text_area.empty();
    let cell_html = "";
    if (shift != "OFF"){
        cell_html += schedule['roles'][role_index] + "<br>" + shift['start'] + " - " + shift['end'];
    } else {
        cell_html += "OFF";
    };
    text_area.html(cell_html);

    //Update database
    post_shift_change(date, emp_id, shift);
};

var get_cell_to_edit = (date, emp_id) => {

    let vs_calendar_shifts = $("#vs-calendar-shifts");
    let emp_index = SCHEDULE['employees'].indexOf(SCHEDULE['employees'].find(emp => emp._id === emp_id))
    let day_index = SCHEDULE['days'].indexOf(date);

    let cell_to_edit = vs_calendar_shifts.children(":nth-child(" + select_cell(emp_index, day_index) + ")");
    console.log("Cell to edit:");
    console.log(cell_to_edit);
    return cell_to_edit
};

var select_cell = (emp_index, day_index) => {

    let cells_above = emp_index * SCHEDULE['days'].length;

    let cell_index = cells_above + day_index + 1; //1 to change to 1-indexing for nth-child
    console.log("Cell index: " + cell_index);
    return cell_index;
};

var post_shift_change = (date, emp_id, shift) => {
    let data = {
        schedule_id: SCHEDULE['_id'],
        date: date,
        emp_id: emp_id,
        shift: shift
    };
    $.ajax({
        type: "POST",
        url: "/_change_shift_assignment",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(data){
            //Reload SCHEDULE
            SCHEDULE = data;
            console.log("SCHEDULE reloaded @ view_schedule -> post_shift_change")
            //Check for missing shifts
            //Check for over-assigned shifts
            update_shift_issue_flags(SCHEDULE['shifts'], SCHEDULE['output']);
        }
    });
};

var update_shift_issue_flags = (shifts, output) => {

    $(".vs-calendar-shift-issue-warning").remove();

    console.log("Updating shift issue flags.");

    let expected_emps_per_shift = {};
    let assigned_emps_per_shift = num_emps_assigned_per_shift(shifts, output);
    let dates = SCHEDULE['days'];

    for (shift=0; shift < shifts.length; shift++) {
        expected_emps_per_shift[shifts[shift]['_id']] = shifts[shift]['num_employees'];
    };

    let shifts_with_issues = [];

    for (shift=0; shift < shifts.length; shift++){

        let shift_id = shifts[shift]['_id'];

        if (expected_emps_per_shift[shift_id] != assigned_emps_per_shift[shift_id]){
            shifts_with_issues.push(shifts[shift]);
        };
    };

    let shifts_with_issues_by_day = group_shifts_by_day(shifts_with_issues);

    for (day=0; day < shifts_with_issues_by_day.length; day++){
          console.log(day);
          console.log(shifts_with_issues_by_day);
          console.log(shifts_with_issues_by_day[day].length);
          if (shifts_with_issues_by_day[day].length > 0){
                 console.log("Adding warning text / icon.");
                 //make a warning icon
                 let warning_icon = $("<span />").attr("id", "shift-issue-warning-icon-" + day)
                                                .addClass("fas fa-exclamation-triangle shift-issue-warning-icon");

                 //attach warning icon to header cell
                 let day_index = SCHEDULE['days'].indexOf(shifts_with_issues_by_day[day][0]['date']) + 1; //Accounts for emp column

                 let header_cell = $("#vs-calendar-header-row").children(":nth-child(" + day_index + ")");

                 let warning_container = $("<div />").addClass("vs-calendar-shift-issue-warning");

                 let issue_warning = $("<p />").attr("id", "shift-issue-warning-text-" + day)
                                                .attr("data-date", shifts_with_issues_by_day[day][0]['date'])
                                                .data("shifts-with-issues", shifts_with_issues_by_day[day])
                                                .append(warning_icon)
                                                .append(" " + shifts_with_issues_by_day[day].length + " issue(s)");

                 warning_container.append(issue_warning);
                 header_cell.append(warning_container);

                 let tooltip = new jBox('Tooltip', {
                    attach: '#shift-issue-warning-text-' + day,
                    title: 'Shift Issues',
                    content: "No shifts with issues.",
                    onOpen: function() {

                        let date = this.source.attr("data-date");
                        let day_index = SCHEDULE['days'].indexOf(date);
                        let shifts_with_issues = this.source.data("shifts-with-issues");

                        set_warning_icon_tooltip_content(shifts_with_issues, output);
                        this.setContent($("#shift-issue-warning-tooltip-content"));
                    }
                 });
          };
    };
};

function set_warning_icon_tooltip_content(shifts, output) {

    let tooltip_content = $("#shift-issue-warning-tooltip-content");

    console.log(tooltip_content);

    tooltip_content.empty();

    console.log(shifts);
    console.log(output);

    let num_emps_per_shift = num_emps_assigned_per_shift(shifts, output);

    for (shift=0; shift < shifts.length; shift++) {

        let tooltip_text = shifts[shift]['role'] + " -- " + shifts[shift]['start'] + " - " + shifts[shift]['end'] +
        " -- " + num_emps_per_shift[shifts[shift]['_id']] + "/" + shifts[shift]['num_employees']

        if (!(shift == shifts.length - 1)) {
            tooltip_text = tooltip_text + "<hr>";
        }

        console.log(tooltip_text);
        tooltip_content.append(tooltip_text);
    };
};


//Utilities (move these to a central file at some point)
function num_emps_assigned_per_shift(shifts, output) {

    let num_emps_per_shift = {};
    for (shift = 0; shift < shifts.length; shift++){
        num_emps_per_shift[shifts[shift]["_id"]] = 0;
    }
    for (emp = 0; emp < output.length; emp++){
        for (shift_day = 0; shift_day < output[emp].length; shift_day++){
            num_emps_per_shift[output[emp][shift_day]["shift_id"]] += 1;
        }
    }

    return num_emps_per_shift
};

var get_eligible_shifts = (emp_roles, shifts) => {

    let eligible_shifts = [];

    for (role=0; role<emp_roles.length; role++){
        for (shift=0; shift<shifts.length; shift++){
            if (emp_roles[role] == shifts[shift]['role']){
                eligible_shifts.push(shifts[shift])
            };
        };
    };

    return eligible_shifts
};

var get_emp_shifts_for_day = (emp_roles, shifts, days, date) => {
    let eligible_shifts_by_day = vs_get_shifts_by_day(get_eligible_shifts(emp_roles, shifts), days);
    let day_index = days.indexOf(date);

    return shifts_by_day[day_index]
};

function vs_get_shifts_by_day(shifts, days){

    shifts_by_day = []
    for (i=0; i<days.length; i++){
        daily_shifts = []
        for(shift=0; shift<shifts.length; shift++){
            if (shifts[shift]['date'] == days[i]){
                daily_shifts.push(shifts[shift])
            };
        };
        shifts_by_day.push(daily_shifts);
    };

    return shifts_by_day
};

function group_shifts_by_day(shifts) {
    let dates = [];

    for (i=0; i < shifts.length; i++){
        console.log(dates);
        console.log(shifts[i]['date']);
        if (!(dates.indexOf(shifts[i]['date']) >= 0)){
            dates.push(shifts[i]['date']);
        };
    };

    console.log(dates);

    let shifts_by_day = [];

    for (date=0; date < dates.length; date++) {
        let shifts_for_day = [];
        for (shift=0; shift < shifts.length; shift++) {
            if (shifts[shift]['date'] == dates[date]) {
                console.log("Adding shifts to day.");
                console.log(day);
                console.log(dates[date]);
                console.log(shifts[shift]['date']);
                shifts_for_day.push(shifts[shift]);
            };
        };

        shifts_by_day.push(shifts_for_day);
    };

    return shifts_by_day;
};