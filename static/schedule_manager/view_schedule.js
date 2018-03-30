$(document).on("click", "#create-schedule", function(){
    $.getJSON("/api/create_schedule/" + SCHEDULE_ID, function(data){
        start_index = 0
        render_schedule_header(data, start_index);
    });
});

function render_schedule(schedule){

    //Render table header (dates)
    let

    //Render rows

};

// WHY IS DURATION 7????
function render_schedule_header(schedule, start_date_index, duration=7){

    $("#schedule-output-body").empty();

    $("#schedule-output-header").append($('<th />', {text: "Employees"}))

    days = schedule["days"]
    if (days.length > duration){
        max_days = duration;
    } else {
        max_days = days.length
    };

    for (i=0; i<max_days; i++){
        $("#schedule-output-header").append( $('<th />', {text: days[i]}) );
    };

    for (emp=0; emp<schedule["employees"].length; emp++){
        let row = document.createElement('tr');
        $(row).append($('<th />', {text: schedule["employees"][emp]["name"]}).css("border-top", "1px solid"));
        for (day=0; day<schedule["days"].length; day++){
            let td = $('<td />')
            $(td).css("border-top", "1px solid")
            emps_work_for_day = schedule.output[emp][day];

            if (emps_work_for_day["working"]) {
                $(td).html(schedule['roles'][emps_work_for_day['role']] + "<br>" + emps_work_for_day['shift']);

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
};