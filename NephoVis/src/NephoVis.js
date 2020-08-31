// ################################################################################################
// set up general variables for all scripts
const myColors = [
    "#0072B2", // darkish blue
    "#009E73", // green
    "#D55E00", // brick red
    "#ffd77d", // orangy yellow
    "#CC79A7", // pink-purple
    "#F0E442", // bright yellow
    "#56B4E9", // sky blue
    "#986042", // brown
    "#011f4b", // almost black
    "#345534", //dark green
    "#696969"] //gray
    // colorblind friendly palette: six first from "seaborn" (other three may not be so)

// Color, shape, size palettes
const globals = {
    myColors : myColors,
    color : d3.scaleOrdinal(myColors),
    shape : d3.scaleOrdinal(d3.symbols),
    size : d3.scaleLinear().range([40, 200])
}

function initVars(data, level, type) {
    // sets the values of variables to access the data
    return {
        data : data,
        colnames : classifyColnames(data),
        nominals : colnames["nominals"],
        numerals : colnames["numerals"],
        colorvar : varFromLS(data, "color", level, type),
        colorSelection : [],
        shapevar : varFromLS(data, "shape", level, type),
        shapeSelection : [],
        sizevar : varFromLS(data, "size", level, type)
    }
}

function buildDropdown(d3, key, variable, data, settings, valueFunction = d => d, textFunction = d => d, defaultClick = true) {
    const dropdown = d3.select("#" + key)
            .selectAll("button")
            .data(data[variable]).enter()
            .append("button")
            .attr("class", "dropdown-item " + key.slice(0, 3))
            .attr("xlink:href", "#")
            .attr("value", valueFunction)
            .html(textFunction);

    if (defaultClick){
        dropdown.on("click", function () {
            data[key + "var"] = updateVar(data.data, key, this.value, settings.level, settings.type);
            data[key + "Selection"] = [];
            updatePlot();
            updateLegend(data, settings);
          });
    }
    
    return dropdown;
}

// ################################################################################################
// Functions to help draw the plot
function traceCenter(p, x1, x2, y1, y2) {
    return (
        p.append("line")
            .attr("x1", x1)
            .attr("x2", x2)
            .attr("y1", y1)
            .attr("y2", y2)
            .attr("stroke", "lightgray")
            .attr("stroke-width", 1)
    );
}

function setTooltip(d3, where) {
    return (
        d3.select(where).append("div")
            .attr("class", "tooltip")
            .style("width", 500)
            //   .attr("height", 20)
            .style("position", "absolute")
            .style("opacity", 0)
    );
}

function setPointerEvents(svg, width, height) {
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(0,0)")
        .style("pointer-events", "all")
        .style("fill", "none");
}

function code(d3, d, variable, schema, default_value) {
    if (_.isNull(variable.variable)) {
        return (default_value);
    } else {
        const thisVar = variable.variable;
        const thisValue = variable.values;
        const res = isNaN(default_value) ? schema.domain(thisValue)(d[thisVar]) : schema.domain(d3.extent(thisValue))(+d[thisVar]);
        return(res);
        }
    }

function formatVariableName(varName) {
    return(_.toUpper(_.kebabCase(_.replace(varName, /^[f|s]oc_/, ""))))
  }

// ################################################################################################
// Functions to obtain and manipulate data

function exists(d3, t, model) {
    return (d3.format(".3r")(t[model + ".x"]) !== "0.00" || d3.format(".3r")(t[model + ".y"]) !== "0.00");
}

// Short function to obtain the possible values of a variable
function getValues(dataset, colname) {
    const values = _.uniq(_.map(dataset, colname));
    const isNum = values.every((d) => !isNaN(d));
    const res = isNum ? values.map((d) => +d) : values.map((d) => d.toString());
    return(res.sort());
}

function extractNominals(variables, dataset){
    const nominals = variables.filter(d => {
        return (!d.startsWith("_") && !getValues(dataset, d).every(v => !isNaN(v)));
    }).filter(d => getValues(dataset, d).length <= 10);
    nominals.push("Reset");
    return(nominals);
}

function extractNumerals(variables, dataset){
    const numerals = variables.filter(d => getValues(dataset, d).every(v => !isNaN(v)));
    numerals.push("Reset");
    return(numerals);
}
function classifyColnames(dataset) {
    // const colnames = dataset.columns;
    const colnames = _.keys(dataset[0])
    const variables = colnames.filter(d => {
        return (!d.endsWith(".x") &&
            !d.endsWith(".y") &&
            getValues(dataset, d).length > 1);
    });   

    return ({
        "all": colnames,
        "variables": variables,
        "nominals": extractNominals(variables, dataset),
        "numerals": extractNumerals(variables, dataset),
        "contexts": colnames.filter(d => d.startsWith("_ctxt"))
    });
}

// Deal with Local Storage

function updateVar(dataset, variable, name, settings) {
    const variableName = name === "Reset" ? null : name;
    const values = name === "Reset" ? +0 : getValues(dataset, name);

    localStorage.setItem(settings.level + "-" + variable + "var-" + settings.type, JSON.stringify(variableName));
    return ({ "variable": variableName, "values": values });
}


function clearStorage(d3, data, settings) {
    const selection = data[settings.level + "Selection"];
    _.pullAll(selection, selection);
    ["color", "shape", "size"].forEach((v) => {
        resetVariable(_.join([v + "sel", settings.level, settings.type], "-"));
    });
    updateSelection(d3, data, settings);
}

function varFromLS(dataset, variable, settings) {
    const LS = JSON.parse(localStorage.getItem(settings.level + "-" + variable + "var-" + settings.type));
    const values = _.isNull(LS) ? +0 : getValues(dataset, LS);
    return ({
        "variable": LS,
        "values": values
    });
}


function highlightDot(d3, selection, level){
    d3.selectAll(".dot")
      .selectAll("path.graph")
      .style("opacity", selection.length > 0 ? 1 : 0.7)
      .classed("lighter", (d) => {
        const id = level == "model" ? "_model" : "_id";
        return selection.length > 0 && selection.indexOf(d[id]) === -1;
      });
  }
  
function updateSelection(d3, data, settings) {
    const selection = data[settings.level + "Selection"];

    if (settings.level === "model") {d3.select("#numSelected").text(selection.length);}

    if (selection.length > 0 && selection.indexOf("undefined") > -1) _.pull(selection, "undefined");

    ["color", "shape", "size"].forEach((variable) => boldenLegend(variable, level, type) );
    localStorage.setItem(settings.level + "Selection-" + settings.type, selection.length > 0 ? JSON.stringify(selection) : JSON.stringify(null));
    // if something is selected everything else is translucent
    highlightDot(d3, selection, settings.level);
}

// #####################################################################################################################

// For level 2 & 3: offer different solutions if they exist
function subsetCoords(datasets, technique, model){
    const data = datasets[technique];
    const subset = data.map(d => {
      const res = {"_id" : d["_id"]};
      if (typeof model === "string") {
          [".x", ".y"].forEach((x) => res[technique + x] = d[model + x] === undefined ? 0.0 : d[model + x]);
      } else {
          for (let i = 0; i < model.length; i++) {
            [".x", ".y"].forEach((x) => res[model[i] + "-" + technique + x] = d[model[i] + x] === undefined ? 0.0 : d[model[i] + x]);
          }
      }
      return(res);
    });
    return(subset);
  }

function offerAlternatives(datasets, alternatives, model, type) {
    if (d3.keys(datasets).indexOf("tokens") === -1 && !_.isNull(alternatives)) {
        const storageSolution = JSON.parse(localStorage.getItem("solution-" + type));
        const chosenSolution = _.isNull(storageSolution) ? alternatives[0] : storageSolution;
        const alts = d3.select("#moveAround").append("div") // setup the dropdown for the alternatives
            .attr("class", "btn-group");
        alts.append("button")
            .attr("type", "button")
            .attr("class", "btn shadow-sm btn-marigreen dropdown-toggle")
            .attr("data-toggle", "dropdown")
            .html("<i class='fas fa-list-ul'></i> Switch solution");
        alts.append("div")
            .attr("class", "dropdown-menu")
            .attr("id", "solutions");
        buildDropdown(d3, "solutions", alternatives, data, settings, valueFunction = d => d, textFunction = d => {
          return (d === chosenSolution ? "<b>" + d + "</b>" : d);
        }, defaultClick = false);

        localStorage.setItem("solution-" + type, JSON.stringify(chosenSolution));
        const coords = subsetCoords(datasets, alternatives[0], model);
        for (let i = 1; i < alternatives.length; i++){
            mergeVariables(coords, subsetCoords(datasets, alternatives[i], model))
        }
        return(coords)

    } else { // if "tokens remains"
        return (subsetCoords(datasets, "tokens", model));
    }
}

// function offerAlternatives(datasets, alternatives, type) {
//     if (d3.keys(datasets).indexOf("tokens") === -1 && !_.isNull(alternatives)) {
//         const storageSolution = JSON.parse(localStorage.getItem("solution-" + type));
//         const chosenSolution = _.isNull(storageSolution) ? alternatives[0] : storageSolution;
//         const alts = d3.select("#moveAround").append("div") // setup the dropdown for the alternatives
//             .attr("class", "btn-group");
//         alts.append("button")
//             .attr("type", "button")
//             .attr("class", "btn shadow-sm btn-marigreen dropdown-toggle")
//             .attr("data-toggle", "dropdown")
//             .html("<i class='fas fa-list-ul'></i> Switch solution");
//         alts.append("div")
//             .attr("class", "dropdown-menu")
//             .attr("id", "solutions");
//         buildDropdown("solutions", alternatives,
//         valueFunction = d => d,
//         textFunction = d => {
//           return (d === chosenSolution ? "<b>" + d + "</b>" : d);
//         });

//         localStorage.setItem("solution-" + type, JSON.stringify(chosenSolution));
//         return (datasets[chosenSolution]);

//     } else { // if "tokens remains"
//         return (datasets["tokens"]);
//     }
// }

function mergeVariables(coordinates, variables) {
    coordinates.forEach((coordRow) => {
        _.assign(coordRow, variables.filter(varRow => varRow["_id"] === coordRow["_id"])[0]);
    });
}

// ########################################################################################################################
