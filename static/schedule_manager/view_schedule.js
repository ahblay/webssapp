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

function render_schedule_header(schedule, start_date_index, duration=7){

    $("#schedule-output-body").empty();

    days = schedule["days"]
    if (days.length > duration){
        max_days = days.length
    } else {
        max_days = duration;
    };

    for (i=0; i<max_days; i++){
        $("#schedule-output-header").append( $('<th />', {text: days[i]}) );
    };

    for (i=0; i<schedule["employees"].length; i++){
        let row = document.createElement('tr')
        let name_td = document.createElement('td')


    };
};