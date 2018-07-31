// This file will contain the logic to create a modal which allows the user to choose one of a list of selections
// The data dict will apply it's keys as the headers and the values in the fields.
// each entry in data dict must be a list of equal length
// You can pass in a function as on_complete which will be run when a user clicks select.
// The select button is disabled when there is no selection.

function createSelectModal(title, data, labels, button_ids){
    console.log("Creating select modal.");
    let modal = new jBox("Modal", {
        title: title,
        footer: makeSelectModalFooter(button_ids)
    });
    modal.setContent(makeSelectModalContent(data, labels));
    $(modal).addClass("select-modal")
    return modal
};

function makeSelectModalContent(data, labels){
    let modal_content = null;
    console.log(data);
    if (data['ids'] == []){
        modal_content = $("<div />").addClass("select-modal-content");
        modal_content.append(makeSelectModalContentHeader(data, labels));
        let data_by_row = makeArrayFromDictValues(data);
        console.log(data_by_row)
        for (row=0; row<data_by_row.length; row++){
            modal_content.append(makeSelectModalContentRow(data_by_row[row]));
        };
    } else {
        modal_content = $("<div />").addClass("select-modal-no-shift-templates")
                                        .text("You do not have any templates which can be applied" +
                                        " to the current schedule.");
    };
    return modal_content
};

function makeSelectModalContentHeader(data, labels){
    // Render header from data keys
    console.log("Rendering select modal header.")
    let modal_content_header = $("<div />").addClass("select-modal-content-header");
    for (index=0; index<labels.length; index++){
        // TODO: You may need text formatting here
        console.log("Adding key: " + labels[index]);
        modal_content_header.append($("<div />").addClass("select-modal-content-header-label")
                                                .text(labels[index]));
    };
    return modal_content_header
};

function makeSelectModalContentRow(row_data){
    let modal_content_row = $("<div />").addClass("select-modal-content-row");
    let checkbox = $("<input />").addClass("select-modal-row-checkbox")
                                 .attr("data-id", row_data[0])
                                 .prop("type", "checkbox");
    modal_content_row.append(checkbox);
    for (field=1; field<row_data.length; field++){
        modal_content_row.append($("<div />").addClass("select-modal-content-row-field")
                                             .text(row_data[field]));
    };
    return modal_content_row
};

function makeSelectModalFooter(button_ids){
    console.log("Rendering modal footer.");
    let cancel_button = makeSelectModalCancelButton(button_ids['cancel']);
    let select_button = makeSelectModalSelectButton(button_ids['confirm']);
    let modal_footer = $("<div />").addClass("select-modal-footer")
                                    .append(cancel_button, select_button);
    return modal_footer
};

function makeSelectModalCancelButton(cancel_button_id){
    console.log("Rendering select modal cancel button.")
    let cancel_button = $("<button />").addClass("btn btn-default select-modal-cancel-button")
                                        .prop("id", cancel_button_id)
                                        .text("Cancel");
    return cancel_button
}

function makeSelectModalSelectButton(confirm_button_id){
    console.log("Rendering select modal select button.")
    let select_button = $("<button />").addClass("btn btn-confirm select-modal-select-button")
                                        .prop("id", confirm_button_id)
                                        .text("Apply");
    return select_button
}