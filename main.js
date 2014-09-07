$(document).ready(function() {
	$.get('data.csv', function(line) {
		console.log(line);
	});
});