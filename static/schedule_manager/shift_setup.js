console.log("shift_setup.js is running.")

$("#page-right").on("click", function(){
    console.log("Page right clicked.")
    //$(this).prop('disabled', true);
    $('#page-left').prop('disabled', false);
});

function create_row(attribute){
    let row = document.createElement("tr");

    //manage start time dropdown
    let startTime = document.createElement("td");
    console.log(startTime);
    $(startTime).addClass("text-center")
    let startOptions = [10, 11, 12, 1, 2, 3, 4, 5];
    let startSelect = document.createElement("select");


    for (let i=0; i < startOptions.length; i++) {
        let option = document.createElement("option");
        option.value = startOptions[i];
        option.text = startOptions[i];
        startSelect.appendChild(option);
    };

    startTime.append(startSelect);
    row.append(startTime);

    //manage end time dropdown
    let endTime = document.createElement("td");
    console.log(endTime);
    $(endTime).addClass("text-center")
    let endOptions = [10, 11, 12, 1, 2, 3, 4, 5];
    let endSelect = document.createElement("select");

    for (let i=0; i < endOptions.length; i++) {
        let option = document.createElement("option");
        option.value = endOptions[i];
        option.text = endOptions[i];
        endSelect.appendChild(option);
    };

    endTime.append(endSelect);
    row.append(endTime);

    //determine length
    let length = document.createElement("td");
    length.append($(startSelect).val() - $(endSelect).val())
    $(startSelect).on("change", function () {
        console.log($(startSelect).val())
        $(length).empty()
        length.append($(startSelect).val() - $(endSelect).val())
    })
    $(endSelect).on("change", function () {
        console.log($(startSelect).val())
        $(length).empty()
        length.append($(startSelect).val() - $(endSelect).val())
    })
    row.append(length);

    //select number of employees
    let numberEmps = document.createElement("td");
    $(numberEmps).addClass("text-center")
    let numEmpsOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let numEmpsSelect = document.createElement("select");

    for (let i=0; i < numEmpsOptions.length; i++) {
        let option = document.createElement("option");
        option.value = numEmpsOptions[i];
        option.text = numEmpsOptions[i];
        numEmpsSelect.appendChild(option);
    };

    numberEmps.append(numEmpsSelect);
    row.append(numberEmps);

    //select role
    let roles = document.createElement("td");

    row.append(roles);
    $(roles).addClass("text-center")
    let roleOptions = ["Boiler", "Ovid", "Scandinavian", "Sauce Designer"];
    let roleSelect = document.createElement("select");

    for (let i=0; i < roleOptions.length; i++) {
        let option = document.createElement("option");
        option.value = roleOptions[i];
        option.text = roleOptions[i];
        roleSelect.appendChild(option);
    };

    roles.append(roleSelect);
    $(attribute).append(row);
}

$("#add-shift").on("click", function () {
    create_row("tbody")
})
