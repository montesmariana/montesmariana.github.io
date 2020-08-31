function loadData(type, files, other_args = null) {
    const prefix = "data/" + type + "/" + type;
    var allFiles = {
        "model": prefix + ".models.tsv",
        "distances": prefix + ".models.dist.tsv",
        "tokens": prefix + ".tsv",
        "weights": prefix + ".ppmi.tsv",
        "variables": prefix + ".variables.tsv"
    };

    fetchSolutionsFile(type).then((data) => {
        if (files.indexOf("tokens") > -1) {
            d3.keys(data).forEach((d) => {
                allFiles[d] = prefix + data[d] + ".tsv";
                files.push(d);
            });
            if (d3.keys(data).length > 0) { _.pull(files, "tokens"); }
            if (other_args === null) { other_args = d3.keys(data); }
        }

        const toLoad = files.map((f) => d3.tsv(allFiles[f]));

        Promise.all(toLoad).then((results) => {
            const loadedDatasets = _.fromPairs(_.zip(files, results));

            execute(datasets = loadedDatasets, type = type, other_args = other_args);
        });
    });

}

function fetchSolutionsFile(type) {
    fetch("data/" + type + "/" + type + ".solutions.json")
        .then(response => response.ok ? response.json() : "");
}