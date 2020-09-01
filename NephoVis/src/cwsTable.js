function execute(datasets, type) {
    // const group = URLUtils.getUrlParameter(window.location, "group");
    const modelSelection = listFromLS("modelselection-" + type);
    // const modelSelection = listFromLS("modelselection-" + type + "-group" + group);
    const tokSelection = listFromLS("tokenselection-" + type);
    const selectedTokens = datasets["variables"].filter((t) => tokSelection.indexOf(t["_id"]) !== -1 );
    const deselectedTokens = datasets["variables"].filter((t) => tokSelection.indexOf(t["_id"]) === -1 );
    function findCwsColumn(m) {
        return (datasets["variables"].columns.filter((d) => {
            return (d.startsWith("_cws.") && m.search(d.slice(5)) === 0)
        })[0]);
    }
    const cwsColumns = modelSelection.map(findCwsColumn);

    const infoOptions = [
        {name : "Absolute frequency", value : "freq"},
        {name : "Selected and non selected", value : "both"},
        {name : "Absolute and relative frequencies", value :"prop"},
        {name : "Ratio selected/non selected", value : "ratio"}
    ]

    buildDropdown("info", infoOptions,
        valueFunction = (d) => d.value, textFunction = (d) => d.name)
        .on("click", (d) => {drawTable(d.value, freqcols)});

    const cws = cwsColumns.map((m) => { // for each model
        return (selectedTokens.map((d) => { return (d[m]); }).join(";"));
    }).join(";").split(";").filter((d) => {return(d !== "NA"); });

    const freqcols = modelSelection.map((d) => modelSelection.indexOf(d) + 1 );

    function addRawFreq(d, freqcols, selectedTokens){
        const start = { "CWs": d, "total" : countTokens(d, selectedTokens)}
        for (let i = 0; i < freqcols.length; i++) {
            start[freqcols[i]] = countCws(cwsColumns[i], d, selectedTokens);
        }
        return(start);
    }

    function addProp(d, freqcols, selectedTokens, deselectedTokens){
        const totalProp = countTokens(d, selectedTokens)/(countTokens(d, deselectedTokens)+countTokens(d, selectedTokens));
        const start = { "CWs": d, "total-A" : countTokens(d, selectedTokens), "total-R" : d3.format(".3r")(totalProp)}
        for (let i = 0; i < freqcols.length; i++) {
            const partialProp = countCws(cwsColumns[i], d, selectedTokens)/(countCws(cwsColumns[i], d, deselectedTokens)+countCws(cwsColumns[i], d, selectedTokens));
            start[freqcols[i] + "-A"] = countCws(cwsColumns[i], d, selectedTokens);
            start[freqcols[i] + "-R"] = d3.format(".3r")(partialProp);
        }
        return(start);
    }
    function addBothFreqs(d, freqcols, selectedTokens, deselectedTokens){
        const start = { "CWs": d, "total+" : countTokens(d, selectedTokens), "total-": countTokens(d, deselectedTokens)}
        for (let i = 0; i < freqcols.length; i++) {
            start[freqcols[i] + "+"] = countCws(cwsColumns[i], d, selectedTokens);
            start[freqcols[i] + "-"] = countCws(cwsColumns[i], d, deselectedTokens);
        }
        return(start);
    }
    function addRatio(d, freqcols, selectedTokens, deselectedTokens){
        const totalRatio = countTokens(d, selectedTokens)/(countTokens(d, deselectedTokens)+0.00001);
        const start = { "CWs": d, "total" : totalRatio > 1000 ? totalRatio.toExponential(2) : d3.format(".3r")(totalRatio)}
        for (let i = 0; i < freqcols.length; i++) {
            const partialRatio = countCws(cwsColumns[i], d, selectedTokens)/(countCws(cwsColumns[i], d, deselectedTokens)+0.00001);
            start[freqcols[i]] = partialRatio > 1000 ? partialRatio.toExponential(2) : d3.format(".3r")(partialRatio);
        }
        return(start);
    }

    function nameColumns(info, freqcols){
        const cols = ["CWs"]
        if (info === "freq" | info === "ratio") {
            cols.push("total");
            cols.push(...freqcols);
        } else if (info === "both") {
            cols.push("total+");
            cols.push("total-");
            freqcols.forEach((d) => {
                cols.push(d + "+");
                cols.push(d + "-");
            });
        } else if (info === "prop") {
            cols.push("total-A");
            cols.push("total-R");
            freqcols.forEach((d) => {
                cols.push(d + "-A");
                cols.push(d + "-R");
            });
        }
        console.log(cols)
        return(cols);
    }

    function createTable(info, freqcols){
        const tableData = _.uniq(cws).map((d) => {
            if (info === "freq"){
                return(addRawFreq(d, freqcols, selectedTokens));
            } else if (info === "both") {
                return(addBothFreqs(d, freqcols, selectedTokens, deselectedTokens));
            } else if (info === "ratio") {
                return(addRatio(d, freqcols, selectedTokens, deselectedTokens));
            } else if (info === "prop") {
                return(addProp(d, freqcols, selectedTokens, deselectedTokens));
            }
        });
        return({tableData : tableData, cols : nameColumns(info, freqcols)});
    }
    
    function drawTable(info, freqcols){
        d3.select("#cwsFreq").selectAll("div").remove();
        d3.select("#cwsFreq").selectAll("table").remove();
        
        const tableData = createTable(info, freqcols);
        console.log(tableData.cols)
        console.log(typeof tableData.cols[3])
        
        const table = d3.select("#cwsFreq").append("table");
        table.append('thead').append('tr')
            .selectAll('th')
            .data(tableData.cols).enter()
            .append("th")
            .text(d => d);
    
        const rows = table.append('tbody').selectAll('tr')
            .data(tableData.tableData).enter()
            .append('tr')        
        
        rows.selectAll('td')
            .data((d) => tableData.cols.map((k) => {return({ 'name': k, 'value': d[k] })}))
                .enter()
            .append('td')
            .attr("class", d => typeof d.name === "string" && (d.name.endsWith("+") | d.name.endsWith("A")) ? "plus" : "minus")
            .attr('data-th', d => d.name)
            .text(d => d.value);

        $("table").DataTable({
            'destroy' : true,
            "order": [[1, "desc"]]
            // "columnDefs": [{ "visible": false, "targets": 1 }]
        });
    }

   

    function countTokens(cw, df) {
        let res = []
        for (let i = 0; i < cwsColumns.length; i++){
            const m = cwsColumns[i];
            const tids = df
                .filter((t) => t[m].split(";").indexOf(cw) !== -1 )
                .map((t) => t["_id"] );
            res.push(...tids);
        }
        return(_.uniq(res).length);
    }

    function countCws(m, cw, df) {
        const res = df.map((d) => d[m])
            .join(";").split(";")
            .filter((w) => w === cw );
        return (res.length);
    }

    drawTable("freq", freqcols);
}