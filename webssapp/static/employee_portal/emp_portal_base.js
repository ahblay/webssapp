// Load user schedules
let emp_schedules = [];
$.getJSON("/get_user_schedules", function(data){
    emp_schedules = data;
    console.log(data);
    renderShiftsThisWeek(data);
})

// Populate shifts this week
function renderShiftsThisWeek(schedules){
    for (schedule=0; schedule < schedules.length; schedule++){
        let sched_block = document.createElement("div");
        $(sched_block).text(schedules[schedule]["name"]);
        $(".emp-portal-shifts-this-week").append(sched_block);
    }
}
// Populate upcoming schedules

// Populate schedule history