function makeArrayFromDictValues(dict_of_data){
    // This function takes a dict with equal length lists as each value and flattens them into a list of lists
    // where each internal list contains the values at a given index of the dict values.

    let output = []
    for (index=0; index<Object.values(dict_of_data).length; index++){
        let internal_list = []
        for (val=0; val<Object.values(dict_of_data).length; val++){
            internal_list.push(Object.values(dict_of_data)[val][index]);
        };
        output.push(internal_list);
    };
    return output
};

function processPostResponse(response, on_success){
    if (response['success']){
        console.log(response['message']);
        on_success(response);
    } else {
        alert("Sorry, that action could not be completed: \n" + response['message']);
    }
}

function getIds(db_dicts){
    let ids = []
    for (entry=0; entry<db_dicts.length; entry++){
        ids.push(db_dicts[entry]['_id']);
    };
    return ids
}

function getNames(db_dicts){
    let names = [];
    for (entry=0; entry<db_dicts.length; entry++){
        names.push(db_dicts[entry]['name']);
    }
}