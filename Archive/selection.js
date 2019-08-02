var type = 'church'
function updateSelection(){
    d3.tsv(type+".models.tsv", function(error, data){
        if (error) throw error;
        var dataset = data;
        // var models = new Array();
        // data.forEach(function(d){models.push(d.type);});
        // console.log(models, typeof models);

        var info = {
                "focc10:10" : document.getElementById("tw-one").checked,
                "focc5:5" : document.getElementById("tw-two").checked,
                "focc3:3" : document.getElementById("tw-three").checked,
                // "bound" : document.getElementById("bound").checked,
                // "nobound" : document.getElementById("nobound").checked,
                "soccc" : document.getElementById("soccc").checked,
                "soccs" : document.getElementById("soccs").checked,
                "5k" : document.getElementById("socc5k").checked,
                "10k" : document.getElementById("socc10k").checked,
                "focc" : document.getElementById("soccfocc").checked,
                "soccwin5:5" : document.getElementById("soccwin5").checked,
                "soccwin10:10" : document.getElementById("soccwin10").checked,
                "cw1" : document.getElementById("cw1").checked,
                "cw2" : document.getElementById("cw2").checked
                // "all": document.getElementById("allpos").checked,
            // "dvnj": document.getElementById("dvnj").checked,
                // "noweight": document.getElementById("twno").checked,
            // "ppmi0": document.getElementById("twppmi").checked
        };
    // darkenbuttons();
        selectedmodels = getmodels(dataset);
        document.getElementById("countmodels").innerHTML = selectedmodels.length;
        localStorage.clear();
        localStorage.setItem("modselection", JSON.stringify(selectedmodels));
        console.log(selectedmodels);

        function getmodels(modellist){
            var newlist = new Array();
            modellist.forEach(function(item){
                    // FIRST define variables that extract the values of the settings in models and
                    //// make them equivalent to the keys in info
                    var twmodel = "focc" + item.token_window
                    var socccorp = "socc" + item.socccorpus[0].toLowerCase()
                    //var soccpos = item.pos
                    var socclength = item.socclength_group
                    var soccwindow = "soccwin" + item.socc_window
                    var cwmin = "cw" + item.mincws
                    // var tw = item.weight
                
                    // SECOND define variables that are true if one of the buttons has been clicked (for each setting)
                // var twcorpvalue = info["twppmic"] || info["twppmis"]
                    var twmodelvalue = info["focc3:3"] || info["focc5:5"] || info["focc10:10"]
                    // var twboundvalue = info["bound"] || info["nobound"]
                    var socccorpvalue = info["soccc"] || info["soccs"]
                    //var soccposvalue = info["all"] || info["dvnj"]
                    var socclengthvalue = info["5k"] || info["10k"] || info["focc"]
                    var soccwinvalue = info["soccwin5:5"] || info["soccwin10:10"]
                    var cwminvalue = info["cw1"] || info["cw2"]
                    // var twvalue = info["noweight"] || info["ppmi0"]
                
                if (
                    // For each setting, check if the value in the current row is true or if none is true
                    (info[twmodel] == true || twmodelvalue != true) &&
                    // (info[twbound] == true || twboundvalue != true) &&
                    (info[socccorp] == true || socccorpvalue != true) &&
                    //(info[soccpos] == true || soccposvalue != true) &&
                    (info[socclength] == true || socclengthvalue != true) &&
                    (info[soccwindow] == true || soccwinvalue != true) &&
                    (info[cwmin] == true || cwminvalue != true)
                    //(info[tw] == true || twvalue != true)
                    ){
                    newlist.push(item['_model']);
                }});
            return newlist;
        };

    // function darkenbuttons(){
    //   // if COHA for first order weighting and not Semcor
    //   var cond1 = info["twppmic"] && !info["twppmis"];
    //   // if 1.5 as first order ppmi weighting and not others
    //   var cond2 = info["twppmi1_5"] && !(info["twppmi0"] || info["twppmi1"]);
    //   // if semcor 1.0 as first order llr weighting and not others
    //   var cond3 = info["twlls1"] && !(info["twllc0"] | info["twllc1"]);
    //   // if semcor 0.0 or 1.0 as first order llr weighting and not others
    //   var cond4 = (info["twlls1"] || (info["twll0"] && info["twppmis"])) && !(info["twllc1"] || info["twllc0"]);
    //   // if semcor 0.0 as first order llr weighting and not others
    //   var cond5 = (info["twll0"] && info["twppmis"]) && !(info["twlls1"] || info["twllc1"] || info["twllc0"]);
    //   // if semcor as second order weighting and not COHA
    //   var cond6 = info["soccs"] && !(info["soccc"]);
    //   // if length of final vector is 5kcont and not others
    //   var cond7 = info["top5kcont"] && !(info["intersect"] || info["top5k"]);
    //   // if second order ppmi weighting is not 0
    //   var cond8 = info["soccppmi1"] && !(info["soccppmi0"]);
    //   // if first order features are only 5k
    //   var cond9 = info["twfeatures5k"] && !(info["twfeatures10k"] || info["twfeatures27k"]);
    //   // if first order features are only 10k
    //   var cond11 = (info["twfeatures10k"] || info["twfeatures5k"]) && !(info["twfeatures27k"]);
    //   // if second order llr weighting is not 0
    //   var cond12 = info["soccll1"] && !(info["soccll0"]);

    //   lowerOpacity((cond2 || cond3), "twpc");
    //   lowerOpacity((cond1 || cond4 || cond9), "twpt1_5");
    //   lowerOpacity((cond1 || cond2), "twls1");
    //   lowerOpacity((cond2 || cond8 || cond12), "twf5");
    //   lowerOpacity(cond5, "twpt1");
    //   lowerOpacity(cond6, "length5c");
    //   lowerOpacity(cond7, "socs");
    //   lowerOpacity((cond8 || cond12), "twf10");
    //   lowerOpacity(cond11, "socp1");
    //   lowerOpacity(cond11, 'socl1');
    // };
    // function lowerOpacity(condition, buttonid){
    //   if (condition){
    //     document.getElementById(buttonid).style.opacity = 0.5} else {
    //       document.getElementById(buttonid).style.opacity = 1.0;
    //     };
    //   };
    });
};


d3.select("#confirm-select").on("click", function() {
    localStorage.setItem("goToPlot-church", JSON.parse(
        localStorage.getItem("modselection"))[0].substring(
        0, JSON.parse(localStorage.getItem(
            "modselection"))[0].length-2));
    window.open("level2.html?type=church");
});
updateSelection()
