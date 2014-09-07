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
		quests.Mistral.forEach(function(quest) {
			html += "<option>" + quest.name + "</option>\n";
		});
		$("#mistral").html(html);
		html = "";
		quests.Cordelica.forEach(function(quest) {
			html += "<option>" + quest.name + "</option>\n";
		});
		$("#cordelica").html(html);
	});
	$('#nrgAvail').keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $('#go').focus().click();
            return false;
        }
    });
	$("#go").click(function() {
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
				var tmp = v[j];
				if (i - w[j] >= 0) {
					tmp += m[i - w[j]];
				}
				if (max <= tmp) {
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