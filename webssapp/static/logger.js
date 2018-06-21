//source should take the form file_name/func_name:line_no
function log_to_server(source, level, message, json_data=undefined){
    data = {
        source: source,
        level: level,
        msg: message
    };

    if (data !== undefined){
        data["json_data"] = json_data;
    };

    $.ajax({
        type: "POST",
        url: "/_log_to_server",
        data: JSON.stringify(data),
        contentType: "application/json",
        dataType: "json",
        encode: "true",
        success: function(){
            console.log("Logged msg: " + message + " with level: " + level + " to server.");
        }
    });
}