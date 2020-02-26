function execute(datasets, type) {
  var width = 600,
    height = 600,
    padding = 40;
  var dataset = datasets[0];
  var foc, soc;
  var modselection;
  var valselection = [], filtmodand = [], filteredvars, filtvalues, filtmodor, modstemp; // for filtering with buttons
  var colorDropdown, shapeDropdown, sizeDropdown;
  var tooltip;
  var svg, dot;
  var x, y, newX, newY, xrange, yrange;
  var xCenter, yCenter, xAxis, yAxis;
  var level = 'model';


  d3.select("h1").html("Level 1 (<em>" + type + "</em>)");
  // colnames = classify_colnames(dataset);
  // nominals = colnames['nominals'];
  // numerals = colnames['numerals'];

  initVars(dataset, "mod");

  foc = nominals.filter(function(d) {return (d.startsWith('foc_')); });
  soc = nominals.filter(function(d) {return (d.startsWith('soc_')); });
  
  // information from localStorage
  // colorvar = varFromLS(dataset, "color", "mod");
  // colorselection = [];

  // shapevar = varFromLS(dataset, "shape", "mod");
  // shapeselection = [];

  // sizevar = varFromLS(dataset, "size", "mod");

  modselection = listFromLS(level + "selection-" + type);

  // set up buttons selection
  
  focButtons = checkBoxSections("focrow", foc, dataset);
  socButtons = checkBoxSections("socrow", soc, dataset);
  if (type == 'church') {
    finButtons = checkBoxSections("finalrow", ["minimum_contextwords"], dataset);
  }
        
  $(document).on('change', 'input', function(){
    var checked = d3.select(this).attr('id');
    if (valselection.indexOf(checked) == -1) {
      valselection.push(checked);
    } else {
      valselection.splice(valselection.indexOf(checked), 1);
    }
    console.log(valselection);
    updateModButtons();
  });

  function updateModButtons(){
    var newsel = [];
    if (type == 'church') {
      var fvars = foc.concat(soc).concat(['minimum_contextwords']);
    } else {
      var fvars = foc.concat(soc)
    }
    filteredvars = fvars.filter(function(d) {
      return(valselection.filter(function(x) {return(x.startsWith(d))}).length > 0);
    });
    filtmodand = [];
    filteredvars.forEach(function(d) {
      filtvalues = valselection
        .filter(function(x) {return(x.startsWith(d))})
        .map(function(x) {return(x.split(':')[1])});
      filtmodor = [];
      filtvalues.forEach(function(v) {
        modstemp = d3.map(dataset, function(row) {
          if (row[d] == v) {return(row['_model']); }
        }).keys();
        filtmodor = filtmodor.concat(modstemp);
        filtmodor.splice(filtmodor.indexOf('undefined'), 1);
      })
      filtmodand = filtmodand.length > 0 ? filtmodor.filter(function(x) {return(filtmodand.indexOf(x) > -1); }) : filtmodor;
    })
    updateModSelection(filtmodand);
  }

  // set up dropdowns
  colorDropdown = buildDropdown("colour", nominals);
  shapeDropdown = buildDropdown("shape", nominals);
  sizeDropdown = buildDropdown("size", numerals);

  
  // Set up canvas
  svg = d3.select("#svgContainer").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(responsivefy)
    .attr("transform", "translate(0,0)")
    .append("g")
    .call(d3.zoom().on('zoom', zoomed));
  
    //add tooltip (before the svg so it is not on top of it?)
  tooltip = setTooltip("#svgContainer");
  
  // Set up pointing area so you can have zoom with the mouse in any point of the plot
  setPointerEvents(svg, width, height);
    
  // Set up scales (axes, color...) - coordinates multiplied to get some padding in a way
  xrange = setRange(getValues(dataset, 'model.x'), 1.1);
  yrange = setRange(getValues(dataset, 'model.y'), 1.1);
  console.log('testrange')
  // xrange = [
  //   d3.min(dataset, function(d) {return (+d['model.x']); }) * 1.1,
  //   d3.max(dataset, function(d) {return (+d['model.x']) ;}) * 1.1
  // ];
  // yrange = [
  //   d3.min(dataset, function(d) {return (+d['model.y']); }) * 1.1,
  //   d3.max(dataset, function(d) {return (+d['model.y']) ;}) * 1.1
  // ];

  x = d3.scaleLinear()
    .domain(xrange)
    .range([padding, width-padding]);

  y = d3.scaleLinear()
    .domain(yrange)
    .range([height-padding, padding]);

  newX = x;
  newY = y;

  // Vertical center
  xCenter = traceCenter(svg, x1 = newX(0), x2 = newX(0), y1 = padding, y2 = height-padding);
  
  // Horizontal center
  yCenter = traceCenter(svg, x1 = padding, x2 = width-padding, y1 = newY(0), y2 = newY(0));
  

  // Axes (tickSizeOuter(0) avoids overlap of axes)
  xAxis = d3.axisBottom(newX).tickSizeOuter(0);
  svg.append("g")
    .attr("id", "xaxis")
    .attr("transform", "translate(0, " + (height-padding) + ")")
    .call(xAxis);

  yAxis = d3.axisLeft(newY).tickSizeOuter(0);
  svg.append("g")
    .attr("id", "yaxis")
    .attr("transform", "translate(" + padding + ", 0)")
    .call(yAxis);

  // What happens with the zoom
  function zoomed() {
    newY = d3.event.transform.rescaleY(y);
    newX = d3.event.transform.rescaleY(x);
    svg.select('#xaxis').call(xAxis.scale(newX)); // x axis rescaled
    svg.select('#yaxis').call(yAxis.scale(newY)); // y axis rescaled
    dot.attr("transform", function(d) {
      return("translate(" + newX(d['model.x']) +  ", " + newY(d['model.y']) + ")");
    }) // dots repositioned
    xCenter.attr("x1", newX(0)).attr("x2", newX(0)); // central x rescaled
    yCenter.attr("y1", newY(0)).attr("y2", newY(0)); // central y rescaled
  };


  // Design of The Dot

  dot = svg.append("g")
    .attr("class", "dot")
    .selectAll("path")
    .data(dataset).enter()
      .append('path')
      .attr("class", "graph")
      .attr("transform", function(d) { return ("translate(" + newX(d['model.x']) + "," + newY(d['model.y']) + ")"); })
      .attr("d", d3.symbol()
        .type(function (d) {return (code(d, shapevar, shape, d3.symbolWye)); })
        .size(function(d) {return (code(d, sizevar, size, 64)); }))
      .style('fill', function(d) {return (code(d, colorvar, color, "#1f77b4")); })
      .classed("lighter", function(d) {return (modselection.length > 0 ? modselection.indexOf(d['_model']) === -1 : false); })
      .on("mouseover", function(d) {
        let position = d3.select(this).attr("transform").split(',');
        let xcoord = position[0].split('(')[1];
        xcoord = +xcoord > 250 ? +(xcoord)-100 : +xcoord;
        let ycoord = position[1].split(')')[0];
        tooltip.transition()
          .duration(200)
          .style("opacity", 1);
        var colordata = (typeof(colorvar['variable']) == "string" ? "<br><b>"+colorvar['variable']+"</b>: " + d[colorvar['variable']] : "");
        var shapedata = (typeof(shapevar['variable']) == "string" ? "<br><b>"+shapevar['variable']+"</b>: " + d[shapevar['variable']] : "");
        var sizedata = (typeof(sizevar['variable']) == "string" ? "<br><b>"+sizevar['variable']+"</b>: " + d3.format(".3r")(+d[sizevar['variable']]) : "");
        tooltip.html("<b>" + d['_model'] + "</b>" + colordata + shapedata + sizedata)
          .style("left", (xcoord) + "px")
          .style("top", (ycoord) + "px");
        svg.select(".dot")
          .append("path")
          .attr("class", "selector")
          .attr("transform", d3.select(this).attr("transform"))
          .attr("d", d3.symbol().type(d3.symbolCircle).size(250))
          .style("fill", "none")
          .style("stroke", compColor(d3.select(this).style("fill")))
          .style("stroke-width", 2);
      })
      .on('mouseout', function() {
        tooltip.transition()
          .duration(200)
          .style("opacity", 0);
        d3.selectAll(".selector").remove();
      })
      .on('click', function(d) {
        var modName = d['_model'];
        var modIndex = modselection.indexOf(modName);
        if (modIndex > -1) {
          modselection.splice(modIndex, 1);
        } else {
          modselection.push(modName);
        }
        updateModSelection(modselection);
      });

  // what happens when we click on the dropdowns?
  colorDropdown.on("click", function() {
    colorvar = updateVar(dataset, "color", this.value, "mod");
    colorselection = [];
    updatePlot();
    updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
  });

  shapeDropdown.on("click", function() {
    shapevar = updateVar(dataset, "shape", this.value, "mod");
    shapeselection = [];
    updatePlot();
    updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
  });

  sizeDropdown.on("click", function() {
    sizevar = updateVar(dataset, "size", this.value, "mod");
    updatePlot();
    updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
  });

  // clear selection of models
  d3.select("#clear-select")
    .on("click", function() {
      modselection = [];
      cleanStor("colorsel-" + level + '-' + type);
      cleanStor("shapesel-" + level + '-' + type);
      cleanStor("sizesel-" + level + '-' + type);
      updateModSelection(modselection);
    });

  d3.select("#model-select")
    .on("click", function() {
      window.open("level2.html" + "?type=" + type, "_self");
    });

  d3.select("#go-to-index")
    .on("click", function() {
      window.open("index.html", "_self");
    });

  d3.select("#go-to-buttons")
    .on("click", function() {
      window.open("buttons_selection.html", "_self");
    });

  // Updating color, shape and size after every button clicking
  function updatePlot() {
    dot.style("fill", function(d) {return (code(d, colorvar, color, "#1f77b4")); })
      .attr("d", d3.symbol().type(function(d) {
        return (code(d, shapevar, shape, d3.symbolWye));
        }).size(function(d) {
          return (code(d, sizevar, size, 64)); }));
  }

  function updateModSelection(modselection) {
    updateSelection(modselection, "model", type);
  }
  

  updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
  updateModSelection(modselection);
}