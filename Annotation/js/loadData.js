function loadData() {
    Promise.all([
        d3.tsv("church.tsv"),
        d3.json("church.json"),
        d3.json("users.json"),
        d3.json("messages.json")
    ]).then(function(files) {
        // console.log(JSON.parse(files[1]));
        execute(concordance = files[0], definitions = files[1], users = files[2], messages = files[3]);
    });
}