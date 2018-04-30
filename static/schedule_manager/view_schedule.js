var SCHEDULE = [];

$(document).on("click", "button[data-view-id='view-schedule']", () => {
    $.getJSON("/api/get_sorted_schedule/" + SCHEDULE_ID, function(data){
        SCHEDULE = data;
        console.log(SCHEDULE);
        if (SCHEDULE["output"] != null){
            console.log("Rendering saved output.");
            render_schedule(SCHEDULE);
        };
    });

});

$(document).on("click", "#create-schedule", () => {
    confirm_reschedule = confirm("A schedule already exists. Recreating the schedule will cause the existing schedule to be" +
    " overwritten and any manual changes will be lost. Are you sure you would like to continue?")

        $.getJSON("/api/create_schedule/" + SCHEDULE_ID, function(data){
            SCHEDULE = data;
            render_schedule(SCHEDULE);
        });
});

function render_schedule(schedule){
    console.log("Rendering view-schedule page.")

    $("#schedule-output-div").empty().addClass("col-md-12");
    console.log($("#schedule-output-div"));
    $("#schedule-output-div").append($("<table />")
                              .attr("id", "schedule-output-table")
                              .addClass("table rounded-table-basic table-hover"));

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
            td.addClass("vs-shift-cell")

            $(row).append(td);
        };

        $("#schedule-output-body").append(row);
    };

    col_modal = [];

    for(i=0; i<days.length+1; i++){
        col_modal.push({width: 175, align: "center"})
    };
    console.log(col_modal);

    $("#schedule-output-table").fxdHdrCol({
        fixedCols: 1,
        width: "100%",
        height: 46*SCHEDULE['employees'].length+50,
        colModal: col_modal
    });

    let shift_change_modal = new jBox("Modal", {
        attach: ".shift-change-modal-toggle",
        title: "Change Shift Assignment",
        content: "There are no shifts to display.",
        onOpen: function () {
            let shift_date = this.source.attr("data-date");
            let emp_id = this.source.attr("data-emp-id");

            console.log(this);
            console.log(this.source);

            set_shift_change_modal_content(shift_date, emp_id, schedule);
            this.setContent($("#shift-change-modal-content"));
        }
    });
};

var set_shift_change_modal_content = (date, emp_id, schedule) => {

    $("#shift-change-modal-content").empty();

    let shift_change_table = $("<table />").addClass("table rounded-table-basic table-hover");
    let shift_change_table_head = $("<thead />");
    let shift_change_table_body = $("<tbody />").attr("id", "shift-change-table-body");

    let headers = ['Select', 'Role', 'Time', '# Assigned'];

    let emp = schedule["employees"].find(emp => emp._id === emp_id)

    $("#shift-change-modal-content").append($("<h1 />").text(emp['name'] + " - " + date));

    for (label=0; label < headers.length; label++){
        shift_change_table_head.append($("<th />").text(headers[label]));
    };

    let num_emps_per_shift = num_emps_assigned_per_shift(schedule['shifts'], schedule['output']);

    shift_change_table_body.append(build_off_row().attr("data-shift-date", date));

    emp_shifts_for_day = get_emp_shifts_for_day(emp['roles'], schedule['shifts'], schedule['days'], date)

    for (shift=0; shift < emp_shifts_for_day.length; shift++) {
        let row = $("<tr />").attr("data-shift-id", emp_shifts_for_day[shift]['_id'])
                             .addClass('shift-change-modal-row');
        row.append($("<td />").append($("<input />").addClass("shift-change-modal-checkbox")
                                                    .attr("type", "checkbox")));
        row.append($("<td />").text(emp_shifts_for_day[shift]['role']));
        row.append($("<td />").text(emp_shifts_for_day[shift]['start'] + " - " + emp_shifts_for_day[shift]['end']));
        row.append($("<td />").text(num_emps_per_shift[schedule["shifts"][shift]["_id"]] + "/" + emp_shifts_for_day[shift]['num_employees']));

        shift_change_table_body.append(row);
    };
    let emp_index = schedule['employees'].indexOf(emp);
    let day_index = schedule['days'].indexOf(date);

    modal_content = $("#shift-change-modal-content");
    shift_change_table.append(shift_change_table_head)
                        .append(shift_change_table_body);

    modal_content.append(shift_change_table);

    mark_current_shift(schedule['output'][emp_index][day_index]['shift_id']);

};

var mark_current_shift = (shift_id) => {
    console.log("Marking current shift: " + shift_id);
    console.log($(".shift-change-modal-row"));
    let shift_ids = $(".shift-change-modal-row").map(function () { return $(this).attr("data-shift-id")}).get();
    console.log(shift_id);
    console.log(shift_ids);

    if (shift_ids.indexOf(shift_id) >= 0

    ) {
        console.log("Found shift id.");
        $("tr[data-shift-id='" + shift_id + "']").children().last().append($("<span />").addClass("fas fa-check"));
    } else {
        console.log("No assigned shift.");
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

var num_emps_assigned_per_shift = (shifts, output) => {

    let num_emps_per_shift = {};
    for (shift = 0; shift < shifts.length; shift++){
        num_emps_per_shift[shifts[shift]["_id"]] = 0;
    }
    for (emp = 0; emp < output.length; emp++){
        for (day = 0; day < output[emp].length; day++){
            num_emps_per_shift[output[emp][day]["shift_id"]] += 1;
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