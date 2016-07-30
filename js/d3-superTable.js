d3.superTable = function() {
    
	var table_data = undefined;
	var table_header = undefined;
	var num_rows_to_show = undefined;
	var click_function = undefined;


    // my(selection) executes when we do .call() on a d3 selection:
    function my(selection) {
        selection.each(function(d, i) {
            var element = d3.select(this);
            
            if (table_header == undefined) {
            	table_header = d3.keys(table_data[0]);
            }

            element.html("");
            var table = element.append("table").attr("class","d3-superTable-table");
            
            table.append("tr").attr("class","d3-superTable-header-row").selectAll("th").data(table_header).enter().append("th").html(function(d) {return d});

            var table_data_subset = table_data;
            if (num_rows_to_show != undefined && num_rows_to_show < table_data.length) {
            	table_data_subset = [];
            	for (var i = 0; i < num_rows_to_show; i++) {
            		table_data_subset.push(table_data[i]);
            	}
            }

            var rows = table.selectAll("tr.unselected").data(table_data_subset).enter().append("tr").attr("class","unselected");

            if (typeof(click_function) === "function") {
            	rows.on("click", function (d) {
                    if (typeof(check_ready_function) != "function" || check_ready_function() == true) {
                        d3.selectAll("tr").attr("class","unselected");
                        d3.select(this).attr("class", "selected");
                        click_function(d);    
                    }
                }).style("cursor","pointer");
            }
            rows.selectAll("td").data(table_header).enter().append("td").html(function(d) { return d3.select(this.parentNode).datum()[d]});
        });
    }

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

    return my;
}
