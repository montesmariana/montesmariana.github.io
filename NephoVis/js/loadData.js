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
function loadData(type, files, other_args = null) {
    
    var toLoad = [];
    var allFiles = {
        "model" : "data/" + type + "/" + type + ".models.tsv",
        "distances" : "data/" + type + "/" + type + ".models.dist.tsv",
        "tokens" : "data/" + type + "/" + type + ".tsv",
        "weights" : "data/" + type + '/' + type + '.ppmi.tsv'
    };

    fetch("data/" + type + "/" + type + ".solutions.json").then(response => {
        if (!response.ok) {
            return "";
        }
        return response.json();
        }).then(data => {
            if (files.indexOf('tokens') > -1) {
                d3.keys(data).forEach(function(d) {
                    allFiles[d] = "data/" + type + "/" + type + data[d] + ".tsv";
                    files.push(d);
                });
                other_args = data;
            }
            
            files.forEach(function(f) {
                toLoad.push(d3.tsv(allFiles[f]));
            });
            Promise.all(toLoad).then(function(files) {
                execute(datasets = files, type = type, other_args = other_args);
            });
        });
    
}