var quests = {};

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
		var v = [];	// exp
		var w = [];	// nrg
		var W = parseInt($("#nrgAvail").val());
		var n = 0;
		var questNames = [];
		var questName = $('#mistral').children(':selected').text();
		for (var i = 0; i < quests.Mistral.length; ++i) {
			var quest = quests.Mistral[i];
			v.push(quest.exp);
			w.push(quest.nrg);
			++n;
			questNames.push(quest.name);
			if (quest.name === questName) {
				break;
			}
		};
		questName = $('#cordelica').children(':selected').text();
		for (var i = 0; i < quests.Cordelica.length; ++i) {
			var quest = quests.Cordelica[i];
			v.push(quest.exp);
			w.push(quest.nrg);
			++n;
			questNames.push(quest.name);
			if (quest.name === questName) {
				break;
			}
		};
		quests.Dungeon.forEach(function(quest) {
			v.push(quest.exp);
			w.push(quest.nrg);
			++n;
			questNames.push(quest.name);
		});
		var result = unboundedKnapsack(v,w,W,n);
		var html = "";
		result["quests"].forEach(function(index) {
			html += questNames[index] + "<br>\n"
		});
		html += "Total exp: " + result["exp"]
		$("#quests").html(html);
	});
$("#expGo").click(function() {
		var v = [];	// exp
		var w = [];	// nrg
		var W = parseInt($("#expNeeded").val());
		var n = 0;
		var questNames = [];
		var questName = $('#mistral').children(':selected').text();
		for (var i = 0; i < quests.Mistral.length; ++i) {
			var quest = quests.Mistral[i];
			v.push(quest.nrg);
			w.push(quest.exp);
			++n;
			questNames.push(quest.name);
			if (quest.name === questName) {
				break;
			}
		};
		questName = $('#cordelica').children(':selected').text();
		for (var i = 0; i < quests.Cordelica.length; ++i) {
			var quest = quests.Cordelica[i];
			v.push(quest.nrg);
			w.push(quest.exp);
			++n;
			questNames.push(quest.name);
			if (quest.name === questName) {
				break;
			}
		};
		quests.Dungeon.forEach(function(quest) {
			v.push(quest.nrg);
			w.push(quest.exp);
			++n;
			questNames.push(quest.name);
		});
		var result = linearProgramming(v,w,W,n);
		var html = "";
		var nrg = 0;
		var exp = 0;
		result.forEach(function(index) {
			html += questNames[index] + "<br>\n";
			nrg += v[index];
			exp += w[index];
		});
		html += "Total energy: " + nrg + "<br>" + "Total exp: " + exp;
		$("#quests").html(html);
	});
});

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
	var doQuests = [];
	for (var i = W; i > 0;) {
		if (pick[i] != -1) {
			doQuests.push(pick[i]);
		}
		i -= w[pick[i]];
	}
	return { "exp": m[W], "quests": doQuests };
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
    doQuests = [];
    var i = 0;
    for (var key in result) {
    	var value = result[key];
    	if (value > 0) {
    		for (var j = 0; j < value; j++) {
    			doQuests.push(i)
    		}
    	}
    	++i;
    }
    return doQuests;
}