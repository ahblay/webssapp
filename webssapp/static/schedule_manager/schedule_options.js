function renderScheduleErrors(errors){
    console.log("Printing errors:")
    console.log(errors);
    $("#error-panel").empty();
    if (errors.length == 0){
        let no_error_p = document.createElement("p");
        $(no_error_p).text("There are no errors to report! Continue to the View Schedule tab to create your schedule.");

        $("#error-panel").append(no_error_p);
    } else {
        for (error=0; error < errors.length; error++){
            console.log("Rendering error:")
            console.log(errors[error]);
            $("#error-panel").append(renderError(errors[error]));
        };
        console.log("Full error-panel:");
        console.log($("#error-panel"));
    };
};

function renderError(error){
    console.log(error);
    let error_block = document.createElement("div");
    let error_type = document.createElement("h3");
    let error_text = document.createElement("p");
    console.log(error['error_type']);
    console.log(error['error_text']);
    $(error_type).text(error['error_type']);
    $(error_text).text(error['error_text']);
    $(error_block).append(error_type);
    $(error_block).append(error_text);
    console.log($(error_block));
    return error_block;
}