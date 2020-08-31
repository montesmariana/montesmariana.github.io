const settings = {
  width : 600,
  height : 600,
  padding : 40,
  level : 'model'
}

// Functions
function htmlText(d3, data, settings) {
  d3.select("h1").html("Level 1 (<em>" + settings.type + "</em>)");

  d3.select("#numSelected").text(data[settings.level + "Selection"].length);
}

function htmlButtons(d3, data, settings) {
  d3.select("#clearSelect").on("click", clearButton(settings, data));

  d3.select("#modelSelect").on("click", goTo("level2", settings));

  d3.select("#go2index").on("click", goTo("index"));
}

function htmlDropdowns(d3, data, settings) {
  [{
    name : "color", datatype : "nominals",
    name : "shape", datatype : "nominals",
    name : "size", datatype : "numerals"
  }].forEach((x) => {
    buildDropdown(d3, x.name, x.datatype, data, settings,
      valueFunction = d => d,
      textFunction = d => formatVariableName(d));
  });
}
function clearButton(settings, data) {
  clearStorage(data[settings.level + "Selection"], settings.level, settings, type);
  if (settings.level === "model") {
    resetVariable(settings.type + "-modselectionFromButtions");
    _.keys(data.variableSelection).forEach(v => data.variablesSelection[v] = [])
    d3.selectAll("label[name='selectionByButtons']").classed("active", false);
  }
}

function goTo(url, settings = null) {
  if (url == "level2") {
    window.open(url, ".html?type=" + settings.type);
  } else {
    window.open(url + ".html", "_self");
  }
}

function addCheckbox(d3, data, type) {
  checkboxSections("focrow", data.foc, data.data); // create buttons for "foc"
  checkboxSections("socrow", data.soc, data.data); // create buttons for "soc"

  $(document).on('change', 'input', clickCheckbox(d3, data, type));
}

function clickCheckbox(d3, data, type) {
  const checked = d3.select(this).attr('id');
  const key = checked.split(":")[0];
  const value = checked.split(":")[1];
  updateArray(data.variableSelection[key], value);
  localStorage.setItem(type + "-modselectionFromButtons", JSON.stringify(data.variableSelection));
  updateCheckbox(data.data, data.variableSelection);
}

function setOneCloud(d3, settings, coordScale) {
  const width = settings.width;
  const height = settings.height;

  const svg = d3.select("#svgContainer").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(responsivefy)
    .attr("transform", "translate(0,0)")
    .append("g")
    .call(d3.zoom().on('zoom', zoomed));

  setPointerEvents(svg, width, height);

  const xAxis = d3.axisBottom(coordScale.x).tickSizeOuter(0);
  svg.append("g")
    .attr("id", "xaxis")
    .attr("transform", "translate(0, " + (height - settings.padding) + ")")
    .call(xAxis);

  const yAxis = d3.axisLeft(coordScale.y).tickSizeOuter(0);
  svg.append("g")
    .attr("id", "yaxis")
    .attr("transform", "translate(" + settings.padding + ", 0)")
    .call(yAxis);

  const xCenter = traceCenter(svg, x1 = coordScale.x(0), x2 = coordScale.x(0), y1 = settings.padding, y2 = height - settings.padding);

  // Horizontal center
  const yCenter = traceCenter(svg, x1 = settings.padding, x2 = width - settings.padding, y1 = coordScale.y(0), y2 = coordScale.y(0));

  return {
    svg : svg, xAxis : xAxis, yAxis : yAxis, xCenter : xCenter, yCenter : yCenter
  }

}

function setScales(d3, data, settings) {
  const xrange = setRange(getValues(data, 'model.x'), 1.1);
  const yrange = setRange(getValues(data, 'model.y'), 1.1);

  const x = d3.scaleLinear()
    .domain(xrange)
    .range([settings.padding, settings.width - settings.padding]);

  const y = d3.scaleLinear()
    .domain(yrange)
    .range([settings.height - settings.padding, settings.padding]);

  return { x : x, y : y }
}


function locateDot(d, modelname, coords){
  return ("translate(" + coords.x(d[modelname + '.x']) + "," + coords.y(d[modelname + '.y']) + ")");
}

function styleDot(d3, dot, data, globals){
  dot.style('fill', (d) => code(d3, d, data.colorvar, globals.color, "#1f77b4")) // original color
    .attr("d", d3.symbol() // original look
      .type((d) => code(d3, d, data.shapevar, globals.shape, d3.symbolWye)) // original shape
      .size((d) => code(d3, d, data.sizevar, globals.size, 64)));
}

function removeTooltip(d3, tooltip){
  tooltip.transition().duration(200).style("opacity", 0);
  d3.selectAll(".selector").remove();
}


function toggleDot(d, selection, level){
  const id = level == "model" ? "_model" : "_id";
  updateArray(selection, d[id]);
}
function makeDots(d3, svg, data, coords, settings, globals) {
  //add tooltip (before the svg so it is not on top of it?)
  const tooltip = setTooltip("#svgContainer");

  const dot = svg.append("g")
    .attr("class", "dot")
    .selectAll("path")
    .data(data.data).enter()
    .append('path')
    .attr("class", "graph")
    .attr("transform", (d) => locateDot(d, "model", coords)) // coordinates!
    .on("mouseover", (d) => mouseoverDot(d3, d, data, svg, tooltip))
    .on('mouseout', removeTooltip(d3, tooltip))
    .on('click', function (d) {
      resetVariable(settings.type + "-modselectionFromButtons");
      toggleDot(d, data.modelSelection, settings.level);
      updateSelection(d3, data, settings);
    });

  styleDot(d3, dot, data, globals);
  highlightDot(d3, data.modelSelection, settings.level);
  return(dot);
}

function reportVariables(d3, data, variable){
  const thisVar = data[variable + "var"]["variable"];
  if (_.isNull(thisVar)) {
    return "";
  } else {
    const thisValue = variable === "size" ? d3.format(".r")(+d[thisVar]) : d[thisVar];
    return("<br><b>" + thisVar + "</b>: " + thisValue);
  }
}

function mouseoverDot(d3, d, data, svg, tooltip) {
  // Extract coordinates from the 'transform' attribute
  const position = d3.select(this).attr("transform").split(',');
  const xcoord = parseInt(position[0].split('(')[1]) / 1.1;
  // xcoord = +xcoord > 250 ? +(xcoord) - 100 : +xcoord;
  const ycoord = parseInt(position[1].split(')')[0]) / 1.1;

  tooltip.transition() // show tooltip
    .duration(200)
    .style("opacity", 1);

  const reportedVariables = reportVariables(d3, data, "color") + reportVariables(d3, data, "shape") + reportVariables(d3, data, "size");
  tooltip.html("<b>" + d['_model'] + "</b>" + reportedVariables)
    .style("left", (xcoord) + "px")
    .style("top", (ycoord) + "px");
  svg.select(".dot")
    .append("path")
    .attr("class", "selector")
    .attr("transform", d3.select(this).attr("transform"))
    .attr("d", d3.symbol().type(d3.symbolCircle).size(250))
    .style("fill", "none")
    .style("stroke", compColor(d3, d3.select(this).style("fill")))
    .style("stroke-width", 2);
}

function zoomed(d3, svg, dot, coords) {
  newY = d3.event.transform.rescaleY(coords.y);
  newX = d3.event.transform.rescaleX(coords.x);
  svg.svg.select('#xaxis').call(svg.xAxis.scale(newX)); // x axis rescaled
  svg.svg.select('#yaxis').call(svg.yAxis.scale(newY)); // y axis rescaled
  dot.attr("transform", (d) => locateDot(d, "model", {x = nexX, y = newY})) // dots repositioned
  svg.xCenter.attr("x1", newX(0)).attr("x2", newX(0)); // central x rescaled
  svg.yCenter.attr("y1", newY(0)).attr("y2", newY(0)); // central y rescaled
};

function checkboxSections(where, data) {
  d3.select("#" + where).selectAll("div")
    .data(data.data)
    .enter()
    .append("div")
    .attr("class", "btn-group-toggle")
    .attr("data-toggle", "buttons")
    .each((p) => appendCheckbox(d3, data, p));
}

function appendCheckbox(d3, data, p) {
  const butGroup = d3.select(this);

  const butText = formatVariableName(p);

  butGroup.append("p")
    .attr("class", "mb-0 mt-2")
    .style("font-weight", "bold")
    .text("Select " + butText);

  butGroup.selectAll("label")
    .data(getValues(data.data, p))
    .enter()
    .append("label")
    .attr("class", "btn btn-secondary py-0 m-0")
    .attr("parent", p)
    .attr("name", "selectionByButtons")
    .classed("active", (d) => data.variableSelection[p].indexOf(d) > -1)
    .text(d => d)
    .append("input")
    .attr("type", "checkbox")
    .attr("autocomplete", "off")
    .attr("id", (d) => p + ":" + d);
}

function updateCheckbox(data, variableSelection) {
  const selectedValues = _.omitBy(variableSelection, _.isEmpty);

  const selectedTokens = d3.keys(selectedValues).map( (v) => {
    const filteredDataset = data.data
      .filter((row) => selectedValues[v].indexOf(row[v]) > -1 ) // filter by variable
      .map((row) => row["_model"]);// extract modelname
    return (filteredDataset);
  });

  data.modelSelection = [];
  data.modelSelection.push(..._.intersection(...selectedTokens));
  updateSelection(d3, data, settings);
}

function execute(datasets, type) {
  settings.type = type;
  const dataset = datasets["model"];
  
  const data = initVars(dataset, "mod"); // sets colnames, nominals, numerals, sizevar, colorvar...
  data.modelSelection = listFromLS(settings.level + "selection-" + settings.type);

  data.foc = data.nominals.filter( (d) => d.startsWith('foc_'));
  data.soc = data.nominals.filter( (d) => d.startsWith('soc_'));
  data.VSFromLS = JSON.parse(localStorage.getItem(type + "-modselectionFromButtons"));
  data.variableSelection = _.isNull(data.VSFromLS) ? _.fromPairs(_.map(data.nominals, (x) => [x, []])) : data.VSFromLS;

  htmlText(d3, data, settings);
  htmlButtons(d3, data, settings);
  htmlDropdowns(d3, data, settings);
  addCheckbox(d3, data, type);


  // Set up canvas ######################################################################
  const coordScale = setScales(d3, data.data, settings);
  const svg = setOneCloud(d3, settings, coordScale);
  const dot = makeDots(d3, svg, data, coordScale, settings, globals);

  // Run basic functions
  updateCheckbox(data.data, data.variableSelection);
  updateLegend(data, settings);
  updateSelection(d3, data, settings);

}