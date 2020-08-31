
function boldenLegend(d3, variable, settings) {
    const selection = listFromLS(variable.toLowerCase() + "sel-" + settings.level + "-" + settings.type);
    d3.select("#legend" + _.capitalize(variable))
        .selectAll("g.cell").each( () => {
            const label = d3.select(this);
            
            label.style("font-weight", () => selection.indexOf(label.text()) === -1 ? "400" :"700" );
        });
}

function selectionByLegend(d3, data, settings) {
    const legendVariables = ["color", "shape", "size"];
    
    legendVariables.forEach( (x) => boldenLegend(d3, x, settings) );
    const id = level === "model" ? "_model" : "_id";
    const selection = _.uniq(_.map(data.data, (d) => {
        if (legendVariables.every((v) => checkSelected(d, v, data[v+"var"]["variable"], settings))) { return d[id]; }
    }));
    const selectedVariables = legendVariables
        .map((x) => listFromLS(_.join([x + "sel", settings.level, settings.type], "-")).length)
        .reduce((x, y) => x+y);
    if (selectedVariables === 0) { _.pullAll(selection, selection); }
    updateSelection(d3, data, settings);
}

function checkSelected(d, name, variable, settings){
    const selection = listFromLS(_.join([name + "sel", settings.level, settings.type], "-"));
    return selection.length === 0 || selection.indexOf(d[variable]) !== -1;
}

function createColorLegend(d3, scale, globals){
    return d3.legendColor()
        .shape("path", d3.symbol().type(d3.symbolCircle).size(50)())
        .scale(scale.range(globals.myColors));
}

function createShapeLegend(d3, scale, values){
    return d3.legendSymbol()
        .scale(scale.range(values.map((d) => d3.symbol().type(shape(d))())));
}

function createSizeLegend(d3, values) {
    const scale = d3.scaleLinear().domain(d3.extent(values)).range([5, 8]);
    const smallNumbers = (scale.domain()[1] - scale.domain()[0]) / (values.length - 1) < 1;
    
    return d3.legendSize().shape("circle")
        .labelOffset(15)
        .scale(scale)
        .cells((values.length > 6 || smallNumbers) ? 5 : values.length)
        .labelFormat(smallNumbers ? ".04r" : ".0d");
    }

function legendCellClick(d, variable, values, data, settings){
    if (variable !== "size" || values.length <= 6) {
        const selection = listFromLS(_.join([variable + "sel", settings.level, settings.type], "-"));
        updateArray(selection, d)
        localStorage.setItem(_.join([variable + "sel", settings.level, settings.type], "-"), JSON.stringify(selection));
        selectionByLegend(data, settings);
    }
}

function createLegend(d3, variable, values, data, settings, globals){
    const scale = d3.scaleOrdinal().domain(values);

    switch(variable){
        case "color":
            legend = createColorLegend(d3, scale, globals);
            break;
        case "shape":
            legend = createColorLegend(d3, scale, values);
            break;
        case "size":
            legend = createSizeLegend(d3, values);
            break;
    }

    legend.title(formatVariableName(data[variable + "var"].variable))
        .on("cellclick", (d) => legendCellClick(d, variable, values, data, settings));
        
    return(legend);
}
function updateVariableLegend(d3, variable, data, settings, globals, legendContainer, legendList){
    const values = data[variable + "var"]["values"];

    if (_.isArray(values)){
       
        const legend = createLegend(d3, variable, values, data, settings, globals);
        addLegendToContainer(legendContainer, variable, values, settings, legend);
        
        legendList.push(variable);

    } else {
        if (legendList.indexOf(variable) > -1) _.pull(legendList, variable);
        legendContainer.select("#legend" + _.capitalize(variable)).remove();
    }
}

function addLegendToContainer(legendContainer, variable, values, settings, legend){
    legendContainer.append("svg")
    // .attr("width", lCWidth)
        .style("height", (values.length * 30 + settings.padding) + "px")
        .attr("height", "100%")
        .attr("transform", "translate(0,0)")
        .attr("id", "legend" + _.capitalize(variable))
        .append("g")
        .attr("class", "legend")
        .attr("transform", "translate(0, " + settings.padding / 2 + ")")
        .call(legend);
}
function updateLegend(d3, data, settings, globals) {
    const legendList = [];
    const legendContainer = d3.select("#legendContainer");
    legendContainer.selectAll("svg").remove();

    // Update color legend
    ["color", "shape", "size"].forEach((variable) => updateVariableLegend(d3, variable, data, settings, globals, legendContainer, legendList));

    if (legendList.length > 0) {
        legendContainer.selectAll("svg").call(responsivefy);
        ["color", "shape", "size"].forEach( (x) => boldenLegend(d3, x, settings) );
    }
}