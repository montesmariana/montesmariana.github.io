function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;
    
    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
}
}

// var type = getUrlParameter('type');
function loadData(type, files) {
    var toLoad = [];
    var allFiles = {
        "model" : "data/" + type + "/" + type + ".models.tsv",
        "distances" : "data/" + type + "/" + type + ".models.dist.tsv",
        "tokens" : "data/" + type + "/" + type + ".tsv",
        "weights" : "data/" + type + '/' + type + '.ppmi.tsv'
    };
    files.forEach(function(f) {
        toLoad.push(d3.tsv(allFiles[f]));
    });
    Promise.all(toLoad).then(function(files) {
        execute(datasets = files, type = type);
    });
}