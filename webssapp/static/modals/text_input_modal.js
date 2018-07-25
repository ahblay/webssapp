// This file defines a simple single line text input modal (eg to enter a name)

function makeTextInputModal(title, on_confirm){
    let modal = new jBox({
        title: title,
    })
    modal.setContent(makeTextInputModalContent());
    modal.setFooter(makeTextInputFooter(modal, validate, on_confirm));
    modal.addClass("text-input-modal");
    return modal
};

function makeTextInputContent(){
    let text_input_content = $("<div />").addClass("text-input-modal-content");
    let input_field = $("<input />").addClass("text-input-modal-input-field")
                                    .prop("type", "text");
    text_input_content.append(input_field);
    return text_input_content
}

function makeTextInputFooter(modal, validate, on_confirm){
    let modal_footer = $("<div />").addClass("text-input-modal-footer");
    let cancel_button = makeTextInputModalCancel(modal);
    let confirm_button = makeTextInputModalConfirm(validate, on_confirm);
    modal_footer.append(cancel_button, confirm_button);
    return modal_footer
}

function makeTextInputModalCancel(modal){
    let cancel_button = $("<button />").addClass("btn btn-default select-modal-cancel-button");
    let on_cancel = function(modal){
        modal.destroy();
    }
    cancel_button.click(on_cancel);
    return cancel_button
};

function makeTextInputModalConfirm(on_confirm){
    let confirm_button = $("<button />").addClass("btn btn-default select-modal-cancel-button");
    let on_click = function(on_confirm){
        on_confirm();
    };
    confirm_button.click(on_click);
    return confirm_button
}