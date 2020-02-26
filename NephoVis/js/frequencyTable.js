function execute(datasets, type, level = 'freqs') {
    var tokselection, table, cws;
    var bigdata = datasets[0];
    var ppmidata = datasets[1];
    
    tokselection = listFromLS("tokenselection-" + type);
    cws = bigdata.filter(function(d) {
            return(tokselection.indexOf(d['_id']) !== -1);
        }).map(function(d) {
            return(d[cws_column]);
        });
    var mySet = new Set(cws.join(';').split(';'));
                    
    cwsFreq = Array.from(mySet).map(function(d) {
        var ppmi = ppmidata.filter(function(p) {
            return(p.cw == d); 
        })[0];

        var tokens = cws.filter(function(p) {
            return(p.split(';').indexOf(d) !== -1);
        }).length;

        return({
            'cw': d,
            'tokens': tokens,
            'ppmi': ppmi == undefined ? 'NA' : d3.format('.3')(ppmi['ppmi'])
        });
    });

    cols = ['Feature', 'Tokens', 'PPMI']

    table = d3.select("#cwsFreq").append("table");
    table.append('thead').append('tr')
        .selectAll('th')
        .data(cols).enter()
        .append("th")
        .text(function(d) {return(d); });

    rows = table.append('tbody').selectAll('tr')
        .data(cwsFreq).enter()
        .append('tr');
    rows.selectAll('td')
        .data(function(d) {
            return(d3.keys(cwsFreq[0]).map(function(k) {
                return({'name' : k, 'value' : d[k]});
                }));
        }).enter()
        .append('td')
        .attr('data-th', function(d) {return(d.name); })
        .text(function(d) {return(d.value); });
                
    $("table").DataTable({
        // 'destroy' : true,
        'order' : [[1, 'desc']]
    });
}