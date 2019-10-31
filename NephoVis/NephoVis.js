// Make svg responsive with script from: https://brendansudol.com/writing/responsive-d3
function responsivefy(svg) {
// get container + svg aspect ratio
    var container = d3.select(svg.node().parentNode),
    width = parseInt(svg.style("width")),
    height = parseInt(svg.style("height")),
    aspect = width / height;

    // add viewBox and preserveAspectRatio properties,
    // and call resize so that svg resizes on inital page load
    svg.attr("viewBox", "0 0 " + width + " " + height)
    .attr("perserveAspectRatio", "xMinYMid")
    .call(resize);

    // to register multiple listeners for same event type, 
    // you need to add namespace, i.e., 'click.foo'
    // necessary if you call invoke this function for multiple svgs
    // api docs: https://github.com/mbostock/d3/wiki/Selections#on
    d3.select(window).on("resize." + container.attr("id"), resize);

    // get width of container and resize svg to fit it
    function resize() {
        var targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}

// EXTRACT THE NAME OF THE MODEL FROM THE URL!!  (by Thomas) 
function getUrlParameter(sParam) {
var sPageURL = decodeURIComponent(window.location.search.substring(1)),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
}
}

// Generate complementary colors for the circle on hover
function compColor(col) {
    res = d3.hsl(col);
    hue = res['h'];
    newHue = +hue < 180 ? +(hue + 180) : +(hue-180);
    res['h'] = newHue;
    return(res.toString());
    }

// Short function to obtain the possible values of a variable
function getValues(dataset, colname) {
    return(d3.map(dataset, function(d) {return d[colname]}).keys());
}

function cleanStor(item) {
    localStorage.setItem(item, JSON.stringify(null));
    }

function classify_colnames(dataset) {
    var colnames, variables, nominals, numerals, contexts
    
    colnames = d3.keys(dataset[0]);
    variables = colnames.filter(function(d) {
        return (!d.endsWith('.x') &&
        !d.endsWith('.y') &&
        !d.startsWith("_"));
    });
    nominals = variables.filter(function(d) {
        return (!getValues(dataset, d).every(function(d) {return(!isNaN(d)); }));
    }).filter(function(d) {
        return (getValues(dataset, d).length <= 10);
    });
    nominals.push("Reset");

    numerals = variables.filter(function(d) {
        return(getValues(dataset, d).every(function(d) {return(!isNaN(d)); }));
    });
    numerals.push("Reset");

    contexts = colnames.filter(function(d) {
        return(d.startsWith('_ctxt'));
    });

    return({
        "all" : colnames,
        "variables" : variables,
        "nominals" : nominals,
        "numerals" : numerals,
        "contexts" : contexts
    });
}

function varFromLS(dataset, variable, level) {
    var LS, name, values;
    LS = JSON.parse(localStorage.getItem(variable + "var-" + level));
    name = LS == null ? undefined : LS;
    values = typeof(name) == 'string' ? getValues(dataset, name) : +0;
    return({
        "variable" : name,
        "values" : values
    });
}

function listFromLS(variable) {
    var LS = JSON.parse(localStorage.getItem(variable));
    return(LS == null ? [] : LS);
}

function updateVar(dataset, variable, name, level) {
    if (name == 'Reset') {
        varset = {
            "variable" : null,
            "values" : +0
        }
    } else {
        var values = getValues(dataset, name);
        values = isNaN(values[0]) ? values : values.map(function(d) {
            return +d;}).sort(function(a, b){return a-b});
        varset = {
            "variable" : name,
            "values" : values
        }
    }
    localStorage.setItem(variable + "var-" + level, JSON.stringify(varset['variable']));
    return(varset);
}

function code(d, variable, schema, default_value){
    if (variable['variable'] == null) {
        return(default_value);
    } else {
        if (isNaN(default_value)) {
            return(schema(variable['values'].indexOf(d[variable['variable']])));
        } else {
            schema.domain(d3.extent(variable['values']));
            return(schema(+d[variable['variable']]));
        }
    }
}

function buildDropdown(where, data,
    value_function = function(d) {return(d); },
    text_function = function(d) {return(d); }){
    return(
        d3.select("#" + where)
            .selectAll("button")
            .data(data).enter()
                .append("button")
                .attr("class", "dropdown-item " + where.slice(0, 3))
                .attr("xlink:href", "#")
                .attr("value", value_function)
                .text(text_function)
            );
}

function traceCenter(p, x1, x2, y1, y2) {
    return(
    p.append("line")
        .attr("x1", x1)
        .attr("x2", x2)
        .attr("y1", y1)
        .attr("y2", y2)
        .attr("stroke", "lightgray")
        .attr("stroke-width", 1)
        );
}

function exists(t, model) {
    return (d3.format('.3r')(t[model + '.x']) != '0.00' || d3.format('.3r')(t[model + '.y']) != '0.00');
  }

// function setTooltip(where = "body") {
//     return(
//         d3.select(where).append('div')
//           .attr("class", "tooltip")
//           .attr("width", 100)
//           .attr("height", 20)
//           .style('position', 'absolute')
//           .style("opacity", 0)
//     );
// }