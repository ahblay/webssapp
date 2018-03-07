//Path from root/templates/
let SCHEDULE_MANAGER_TEMPLATE_DIR_PATH = "schedule_manager/"

fetch_tab_bodies();

$('#tab-select .btn-secondary').on('click', function(){

    if ($(this).hasClass('active')){
        return
    };

    let current_view = $(".btn-secondary.active");
    current_view.removeClass("active");
    $(this).addClass("active")

    change_view(current_view.data("view-id"), $(this).data("view-id"))
});

function change_view(current_view_id, new_view_id){
    let current_view = $("#" + current_view_id)
    console.log(current_view)
    current_view.fadeOut().promise().done(function(){
        console.log(current_view.attr("id") + " faded out.");
        let new_view = $("#" + new_view_id);
        new_view.fadeIn();
    });
};

function fetch_tab_bodies(){
    var tab_ids = $(".smgr-tab").map(function(){return $(this).attr("id");}).get();
    for (i=0; i<tab_ids.length; i++){
        let html_path = SCHEDULE_MANAGER_TEMPLATE_DIR_PATH + tab_ids[i].replace("-", "_") + ".html";
        $("#" + tab_ids[i]).load("/load_html/" + html_path);
        console.log("Loaded html from " + html_path + " to #" + tab_ids[i]);
    };
};