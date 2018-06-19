function log_to_server(level, message){
    data = {
        level: level,
        msg: message
    }

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