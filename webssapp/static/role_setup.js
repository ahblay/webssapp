//On load
$.getJSON("/_api/get_roles", function(data) {
    refresh_table_data(data);
});

$(".basic").spectrum({
    color: "#fff",
    change: function(color) {
        console.log("change called: " + color.toHexString());
    }
});

$(document).ready(function () {
    new jBox('Tooltip', {
        attach: '#previous-schedule-icon',
        content: $("#previous-schedules-tooltip"),
        closeOnMouseleave: true
    });
    new jBox('Tooltip', {
        attach: '#current-schedule-icon',
        content: $("#current-schedules-tooltip"),
        closeOnMouseleave: true
    });
    new jBox('Tooltip', {
        attach: '#upcoming-schedule-icon',
        content: $("#upcoming-schedules-tooltip"),
        closeOnMouseleave: true
    });
})

function openSchedule(id) {
    console.log(id)
    //var scheduleID = $(this).data("schedule-id")
    window.location.href = "/view_schedule/" + id
}

//Main table functions
$(document).on("click", "#check-all-roles", function(){
    $(".row-select-checkbox").not(this).prop("checked", this.checked)
    console.log("Check-all selected, updating buttons.")
    var num_boxes_selected = $(".row-select-checkbox:checked").length
    if ( num_boxes_selected > 0) {
        $("#edit-roles").removeAttr("disabled");
        $("#remove-roles").removeAttr("disabled");
    } else {
        $("#edit-roles").attr("disabled", "disabled")
        $("#remove-roles").attr("disabled", "disabled")
    };
});

$(document).on("change", ".row-select-checkbox", function(){
    var num_boxes_selected = $(".row-select-checkbox:checked").length
    if ( num_boxes_selected > 0) {
        $("#edit-roles").removeAttr("disabled");
        $("#remove-roles").removeAttr("disabled");
    } else {
        $("#edit-roles").attr("disabled", "disabled")
        $("#remove-roles").attr("disabled", "disabled")
    };
});

$(document).on("click", "#add-role-submit", function () {
    var data = {name: $("#add-role").val(), color: $("#role-color-select").spectrum('get').toHexString()}
    console.log(data)
    $.ajax({
        type: "POST",
        url: "/_add_role",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(){
            $("#edit-roles").attr("disabled", "disabled");
            $("#remove-roles").attr("disabled", "disabled");
            $("#role-table-body").empty();
            $.getJSON("/_api/get_roles", function(data) {
                refresh_table_data(data);
            });
        }
    });
})

function refresh_table_data(data) {
    console.log(data)
    for (i = 0; i < data.length; i++) {
        let tr = document.createElement("tr")

        let checkbox_td = document.createElement("td")
        $(checkbox_td).css("border-top", "1px solid").css("width", "50px")
        let label = document.createElement("label");
        $(label).addClass("checkbox-container");
        let span = document.createElement("span");
        $(span).addClass("custom-checkbox");
        let input = $(document.createElement("input"));
        input.addClass("row-select-checkbox");
        input.attr("type", "checkbox");
        input.attr("id", data[i]["_id"]);
        input.val("");
        console.log(input);
        $(label).append(input);
        $(label).append(span);
        $(checkbox_td).append(label);
        $(tr).append(checkbox_td);

        let name_td = document.createElement("td")
        $(name_td).css("border-top", "1px solid")
        $(name_td).append(data[i]["name"])
        $(tr).append(name_td)


        let color_td = document.createElement("td")
        $(color_td).css("border-top", "1px solid")

        /*
        let color_box = document.createElement("div")
        $(color_box).addClass("role-color-box").css("background-color", data[i]["color"])
        $(color_td).append(color_box)
        */

        let color_picker = document.createElement("input")
        $(color_picker).addClass("spectrum-edit").val(data[i]["color"])
        $(color_picker).attr("data-shift-name", data[i]["name"])
        $(color_td).append(color_picker)
        $(tr).append(color_td)

        $("#roles-table-master tbody").append(tr)
    }
    $(".spectrum-edit").spectrum({
        showPaletteOnly: true,
        showPalette: true,
        palette: [
            ['#717270', '#28B799', '#F8Bf39',
            '#F1EAD1', '#D75749'],
            ['#225085', '#28B5C7', '#EA7D33', '#C24B74']
        ],
        change: function(color) {
            data = {"name": $(this).data("shift-name"), "color": color.toHexString()}
            console.log(data)
            $.ajax({
                type: "POST",
                url: "/edit_role",
                data: JSON.stringify(data),
                contentType: "application/json",
                dataType: "json",
                encode: "true"
                //success: success
            });
        }
    });
}

//Remove role functions
$(document).on("click", "#remove-roles", function() {
    var message = "Are you sure that you wish to remove these roles from the master list? All schedules will " +
                  "no longer include these roles. This will BREAK THE ALGORITHM."
    var confirmed = confirm(message);
    if (confirmed){

        data = {
            "_ids": $(".row-select-checkbox:checked").map(function(){return this.id}).get()
        };

        let success = function() {
                $("#edit-roles").attr("disabled", "disabled");
                $("#remove-roles").attr("disabled", "disabled");
                $("#role-table-body").empty();
                console.log("Refreshing Table")
                $.getJSON("/_api/get_roles", function(data){
                    console.log(data)
                    refresh_table_data(data);
                });
        };

        $.ajax({
        type: "POST",
        url: "/_remove_roles",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: success
        });
    };
});