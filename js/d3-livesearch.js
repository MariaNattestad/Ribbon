d3.livesearch = function() {
    
    var selection_function = undefined;
    var search_list = undefined;
    var search_key = undefined;
    var max_suggestions_to_show = undefined;
    var placeholder = "";

    // This happens when we do .call() on a d3 selection
    function my(selection) {
        selection.each(function(d, i) {
            var element = d3.select(this);
            var placeholder_text = placeholder;
            
            // If livesearch is bound to data:
            if (d != undefined) {

                // Can be a value or a function of d:
                this.search_list = (typeof(search_list) === "function" ? search_list(d) : search_list);
                if (this.search_list == undefined && d.search_list != undefined) {
                    this.search_list = d.search_list;
                }
                this.search_key = (typeof(search_key) === "function" ? search_key(d) : search_key);
                if (this.search_key == undefined && d.search_key != undefined) {
                    this.search_key = d.search_key;
                }
                this.max_suggestions_to_show = (typeof(max_suggestions_to_show) === "function" ? max_suggestions_to_show(d) : max_suggestions_to_show);
                
                if (selection_function == undefined && d.func != undefined) {
                    this.selection_function = d.func;
                } else {
                    this.selection_function = selection_function(d);
                }    
                placeholder_text = (typeof(placeholder) === "function" ? placeholder(d) : placeholder);
            } else {
                // If not bound to data:
                this.search_list = search_list;
                this.search_key = search_key;
                this.selection_function = selection_function;
                placeholder_text = placeholder;
                this.max_suggestions_to_show = max_suggestions_to_show;
            }
            element.html("");
            // element.append("button").on("click",selection_function_var).html(labelvar);
            element.append("input").property("type","text").attr("class","d3-livesearch-input").on("keyup",my.typing).property("placeholder",placeholder_text);
            element.append("ul").attr("class","d3-livesearch-suggestions");
        });
    }

    my.typing = function(){
        var key = d3.event.keyCode;
        var parent = d3.select(this.parentNode);

        if (key == 13) { // Enter/Return key
            var selected_datum;
            var h = this.parentNode.highlighted_index;
            parent.select("ul").selectAll("li").attr("class",function(d,i) {if (i == h) {selected_datum = d;}return "unselected"});
            parent.select("ul").selectAll("li").remove();
            parent.select("input").property("value","");
            this.parentNode.highlighted_index = 0;
            this.parentNode.selection_function(selected_datum);
            return;
        } else if (key == 40) { // down arrow
            this.parentNode.highlighted_index++;
            if (this.parentNode.highlighted_index  >= this.parentNode.num_suggestions) {
                this.parentNode.highlighted_index = this.parentNode.num_suggestions - 1;
            }
            var h = this.parentNode.highlighted_index;
            parent.select("ul").selectAll("li").attr("class",function(d,i) {return (i==h ? "selected" : "unselected")});
            return;
        } else if (key == 38) { // up arrow
            this.parentNode.highlighted_index--;
            if (this.parentNode.highlighted_index < 0) {
                this.parentNode.highlighted_index = 0;
            }
            var h = this.parentNode.highlighted_index;
            parent.select("ul").selectAll("li").attr("class",function(d,i) {return (i==h  ? "selected"  : "unselected")});
            return; 
        }
        
        parent.select("ul").append("li").html(key);

        var search_key = this.parentNode.search_key;
        var search_list = this.parentNode.search_list;
        var search_value = this.value;

        if (search_value.length==0) { 
            parent.select("ul").html("");
            parent.select("ul").style("border","0px");
            return;
        }
        
        var max_suggestions_to_show = this.parentNode.max_suggestions_to_show;
        this.parentNode.num_suggestions = 0;
        
        parent.select("ul").selectAll("li").remove();

        var matching_data = [];
        if (search_key != undefined){
            for (var i in search_list) {
                if (search_list[i][search_key] == undefined) {
                    console.log(search_key + " is not in search_list[" + i + "]");
                } else if (search_list[i][search_key].indexOf(search_value) != -1) {
                    matching_data.push(search_list[i]);
                    this.parentNode.num_suggestions++;
                    if (max_suggestions_to_show != undefined && this.parentNode.num_suggestions >= max_suggestions_to_show) {
                        break;
                    }
                }
            }
        } else {
            for (var i in search_list) {
                if (search_list[i].indexOf(search_value) != -1) {
                    matching_data.push(search_list[i]);
                    this.parentNode.num_suggestions++;
                    if (max_suggestions_to_show != undefined && this.parentNode.num_suggestions >= max_suggestions_to_show) {
                        break;
                    }
                }
            }
        }

        this.parentNode.highlighted_index = 0;
        var h = this.parentNode.highlighted_index;
        var func = this.parentNode.selection_function;

        parent.select("ul").selectAll("li").data(matching_data).enter()
            .append("li")
                .html(function(d) {return (typeof(d) === "string") ? d : d[search_key] })
                .attr("class",function(d,i) {return (i==h ? "selected" : "unselected")})
                .on("click",function(d,i) {
                    parent.select("ul").selectAll("li").remove();
                    parent.select("input").property("value","");
                    func(d);
                });

        if (this.parentNode.num_suggestions == 0) {
            parent.select("ul").append("li").html("No matches");
        }
    }

    my.placeholder = function(value) {
        if (!arguments.length) return placeholder;
        placeholder = value;
        return my;
    };
    my.search_list = function(value) {
        if (!arguments.length) return search_list;
        search_list = value;
        return my;
    };
    my.search_key = function(value) {
        if (!arguments.length) return search_key;
        search_key = value;
        return my;
    };
    my.selection_function = function(value) {
        if (!arguments.length) return selection_function;
        selection_function = value;
        return my;
    };
    my.max_suggestions_to_show = function(value) {
        if (!arguments.length) return max_suggestions_to_show;
        max_suggestions_to_show = value;
        return my;
    };
    


    return my;
}