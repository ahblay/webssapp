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

    days = schedule["days"]

    console.log(days);

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
            emps_work_for_day = schedule.output[emp][day];

            if (emps_work_for_day["working"]) {
                $(td).html(schedule["roles"][emps_work_for_day["role"]] + "<br>" +
                emps_work_for_day["shift"]);

                if (emps_work_for_day["declined"]) {
                    $(td).addClass("declined-shift");
                };
            } else {
                $(td).text('OFF');
            };

            vs_shifts_dropdown = $("<div />").addClass("dropdown")

            vs_shifts_dropdown.append($("<a />").addClass("dropdown-toggle")
                                        .attr("data-toggle", "dropdown")
                                        .attr("id", "vs-shifts-dropdown-" + emp + "-" + day)
                                        .attr("aria-haspopup", true)
                                        .attr("aria-expanded", false)
                                        .attr("href", "#")
                                        .html("<span class='fas fa-angle-down'></span>"));

            vs_shifts_dropdown_menu = $("<ul />").addClass("dropdown-menu vs-shifts-dropdown")
                                        .attr("aria-labelledby", "vs-shifts-dropdown-" + emp + "-" + day)

            eligible_shifts = vs_get_shifts_by_day(get_eligible_shifts(
                                                    schedule["employees"][emp]["roles"], schedule["shifts"]), days);
            console.log(eligible_shifts)
            for (shift=0; shift < eligible_shifts[day].length; shift++){
                $(vs_shifts_dropdown_menu).append($("<li />").addClass("dropdown-item").text("Test Text"));
                $(vs_shifts_dropdown_menu).append($("<li />").addClass("divider"));
            };

            vs_shifts_dropdown.append(vs_shifts_dropdown_menu);

            $(td).append(vs_shifts_dropdown);

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
};

var get_eligible_shifts = (roles, shifts) => {

    let eligible_shifts = [];

    for (role=0; role<roles.length; role++){
        for (shift=0; shift<shifts.length; shift++){
            if (roles[role] == shifts[shift]['role']){
                eligible_shifts.push(shifts[shift])
            };
        };
    };

    return eligible_shifts
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