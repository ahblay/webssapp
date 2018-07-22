// This file will contain the logic to create a modal which allows the user to choose one of a list of selections
// The data dict will apply it's keys as the headers and the values in the fields.
// each entry in data dict must be a list of equal length
// You can pass in a function as on_complete which will be run when a user clicks select.
// The select button is disabled when there is no selection.

function createSelectModal(title, data, on_complete){
    let modal = new jBox("Modal", {
        title: title,
    });
    modal.setContent(makeSelectModalContent(data));
    modal.setFooter(makeSelectModalFooter(modal, data, on_complete));
    modal.addClass("select-modal")
    return modal
};

function makeSelectModalContent(data){
    let modal_content = $("<div />").addClass("select-modal-content");
    modal_content.append(makeSelectModalContentHeader(data));
    let data_by_row = makeArrayFromDictValues(data);
    for (row=0; row<data_by_row.length; row++){
        modal_content.append(makeSelectModalContentRow(data_by_row[row]));
    };
    return modal_content
};

function makeSelectModalContentHeader(data){
    // Render header from data keys
    let modal_content_header = $("<div />").addClass("select-modal-content-header");
    for (key=0; key<Object.keys(data).length; key++){
        // TODO: You may need text formatting here
        modal_content_header.append($("<div />").addClass("select-modal-content-header-label")
                                                .text(Object.keys(data)[key]))

    }
    return modal_content_header
}

function makeSelectModalContentRow(row_data){
    let modal_content_row = $("<div />").addClass("select-modal-content-row");
    for (field=0; field<row_data.length; field++){
        modal_content_row.append($("<div />").addClass("select-modal-content-row-field")
                                             .text(row_data[field]));
    };
    return modal_content_row
};

function makeSelectModalFooter(data, on_complete){
    let cancel_button = makeSelectModalCancelButton();
    let select_button = makeSelectModalSelectButton(data, on_complete);
    let modal_footer = $("<div />").addClass("select-modal-footer")
                                    .append(cancel_button, select_button);
    return modal_footer
};

function makeSelectModalCancelButton(modal){
    let cancel_button = $("<button />").addClass("btn btn-default select-modal-cancel-button");
    let on_cancel = function(modal){
        modal.destroy();
    }
    cancel_button.click(on_cancel);
    return cancel_button
}

function makeSelectModalSelectButton(data, on_complete){
    let select_button = $("<button />").addClass("select-modal-select-button");
    select_button.click(on_complete);
    return select_button
}