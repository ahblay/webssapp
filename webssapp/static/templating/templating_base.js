// Choose shift template modal
let Active_JBOX = null;

$(document).on("click", "#choose-shift-template-modal-open", function (){
    // Get templates
    console.log("Opening choose shift template modal.");
    let templates = []
    $.getJSON("/get_shift_templates").done(function(response){
        console.log(response['templates'])
        let templates = filterShiftTemplatesByLength(response['templates'], SCHEDULE.days.length)
        console.log(templates)
        Active_JBOX = createChooseShiftTemplateModal(templates);
        Active_JBOX.open();
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

function createChooseShiftTemplateModal(templates){
    console.log(templates)
    let ids = getIds(templates);
    let names = getNames(templates);
    let data = {ids: ids, names: names};
    console.log(data);
    let button_ids = {
    'cancel': "choose-shift-template-modal-cancel",
    'confirm': "choose-shift-template-modal-apply"
    }
    let modal = createSelectModal("Choose A Template", data, ['Select', 'Name'], button_ids);
    return modal
};

function onApplyShiftTemplateSuccess(response){
    SCHEDULE = response['new_schedule']
    Active_JBOX.destroy();
    Active_JBOX = null;
    // reload shifts
    loadShiftCalendar(SCHEDULE['shifts']);
};

$(document).on("click", "#choose-shift-template-modal-cancel", function(){
    Active_JBOX.destroy();
    Active_JBOX = null;
});

$(document).on("click", "#choose-shift-template-modal-apply", function(){
    let choose_template_confirm = confirm("This will overwrite the current shifts. Are you sure you want to continue?");
    if (choose_template_confirm){
        postApplyShiftTemplate(SCHEDULE['_id'], $($(".select-modal-row-checkbox:checked").get(0)).attr("data-id"));
    };
});

// Choose emp template modal
$(document).on("click", "#choose-emp-template-modal-open", function (){
    // Get templates
    console.log("Opening choose emp template modal.");
    let templates = []
    $.getJSON("/get_emp_templates").done(function(response){
        Active_JBOX = createChooseEmpTemplateModal(response['templates']);
        Active_JBOX.open();
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
            processPostResponse(response, onApplyShiftTemplateSuccess);
        }
    });
};

function createChooseEmpTemplateModal(templates){
    let ids = getIds(templates);
    let names = getNames(templates);
    let data = {ids: ids, names: names};
    let button_ids = {
    'cancel': "choose-emp-template-modal-cancel",
    'confirm': "choose-emp-template-modal-apply"
    }
    let modal = createSelectModal("Choose A Template", data, ['Select', 'Name'], button_ids);
    return modal
};

function onApplyEmpTemplateSuccess(response){
    SCHEDULE = response['new_schedule']
    Active_JBOX.destroy();
    Active_JBOX = null;
    // reload emps
};

$(document).on("click", "#choose-emp-template-modal-cancel", function(){
    Active_JBOX.destroy();
    Active_JBOX = null;
});

$(document).on("click", "#choose-emp-template-modal-apply", function(){
    let choose_template_confirm = confirm("This will overwrite the current employees. Are you sure you want to continue?");
    if (choose_template_confirm){
        postApplyEmpTemplate(SCHEDULE['_id'], $($(".select-modal-row-checkbox:checked").get(0)).attr("data-id"));
    };
});

// Save emp template modal
$(document).on("click", "#save-emp-template-modal-open", function(){
    let templates = []
    $.getJSON("/get_emp_templates").done(function(templates){
        Active_JBOX = createSaveEmpTemplateModal("save-emp-template-modal-cancel", "save-emp-template-modal-confirm");
        Active_JBOX.open();
    });
});

function postSaveEmpTemplate(schedule_id, template_name){
    data = {
        "schedule_id": schedule_id,
        "name": template_name,
    };

    $.ajax({
        type: "POST",
        url: "/save_emp_template",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(response){
            processPostResponse(response, onSaveEmpTemplateSuccess);
        }
    });
};

function createSaveEmpTemplateModal(cancel_button_id, confirm_button_id){
    let modal = makeTextInputModal("Save Template", cancel_button_id, confirm_button_id);
    return modal
};

$(document).on("click", "#save-emp-template-modal-confirm", function(){
    $.getJSON("/get_emp_templates").done(function(response){
        if (getNames(response['templates']).indexOf($(".text-input-modal-input-field").val()) > -1){
            let save_template_confirm = confirm("There is already a template with that name. This action will overwrite that template. Are you sure you want to continue?");
            if (save_template_confirm){
                postSaveEmpTemplate(SCHEDULE['_id'], $(".text-input-modal-input-field").val());
            };
        } else {
            postSaveEmpTemplate(SCHEDULE['_id'], $(".text-input-modal-input-field").val());
        };
    });
});

$(document).on("click", "#save-emp-template-modal-cancel", function(){
    Active_JBOX.destroy();
    Active_JBOX = null;
});

function onSaveEmpTemplateSuccess(response){
    Active_JBOX.destroy();
    Active_JBOX = null;
};

// Save shift template modal
$(document).on("click", "#save-shift-template-modal-open", function(){
    let templates = []
    $.getJSON("/get_shift_templates").done(function(templates){
        Active_JBOX = createSaveShiftTemplateModal("save-shift-modal-cancel", "save-shift-modal-confirm");
        Active_JBOX.open();
    });
});

function postSaveShiftTemplate(schedule_id, template_name){
    data = {
        "schedule_id": schedule_id,
        "name": template_name,
    };

    $.ajax({
        type: "POST",
        url: "/save_shift_template",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(response){
            processPostResponse(response, onSaveShiftTemplateSuccess);
        }
    });
};

function createSaveShiftTemplateModal(cancel_button_id, confirm_button_id){
    let modal = makeTextInputModal("Save Template", cancel_button_id, confirm_button_id);
    return modal
};

$(document).on("click", "#save-shift-modal-confirm", function(){
    $.getJSON("/get_shift_templates").done(function(response){
        if (getNames(response['templates']).indexOf($(".text-input-modal-input-field").val()) > -1){
            let save_template_confirm = confirm("There is already a template with that name. This action will overwrite that template. Are you sure you want to continue?");
            if (save_template_confirm){
                postSaveShiftTemplate(SCHEDULE['_id'], $(".text-input-modal-input-field").val());
            };
        } else {
            postSaveShiftTemplate(SCHEDULE['_id'], $(".text-input-modal-input-field").val());
        };
    });
});

$(document).on("click", "#save-shift-modal-cancel", function(){
    Active_JBOX.destroy();
    Active_JBOX = null;
});

function onSaveShiftTemplateSuccess(response){
    Active_JBOX.destroy();
    Active_JBOX = null;
};