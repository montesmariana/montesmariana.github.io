function loadData() {
    Promise.all([
        d3.tsv("church.tsv"),
        d3.json("senses.json"),
        d3.json("concept.json"),
        d3.json("messages.json")
    ]).then(function(files) {
        // console.log(JSON.parse(files[1]));
        execute(concordance = files[0], category1 = files[1], category2 = files[2], messages = files[3]);
    });
}