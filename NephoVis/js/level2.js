function execute(datasets, type, alternatives) {
  var modselection, tokselection;
  var ncol, nrow, width, height, padding;
  var dataset = datasets[2];
  var models = datasets[0];
  var colorDropdown, shapeDropdown, sizeDropdown, modDropdown;
  var tooltip;
  var svg, cells;
  var brush, brushCell;
  var xmin = [], ymin = [], xmax = [], ymax = []; // to scale the plots
  var xAxis, yAxis;
  var x, y, xrange, yrange; // for scales
  var i, j, m; // to iterate over the models
  var models, model_colors, color_model;
  var level = 'token';


  d3.select("h1").html("Level 2 (<em>" + type + "</em>)");

  // Go back to previous level
  d3.select("#to-level1").on("click", function () {
    window.open("level1.html" + "?type=" + type, "_self")
  });

  // first info from LocalStorage
  modselection = listFromLS("modelselection-" + type);
  // modselection = JSON.parse(localStorage.getItem("modselection"));
  if (modselection == null) {
    window.alert("No models found in selection, let's go back to Level 1!");
    window.open("level1.html" + "?type=" + type, "_self");
  } else if (modselection.length > 9) {
    window.alert("You have selected too many models, only the first 9 will be used.");
    modselection = modselection.slice(0, 9);
    localStorage.setItem("modelselection-" + type, JSON.stringify(modselection));
  }

  ncol = 3; // number of columns in the grid
  nrow = Math.ceil(modselection.length / ncol); // number of rows in the grid
  width = 250, height = 250, padding = 30;
  d3.select("#concordance").style("height", padding * 2 + "px");

  if (datasets.length > 3 && alternatives !== null) {
    const chosenSolution = JSON.parse(localStorage.getItem("solution-" + type));
    if (chosenSolution !== null) {
      dataset = datasets[d3.keys(alternatives).indexOf(chosenSolution) + 3];
    }
    const alts = d3.select("#moveAround").append("div")
      .attr("class", "btn-group");
    alts.append("button")
      .attr("type", "button")
      .attr("class", "btn shadow-sm btn-marigreen dropdown-toggle")
      .attr("data-toggle", "dropdown")
      .html("<i class='fas fa-list-ul'></i> Switch solution");
    alts.append("div")
      .attr("class", "dropdown-menu")
      .attr("id", "solutions");
    altDropdown = buildDropdown("solutions", d3.keys(alternatives));
    altDropdown.on("click", function (d) {
      localStorage.setItem("solution-" + type, JSON.stringify(d));
      dataset = datasets[d3.keys(alternatives).indexOf(d) + 3];
      deploy(dataset);
    })
  }


  // model_colors = classify_colnames(models)['nominals'];
  // color_model = varFromLS(models, "color", "model", type);
  // modelColDropdown = buildDropdown("model-colour", model_colors);
  // modelColDropdown.on("click", function() {
  //   color_model = updateVar(models, "color", this.value, 'model', type);
  //   color_circles();
  // });

  // color_circles();
  // function color_circles() {
  //   console.log(color_model['values']);
  //   d3.selectAll('circle')
  //     .style('fill', function(d) {
  //       if (typeof color_model['variable'] === 'string') {
  //         const value = models.filter(function(m) {return m['_model'] === d.m;})
  //           .map(function(n) {return (n[color_model['variable']])})[0];
  //           console.log(value);
  //         return(color(color_model['values'].indexOf(value)));
  //       } else {
  //         return(color(0));
  //       }
  //     });
  // }
  tokselection = listFromLS(level + "selection-" + type);

  //add tooltip (before the svg so it is not on top of it?)
  tooltip = setTooltip("#svgContainer");

  // Set up brush
  brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on('start', brushstart)
    .on('brush', brushing)
    .on('end', brushed);

  function brushstart() {
    if (!(brushCell == this)) {
      if (!(brushCell == undefined)) { d3.selectAll('.brush').call(brush.move, null); }
      tokselection = [];
      updateTokSelection(tokselection);
      brushCell = this;
    }
  }

  function brushing(p) {
    var e = d3.event.selection;
    if (!(e == null)) {
      svg.selectAll('.dot').selectAll('path')
        .classed('lighter', function (d) {
          var xc = x(d[p.m + '.x']);
          var yc = y(d[p.m + '.y']);
          return (xc < e[0][0] + padding || xc > e[1][0] + padding || yc < e[0][1] + padding || yc > e[1][1] + padding || !exists(d, p.m));
        });
    }
  }

  function brushed() {
    tokselection = [];
    svg.selectAll('.dot').selectAll('path')
      .each(function (d) {
        if (!(d3.select(this).classed("lighter")) && tokselection.indexOf(d['_id']) === -1) {
          tokselection.push(d['_id']);
        }
      });
    updateTokSelection(tokselection);
  }

  function deploy(dataset) {

    const solutionName = JSON.parse(localStorage.getItem("solution-"+type));
    if (solutionName !== null) {
      const technique = solutionName.toLowerCase().search("tsne") > -1 ? "t-SNE, perplexity: " + solutionName.match("[0-9]+") : solutionName.toUpperCase();
      d3.select("h4#solutionName").text("Technique: " + technique);
    }
    // classify columns
    initVars(dataset, level, type);
    // colnames = classify_colnames(dataset);
    // nominals = colnames['nominals'];
    // numerals = colnames['numerals'];
    // contexts = colnames['contexts'];

    // colorvar = varFromLS(dataset, "color", level, type);

    // shapevar = varFromLS(dataset, "shape", level, type);

    // sizevar = varFromLS(dataset, "size", level, type);
    // Set up canvas
    d3.select("#svgContainer").selectAll("svg").remove();
    svg = d3.select("#svgContainer").append("svg")
      .attr("width", width * ncol + padding * ncol)
      .attr("height", height * nrow + padding * (nrow - 1))
      .call(responsivefy)
      //.style("background-color", "lightgray")
      .attr("transform", "translate(0,0)")
      .append("g");

    // set up dropdowns
    colorDropdown = buildDropdown("colour", nominals);
    shapeDropdown = buildDropdown("shape", nominals.filter(function (d) { return (getValues(dataset, d).length <= 7); }));
    sizeDropdown = buildDropdown("size", numerals);
    modDropdown = buildDropdown("models", modselection);

    // Set up scales (axes, color...) - coordinates multiplied to get some padding in a way
    xvalues = d3.merge(modselection.map(function (m) {
      return (getValues(dataset, m + '.x'));
    }));
    yvalues = d3.merge(modselection.map(function (m) {
      return (getValues(dataset, m + '.y'));
    }));
    xrange = setRange(xvalues, 1.05);
    yrange = setRange(yvalues, 1.05);

    x = d3.scaleLinear()
      .domain(xrange)
      .range([padding, width]);

    y = d3.scaleLinear()
      .domain(yrange)
      .range([height, padding]);


    // Vertical center
    xAxis = d3.axisBottom(x).tickSizeOuter(0);
    yAxis = d3.axisLeft(y).tickSizeOuter(0);

    function combine(m, i) {
      return ({
        m: m,
        j: Math.floor(i / 3),
        i: i - 3 * Math.floor(i / 3)
      });
    }

    cells = svg.selectAll(".cell")
      .data(modselection.map(combine))
      .enter()
      .append('g')
      .attr('class', 'cell')
      .attr('transform', function (d) {
        return ('translate(' + (+d.i) * (width + padding) + ", " + +((height + padding / 2) * (+d.j)) + ")");
      })
      .attr('model', function (d) { return (d.m) })
      .each(plotCell);

    $(document).on('change', 'input[name="selection"]', function () {
      var radio = d3.select(this).attr('value');
      if (radio == 'brush') {
        cells.append('g')
          .attr("transform", "translate(" + padding + ", " + padding + ")")
          .attr("class", "brush")
          .call(brush);
      } else {
        svg.selectAll(".brush").remove();
      }
      // tokselection = [];
      updateTokSelection(tokselection);
    });

    function plotCell() {
      var cell = d3.select(this);
      var bin, present;

      cell.append('text')
        .attr('x', padding * 1.5)
        .attr('y', padding)
        .attr('dy', '-0.5em')
        .attr('font-size', '0.7em')
        .style('cursor', 'pointer')
        .text(function (d) {
          return (d.m.length > 40 ? d.m.substring(0, 37) + '...' : d.m);
        })
        .on("click", function (d) {
          window.open("level3.html" + "?type=" + type + "&model=" + d.m, "_self");
        })
        .on('mouseover', function (d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", 1)
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-color", "lightgray");
          tooltip.html(d.m)
            .style("left", (+d.i)*(width-padding)+padding + "px")
            .style("top", (height-padding)*(+d.j)+padding + "px");
        })
        .on('mouseout', function () {
          tooltip.transition()
            .duration(200)
            .style("opacity", 0);
          d3.selectAll(".selector").remove();
        });

      // Draw frame
      cell.append('rect')
        .attr('x', padding)
        .attr('y', padding)
        .attr('width', width - padding)
        .attr('height', height - padding)
        .style('fill', 'none')
        .style('stroke', 'black')
        .style("pointer-events", "all")
        .style('stroke-width', 0.5);

      traceCenter(cell, x1 = x(0), x2 = x(0), y1 = padding, y2 = height);

      traceCenter(cell, x1 = padding, x2 = width, y1 = y(0), y2 = y(0));

      cell.append("g")
        .attr("class", "axis xAxis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis);

      cell.append("g")
        .attr("class", "axis yAxis")
        .attr("transform", "translate(" + padding + ", " + 0 + ")")
        .call(yAxis);

      cell.append('circle')
        .attr('cx', padding)
        .attr('cy', padding)
        .attr('r', padding * 0.4)
        .style('fill', function (d) {
          if (typeof color_model === 'string') {
            const value = models.filter(function (m) { return m['_model'] === d.m; })
              .map(function (n) { return (n[color_model]) }).keys();
            return (color(value));
          } else {
            return (color(0));
          }
        });


      cell.append('text')
        .attr('x', padding)
        .attr('y', padding)
        .attr('dx', '-0.3em')
        .attr('dy', '0.3em')
        .text(function (d) { return (modselection.indexOf(d.m) + 1); })
        .style('fill', 'white')
        .style('font-weight', 'bold')
        .style('font-size', '0.8em');

      present = dataset.filter(function (d) { return (exists(d, cell.attr("model"))); });

      cell.append("g")
        .attr("transform", "translate(0,0)")
        .attr("class", "dot")
        .selectAll("path")
        .data(present).enter()
        .append('path')
        .attr("class", "graph present")
        .attr("transform", function (d) {
          return ("translate(" + x(d[cell.attr('model') + '.x']) + "," + y(d[cell.attr('model') + '.y']) + ")");
        })
        .each(styleDot);

      bin = dataset.filter(function (d) { return (!exists(d, cell.attr("model"))); });

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

      function styleDot() {
        var dot = d3.select(this);

        dot.attr("d", d3.symbol()
          .type(function (d) { return (code(d, shapevar, shape, d3.symbolCircle)); })
          .size(function (d) { return (code(d, sizevar, size, 50)); }))
          .style('fill', function (d) { return (code(d, colorvar, color, "#1f77b4")); })
          .style('opacity', 1)
          .attr('model', modselection[m])
          //.attr('token_id', function(d) {return(d['_id'])})
          .classed("lighter", function (d) {
            return (tokselection.length > 0 ? (tokselection.indexOf(d['_id']) === -1) : false);
          })
          // .classed("lost", function(d) {return(!exists(d, cell)); })
          .on('mouseover', function (d) {
            // let position = d3.select(this).attr("transform").split(',');
            // let xcoord = +(position[0].split('(')[1]) > 250 ? padding : position[0].split('(')[1];
            // let ycoord = position[1].split(')')[0];
            var tooltipcolor = code(d, colorvar, color, "#1f77b4")
            // var tooltiptext = typeof(ctxtvar) == 'string' ? d[ctxtvar].replace(/<em>/g, "<em style='color:" +tooltipcolor + ";font-weight:bold;'>") : ""
            var ctxt = colnames['all'].filter(function (d) { return (d.startsWith("_ctxt") && d.endsWith(".raw")); })[0];
            var tooltiptext = d[ctxt].replace(/class=["']target["']/g, "style='color:" + tooltipcolor + ";font-weight:bold;'");
            d3.select("#concordance").append("p")
              .attr("class", "text-center p-2 ml-2")
              .style("border", "solid")
              .style("border-color", "gray")
              .style("background-color", "white")
              .style("font-size", "0.8em")
              .html(tooltiptext);

            // tooltip.transition()
            //   .duration(200)
            //   .style("opacity", 1)
            //   .style("background-color", "white")
            //   .style("border", "solid")
            //   .style("border-color", "lightgray");
            // tooltip.html("<b>" + d['_id'] + "</b><br>" + xcoord + ", " +  ycoord)
            // tooltip.html("<b style='color: " + tooltipcolor + "'>" + d['_id'] + "</b><br>" + tooltiptext)
            //   .style("left", (xcoord) + "px")
            //   .style("top", (ycoord) + "px")
            //   .style("width", "500px");
          })
          .on('mouseout', function () {
            d3.select("#concordance").select("p").remove();
            // tooltip.transition()
            //   .duration(200)
            //   .style("opacity", 0);
            // d3.selectAll(".selector").remove();
          })
          .on('click', function (d) {
            var tokId = d['_id'];
            var tokIndex = tokselection.indexOf(tokId);
            if (tokIndex > -1) {
              tokselection.splice(tokIndex, 1);
            } else {
              tokselection.push(tokId);
            }
            updateTokSelection(tokselection);
          });
      }
    }

    // what happens when we click on the dropdowns?
    colorDropdown.on("click", function () {
      colorvar = updateVar(dataset, "color", this.value, level, type);
      updatePlot();
      updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
    });

    shapeDropdown.on("click", function () {
      shapevar = updateVar(dataset, "shape", this.value, level, type);
      updatePlot();
      updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
    });

    sizeDropdown.on("click", function () {
      sizevar = updateVar(dataset, "size", this.value, level, type);
      updatePlot();
      updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
    });

    modDropdown.on("click", function () {
      window.open("level3.html" + '?type=' + type + '&model=' + this.value, "_self");
    });

    // clear selection of models
    d3.select("#clear-select")
      .on("click", function () {
        cleanStor("colorsel-" + level + '-' + type);
        cleanStor("shapesel-" + level + '-' + type);
        cleanStor("sizesel-" + level + '-' + type);
        tokselection = [];
        updateTokSelection(tokselection);
      });

    // Updating color, shape and size after every button clicking
    function updatePlot() {
      svg.selectAll('.dot').selectAll('path')
        .style("fill", function (d) { return (code(d, colorvar, color, "#1f77b4")); })
        .attr("d", d3.symbol().type(function (d) {
          return (code(d, shapevar, shape, d3.symbolCircle));
        }).size(function (d) {
          return (code(d, sizevar, size, 50));
        }));
    }

    // update token selection
    function updateTokSelection(tokselection) {
      updateSelection(tokselection, level, type);
    }
    // function updateTokSelection(tokselection) {
    //   // stores 'null' if it's empty and the list otherwise
    //   localStorage.setItem("tokselection", tokselection.length > 0 ? JSON.stringify(tokselection) : JSON.stringify(null));
    //   // if something is selected everything else is translucent
    //   svg.selectAll(".dot").selectAll("path")
    //     .classed("lighter", function(d) {return (tokselection.length > 0 ? tokselection.indexOf(d['_id']) === -1 : false); });
    // }

    updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
    updateTokSelection(tokselection);
  }

  deploy(dataset);

  d3.select("#show-matrix").on("click", function () {
    var params = "width=400,height=400,menubar=no,toolbar=no,location=no,status=no";
    window.open("distanceMatrix.html?type=" + type, "distmatrix", params);
  });

}