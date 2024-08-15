d3.superTable = function() {
	
	var table_data = undefined;
	var table_header = undefined;
	var num_rows_to_show = undefined;
	var click_function = undefined;
	var run_on_filtered_data_function = undefined;
	var element = null;
	var requirements = {}; //{"chrom": [{"op":"=","arg":"17"}], "start":[{"op":">","arg":38000000}, {"op":"<","arg":42000000}]};
	var previous_sort = {"column":null, "direction":"forward"};
	var check_ready_function = undefined;
	var show_advanced_filters = false;

	// my(selection) executes when we do .call() on a d3 selection:
	function my(selection) {
		selection.each(function(d, i) {
			element = d3.select(this);
			
			my.create_table();
		});
	};

	my.create_table = function() {
		if (table_header == undefined) {
				table_header = d3.keys(table_data[0]);
			}

			element.html("");
			var table = element.append("table").attr("class","d3-superTable-table");
			
			table.append("tr").attr("class","d3-superTable-header-row").selectAll("th")
				.data(table_header).enter()
				.append("th")
					.html(function(d) {return d})
					.on("click",my.click_header);

			if (show_advanced_filters) {
				table.append("tr").attr("class","d3-superTable-filter-row").selectAll("td")
					.data(table_header).enter()
					.append("td").append("input").property("type","text")
					.attr("column_name",function(d) {return d})
					.property("value",function(d) {var text = ""; for (r in requirements[d]) {text += requirements[d][r].op + requirements[d][r].arg + " "}; return text;})
					.on("change", my.typing_advanced_filter);
			}

			var run_function_on_filtered_data = false;
			if (typeof(run_on_filtered_data_function) === "function") {
				run_function_on_filtered_data = true;
			}
			var table_data_subset = table_data;
			var counter = 0;
			var filtered_data = table_data;
			if (Object.keys(requirements) != 0 || (num_rows_to_show != undefined && num_rows_to_show < table_data.length)) {
				table_data_subset = [];
				filtered_data = [];
				for (var i = 0; i < table_data.length; i++) {
					var good = true;
					for (var column in requirements){
						for (var r in requirements[column]) {
							var col = table_data[i][column];
							var arg = requirements[column][r].arg;
							if (requirements[column][r].op == "=" && col != arg) {
								good = false;
								break;
							} else if (requirements[column][r].op == ">") {
								if (typeof(table_data[i][column]) === "number" && col <= arg) {
									good = false;
									break;
								} else if (typeof(table_data[i][column]) === "string" && natural_sort(col,arg) <= 0) {
									good = false;
									break;
								}
							} else if (requirements[column][r].op == "<") {
								if (typeof(table_data[i][column]) === "number" && col >= arg) {
									good = false;
									break;
								} else if (typeof(table_data[i][column]) === "string" && natural_sort(col,arg) >= 0) {
									good = false;
									break;
								}
							}
						}
					}

					if (good) {
						if (num_rows_to_show === undefined || counter < num_rows_to_show) {
							table_data_subset.push(table_data[i]);
							counter++;
						}
						if (run_function_on_filtered_data) {
							filtered_data.push(table_data[i]);
							// Don't break if we need all the data for another function
						} else if (num_rows_to_show != undefined && counter >= num_rows_to_show) {
							break;
						}
					}
				}
			}
			var rows = table.selectAll("tr.unselected").data(table_data_subset).enter().append("tr").attr("class","unselected");

			if (typeof(click_function) === "function") {
				rows.on("click", function (d) {
					if (typeof(check_ready_function) != "function" || check_ready_function() == true) {
						element.selectAll("tr.selected").attr("class","unselected");
						d3.select(this).attr("class", "selected");
						click_function(d);
					}
				}).style("cursor","pointer");
			}
			rows.selectAll("td").data(table_header).enter().append("td").html(function(d) { return d3.select(this.parentNode).datum()[d]});

			if (run_function_on_filtered_data) {
				run_on_filtered_data_function(filtered_data);
			}
	}

	my.click_header = function(d) {
		// Sort by column: numeric sort for numbers, natural sort for strings
		if (typeof(table_data[0][d]) === "string") {
			table_data.sort(function(a, b){return natural_sort(a[d],b[d])});    
		} else {
			table_data.sort(function(a, b){return a[d] - b[d]});
		}
		if (d == previous_sort.column) {
			if (previous_sort.direction == "forward") {
				table_data.reverse();   
				previous_sort.direction = "reverse";
			} else {
				previous_sort.direction = "forward";
			}
		} else {
			previous_sort.direction = "forward";
		}
		previous_sort.column = d;
		my.create_table();
	};

	my.filter_rows = function(d,text) {
		requirements[d] = [];

		var reqs = text.split(/\s+/);
		var acceptable_types = [">","<","="];
		for (i in reqs) {
			if (acceptable_types.indexOf(reqs[i][0]) != -1) {
				var value = reqs[i].substr(1,reqs[i].length);
				if (value.length > 0) {
					if (typeof(table_data[0][d]) === "number"){
						value = parseFloat(reqs[i].substr(1,reqs[i].length));	
					}
					requirements[d].push({"op":reqs[i][0], "arg":value});		
				}
			}
		}
		if (requirements[d].length == 0) {
			delete requirements[d];
		}
		my.create_table();
	};
	
	my.typing_advanced_filter = function(d) {
		my.filter_rows(d, d3.event.target.value);

	};

	my.table_data = function(value) {
		if (!arguments.length) return table_data;
		table_data = value;
		return my;
	};
	my.table_header = function(value) {
		if (!arguments.length) return table_header;
		table_header = value;
		return my;
	};
	my.num_rows_to_show = function(value) {
		if (!arguments.length) return num_rows_to_show;
		num_rows_to_show = value;
		return my;
	};
	my.click_function = function(value) {
		if (!arguments.length) return click_function;
		click_function = value;
		return my;
	};
	my.check_ready_function = function(value) {
		if (!arguments.length) return check_ready_function;
		check_ready_function = value;
		return my;
	};
	my.show_advanced_filters = function(value) {
		if (!arguments.length) return show_advanced_filters;
		show_advanced_filters = value;
		return my;
	};
	my.run_on_filtered_data_function = function(value) {
		if (!arguments.length) return run_on_filtered_data_function;
		run_on_filtered_data_function = value;
		return my;
	};
	var natural_sort = function(a,b) {
		// Natural sort is from: http://web.archive.org/web/20130826203933/http://my.opera.com/GreyWyvern/blog/show.dml/1671288
		function chunk(t) {
			var tz = [], x = 0, y = -1, n = 0, i, j;

			while (i = (j = t.charAt(x++)).charCodeAt(0)) {
				var m = (i == 46 || (i >=48 && i <= 57));
				if (m !== n) {
					tz[++y] = "";
					n = m;
				}
				tz[y] += j;
			}
			return tz;
		}

		var aa = chunk(a);
		var bb = chunk(b);

		for (x = 0; aa[x] && bb[x]; x++) {
			if (aa[x] !== bb[x]) {
				var c = Number(aa[x]), d = Number(bb[x]);
				if (c == aa[x] && d == bb[x]) {
					return c - d;
				} else return (aa[x] > bb[x]) ? 1 : -1;
			}
		}
		return aa.length - bb.length;
	}

	return my;
}
