function execute(datasets, type, alternatives) {
  const models = datasets["model"];
  const level = "token";
  const tokenSelection = listFromLS(level + "selection-" + type);


  // SET UP WORKSPACE ###############################################################################################################################

  d3.select("h1").html("Level 2 (<em>" + type + "</em>)");
  d3.select("#concordance").style("height", "50px");

  // Set buttons behaviour ##########################################################
  d3.select("#toLevel1").on("click", function () {
    window.open("level1.html" + "?type=" + type, "_self")
  });

  d3.select("#showMatrix").on("click", function () {
    var params = "width=400,height=400,menubar=no,toolbar=no,location=no,status=no";
    window.open("distanceMatrix.html?type=" + type, "distmatrix", params);
  });

  // clear selection of models
  d3.select("#clearSelect").on("click", () => { clearStorage(tokenSelection, level, type); });

  // first info from LocalStorage
  const modelSelection = listFromLS("modelselection-" + type);

  if (_.isEmpty(modelSelection)) {
    window.alert("No models found in selection, let's go back to Level 1!");
    window.open("level1.html" + "?type=" + type, "_self");
  } else if (modelSelection.length > 9) {
    window.alert("You have selected too many models, only the first 9 will be used.");
    while (modelSelection.length > 9) {
      modelSelection.pop();
    }
    localStorage.setItem("modelselection-" + type, JSON.stringify(modelSelection));
  }

  // Set up that doesn't depend on the solution(s) ################################################################

  const ncol = 3; // number of columns in the grid
  const nrow = Math.ceil(modelSelection.length / ncol); // number of rows in the grid
  const width = 250;
  const height = 250;
  const padding = 30;

  
  //add tooltip (before the svg so it is not on top of it?)
  const tooltip = setTooltip("#svgContainer");


  deploy(offerAlternatives(datasets, alternatives, type));
  d3.select("#solutions").selectAll("button").on("click", function (d) {
    localStorage.setItem("solution-" + type, JSON.stringify(d));
    deploy(datasets[d], tokenSelection);
  });

  // Offer options of solutions if they exist; otherwise, just work with "tokens" ###################################

  // FUNCTIONS ###############################################################################################################


  // update token selection
  function updateTokSelection(tokenSelection) {
    updateSelection(tokenSelection, level, type);
  }


  // Draw the plot based on the right dataset
  function deploy(coordinates) {
    const dataset = _.clone(coordinates);
    _.merge(dataset, datasets["variables"]);
    
    const solutionName = JSON.parse(localStorage.getItem("solution-" + type));
    if (!(_.isNull(solutionName))) {
      const technique = solutionName.toLowerCase().search("tsne") > -1 ? "t-SNE, perplexity: " + solutionName.match("[0-9]+") : solutionName.toUpperCase();
      d3.select("h4#solutionName").text("Technique: " + technique);
    }

    // Set up variables

    initVars(dataset, level, type);
    const modelColors = classifyColnames(models)["nominals"];
    let colorModel = varFromLS(models, "color", "model", type);
    
    updateTokSelection(tokenSelection);
    console.log(tokenSelection)

    
    // set up dropdowns #############################################################################
    buildDropdown("modelColour", modelColors,
    valueFunction = d => d,
    textFunction = d => formatVariableName(d))
    .on("click", function () {
      colorModel = updateVar(models, "color", this.value, "model", type);
      colorCircles();
    });

    buildDropdown("colour", nominals).on("click", function () {
      colorvar = updateVar(dataset, "color", this.value, level, type);
      updatePlot();
      updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
    });
    buildDropdown("shape",
      nominals.filter(function (d) { return (d === "Reset" || getValues(dataset, d).length <= 7); })).on("click", function () {
        shapevar = updateVar(dataset, "shape", this.value, level, type);
        updatePlot();
        updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
      });
    buildDropdown("size", numerals).on("click", function () {
      sizevar = updateVar(dataset, "size", this.value, level, type);
      updatePlot();
      updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
    });
    buildDropdown("models", modelSelection).on("click", function () {
      window.open("level3.html" + "?type=" + type + "&model=" + this.value, "_self");
    });

    // Set up canvas #######################################################################################

    d3.select("#svgContainer").selectAll("svg").remove();
    const svg = d3.select("#svgContainer").append("svg")
      .attr("width", width * ncol + padding * ncol)
      .attr("height", height * nrow + padding * (nrow - 1))
      .call(responsivefy)
      //.style("background-color", "lightgray")
      .attr("transform", "translate(0,0)")
      .append("g");


    // Set up brush
    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on("start", brushstart)
      .on("brush", brushing)
      .on("end", brushed);

    // react to selection of brush/click
    $(document).on("change", 'input[name="selection"]', function () {
      if (d3.select(this).attr("value") === "brush") {
        d3.selectAll(".cell").append("g")
          .attr("transform", "translate(" + padding + ", " + padding + ")")
          .attr("class", "brush")
          .call(brush);
      } else {
        d3.selectAll(".brush").remove();
      }
      // tokenSelection = [];
      updateTokSelection(tokenSelection);
    });

    // Set up scales (axes) - coordinates multiplied to get some padding in a way
    const xvalues = d3.merge(modelSelection.map(function (m) {
      console.log(m)
      return (getValues(dataset, m + ".x"));
    }));
    const yvalues = d3.merge(modelSelection.map(function (m) {
      return (getValues(dataset, m + ".y"));
    }));
    const xrange = setRange(xvalues, 1.05);
    const yrange = setRange(yvalues, 1.05);

    const x = d3.scaleLinear()
      .domain(xrange)
      .range([padding, width]);

    const y = d3.scaleLinear()
      .domain(yrange)
      .range([height, padding]);


    // Vertical center
    const xAxis = d3.axisBottom(x).tickSizeOuter(0);
    const yAxis = d3.axisLeft(y).tickSizeOuter(0);

    // DRAW PLOT ##############################################################################################################

    cells = svg.selectAll(".cell")
      .data(modelSelection.map(combine))
      .enter()
      .append("g")
      .attr("class", "cell")
      .attr("transform", function (d) {
        return ("translate(" + (+d.i) * (width + padding) + ", " + +((height + padding / 2) * (+d.j)) + ")");
      })
      .attr("model", function (d) { return (d.m) })
      .each(plotCell);

    colorCircles();
    updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
    updatePlot();



    // FUNCTIONS #################################################################################################################

    // To combine data of the models in one
    function combine(m, i) {
      return ({
        m: m,
        j: Math.floor(i / ncol),
        i: i - ncol * Math.floor(i / ncol)
      });
    }

    // Styling the mini plots (cells)

    function mouseoverCell(d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", 1)
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-color", "lightgray");
      tooltip.html(d.m)
        .style("left", (+d.i) * (width - padding) + padding + "px")
        .style("top", (height - padding) * (+d.j) + padding + "px");
    }


    function titleCell(cell) {
      cell.append("text")
        .attr("x", padding * 1.5)
        .attr("y", padding)
        .attr("dy", "-0.5em")
        .attr("font-size", "0.7em")
        .style("cursor", "pointer")
        .text(function (d) {
          return (d.m.length > 40 ? d.m.substring(0, 37) + "..." : d.m);
        })
        .on("click", function (d) {
          window.open("level3.html" + "?type=" + type + "&model=" + d.m, "_self");
        })
        .on("mouseover", mouseoverCell)
        .on("mouseout", function () {
          tooltip.transition().duration(200).style("opacity", 0);
          d3.selectAll(".selector").remove();
        });
    }

    function drawFrame(cell) {
      // Draw frame
      cell.append("rect")
        .attr("x", padding)
        .attr("y", padding)
        .attr("width", width - padding)
        .attr("height", height - padding)
        .style("fill", "none")
        .style("stroke", "black")
        .style("pointer-events", "all")
        .style("stroke-width", 0.5);

      traceCenter(cell, x1 = x(0), x2 = x(0), y1 = padding, y2 = height);

      traceCenter(cell, x1 = padding, x2 = width, y1 = y(0), y2 = y(0));

      // Draw axes
      cell.append("g")
        .attr("class", "axis xAxis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis);

      cell.append("g")
        .attr("class", "axis yAxis")
        .attr("transform", "translate(" + padding + ", " + 0 + ")")
        .call(yAxis);
    }

    function colorCircles() {
      d3.selectAll("circle")
        .style("fill", function (d) {
          const m = models.filter(function (row) { return (row["_model"] === d.m) })[0];
          return (code(m, colorModel, color, "#1f77b4"));
        });
    }

    function numberCell(cell) {
      // Show number of model
      cell.append("circle")
        .attr("cx", padding)
        .attr("cy", padding)
        .attr("r", padding * 0.4)

      cell.append("text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dx", "-0.3em")
        .attr("dy", "0.3em")
        .text(function (d) { return (modelSelection.indexOf(d.m) + 1); })
        .style("fill", "white")
        .style("font-weight", "bold")
        .style("font-size", "0.8em");
    }

    function mouseoverDot(d) {
      const tooltipcolor = code(d, colorvar, color, "#1f77b4")
      // const tooltiptext = typeof(ctxtvar) == "string" ? d[ctxtvar].replace(/<em>/g, "<em style='color:" +tooltipcolor + ";font-weight:bold;'>") : ""
      const ctxt = colnames["all"].filter(function (d) { return (d.startsWith("_ctxt") && d.endsWith(".raw")); })[0];
      const tooltiptext = d[ctxt].replace(/class=["']target["']/g, 'style="color:' + tooltipcolor + ';font-weight:bold;"');

      d3.select("#concordance").append("p")
        .attr("class", "text-center p-2 ml-2")
        .style("border", "solid")
        .style("border-color", "gray")
        .style("background-color", "white")
        .style("font-size", "0.8em")
        .html(tooltiptext);
    }

    // Styling the dots in the plots

    function styleDot() {
      d3.select(this)
        .attr("d", d3.symbol()
          .type(function (d) { return (code(d, shapevar, shape, d3.symbolCircle)); }) //set up shape
          .size(function (d) { return (code(d, sizevar, size, 50)); })) // set up size
        .style("fill", function (d) { return (code(d, colorvar, color, "#1f77b4")); }) // set up color
        .style("opacity", 1)
        .attr("model", d3.select(this.parentNode.parentNode).attr("model"))
        //.attr("token_id", function(d) {return(d["_id"])})
        .classed("lighter", function (d) { //ise selected?
          return (tokenSelection.length > 0 ? (tokenSelection.indexOf(d["_id"]) === -1) : false);
        })
        // .classed("lost", function(d) {return(!exists(d, cell)); })
        .on("mouseover", mouseoverDot)
        .on("mouseout", function () { d3.select("#concordance").select("p").remove(); })
        .on("click", function (d) {
          tokenSelection.indexOf(d["_id"]) === -1 ? tokenSelection.push(d["_id"]) : _.pull(tokenSelection, d["_id"]);
          updateTokSelection(tokenSelection);
        });
    }

    // Updating color, shape and size after every button clicking
    function updatePlot() {
      d3.selectAll(".dot").selectAll("path")
        .style("fill", function (d) { return (code(d, colorvar, color, "#1f77b4")); })
        .attr("d", d3.symbol().type(function (d) {
          return (code(d, shapevar, shape, d3.symbolCircle));
        }).size(function (d) {
          return (code(d, sizevar, size, 50));
        }));
    }

    // For the brush
    let brushCell; // this mess because of the cells
    function brushstart() {
      if (!(brushCell === this)) {
        if (!(brushCell === undefined)) { d3.selectAll(".brush").call(brush.move, null); }
        _.pullAll(tokenSelection, tokenSelection);
        updateTokSelection(tokenSelection);
        brushCell = this;
      }
    }

    function brushing(p) {
      const e = d3.event.selection;
      if (!_.isNull(e)) {
        d3.selectAll(".dot").selectAll("path")
          .classed("lighter", function (d) {
            var xc = x(d[p.m + ".x"]);
            var yc = y(d[p.m + ".y"]);
            return (xc < e[0][0] + padding || xc > e[1][0] + padding || yc < e[0][1] + padding || yc > e[1][1] + padding || !exists(d, p.m));
          });
      }
    }

    function brushed() {
      _.pullAll(tokenSelection, tokenSelection);
      d3.selectAll(".dot").selectAll("path")
        .each(function (d) {
          if (!(d3.select(this).classed("lighter")) && tokenSelection.indexOf(d["_id"]) === -1) {
            tokenSelection.push(d["_id"]);
          }
        });
      updateTokSelection(tokenSelection);
    }


    // ACTUALLY PLOTTING STUFF!!
    function plotCell(p) {
      const cell = d3.select(this);
      const present = dataset.filter(function (d) { return (exists(d, cell.attr("model"))); });
      const bin = dataset.filter(function (d) { return (!exists(d, cell.attr("model"))); });

      titleCell(cell);

      drawFrame(cell);

      numberCell(cell);

      // Draw present tokens

      cell.append("g")
        .attr("transform", "translate(0,0)")
        .attr("class", "dot")
        .selectAll("path")
        .data(present).enter()
        .append("path")
        .attr("class", "graph present")
        .attr("transform", function (d) {
          return ("translate(" + x(d[cell.attr("model") + ".x"]) + "," + y(d[cell.attr("model") + ".y"]) + ")");
        })
        .each(styleDot);

      // Draw lost tokens

      cell.append("g")
        .attr("transform", "translate(" + (width + padding / 4) + "," + padding / 2 + ")")
        .attr("class", "dot")
        .selectAll("path")
        .data(bin).enter()
        .append("path")
        .attr("class", "graph")
        .attr("transform", function (d) {
          var j = bin.indexOf(d);
          var i = Math.floor((j * 10) / width);
          j = j - (i * (width / 10));
          return ("translate(" + i * 10 + "," + j * 10 + ")");
        })
        .each(styleDot);
    }

  }



}