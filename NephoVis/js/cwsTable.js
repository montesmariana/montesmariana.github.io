function execute(datasets, type) {
    const group = getUrlParameter("group");
    const modelSelection = listFromLS("modelselection-" + type + "-group" + group);
    const tokSelection = listFromLS("tokenselection-" + type);
    const bigdata = datasets["variables"].filter((t) => {
        return (tokSelection.indexOf(t["_id"]) !== -1);
    });
    function findCwsColumn(m) {
        return (datasets["variables"].columns.filter((d) => {
            return (d.startsWith("_cws.") && m.search(d.slice(5)) === 0)
        })[0]);
    }
    const cwsColumns = modelSelection.map(findCwsColumn);

    const cws = cwsColumns.map((m) => { // for each model
        return (bigdata.map((d) => { return (d[m]); }).join(";"));
    }).join(";").split(";").filter((d) => {return(d !== "NA"); });

    const freqcols = modelSelection.map((d, i) => { return (i + 1); });

    const cols = ["CWs", "totalFreq", ...freqcols];


    const tableData = _.uniq(cws).map((d) => {
        const start = { "CWs": d, "totalFreq": countTokens(d) };
        for (let i = 0; i < freqcols.length; i++) {
            start[freqcols[i]] = countCws(cwsColumns[i], d);
        }
        return (start);
    });

    const table = d3.select("#cwsFreq").append("table");
    table.append('thead').append('tr')
        .selectAll('th')
        .data(cols).enter()
        .append("th")
        .text((d) => { return (d); });

    const rows = table.append('tbody').selectAll('tr')
        .data(tableData).enter()
        .append('tr');
    rows.selectAll('td')
        .data((d) => {
            return (cols.map(function (k) {
                return ({ 'name': k, 'value': d[k] });
            }));
        }).enter()
        .append('td')
        .attr('data-th', d => d.name)
        .text(d => d.value);

    $("table").DataTable({
        // 'destroy' : true,
        "order": [[1, "desc"]],
        // "columnDefs": [{ "visible": false, "targets": 1 }]
    });

    function countTokens(cw) {
        let res = []
        for (let i = 0; i < cwsColumns.length; i++){
            const m = cwsColumns[i];
            const tids = bigdata.filter((t) => {
                return(t[m].split(";").indexOf(cw) !== -1);
            }).map((t) => { return(t["_id"]); });
            res.push(...tids);
        }
        return(_.uniq(res).length);
    }

    function countCws(m, cw) {
        const res = bigdata.map((d) => { return (d[m]); })
            .join(";").split(";")
            .filter((w) => { return (w === cw); });
        return (res.length);
    }
}