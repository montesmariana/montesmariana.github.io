function loadData() {
    Swal.fire({
        title: "Welcome",
        text: "Please enter your username",
        input: "text",
        inputPlaceholder: "name",
        inputValidator: (value) => { // only accept names included in users.json
            if (["esther", "joni"].indexOf(value) === -1) {
                // return msg['not_login_text'];
                return "Wrong username, please try again.";
            }
        }
    }).then((result) => {
        if (result.value) {
            // NO GUEST ACCESS
            user = result.value;
            Swal.fire({
                title: "Login succesful!",
                html: "Welcome, " + result.value,
                icon: "success"
            });
            text['user'] = result.value;
            if (typeof (Storage) !== 'undefined' && JSON.parse(localStorage.getItem("annotations-" + text['user'])) != null) {
                text = JSON.parse(localStorage.getItem("annotations-" + text['user']));
            }
            saved = JSON.stringify(text);

            Promise.all([
                d3.tsv("contact.batch-" + user + ".tsv"),
                d3.tsv("foreigner.batch-" + user + ".tsv"),
                d3.tsv("introduction.batch-" + user + ".tsv"),
                d3.tsv("password.batch-" + user + ".tsv"),
                d3.json("senses.json"),
                d3.json("inoutconcept.json"),
                d3.json("messages.json")
            ]).then(function (files) {
                const concordances = {
                    "contact" : files[0],
                    "foreigner" : files[1],
                    "introduction" : files[2],
                    "password" : files[3]
                }
                // console.log(JSON.parse(files[1]));
                execute(concordance = concordances, category1 = files[4], category2 = files[5], messages = files[6]);
            });
        }
    });
}