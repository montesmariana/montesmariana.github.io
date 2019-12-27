var lang, text = {}, saved = JSON.stringify(text);
var type = 'church';
var counter = 0;
var workspace, tabs, overview, conc, anns, viewing = 0, toClassify;
var inst_num;
var concordance, definitions, users, messages;
var user, names, this_user, this_types, this_selection;
var announced = {};
var concordance, concordances;
var msg;

// Update color of target item in the overview concordance
function updateTargetColor(t) {
    d3.select("#" + msg['tab_1']).selectAll("p.text-sm-center")
        .style("color", function (d) {
            if (!hasSense(d.id, type)) {
                return ('#000000');
            } else if (!isDone(d.id, type)) {
                return ('#ef8a62');
            } else { return ("#4daf4a") }
        });
}

// Update display of reminder to annotate cues
function displayReminder() {
    reminder.style("display", function (d) {
        var here = d3.select(this.parentNode.parentNode).attr("token_id");
        return (hasSense(here, type) && text[type][here]['cues'].length == 0 ? 'block' : 'none');
    });

    no_cues_conf.style("display", function (d) {
        var here = d3.select(this.parentNode.parentNode).attr("token_id");
        return (hasSense(here, type) && text[type][here]['cues'].indexOf('none') == 0 ? 'block' : 'none');
    });
}

function ableAnns() {
    conf.attr("disabled", function() {
        var here = d3.select(this.parentNode.parentNode.parentNode).attr("token_id");
        return (hasSense(here, type) ? null : true);
    });
    cues.selectAll("span").attr("disabled", function(d) {
        return(d3.keys(text[type]).indexOf(d.id) > -1 ? null : true);
    });
    cues.selectAll("label").classed("active", function (d) {
        var here = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).attr('token_id');
        var chosen = hasSense(here, type) && text[type][here]['cues'].indexOf(d.index) > -1;
        return (chosen ? true : null);
    })

    inputtext.selectAll("input")
        .attr("disabled", function() {
            var here = d3.select(this.parentNode.parentNode).attr("token_id");
            return (hasSense(here, type) ? null : true);
        });
}

// Update display of reminder to comment when sense is 'none'
function displayNoSense() {
    no_sense_message.style("display", function (d) {
        var here = d3.select(this.parentNode.parentNode).attr("token_id");
        return (hasSense(here, type) &&
            text[type][here]['sense'] == msg['no_sense_code'] &&
            d3.keys(text[type][here]).indexOf('comments') == -1 ? 'block' : 'none');
    });
}

// update display of ocncordances
function displayConc() {
    conc.style('display', function (d) {
        return (toClassify.indexOf(d.id) == viewing ? 'block' : 'none');
    });
}

// show that a type is done
function checkType() {
    d3.select("#type_selection").selectAll("label")
        .html(function (d) {
            return (checkAchievements(d) == 'done' ? d + ' <i class="fas fa-check"></i>' : d);
        })
        .append("input")
        .attr("type", "radio")
        .attr("autocomplete", "off")
        .attr("name", "type")
        .attr("value", function (d) { return (d) });
}

// update color of confidence stars
function colorStars() {
    conf.selectAll("label")
        .style("color", function (d) {
            var here = d3.select(this.parentNode.parentNode.parentNode.parentNode).attr("token_id");
            if (!hasSense(here, type) ||
                d3.keys(text[type][here]).indexOf('confidence') === -1 ||
                text[type][here]['confidence'] < d) {
                return ("#bdbdbd");
            } else {
                return ("#ffa500");
            }
        })
}

// Check if all the tokens of a type have been assigned with senses
function allSenses(t) { return (d3.keys(text[t]).length == this_user['tokens'][t].length); }

// Check if a particular token has been annotated
function hasSense(token_id, t) {
    return (d3.keys(text[t]).indexOf(token_id) !== -1);
}

// Check if the full work is done
function isDone(token_id, t) {
    var has_cues = text[t][token_id]['cues'].length > 0;
    var has_conf = d3.keys(text[t][token_id]).indexOf('confidence') > -1;
    var has_full_sense = text[t][token_id]['sense'] != msg['no_sense_code'] || d3.keys(text[t][token_id]).indexOf('comments') > -1;
    return (has_cues && has_conf && has_full_sense);
}

function checkAchievements(t) {
    var goal = this_user['tokens'][t];
    var started_tokens = goal.filter(function (d) { return (hasSense(d, t)); });
    var done_tokens = goal.filter(function (d) { return (hasSense(d, t) && isDone(d, t)); });

    if (started_tokens.length == Math.ceil(goal.length * 3 / 5)) {
        return ('halfdone');
    } else if (started_tokens.length == goal.length && done_tokens.length == goal.length) {
        return ('done');
    } else {
        return ('notdone');
    }
}

// Fire an alert when a type is finished
function announceAchievement() {
    var status = checkAchievements(type);
    var message, congrats, timer = 0;

    if (status == 'done' && announced[type] != 'done') {
        congrats = msg["congratulations"];
        checkType();
        var full_types = this_types.filter(function (d) {
            return (checkAchievements(d) == 'done');
        });
        if (full_types.length == this_types.length) {
            message = msg["all_done_message"];
            timer = 2000;
        } else {
            message = msg["type_done_message"][0] + type + msg["type_done_message"][1];
            timer = 1000;
        }
    } else if (status == 'halfdone' && announced[type] != 'halfdone') {
        congrats = msg["encouragement"];
        // message = "You are almost done with <em>" + type + "</em>!"
        message = msg["almost_done_message"][0] + type + msg["almost_done_message"][1];
        timer = 1000;
    } else {
        return;
    }

    if (timer > 0) {

        Swal.fire({
            title: congrats[Math.floor(Math.random() * congrats.length)],
            html: message,
            type: "success",
            // position: "top",
            showConfirmButton: false,
            timer: timer
        });
        announced[type] = status;
    }
}


function create_tsv(text, concordance) {
    const annotations = d3.keys(text).filter(function (d) { return typeof text[d] == 'object' });
    var outputcols = ['id', 'left', 'target', 'right', 'sense', 'confidence', 'cues', 'comments']
    var output = annotations.map(function (a) {
        // a is the name of a type
        return d3.keys(text[a]).map(function (t) {
            // t is a token_id
            var res = [t];
            // return concordance.filter(function(d) {return (d.id === t); })[0];
            ['left', 'target', 'right'].forEach(function(c) {
                res.push(concordance.filter(function(d) {return (d.id == t); })[0][c]);
            });
            ['sense', 'confidence', 'cues', 'comments'].forEach(function (c) {
                // c is a variable
                res.push(d3.keys(text[a][t]).indexOf(c) === -1 ? "" : text[a][t][c]);
            });
            console.log(text[a][t])
            return (res.join('\t'));
        })
        .join('\n');
    })
    .join('\n');
    return [outputcols.join('\t'), output].join('\n');
    // return(output);
}

function saveInLS() { // check if storage is available and store
    if (typeof(Storage) !== "undefined") {
        localStorage.setItem("annotations-" + text['user'], JSON.stringify(text));
    }
}