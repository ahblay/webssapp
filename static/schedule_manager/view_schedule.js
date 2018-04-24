var SCHEDULE = [];

$(document).on("click", "button[data-view-id='view-schedule']", () => {
    $.getJSON("/api/get_sorted_schedule/" + SCHEDULE_ID, function(data){
        SCHEDULE = data;
        console.log(SCHEDULE);
        if (SCHEDULE["output"] != null){
            console.log("Rendering saved output.")
            render_schedule(SCHEDULE);
        };
    });

});

$(document).on("click", "#create-schedule", function(){
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
            let td = $('<td />')
            $(td).css("border-top", "1px solid")
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
        height: (SCHEDULE['employees'].length > 15) ? 15*46 : 46*SCHEDULE['employees'].length+50,
        colModal: col_modal
    });
};