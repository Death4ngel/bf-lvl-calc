<<<<<<< HEAD
// Exp
var v = [];
// Energy
var w = [];
var n = 0;
var quests = [];

$(document).ready(function() {
	$.get('data.csv', function(data) {
		var lines = data.split("\n")
		for (var i = 1; i < lines.length; ++i) {
			var line = lines[i];
			var tokens = line.split(",");
			quests.push(tokens[0] + " (" + tokens[1] + "): " + tokens[2]);
			w.push(parseInt(tokens[3]));
			v.push(parseInt(tokens[5]));
			++n;
		};
	});
	$("#go").click(function() {
		var W = parseInt($("#nrgAvail").val());
		var result = unboundedKnapsack(v,w,W,n);
		var html = "";
		var doQuests = result["quests"];
		for (var i in doQuests) {
			html += quests[doQuests[i]] + "<br>\n"
		}
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
=======
$(document).ready(function() {
	$.get('data.csv', function(line) {
		console.log(line);
	});
});
>>>>>>> Test read file
