var quests = {};
var questNames = [];
var exps = [];
var ergs = [];
var n = 0;

$(document).ready(function() {
	$.get('data.csv', function(data) {
		var lines = data.split("\n")
		for (var i = 1; i < lines.length; ++i) {
			var line = lines[i];
			var tokens = line.split(",");
			if (!quests[tokens[0]]) {
				quests[tokens[0]] = [];
			}
			var name = tokens[1] + " (" + tokens[2] + "): " + tokens[3];
			var quest = { "name": name, "nrg": parseInt(tokens[4]), "exp": parseInt(tokens[6]) };
			quests[tokens[0]].push(quest);
		};
		var html = "";
		var questName = "";
		quests.Mistral.forEach(function(quest) {
			questName = quest.name;
			html += "<option>" + quest.name + "</option>\n";
		});
		$("#mistral").html(html);
		$("#mistral").val(questName)
		html = "";
		quests.Cordelica.forEach(function(quest) {
			questName = quest.name;
			html += "<option>" + quest.name + "</option>\n";
		});
		$("#cordelica").html(html);
		$('#cordelica').val(questName);
	});
	$('#nrgAvail').keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $('#nrgGo').focus().click();
            return false;
        }
    });
    $('#expNeeded').keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $('#expGo').focus().click();
            return false;
        }
    });
	$("#nrgGo").click(function() {
		getQuestsFromEnergy(parseInt($("#nrgAvail").val()));
	});
	$("#expGo").click(function() {
		getQuestsFromExperience(parseInt($("#expNeeded").val()));
	});
});

/**
Returns the quests that give the most experience
*/
function getQuestsFromEnergy(energy) {
	selectQuests();
	showQuests(unboundedKnapsack(exps, nrgs, energy, n));
}

/**
Returns the quests that needs the least energy
*/
function getQuestsFromExperience(exp) {
	selectQuests();
	showQuests(linearProgramming(nrgs, exps, exp, n));
}

/**
Returns a map from index to count
*/
// http://en.wikipedia.org/wiki/Knapsack_problem#Unbounded_knapsack_problem
function unboundedKnapsack(v, w, W, n) {
	var m = [];
	var pick = [];
	m.push(0);

	for (var i = 1; i <= W; ++i) {
		var arg = -1;
		var max = 0;
		for (var j = 0; j < w.length; ++j) {
			if (w[j] <= i) {
				var tmp = v[j] + m[i - w[j]];
				if (max < tmp) {
					max = tmp;
					arg = j;
				}
			}
		}
		m[i] = max;
		pick[i] = arg;
	}
	var ret = {};
	for (var i = W; i > 0;) {
		if (pick[i] !== -1) {
			var index = pick[i];
			if (!ret[index]) {
				ret[index] = 0;
			}
			++ret[index];
		}
		i -= w[pick[i]];
	}
	return ret;
}

// http://hgourvest.github.io/glpk.js/
function linearProgramming(v, w, W, n) {
	// minimize energy used
	// at least experience
	var obj = "Minimize\nobj: ";
	obj += v[0] + " x0";
	var subj = "Subject To\nc1: ";
	subj += w[0] + "x0";
	var bounds = "Bounds\n"
	var integer = "Integer\n";
	for (var i = 1; i < n; ++i) {
		obj += " + " + v[i] + " x" + i;
		subj += " + " + w[i] + " x" + i;
		bounds += "x" + i + " >= 0\n";
		integer += "x" + i + "\n";
	}
	subj += " >= " + W;
	//var str = "Minimize\nobj: 2 x1 + 3 x2 + 4 x3\nSubject To\nc1: 4 x1 + 3 x2 + 2 x3 >= 6\nBounds\nx1 >= 0\nx2 >= 0\nx3 >= 0\nInteger\nx1\nx2\nx3\nEnd";
	var str = obj + "\n" + subj + "\n" + bounds + "\n" + integer + "\nEnd";
	var result = {}, objective, i;
	lp = glp_create_prob();
    glp_read_lp_from_string(lp, null, str);
    glp_scale_prob(lp, GLP_SF_AUTO);
    var smcp = new SMCP({presolve: GLP_ON});
    glp_simplex(lp, smcp);
    glp_intopt(lp);
    objective = glp_mip_obj_val(lp);
    for(i = 1; i <= glp_get_num_cols(lp); i++){
        result[glp_get_col_name(lp, i)] = glp_mip_col_val(lp, i);
    }
    var ret = {};
    var i = 0;
    for (var key in result) {
    	var value = result[key];
    	if (value !== 0) {
	    	ret[i] = value;
	    }
    	++i;
    }
    return ret;
}

/**
Updates the global arrays
*/
function selectQuests() {
	questNames = [];
	exps = [];
	nrgs = [];
	n = 0;
	var questName = $('#mistral').children(':selected').text();
	for (var i = 0; i < quests.Mistral.length; ++i) {
		var quest = quests.Mistral[i];
		nrgs.push(quest.nrg);
		exps.push(quest.exp);
		++n;
		questNames.push(quest.name);
		if (quest.name === questName) {
			break;
		}
	};
	questName = $('#cordelica').children(':selected').text();
	for (var i = 0; i < quests.Cordelica.length; ++i) {
		var quest = quests.Cordelica[i];
		nrgs.push(quest.nrg);
		exps.push(quest.exp);
		++n;
		questNames.push(quest.name);
		if (quest.name === questName) {
			break;
		}
	};
	quests.Dungeon.forEach(function(quest) {
		nrgs.push(quest.nrg);
		exps.push(quest.exp);
		++n;
		questNames.push(quest.name);
	});
}

function showQuests(indexToCount) {
	var html = "";
	var exp = 0;
	var nrg = 0;
	for (var index in indexToCount) {
		var count = indexToCount[index];
		html += count + "x: " + questNames[index] + "<br>\n"
		exp += count * exps[index];
		nrg += count * nrgs[index];
	};
	html += "Total energy: " + nrg + ", Total exp: " + exp
	$("#quests").html(html);
}