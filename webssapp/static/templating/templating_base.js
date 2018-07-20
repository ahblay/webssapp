// Choose shift template modal
$(document).on("click", ".choose-shift-template-modal-open", function (){
    // Get templates
    let templates = []
    $.getJSON("/apply_shift_template", function(data){
        templates = data;
    }).done(function(templates){
        let on_confirm = function(){
            let choose_template_confirm = confirm("This will overwrite the current shifts. Are you sure you want to continue?")
            if (choose_template_confirm){
                postApplyShiftTemplate()
            };
        };
        let modal = createChooseShiftTemplateModal(templates, on_confirm);
        modal.show();
    });
});

function postApplyShiftTemplate(schedule_id, template_id){
    data = {
        "schedule_id": schedule_id,
        "template_id": template_id
    };

    $.ajax({
        type: "POST",
        url: "/apply_shift_template",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(response){
            processPostResponse(response, onApplyShiftTemplateSuccess);
        };
    });
};

function createChooseShiftTemplateModal(templates, on_confirm){
    let ids = getIds(templates);
    let names = getNames(templates);
    let data = {ids: ids, names: names};
    let modal = createSelectModal("Choose A Template", data, on_confirm);
    return modal
};

function onApplyShiftTemplateSuccess(response){
    // reload schedule
    // reload shifts
};

// Choose emp template modal

// Save shift template modal

// Save emp template modal