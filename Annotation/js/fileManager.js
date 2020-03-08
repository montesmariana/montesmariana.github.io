function uploadProgress() {
    Swal.fire({
        title: msg['upload_1'],
        input: 'file',
        inputAttributes: {
            accept: '*.json'
        }
    }).then((file) => {
        if (file.value) {
            var reader = new FileReader();
            reader.onload = (e) => {
                uploaded_text = JSON.parse(reader.result);
                if (uploaded_text['user'] === text['user']) { // if the uploaded file fits the current user
                    text = uploaded_text;
                    saved = JSON.stringify(text);
                    saveInLS();
                    showConc(concordance);
                    Swal.fire({
                        title: msg['upload_success'],
                        icon: "success"
                    });
                } else {
                    Swal.fire({
                        title: msg['upload_fail_title'],
                        text: msg['upload_fail_text'],
                        icon: "error"
                    });
                }
            }
            reader.readAsText(file.value);
        }
    });
}

function downloadJSON() {
    saved = JSON.stringify(text);
    saveInLS();
    var blob = new Blob([saved], { type: "text/plain;charset=utf-8" });
    saveAs(blob, text['user'] + '.json');
    // d3.select(this).attr("href", 'data:text/plain;charset=utf-8,' + encodeURIComponent(saved))
    //     .attr("download", text['user'] + ".json");
    var full_types = this_types.filter(function (t) {
        return (checkAchievements(t) == 'done');
    });
    // var message = full_types.length == this_types.length ? msg["final_download_message"] : null;
    Swal.fire({
        title: msg["download_title"],
        icon: 'success'
    });
}

function downloadTSV() {
    var blob = new Blob([createTsv(text, concordance)], { type: "text/plain;charset=utf-8"});
    saveAs(blob, text['user'] + '.tsv');
    var full_types = this_types.filter(function (d) {
        return (checkAchievements(d) == 'done');
    });
    var message = full_types.length !== this_types.length ? msg["final_download_message"] : null;
    // console.log(final_output);
    Swal.fire({
        title: msg["download_title"],
        html: message,
        icon: 'success'
    });
}