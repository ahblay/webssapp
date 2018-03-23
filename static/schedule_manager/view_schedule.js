$(document).on("click", "#create-schedule", function(){
    console.log(SCHEDULE_ID)
    $.getJSON("/api/create_schedule/" + SCHEDULE_ID, function(data){
        $('#schedule-output').text(data)
    });
});