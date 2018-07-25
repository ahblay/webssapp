// Choose shift template modal
$(document).on("click", ".choose-shift-template-modal-open", function (){
    // Get templates
    let templates = []
    $.getJSON("/get_shift_templates", function(data){
        templates = data;
    }).done(function(templates){
        let on_confirm = function(){
            let choose_template_confirm = confirm("This will overwrite the current shifts. Are you sure you want to continue?");
            if (choose_template_confirm){
                postApplyShiftTemplate(SCHEDULE['_id'], $($(".select-modal-input:checked").get()[0]).attr("data-id"));
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
        }
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
    SCHEDULE = response['new_schedule']
    // reload shifts
    loadShiftCalendar(SCHEDULE['shifts']);
};

// Choose emp template modal
$(document).on("click", ".choose-emp-template-modal-open", function (){
    // Get templates
    let templates = []
    $.getJSON("/get_emp_templates", function(data){
        templates = data;
    }).done(function(templates){
        let on_confirm = function(){
            let choose_template_confirm = confirm("This will overwrite the current employees for this schedule. Are you sure you want to continue?");
            if (choose_template_confirm){
                postApplyEmpTemplate(SCHEDULE['_id'], $($(".select-modal-input:checked").get()[0]).attr("data-id"));
            };
        };
        let modal = createChooseEmpTemplateModal(templates, on_confirm);
        modal.show();
    });
});

function postApplyEmpTemplate(schedule_id, template_id){
    data = {
        "schedule_id": schedule_id,
        "template_id": template_id
    };

    $.ajax({
        type: "POST",
        url: "/apply_emp_template",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(response){
            processPostResponse(response, onApplyEmpTemplateSuccess);
        }
    });
};

function createChooseEmpTemplateModal(templates, on_confirm){
    let ids = getIds(templates);
    let names = getNames(templates);
    let data = {ids: ids, names: names};
    let modal = createSelectModal("Choose A Template", data, on_confirm);
    return modal
};

function onApplyEmpTemplateSuccess(response){
    SCHEDULE = response['new_schedule']
    // reload emps?
    // reload prefs?
};

// Save emp template modal
$(document).on("click", ".save-emp-template-modal-open", function(){
    let templates = []
    $.getJSON("/get_emp_templates", function(data){
        templates = data;
    }).done(function(templates){
        let on_confirm = function(){
            // TODO: Pour one out if this code actually works.
            if ($(".text-input-modal-input-field").val() in getNames(templates)){
                let save_template_confirm = confirm("There is already a template with that name. This action will overwrite that template. Are you sure you want to continue?");
                if (choose_template_confirm){
                    postSaveEmpTemplate(SCHEDULE['_id'], $(".text-input-modal-input-field").val());
                };
            } else {
                postSaveEmpTemplate(SCHEDULE['_id'], $(".text-input-modal-input-field").val());
            };
        };
        let modal = createSaveEmpTemplateModal(templates, on_confirm);
        modal.show();
    });
});

function postSaveEmpTemplate(schedule_id, template_name){
    data = {
        "schedule_id": schedule_id,
        "template_name": template_name
    };

    $.ajax({
        type: "POST",
        url: "/apply_emp_template",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(response){
            processPostResponse(response, onSaveEmpTemplateSuccess);
        }
    });
};

function createSaveEmpTemplateModal(on_confirm){
    let modal = makeTextInputModal("Save Template", on_confirm);
    return modal
};

function onSaveEmpTemplateSuccess(response){
    SCHEDULE = response['new_schedule']
    // reload emps?
    // reload prefs?
};

// Save emp template modal