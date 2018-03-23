$(document).on("click", "#create-schedule", function(){
    console.log(SCHEDULE_ID)
    $.get("/api/create_schedule/" + SCHEDULE_ID);
});