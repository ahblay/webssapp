function makeArrayFromDictValues(dict_of_data){
    // This function takes a dict with equal length lists as each value and flattens them into a list of lists
    // where each internal list contains the values at a given index of the dict values.

    let output = []
    console.log(dict_of_data)
    if (dict_of_data['ids'] == []){
        return output
    } else {
        console.log(dict_of_data)
        for (index=0; index<Object.values(dict_of_data).length; index++){
            let internal_list = []
            for (val=0; val<Object.values(dict_of_data).length; val++){
                internal_list.push(Object.values(dict_of_data)[val][index]);
            };
            output.push(internal_list);
            console.log(internal_list);
        };
    };
    console.log(output)
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
function filterShiftTemplatesByLength(templates, length_to_match){
    let filtered_templates = [];
    for (temp=0; temp<templates.length; temp++){
        if (templates[temp].num_days == length_to_match){
            filtered_templates.push(templates[temp])
        }
    }
    return filtered_templates
}

function getIds(db_dicts){
    let ids = []
    for (entry=0; entry<db_dicts.length; entry++){
        ids.push(db_dicts[entry]['_id']);
    };
    console.log(ids)
    return ids
}

function getNames(db_dicts){
    let names = [];
    for (entry=0; entry<db_dicts.length; entry++){
        names.push(db_dicts[entry]['name']);
    }
    console.log(names)
    return names
}