function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split("&"),
        sParameterName,
        i;
    
    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split("=");
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
}
}

function updateArray(array, d){
    // USES LODASH
    array.indexOf(d) === -1 ? array.push(d) : _.pull(array, d);
}

function setRange(d3, values, scale) {
    return ([d3.min(values) * scale, d3.max(values) * scale]);
}


// Make svg responsive with script from: https://brendansudol.com/writing/responsive-d3
function responsivefy(d3, svg) {
    // get container + svg aspect ratio
    const container = d3.select(svg.node().parentNode);
    const width = parseInt(svg.style("width"));
    const height = parseInt(svg.style("height"));

    // add viewBox and preserveAspectRatio properties,
    // and call resize so that svg resizes on inital page load
    svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .call(resize);

    // to register multiple listeners for same event type, 
    // you need to add namespace, i.e., "click.foo"
    // necessary if you call invoke this function for multiple svgs
    // api docs: https://github.com/mbostock/d3/wiki/Selections#on
    d3.select(window).on("resize." + container.attr("id"), resize);    
}

// get width of container and resize svg to fit it
function resize(svg) {
    const container = d3.select(svg.node().parentNode);
    const width = parseInt(svg.style("width"));
    const height = parseInt(svg.style("height"));
    const aspect = width / height;

    const targetWidth = parseInt(container.style("width"));
    svg.attr("width", targetWidth)
        .attr("height", Math.round(targetWidth / aspect));
}

function compColor(d3, col) {
    const res = d3.hsl(col);
    const hue = res["h"];
    const newHue = +hue < 180 ? +(hue + 180) : +(hue - 180);
    res["h"] = newHue;
    return (res.toString());
}


function resetVariable(item) {
    localStorage.setItem(item, JSON.stringify(null));
}

function listFromLS(variable) {
    const LS = JSON.parse(localStorage.getItem(variable));
    return (_.isNull(LS) ? [] : LS);
}

