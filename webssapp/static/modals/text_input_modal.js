// This file defines a simple single line text input modal (eg to enter a name)

function makeTextInputModal(title, cancel_button_id, confirm_button_id){
    let modal = new jBox("Modal", {
        title: title,
        footer: makeTextInputModalFooter(cancel_button_id, confirm_button_id)
    })
    modal.setContent(makeTextInputModalContent());
    $(modal).addClass("text-input-modal");
    return modal
};

function makeTextInputModalContent(){
    let text_input_content = $("<div />").addClass("text-input-modal-content");
    let input_field = $("<input />").addClass("text-input-modal-input-field")
                                    .prop("type", "text");
    text_input_content.append(input_field);
    return text_input_content
}

function makeTextInputModalFooter(cancel_button_id, confirm_button_id){
    let modal_footer = $("<div />").addClass("text-input-modal-footer");
    let cancel_button = makeTextInputModalCancel(cancel_button_id);
    let confirm_button = makeTextInputModalConfirm(confirm_button_id);
    modal_footer.append(cancel_button, confirm_button);
    return modal_footer
}

function makeTextInputModalCancel(cancel_button_id){
    let cancel_button = $("<button />").addClass("btn btn-default select-modal-cancel-button")
                                        .text("Cancel")
                                        .prop("id", cancel_button_id);
    return cancel_button
};

function makeTextInputModalConfirm(confirm_button_id){
    let confirm_button = $("<button />").addClass("btn btn-default select-modal-confirm-button")
                                        .text("Save")
                                        .prop("id", confirm_button_id);
    return confirm_button
}