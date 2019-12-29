function showConc(concordance) {
    counter += 1;
    this_selection = this_user['tokens'][type].slice(0);
    // Remove and recreate concordance to avoid accumulation
    $("#concordance").remove();

    d3.select("#playground").append("div")
        .attr("class", "col-sm-10")
        .attr("id", "concordance");

    // Filter the data
    concordances = concordance.filter(function (d) { return (this_selection.indexOf(d.id) > -1); });
    toClassify = d3.map(concordances, function (d) { return (d.id); }).keys();
    if (d3.keys(text).indexOf(type) == -1) {
        text[type] = {};
        saved = JSON.stringify(text);
    } // Create a dictionary within 'text' for this type

    checkType(); // mark the types that are done

    workspace = d3.select("#concordance");

    // Create tabs, with 'overview' selected by default
    tabs = workspace.append("ul")
        .attr("class", "nav nav-tabs")
        .attr("role", "tablist");

    tabs.selectAll("li")
        .data([msg['tab_1'], msg['tab_2']]).enter()
        .append("li")
        .attr("class", "nav-item")
        .append("a")
        .attr("class", "nav-link")
        .attr("id", function (d) { return (d + "-tab"); })
        .classed("active", function (d) { return (d == msg['tab_1']); })
        .attr("data-toggle", "tab")
        .attr("href", function (d) { return ("#" + d); })
        .attr("role", "tab")
        .attr("aria-controls", function (d) { return (d); })
        .text(function (d) { return (d.toUpperCase()); });

    workspace.append("div").attr("class", "tab-content")
        .selectAll("div")
        .data([msg['tab_1'], msg['tab_2']]).enter()
        .append("div")
        .attr("class", "tab-pane")
        .attr("id", function (d) { return (d); })
        .classed("active", function (d) { return (d == msg['tab_1']); })
        .attr("width", "100vp")
        .attr("role", "tabpanel")
        .attr("aria-labelledby", function (d) { return (d + "-tab"); });

    // OVERVIEW TAB

    // Create scrollable space for concordances (also to separate from legend)
    overview = d3.select("#" + msg['tab_1'])
        .append("div")
        .attr("class", "mt-4")
        .style("height", "70vh").style("overflow", "auto");

    // For each concordance we get a row, with a left, target and right column
    // 'target' column shows how far the progress is with colors and is clickable to take you to that occurrence
    overview.selectAll("div")
        .data(concordances).enter()
        .append("div").attr("class", "row no-gutters justify-content-sm-center")
        .each(function (d) {
            var line = d3.select(this);

            line.append("div").attr("class", "col-md-5")
                .append("p").attr("class", "text-sm-right")
                .text(function (d) { return (d.left); });

            line.append("div").attr("class", "col-md-2 px-0")
                .append("p").attr("class", "text-sm-center")
                .style("font-weight", "bold")
                .text(function (d) { return (d.target); })
                .style('cursor', 'pointer')
                .on("click", function (d) {
                    tabs.selectAll(".nav-link").classed("active", function () {
                        return (d3.select(this).attr("id") == msg['tab_2'] + "-tab");
                    })
                    workspace.selectAll(".tab-pane").classed("active", function () {
                        return (d3.select(this).attr("id") == msg['tab_2']);
                    });
                    viewing = toClassify.indexOf(d.id);
                    displayConc();
                });

            updateTargetColor();

            line.append("div").attr("class", "col-md-5")
                .append("p").attr("class", "text-sm-left")
                .text(function (d) { return (d.right); });
        });


    // SENSE ANNOTATION TAB

    // Store in the 'conc' variable the set of divs tied to the concordance, to which we'll add everything else
    conc = d3.select("#" + msg['tab_2']).append("div").attr("class", "row justify-content-sm-center mt-5")
        .append("div").attr("class", "col-sm-12").selectAll("div")
        .data(concordances).enter()
        .append("div")
        .attr("token_id", function (d) { return (d.id); }); // The 'token_id' attribute makes it available for nested elements

    displayConc(); // displays the concordance that corresponds to the current token

    /// FIRST show concordance

    conc.append("p")
        .style('color', '#696969')
        .html("This is the current concordance line.");

    conc.each(function (d) {
        var line = d3.select(this);
        line.append("p")
            .attr("class", "text-center")
            .html(function (d) {
                return (d.left + '<span class="px-1 text-primary" style="font-weight:bold">' + d.target + '</span>' + d.right);
            });
    });

    conc.append("hr");

    // if (selected_variables.length > 0) {
        showAnnotations();
    // }

    buttons = d3.select("#" + msg['tab_2']).append("div")
        .attr("class", "row justify-content-center")
        .append("div").attr("class", "col-sm-auto")
        .append("div").attr("class", "btn-group mt-2");

    buttons.append("button") // PREVIOUS
        .attr("type", "button")
        .attr("class", "btn shadow-sm btn-secondary m-1")
        .text(msg["previous"])
        .on("click", function () {
            viewing > 0 ? viewing -= 1 : viewing = toClassify.length - 1;
            displayConc();
            announceAchievement();
        });

    buttons.append("button") // NEXT
        .attr("type", "button")
        .attr("class", "btn shadow-sm btn-secondary m-1")
        .text(msg["next"])
        .on("click", function () {
            viewing < toClassify.length - 1 ? viewing += 1 : viewing = 0;
            displayConc();
            announceAchievement();
        });
}

function showAnnotations() {
    inst_num = 1;

    d3.selectAll(".annotations_section").remove()
    anns = conc.append("div").attr("class", "annotations_section");
    add_variable('sense');
    add_confidence();
    add_cues();
    add_comments();
    displayNoSense();
    ableAnns();

    // categ_vars = selected_variables.filter(function (x) {
    //     return (d3.keys(personalized_variables).indexOf(x) !== -1 && d3.keys(personalized_variables[x]).indexOf(type) !== -1);
    // });
    // categ_vars.forEach(add_variable);
    // if (selected_variables.indexOf('confidence') !== -1) {
    //     add_confidence();
    // }
    // if (selected_variables.indexOf('cues') !== -1) {
    //     add_cues();
    // }
    // if (selected_variables.indexOf('comments') !== -1) {
    //     add_comments();
    // }
}

function write_instruction(text) {
    anns.append("p")
        .style('color', '#696969')
        .html("<strong>" + inst_num.toString() + ".</strong> " + text);
    inst_num += 1;
}
function add_variable(variable) {

    write_instruction(msg['instruction_1']);

    anns.append("div").attr("class", "row no-gutters justify-content-sm-center")
        .append("div").attr("class", "btn-group-vertical btn-group-toggle mt-2 btn-block")
        .attr("data-toggle", "buttons")
        .selectAll("label")
        .data(add_none_tag(definitions[type])).enter()
        .append("label")
        .attr("class", "btn shadow-md btn btn-outline-secondary btn-sm")
        .classed("active", function (d) {
            var here = d3.select(this.parentNode.parentNode.parentNode.parentNode).attr("token_id");
            var chosen = hasSense(here, type) && text[type][here][variable] == d.code;
            return (chosen ? true : null);
        })
        .html(function (d) { return (d.label); })
        .append("input")
        .attr("type", "radio")
        .attr("autocomplete", "off")
        .attr("name", type + "_" + variable)
        .attr("value", function (d) { return (d.code) });

    // Control de results when var changes
    $(document).on('change', 'input[name="' + type + '_' + variable + '"]', function (event) {
        var analized = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
        var answer = d3.select(this).attr('value');
        // register data
        // if (d3.keys(text[type]).indexOf(analized) === -1) {
        text[type][analized] = {};
        // }
        text[type][analized][variable] = answer;
        text[type][analized]['cues'] = [];
        
        inputtext.select("#" + type + toClassify.indexOf(analized) + "_comments").property('value', '');

        updateTargetColor();
        colorStars();
        ableAnns();
        displayNoSense();
        displayReminder();
        saveInLS();
    });

    anns.append("hr");
}

function add_confidence() {

    write_instruction(msg['instruction_2']);

    conf = anns.append("div").attr("class", "row no-gutters justify-content-sm-center")
        .append("div").attr("id", "confidence")
        .attr("class", "btn-group-toggle")
        .attr("data-toggle", "buttons")
        
    conf.append("span").attr("class", "px-2")
        .text(msg["confidence_none"]);

    conf.selectAll("label")
        .data([1, 2, 3, 4, 5, 6, 7]).enter()
        .append("label")
        .attr("class", "btn btn-sm")
        .style("font-size", "1.5em")
        .html("&#x2605;")
        .append("input").attr("type", "radio")
        .attr("autocomplete", "off")
        .attr("name", type + "_confidence")
        .attr("value", function (d) { return (d); });

    colorStars();

    conf.append("span").attr("class", "px-2")
        .text(msg["confidence_all"]);

    // Control when confidence changes
    $(document).on('change', 'input[name="' + type + '_confidence"]', function (event) {
        var analized = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
        var answer = d3.select(this).property('value');
        if (d3.keys(text[type]).indexOf(analized) === -1) {
            text[type][analized] = {};
        }
        text[type][analized]['confidence'] = answer;
        updateTargetColor();
        colorStars();
    });

    anns.append("hr");
}

function add_cues() {

    write_instruction(msg['instruction_3'])

    cues = anns.append("div").attr("class", "row justify-content-center")
        .each(function (d) {
            var line = d3.select(this).append('p').attr("class", "text-center"),
                left_context = [],
                right_context = [],
                left_source = d.left.split(' '),
                right_source = d.right.split(' '); // turns the lines into lists of context words

            // Each context word is represented by an 'index' (what gets registered), comprised of
            // a letter ('L' for left, 'R' for right) and the distance to the target (starting with 1)
            left_context = left_source.map(function (d, i) {
                var cw_idx = left_source.length - i - 1;
                return ({ 'index': 'L' + cw_idx.toString(), 'cw': d });
            });
            right_context = right_source.map(function (d, i) {
                return ({ "index": "R" + i.toString(), 'cw': d });
            });
            halfLine(left_context);

            line.append("span").attr("class", "btn p-0 text-primary")
                .style("font-weight", "bold")
                .text(function (d) { return (d.target); });

            halfLine(right_context);

            function halfLine(context) {
                line.append("span").attr("class", "btn-group-toggle")
                    .attr("data-toggle", "buttons")
                    .attr("disabled", function(d) {
                        return(d3.keys(text[type]).indexOf(d.id) > -1 ? null : true);
                    })
                    .selectAll("label")
                    .data(context).enter()
                    .append("label").attr("class", "btn btn-cue px-1")
                    .classed("active", function (d) {
                        var here = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).attr('token_id');
                        var chosen = hasSense(here, type) && text[type][here]['cues'].indexOf(d.index) > -1;
                        return (chosen ? true : null);
                    })
                    .text(function (d) { return (d.cw); })
                    .append("input").attr("type", "checkbox")
                    .attr("name", type + counter + "_cues")
                    .attr("autocomplete", "off")
                    .attr("value", function (d) { return (d.index); });
            }

        });

    // Control of results when the 'cues' change
    $(document).on("change", "input[name='" + type + counter + "_cues']", function (event) {
        var analized = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
        var answer = d3.select(this).attr('value');
        // if (d3.keys(text[type]).indexOf(analized) === -1) {
        //     text[type][analized] = {};
        // }
        // if (d3.keys(text[type][analized]).indexOf('cues') === -1) {
        //     text[type][analized]['cues'] = [];
        // }
        var cues_list = text[type][analized]['cues'];
        if (cues_list.indexOf('none') == 0) {
            cues_list.splice(0, 1);
        }

        if (cues_list.indexOf(answer) === -1) {
            cues_list.push(answer);
        } else { //if you are unclicking
            cues_list.splice(cues_list.indexOf(answer), 1);
        }

        updateTargetColor();
        displayReminder();
        saveInLS();
    });

    // HERE we add the reminder to add cues if the sense is annotated but there are not cues
    reminder = anns.append('div')
        .attr('class', 'alert alert-warning text-center')
        .attr('role', 'alert')
        .html(msg["reminder"]);

    // and a confirmation if they have selected 'here'
    no_cues_conf = anns.append('div')
        .attr('class', 'alert alert-success text-center')
        .attr('role', 'alert')
        .html(msg["no_cues_conf"]);

    displayReminder();

    // Use the <a> in the reminder message to select 'no cues' as option
    reminder.select("#no-cues-selected")
        .style('cursor', 'pointer')
        // .attr("href", "#")
        .on("click", function (d) {
            text[type][d.id]['cues'] = ['none'];
            displayReminder();
            updateTargetColor();
        });

    anns.append("hr");
}

function add_comments() {

    write_instruction(msg['instruction_4']);

    no_sense_message = anns.append('div')
        .attr('class', 'alert alert-warning text-center')
        .attr('role', 'alert')
        .html(msg["no_sense_message"]);

    inputtext = anns.append("div").attr("class", "row")
        .append("div").attr("class", "col")
        .attr("token_id", function (d) { return (d.id); });

    inputtext.append("div").append("input")
        .attr("class", "form-control")
        .attr("id", function (d) { return (type + toClassify.indexOf(d.id) + "_comments"); })
        .attr("name", "comments")
        .attr('autocomplete', 'on')
        .attr("placeholder", msg["inputtext_placeholder"])
        .attr("aria-label", "Comments")
        .property('value', function () {
            var here = d3.select(this.parentNode.parentNode).attr("token_id");
            return (d3.keys(text[type][here]).indexOf('comments') !== -1 ? text[type][here]['comments'] : null);
        })

    // control when comments change
    $(document).on('change', 'input[name="comments"]', function () {
        var analized = d3.select(this.parentNode.parentNode).attr("token_id");
        var answer = d3.select(this).property('value');
        // if (d3.keys(text[type]).indexOf(analized) === -1) {
        //     text[type][analized] = {};
        // }
        text[type][analized]['comments'] = answer;

        displayNoSense();
        updateTargetColor();
        saveInLS();
    });
}

function add_none_tag(variable) {
    var x = variable.slice(0)
    x.push(
        {
            'code': msg['no_sense_code'],
            'label': '<b>None of the above:</b> <em>the school in Church Street</em>'
        }
    );
    return (x);
}

function execute(concordance, definitions, users, messages) {

    lang = 'en';
    concordance = concordance, definitions = definitions;
    users = users, messages = messages;

    // Edit messages
    msg = messages[lang];
    d3.select("#uploadfile")
        .html('<strong class="text-primary">' + msg["upload_button"] + '</strong>')
        .on("click", function () {
            uploadProgress();
        });
    d3.select("#download")
        .html('<strong>' + msg["download_button"] + '</strong>')
        .on("click", downloadJSON);
    d3.select("title").text(msg["title"]);
    d3.select("h1").text(msg["title"]);
    d3.select("#export")
        .html('<strong>' + msg["export"] + '</strong>')
        .on("click", downloadTSV);
    
    names = d3.map(users, function (d) { return (d.name); }).keys();
    Swal.fire({
        title: msg['welcome_title'],
        text: msg['welcome_text'],
        input: "text",
        inputPlaceholder: msg['welcome_placeholder'],
        inputValidator: (value) => { // only accept names included in users.json
            if (names.indexOf(value) == -1) {
                // return msg['not_login_text'];
                return msg['welcome_error'];
            }
        }
    }).then((result) => {
        if (result.value) {
            // ALLOW GUEST ACCESS
            // var username = names.indexOf(result.value) > -1 ? result.value : 'guest';
            // Swal.fire({
            //     title: msg['login_title'],
            //     html: msg['login_text'] + (username == 'guest' ? result.value + ' <span style="color:#984ea3;font-size:2em;">(' + username + ')</span>' : username),
            //     type: username == 'guest' ? "warning" : "success",
            //     confirmButtonText: msg['login_button']
            // });
            // text['user'] = result.value;
            // if (typeof(Storage) !== 'undefined' && JSON.parse(localStorage.getItem("annotations-" + text['user'])) != null) {
            //     text = JSON.parse(localStorage.getItem("annotations-" + text['user']));
            // }
            // saved = JSON.stringify(text);
            // this_user = users.filter(function(d) {
            //     return(d.name == username)})[0];
            // offerTypes(this_user);

            // NO GUEST ACCESS
            user = result.value;
            Swal.fire({
                title: msg['login_title'],
                html: msg['login_text'] + result.value,
                icon: "success",
                confirmButtonText: msg['login_button']
            });
            text['user'] = result.value;
            if (typeof (Storage) !== 'undefined' && JSON.parse(localStorage.getItem("annotations-" + text['user'])) != null) {
                text = JSON.parse(localStorage.getItem("annotations-" + text['user']));
            }
            saved = JSON.stringify(text);
            this_user = users.filter(function (d) { return (d.name == user) })[0];
            offerTypes(this_user);

        }
    });

    // Create radio buttons with options of types, with first one as default choice
    function offerTypes(this_user) {
        this_types = d3.keys(this_user['tokens']); // tailored to this user
        this_types.forEach(function(d) {
            announced[d] = checkAchievements(d);
        });
        d3.select("#typelist").remove();

        typesel = d3.select("#type_selection").append("div").attr("id", "typelist");

        typesel.append("h3").text("Items");
        typesel.append("div").attr("class", "btn-group-vertical btn-group-toggle")
            .attr("data-toggle", "buttons")
            .selectAll("label")
            .data(this_types).enter()
            .append("label")
            .attr("class", "btn shadow-sm btn-success mt-1")
            .classed("active", function (d) { return (this_types.indexOf(d) == 0); })
            .html(function (d) { return (d); })
            .append("input")
            .attr("type", "radio")
            .attr("autocomplete", "off")
            .attr("name", "type")
            .attr("value", function (d) { return (d) });

        // React to changes in the radio buttons
        $(document).on("change", "input[name='type']", function (event) {
            type = d3.select(this).property('value');
            showConc(concordance);
        });

        // Start with first type by default
        type = this_types[0];

        showConc(concordance);
    }
}


