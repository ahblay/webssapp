var SCHEDULE = [];

$(document).on("click", "#create-schedule", function(){
    $.getJSON("/api/create_schedule/" + SCHEDULE_ID, function(data){
        SCHEDULE = data;
        render_schedule(SCHEDULE, start_date_index=0);
    });
});

function render_schedule(schedule, start_date_index, duration=7){
    console.log("Rendering view-schedule page.")
    console.log(start_date_index);
    console.log(duration);

    $("#schedule-output-header").empty();
    $("#schedule-output-body").empty();

    days = schedule["days"]

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