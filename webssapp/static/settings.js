$(document).on("change", "#ugly", function () {
    $("body").removeClass("less-ugly").removeClass("ugly")
    $("body").addClass("ugly")
})

$(document).on("change", "#still-bad", function () {
    $("body").removeClass("less-ugly").removeClass("ugly")
    $("body").addClass("less-ugly")
})

$(document).on("change", "#normal", function () {
    $("body").removeClass("less-ugly").removeClass("ugly")
})

$(document).on("change", "#pink", function () {
    $("body").removeClass("less-ugly").removeClass("ugly")
    $("body").addClass("pink")
})

$(document).on("change", "#lit", function () {
    $("body").removeClass("less-ugly").removeClass("ugly")
    $("body").addClass("lit")
})