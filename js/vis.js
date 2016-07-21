
// Calculations for drawing and spacing out elements on the screen

var _padding = {};
var _layout = {};
var _positions = {};
_positions.chunk = {};

// Elements on the page
var _svg;

var _svg2; // for read selection

// Data for visualization
var _current_read_index = 0;

var _Chunk_alignments = [];
var _Alignments = [];
var _Ref_intervals = [];
var _Chunk_ref_intervals = [];
var _Whole_refs = [];


var _focal_region; // {chrom,start,end}:  one region that the bam file, variants, or majority of reads from a sam entry point towards, considered the primary region for read alignment


// Reading bam file
var _Bam = undefined;
var _Ref_sizes_from_header = {};

// Selecting region
var _region = {}; // chrom, start, end


// Various global variables to capture UI settings and static variables
var _static = {};
_static.alignment_alpha = 0.5;
_static.dotplot_ref_opacity = 0.5;
_static.colors = ["#ff9896", "#c5b0d5", "#8c564b", "#e377c2", "#bcbd22", "#9edae5", "#c7c7c7", "#d62728", "#ffbb78", "#98df8a", "#ff7f0e", "#f7b6d2", "#c49c94", "#dbdb8d", "#aec7e8", "#17becf", "#2ca02c", "#7f7f7f", "#1f77b4", "#9467bd"];
_static.margin_to_merge_ref_intervals = 10000;


var _settings = {};
_settings.region_min_mapping_quality = 0;
_settings.max_num_alignments = 1000000;
_settings.min_num_alignments = 1;

_settings.ribbon_vs_dotplot = "ribbon";
_settings.min_mapping_quality = 0;
_settings.min_indel_size = -1; // set to -1 to stop showing indels
_settings.colorful = true;
_settings.ribbon_outline = true;
_settings.show_only_known_references = false;
_settings.keep_duplicate_reads = false;
_settings.feature_to_sort_reads = "max_mq";



var _ui_properties = {};
_ui_properties.region_mq_slider_max = 0;
_ui_properties.num_alignments_slider_max = 1000000;

_ui_properties.mq_slider_max = 0;
_ui_properties.indel_size_slider_max = 0;



// Scales for visualization
var _scales = {};
_scales.read_scale = d3.scale.linear();
_scales.whole_ref_scale = d3.scale.linear();
_scales.ref_interval_scale = d3.scale.linear();
_scales.chunk_ref_interval_scale = d3.scale.linear();
_scales.ref_color_scale = d3.scale.ordinal().range(_static.colors);



////////////////// Soon to be deprecated: keep for testing read selection ////////////////////
// var table;

// // How sam table looks
// var header = ["selected","read","alignments","chromosomes","min MQ","max MQ"];
// var size_readname = 20;
// var arrow_color = {"on":"#009900","off":"#cccccc"};
// 
///////////////////////////////////////////////////////////////////////////////////////////////

var _tooltip = {};
function show_tooltip(text,x,y,parent_object) {
	parent_object.selectAll("g.tip").remove();
	_tooltip.g = parent_object.append("g").attr("class","tip");
	_tooltip.g.attr("transform","translate(" + x + "," + y +  ")").style("visibility","visible");
	
	_tooltip.width = (text.length + 4) * (_layout.svg_width/100);
	_tooltip.height = (_layout.svg_height/20);

	_tooltip.rect = _tooltip.g.append("rect")
			.attr("width",_tooltip.width)
			.attr("x",(-_tooltip.width/2))
			.attr("height",_tooltip.height)
			.attr("y",(-_tooltip.height/2))
			.attr("fill","black");

	_tooltip.tip = _tooltip.g.append("text");
	_tooltip.tip.text(text).attr("fill","white").style('text-anchor',"middle").attr("dominant-baseline","middle");
}

function responsive_sizing() {
	// console.log("responsive_sizing");

	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0];

	var window_width;
	var window_height;


	window_width = (w.innerWidth || e.clientWidth || g.clientWidth)*0.98;
	window_height = (w.innerHeight || e.clientHeight || g.clientHeight)*0.96;

	top_banner_size = 60;
	_padding.top = top_banner_size;
	_padding.bottom = 0;
	_padding.left = 0;
	_padding.right = 0;
	_padding.between = 0.01*window_height;
	_padding.text = _padding.between;

	_layout.right_panel_fraction = 0.35;
	_layout.svg_width_fraction = 1-_layout.right_panel_fraction;

	_layout.svg1_height_fraction = 0.50;

	_layout.left_width = (window_width - _padding.left - _padding.right) * (1-_layout.right_panel_fraction);
	_layout.panel_width = (window_width - _padding.left - _padding.right) * _layout.right_panel_fraction;

	_layout.svg1_box_height = (window_height - _padding.top - _padding.bottom) * _layout.svg1_height_fraction;
	_layout.svg2_box_height = (window_height - _padding.top - _padding.bottom) * (1-_layout.svg1_height_fraction);
	_layout.total_height = (window_height - _padding.top - _padding.bottom);

	_layout.svg_width = _layout.left_width - _padding.between*4;
	_layout.svg_height = _layout.svg1_box_height - _padding.between*4;

	_layout.svg2_width = _layout.left_width - _padding.between*4;
	_layout.svg2_height = _layout.svg2_box_height - _padding.between*4;



	_layout.input_margin = _padding.between;


	d3.select("#sam_input_panel")
		.style("width",_layout.left_width + "px")
		.style("height",_layout.input_height + "px")
		.style("padding",_layout.input_margin + "px")

		// d3.select("#sam_input")
			// .style("height",(_layout.input_height-_layout.input_margin*2) + "px");

	d3.select("#svg1_panel")
		.style("width",_layout.left_width + "px")
		.style("height",_layout.svg1_box_height + "px");


	d3.select("#svg2_panel")
		.style("width",_layout.left_width + "px")
		.style("height",_layout.svg2_box_height + "px");


	d3.select("#right_panel")
		.style("width",_layout.panel_width + "px")
		.style("height",_layout.total_height + "px");

	table = d3.select("#right_panel").select("table");

	draw_region_view();
	draw();
}



//////////////////// Region settings /////////////////////////

$('#region_mq_slider').slider( {
	min: 0,
	max: 1000,
	slide: function( event, ui) {
		$("#region_mq_label").html(ui.value);
		_settings.region_min_mapping_quality = ui.value;
		draw_region_view();
	}
});


$( "#num_aligns_range_slider" ).slider({
  range: true,
  min: 1,
  max: 500,
  values: [ 100, 300 ],
  slide: function( event, ui ) {
    $( "#num_aligns_range_label" ).html( "" + ui.values[ 0 ] + " - " + ui.values[ 1 ] );
    _settings.min_num_alignments = ui.values[0];
    _settings.max_num_alignments = ui.values[1];
    draw_region_view();
  }
});


$('#mq_slider').slider( {
	min: 0,
	max: 1000,
	slide: function( event, ui) {
		$("#mq_label").html(ui.value);
		_settings.min_mapping_quality = ui.value;
		draw();
	}
});


$('#indel_size_slider').slider( {
	min: 0,
	max: 1000,
	slide: function( event, ui) {
		$("#indel_size_label").html(ui.value);
		_settings.min_indel_size = ui.value;
		
		_Alignments = reparse_read(_Chunk_alignments[_current_read_index]).alignments;
		draw();
	}
});


$('#only_header_refs_checkbox').change(function() {
	_settings.show_only_known_references = this.checked;
	if (_settings.show_only_known_references == false) {
		user_message("Info","Showing chromosome sizes as 2X the maximum alignment observed");
	}
	// select_read(); // need to reorganize the references used, not just redraw // ===========================
	organize_references_for_chunk();
	draw_region_view();
	select_read();
});


$('#colors_checkbox').change(function() {
	_settings.colorful = this.checked
	draw();
});
$('#outline_checkbox').change(function() {
	_settings.ribbon_outline = this.checked
	draw();
});

// Initialization for beginning of app only
if (_settings.ribbon_vs_dotplot == "ribbon") {
	$(".dotplot_settings").toggle();
	d3.select("#select_ribbon").property("checked",true);
	d3.select("#select_dotplot").property("checked",false);
} else {
	$(".ribbon_settings").toggle();
	d3.select("#select_ribbon").property("checked",true);
	d3.select("#select_dotplot").property("checked",false);
}

$(".ribbon_vs_dotplot").click(function(){
	var value = d3.select("input[name=ribbon_vs_dotplot]:checked").node().value;
	_settings.ribbon_vs_dotplot = value;

	// Show settings specific to each plot
	$(".ribbon_settings").toggle();
	$(".dotplot_settings").toggle();
	
	// Redraw
	draw();

});

function draw_chunk_ref() {
	if (_Whole_refs.length == 0) {
		// console.log("No references for draw_chunk_ref, not drawing anything");
		return;
	}

	
	_positions.chunk.ref_block = {"y":_layout.svg2_height*0.15, "x":_layout.svg2_width*0.05, "width":_layout.svg2_width*0.90, "height":_layout.svg2_height*0.03};
	// Draw "Reference" label
	_svg2.append("text").text("Reference").attr("x",_positions.chunk.ref_block.x+_positions.chunk.ref_block.width/2).attr("y",_positions.chunk.ref_block.y-_positions.chunk.ref_block.height*3).style('text-anchor',"middle").attr("dominant-baseline","middle");


	// _scales.read_scale.range([_positions.read.x,_positions.read.x+_positions.read.width]);
	_scales.whole_ref_scale.range([_positions.chunk.ref_block.x, _positions.chunk.ref_block.x + _positions.chunk.ref_block.width]);
	
	// Whole reference chromosomes for the relevant references:
	_svg2.selectAll("rect.ref_block").data(_Whole_refs).enter()
		.append("rect").attr("class","ref_block")
			.attr("x",function(d) { return _scales.whole_ref_scale(d.cum_pos); })
			.attr("y",_positions.chunk.ref_block.y)
			.attr("width", function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size) - _scales.whole_ref_scale(d.cum_pos));})
			.attr("height", _positions.chunk.ref_block.height)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
			.style("stroke-width",1).style("stroke", "black")
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + bp_format(d.size);
				var x = _scales.whole_ref_scale(d.cum_pos + d.size/2);
				var y = _positions.chunk.ref_block.y - _padding.text;
				show_tooltip(text,x,y,_svg2);
			})
			.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});

	_svg2.selectAll("text.ref_block").data(_Whole_refs).enter()
		.append("text").attr("class","ref_block")
			.filter(function(d) { return (_scales.whole_ref_scale(d.cum_pos + d.size) - _scales.whole_ref_scale(d.cum_pos) > 15);})
				.text(function(d){var chrom = d.chrom; return chrom.replace("chr","")})
				.attr("x", function(d) { return _scales.whole_ref_scale(d.cum_pos + d.size/2)})
				.attr("y",_positions.chunk.ref_block.y - _padding.text)
				.style('text-anchor',"middle").attr("dominant-baseline","bottom");
				// .attr("height", _positions.chunk.ref_block.height)
				// .attr("width", function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size)-_scales.whole_ref_scale(d.cum_pos));})
				// .attr("font-size",function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size)-_scales.whole_ref_scale(d.cum_pos))/2;});
}

function comma_format(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function bp_format(x) {
	
	if (x > 1000000) {
		return (Math.round(x/1000000)).toString() + " Mb"
	}
	if (x > 1000) {
		return (Math.round(x/1000)).toString() + " kb"
	}
}

function draw_chunk_ref_intervals() {

	if (_Chunk_ref_intervals.length == 0) {
		return;
	}

	// console.log("draw_chunk_ref_intervals");

	_positions.chunk.ref_intervals = {"y":_layout.svg2_height*0.25, "x":_layout.svg2_width*0.05, "width":_layout.svg2_width*0.90, "height":_layout.svg2_height*0.65};
	
	_scales.chunk_ref_interval_scale.range([_positions.chunk.ref_intervals.x, _positions.chunk.ref_intervals.x+_positions.chunk.ref_intervals.width]);

	// Zoom into reference intervals where the read maps:
	_svg2.selectAll("rect.ref_interval").data(_Chunk_ref_intervals).enter()
		.append("rect").attr("class","ref_interval")
			.attr("x",function(d) { return _scales.chunk_ref_interval_scale(d.cum_pos); })
			.attr("y",_positions.chunk.ref_intervals.y)
			.attr("width", function(d) {return (_scales.chunk_ref_interval_scale(d.end)-_scales.chunk_ref_interval_scale(d.start));})
			.attr("height", _positions.chunk.ref_intervals.height)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
			.attr("fill-opacity",_static.dotplot_ref_opacity)
			.style("stroke-width",1).style("stroke", "black")
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + comma_format(d.start) + " - " + comma_format(d.end);
				var x = _scales.chunk_ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
				var y = _positions.chunk.ref_intervals.y - _padding.text;
				show_tooltip(text,x,y,_svg2);
			})
			.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});

	// Ref interval mapping back to ref
	_svg2.selectAll("path.ref_mapping").data(_Chunk_ref_intervals).enter()
		.append("path").attr("class","ref_mapping")
			.filter(function(d) {return map_whole_ref(d.chrom,d.start) != undefined;})
				.attr("d",function(d) {return ref_mapping_path_generator(d,true)})
				// .style("stroke-width",2)
				// .style("stroke","black")
				.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})

}

function draw_chunk_alignments() {

	if (_Chunk_alignments.length == 0) {
		return;
	}

	_positions.chunk.reads = { "top_y":_positions.chunk.ref_intervals.y, "height":_positions.chunk.ref_intervals.height*0.9, "x": _positions.chunk.ref_intervals.x, "width":_positions.chunk.ref_intervals.width };
	
	// Focal region
	_svg2.append("rect").attr("class","focal_region")
		.attr("x",function(d) { return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(_focal_region.chrom,_focal_region.start)); })
		.attr("y",_positions.chunk.ref_intervals.y)
		.attr("width", function(d) {return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(_focal_region.chrom,_focal_region.end)) - _scales.chunk_ref_interval_scale(map_chunk_ref_interval(_focal_region.chrom,_focal_region.start));})
		.attr("height", _positions.chunk.ref_intervals.height )
		.attr("fill","none")
		.style("stroke-width",5)
		.style("stroke", "black");


	var chunks = [];
	var counter = 0;
	for (var i in _Chunk_alignments) {

		if (_Chunk_alignments[i].alignments.length <= _settings.max_num_alignments && _Chunk_alignments[i].alignments.length >= _settings.min_num_alignments && _Chunk_alignments[i].max_mq >= _settings.region_min_mapping_quality) {
			chunks.push(_Chunk_alignments[i]);
			chunks[counter].index = i; // to remember the data order even after sorting
			counter++;	
		}
	}

	chunks.sort(function(a, b){return a.alignments.length-b.alignments.length});

	var num_reads_to_show  = chunks.length;

	for (var i = 0; i < chunks.length; i++) {
		chunks[i].read_y = _positions.chunk.reads.top_y + _positions.chunk.reads.height*(i+1)/num_reads_to_show;
		chunks[i].ref_y = _positions.chunk.reads.top_y + _positions.chunk.reads.height*i/num_reads_to_show;

	}

	var alignment_groups = _svg2.selectAll("g.alignment_groups").data(chunks).enter()
		.append("g").attr("class","alignment_groups").attr("transform",function(d) {return "translate(" + 0 + "," + d.read_y + ")"})
		.on("click",function(d) { _current_read_index = d.index; select_read();})


	alignment_groups.selectAll("line.alignment").data(function(read_record){return read_record.alignments}).enter()
		.append("line")
			.attr("x1",function(d) { return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r, d.rs)); })
			.attr("x2",function(d) { return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r, d.re)); })
			.attr("y1",0)
			.attr("y2",0)
			.style("stroke-width",3)
			.style("stroke",function(d) {if (d.qs < d.qe) {return "blue"} else {return "red"}})
			.style("stroke-opacity",0.5)
			.on('mouseover', function(d) {
				var text = "select read";
				var x = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r, (d.rs+d.re)/2));
				var y = d3.select(this.parentNode).datum().read_y - _tooltip.height;
				show_tooltip(text,x,y,_svg2);
			})
			.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});

}


function draw_region_view() {
	// console.log("draw_region_view");

	//////////////////////////   Table read picker   //////////////////////////
	// Add all alignments to the table
	// table.selectAll("tr").remove();
	// table.append("tr").selectAll("th").data(header).enter().append("th").text(function(d){return d;});

	// var rows = table.selectAll("tr.data").data(_Chunk_alignments).enter()
	// 	.append("tr").attr("class","data");
	
	// rows.append("td").append("span").attr("class","glyphicon glyphicon-arrow-right").style("color",arrow_color.off).on("click",function(d,i) {_current_read_index = i; select_read();});
	
	// rows.selectAll("td.data").data(function(read){return parse_record_for_table(read);}).enter()
	// 				.append("td").text(function(d){return d;}).attr("class","data");
	///////////////////////////////////////////////////////////////////////////




	reset_svg2();
	draw_chunk_ref();
	draw_chunk_ref_intervals();
	draw_chunk_alignments();

}


function clear_data() {
	_Alignments = [];
	_Chunk_alignments = [];
	_Whole_refs = [];
	_Ref_intervals = [];
	_Chunk_ref_intervals = [];
	_Ref_sizes_from_header = {};
}


function chunk_changed() {
	// Show results only if there is anything to show
	if (_Chunk_alignments.length > 0) {

		all_read_analysis(); // calculates features of each alignment and adds these variables to _Chunk_alignments

		organize_references_for_chunk();
		draw_region_view();
		
		_current_read_index = 0;
		select_read();
	} else {
		user_message("","");
	}
	
	refresh_visibility();

}

function sam_input_changed(sam_input_value) {
		clear_data();
		remove_bam_file();

		// console.log(d3.select('#sam_input').value);
		var input_text = sam_input_value.split("\n");
		_Ref_sizes_from_header = {};
		_Chunk_alignments = [];
		var unique_readnames = {};
		_settings.min_indel_size = 100000000000; 

		for (var i = 0; i < input_text.length; i++) {
			var columns = input_text[i].split(/[ \t]+/);
			if (columns[0][0] == "@") {
				if (columns[0].substr(0,3) == "@SQ") {
					_Ref_sizes_from_header[columns[1].split(":")[columns[1].split(":").length-1]] = parseInt(columns[2].split(":")[columns[2].split(":").length-1]);	
				}
			} else if (columns.length >= 2) {
				if (columns.length >= 6) {
					var parsed_line = parse_sam_coordinates(input_text[i]);
					if (unique_readnames[parsed_line.readname] == undefined || _settings.keep_duplicate_reads) {
						_Chunk_alignments.push(parsed_line);
						unique_readnames[parsed_line.readname] = true;
					}
				} else {
					user_message("Error","Lines from a sam file must have at least 6 columns, and must contain SA tags in order to show secondary/supplementary alignments");
					return;
				}
			}
		}

		_focal_region = undefined;
		
		refresh_visibility();
		chunk_changed();
	
}

$('#sam_input').bind('input propertychange', function() {sam_input_changed(this.value)});

d3.select("#sam_info_icon").on("click", function() {
	var example = "forward 0  chr2  32866713  60  1000H1000M1000D1000M3000H\nreverse 16  chr2  32866713  60  3000H1000M1000D1000M1000H\nboth 0  chr2  32866713  60  1000H1000M1000D1000M3000H SA:Z:chr2,32866713,-,3000H1000M1000D1000M1000H,60,1;\nindels 0  chr2  32866713  60  100H100M100D100M50I100M40D10M30I100M300H";
	d3.select('#sam_input').property("value",example);
	sam_input_changed(example);
});


d3.select("#bam_info_icon").on("click", function() {
	user_message("Instructions","Create a bam file using an aligner such as BWA, BLASR, or NGM-LR. If you get a sam file convert it to a bam file: <pre>samtools view -bS my_file.sam > my_file.bam</pre>Next sort the bam file:<pre>samtools sort my_file.bam my_file.sorted</pre>Then index the sorted bam file: <pre>samtools index my_file.sorted.bam</pre>Finally, upload the my_file.sorted.bam and the my_file.sorted.bam.bai files");
});





// function bed_input_changed(bed_input_value) {
// 	console.log(bed_input_value);
// }


// $('#bed_input').bind('input propertychange', function() {bed_input_changed(this.value)});

// d3.select("#bed_info_icon").on("click", function() {
// 	console.log("BED INFO");
// 	var example = "chr1  32866713 32896713 read1 30 +\nchr2  22866713 22896713 read1 30 +";
// 	d3.select('#bed_input').property("value",example);
// 	bed_input_changed(example);
// });



function run() {
	responsive_sizing();
	refresh_visibility();
}

function dict_length(dictionary) {
	var num = 0;
	for (var k in dictionary) {num++;}
	return num;
}


function all_read_analysis() {
	
	var overall_max_mq = 0;
	var overall_max_num_alignments = 0;

	for (var j in _Chunk_alignments) {
		read_record = _Chunk_alignments[j];
		// var all_chrs = {};
		var max_mq = 0;

		// var min_mq = 100000;
		for (var i in read_record.alignments) {
			if (read_record.alignments[i].mq > max_mq) {
				max_mq = read_record.alignments[i].mq
			}
			// if (read_record.alignments[i].mq < min_mq) {
			// 	min_mq = read_record.alignments[i].mq
			// }
			// all_chrs[read_record.alignments[i].r] = true;
		}
		_Chunk_alignments[j].max_mq = max_mq;
		if (max_mq > overall_max_mq) {
			overall_max_mq = max_mq;
		}

		if (_Chunk_alignments[j].alignments.length > overall_max_num_alignments) {
			overall_max_num_alignments = _Chunk_alignments[j].alignments.length;
		}
	}


	_ui_properties.region_mq_slider_max = overall_max_mq; 
	_ui_properties.num_alignments_slider_max = overall_max_num_alignments; 

	_settings.max_num_alignments = overall_max_num_alignments;
	_settings.min_num_alignments = 1;
	_settings.region_min_mapping_quality = 0;
	_settings.min_mapping_quality = 0;
	_settings.min_indel_size = 1000000;

	
}

function refresh_ui_elements() {
	// Mapping quality in region view
	$('#region_mq_slider').slider("option","max", _ui_properties.region_mq_slider_max);
	$('#region_mq_slider').slider("option","value", _settings.region_min_mapping_quality);
	$("#region_mq_label").html(_settings.region_min_mapping_quality);


	// Number of alignments in region view
	$( "#num_aligns_range_slider" ).slider("option","max",_ui_properties.num_alignments_slider_max);
	$( "#num_aligns_range_slider" ).slider("values",0,_settings.min_num_alignments);
	$( "#num_aligns_range_slider" ).slider("values",1,_settings.max_num_alignments);
	$( "#num_aligns_range_label" ).html( "" + _settings.min_num_alignments + " - " + _settings.max_num_alignments );


	// Mapping quality in read detail view
	$('#mq_slider').slider("option","max", _ui_properties.mq_slider_max);
	$('#mq_slider').slider("option","value", _settings.min_mapping_quality);
	$("#mq_label").html(_settings.min_mapping_quality);


	// Indel size in read detail view
	$('#indel_size_slider').slider("option","max", _ui_properties.indel_size_slider_max+1);
	$('#indel_size_slider').slider("option","value", _settings.min_indel_size);
	$("#indel_size_label").html(_settings.min_indel_size);
}

function parse_cigar(cigar_string) {
	// console.log(cigar_string);
	var cigar_regex = /(\d+)(\D)/;
	var parsed = cigar_string.split(cigar_regex);
	if (parsed.length < 2) {
		user_message("Error","This doesn't look like a sam file. The 6th column must be a valid cigar string.");
		hide_results();
		throw("input error: not a valid cigar string");
	}
	// console.log(parsed);
	var results = [];
	for (var i = 0; i < parsed.length; i++) {
		if (parsed[i] != "") {
			results.push(parsed[i]);
		}
	}
	var output = [];
	for (var i = 0; i < results.length-1; i+=2) {
		output.push({"num":parseInt(results[i]), "type":results[i+1]});
	}
	// console.log(output);
	return output;
}


function parse_SA_field(sa) {
	var alignments = [];
	var aligns = sa.split(";");
	for (var i = 0; i < aligns.length; i++) {
		var fields = aligns[i].split(",");
		if (fields.length >= 6) {
			var chrom = fields[0];
			var rstart = parseInt(fields[1]);
			var raw_cigar = fields[3];
			var strand = fields[2];
			var mq = parseInt(fields[4]);

			alignments.push(read_cigar(raw_cigar,chrom,rstart,strand,mq));

		} else if (fields.length > 1) {
			console.log("ignoring alternate alignment because it doesn't have all 6 columns:");
			console.log(fields);
		}
	}

	return alignments;
}

function user_message(message_type,message) {
	if (message_type == "") {
		d3.select("#user_message").html("").style("display","none");
	} else {
		d3.select("#user_message").style("display","block");
		var message_style = "default";
		switch (message_type) {
			case "error":
				message_style="danger";
				break;
			case "Error":
				message_style="danger";
				break;
			case "warning","Warning":
				message_style="warning";
				break;
			default:
				message_style="info";
		}
		d3.select("#user_message").html("<strong>"+ message_type + ": </strong>" + message).attr("class","alert alert-" + message_style);
	}
}

function cigar_coords(cigar) {
	// cigar must already be parsed using parse_cigar()
	
	var coords = {};
	coords.read_alignment_length = 0;
	coords.ref_alignment_length = 0;
	
	coords.front_padding_length = 0; // captures S/H clipping at the beginning of the cigar string (what the ref considers the start location)
	coords.end_padding_length = 0; // captures S/H clipping at the end of the cigar string (what the ref considers the end location)

	for (var i = 0; i < cigar.length; i++) {
		var num = cigar[i].num;
		switch (cigar[i].type) {
			case "H":
				if (i < 2) {
					coords.front_padding_length += num;
				} else if (i > cigar.length - 3) {
					coords.end_padding_length += num;
				}
				break;
			case "S":
				if (i < 2) {
					coords.front_padding_length += num;
				} else if (i > cigar.length - 3) {
					coords.end_padding_length += num;
				}
				break;
			case "M":
				coords.read_alignment_length += num;
				coords.ref_alignment_length += num;
				break;
			case "=":
				coords.read_alignment_length += num;
				coords.ref_alignment_length += num;
				break;
			case "X":
				coords.read_alignment_length += num;
				coords.ref_alignment_length += num;
				break;
			case "I":
				coords.read_alignment_length += num;
				break;
			case "D":
				coords.ref_alignment_length += num;
				break;
			case "N": // "Skipped region from the reference" -- sam format specification
				coords.ref_alignment_length += num; 
				break;
			case "P": // "Padding: silent deletion from padded reference" -- sam format specification
				coords.ref_alignment_length += num;
				break;
			default:
				console.log("Don't recognize cigar character: ", cigar[i].type, ", assuming it advances both query and reference, like a match or mismatch");
				coords.read_alignment_length += num;
				coords.ref_alignment_length += num;
		}
	}
	return coords;
}
function read_cigar(unparsed_cigar,chrom,rstart,strand,mq) {
	var cigar = parse_cigar(unparsed_cigar);


	//////   Read cigar string for 
	var coordinates = cigar_coords(cigar);

	var alignment = {};
	alignment.r = chrom;
	alignment.rs = rstart;
	alignment.re = rstart + coordinates.ref_alignment_length;
	
	if (strand == "+") {
		alignment.qs = coordinates.front_padding_length;
		alignment.qe = coordinates.front_padding_length + coordinates.read_alignment_length;
	} else {
		alignment.qe = coordinates.end_padding_length;
		alignment.qs = coordinates.end_padding_length + coordinates.read_alignment_length;
	}
	
	alignment.read_length = coordinates.front_padding_length + coordinates.read_alignment_length + coordinates.end_padding_length;
	alignment.mq = mq;
	alignment.max_indel = 0;

	/////////     Now we run through the cigar string to capture the features     //////////
	alignment.path = [];
	// Add start coordinate to path before we begin
	alignment.path.push({"R":alignment.rs, "Q":alignment.qs});

	// Running counters of read and reference positions:
	var read_pos = 0;
	var step = 1;
	if (strand == "-") {
		read_pos = alignment.read_length; // start at the end of the cigar string
		step = -1; // move backwards towards the front of the cigar string
	}
	var ref_pos = rstart;

	for (var i = 0; i < cigar.length; i++) {
		var num = cigar[i].num;
		switch (cigar[i].type) {
			case "H":
			case "S":
				read_pos += step*num;
				break;
			case "M":
			case "=":
			case "X":
				read_pos += step*num;
				ref_pos += num;
				break;
			case "I":
				if (_settings.min_indel_size != -1 && num >= _settings.min_indel_size) {
					alignment.path.push({"R":ref_pos, "Q":read_pos});
					alignment.path.push({"R":ref_pos, "Q":read_pos + step*num});
				}
				if (num > alignment.max_indel) {
					alignment.max_indel = num;
				}
				read_pos += step*num;
				break;
			case "D":
				if (_settings.min_indel_size != -1 && num >= _settings.min_indel_size) {
					alignment.path.push({"R":ref_pos, "Q":read_pos});
					alignment.path.push({"R":ref_pos + num, "Q":read_pos});
				}
				if (num > alignment.max_indel) {
					alignment.max_indel = num;
				}
				ref_pos += num;
				break;
			case "N": // "Skipped region from the reference" -- sam format specification
			case "P": // "Padding: silent deletion from padded reference" -- sam format specification
				ref_pos += num;
				break;
			default:
				console.log("Don't recognize cigar character: ", cigar[i].type, ", assuming it advances both query and reference, like a match or mismatch");
				read_pos += step*num;
				ref_pos += num;
		}
	}

	// alignment.max_indel
	alignment.path.push({"R":alignment.re, "Q":alignment.qe});
	return alignment;
}

function parse_sam_coordinates(line) {
	var fields = line.split(/[ \t]+/);
	
	var chrom = fields[2];
	var rstart = parseInt(fields[3]);
	var flag = parseInt(fields[1]);
	var mq = parseInt(fields[4]);
	var raw_cigar = fields[5];
	
	var strand = "+";
	if ((flag & 16) == 16) {
		strand = "-";
	}

	
	var alignments = [];
	for (var i = 0; i < fields.length; i++) {
		if (fields[i].substr(0,2) == "SA") {
			alignments = parse_SA_field(fields[i].split(":")[2]);
		}
	}

	alignments.push(read_cigar(raw_cigar,chrom,rstart,strand,mq));

	var read_length = alignments[alignments.length-1].read_length;

	for (var i = 0; i < alignments.length; i++) {
		 if (alignments[i].read_length != read_length) {
				user_message("Warning", "read length of primary and supplementary alignments do not match for this read (calculated using cigar strings)");
		 }
	}

	return {"alignments": alignments, "raw":line, "raw_type":"sam", "readname":fields[0]};
}

function planesweep_consolidate_intervals(starts_and_stops) {
	
	// Add margin to the stop points
	for (var i = 0; i < starts_and_stops.length; i++) {
		if (starts_and_stops[i][1] == "e") {
			starts_and_stops[i][0] = starts_and_stops[i][0]+_static.margin_to_merge_ref_intervals;
		}
	}
	
	starts_and_stops.sort(function(a, b){return a[0]-b[0]});

	var intervals = [];
	var coverage = 0;
	var most_recent_start = -1;
	for (var i = 0; i < starts_and_stops.length; i++) {
		if (starts_and_stops[i][1]=="s") {
			coverage++;
			if (coverage == 1) { // coverage was 0, now starting new interval
				most_recent_start = starts_and_stops[i][0];
			}
		} else if (starts_and_stops[i][1]=="e") {
			coverage--;
			if (coverage == 0) { // coverage just became 0, ending current interval
				// Remove margin from the final stop point before recording, avoiding margins on the edges of the intervals
				intervals.push([most_recent_start,starts_and_stops[i][0]-_static.margin_to_merge_ref_intervals]);
			}
		} else {
			console.log("ERROR: unrecognized code in planesweep_consolidate_intervals must be s or e");
		}
	}

	return intervals;
}

function reparse_read(record_from_chunk) {
	if (record_from_chunk.raw_type == "sam") {
		return parse_sam_coordinates(record_from_chunk.raw);
	} else if (record_from_chunk.raw_type == "bam") {
		return parse_bam_record(record_from_chunk.raw);
	} else {
		console.log("Don't recognize record_from_chunk.raw_type, must be sam or bam");
	}
}


function select_read() {
	var readname = _Chunk_alignments[_current_read_index].readname;

	// table.selectAll("span").style("color",function(d) {if (d.readname == readname) {return arrow_color.on} else {return arrow_color.off}});

	user_message("","");
	

	_settings.min_indel_size = 1000000000; // parse alignments for new read first without indels
	_Alignments = reparse_read(_Chunk_alignments[_current_read_index]).alignments;
	
	_ui_properties.mq_slider_max = 0;
	_ui_properties.indel_size_slider_max = 0;
	for (var i in _Alignments) {
		var alignment = _Alignments[i];
		if (alignment.mq > _ui_properties.mq_slider_max) {
			_ui_properties.mq_slider_max = alignment.mq;
		}
		if (alignment.max_indel > _ui_properties.indel_size_slider_max) {
			_ui_properties.indel_size_slider_max = alignment.max_indel;
		}
	}

	_settings.min_indel_size = _ui_properties.indel_size_slider_max + 1;

	organize_references_for_read();

	_scales.read_scale.domain([0,_Alignments[_Alignments.length-1].read_length]);


	refresh_visibility();
	refresh_ui_elements();
	draw();
}

// Natural sort is from: http://web.archive.org/web/20130826203933/http://my.opera.com/GreyWyvern/blog/show.dml/1671288
function natural_sort(a, b) {
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

function ribbon_alignment_path_generator(d) {

	var bottom_y = _positions.read.y;

	var top_y = _positions.ref_intervals.y + _positions.ref_intervals.height;
	
	var output = "M " + _scales.ref_interval_scale(map_ref_interval(d.r,d.path[0].R)) + "," + top_y; // ref start
	output += ", L " + _scales.read_scale(d.path[0].Q)      + "," + bottom_y; // read start

	for (var i = 1; i < d.path.length; i++) {
		var ref_coord = ", L " + _scales.ref_interval_scale(map_ref_interval(d.r,d.path[i].R))      + "," + top_y; // ref 
		var read_coord = ", L " + _scales.read_scale(d.path[i].Q)      															+ "," + bottom_y; // read 
		if (i % 2 == 0) { // alternate reference and read side so top goes to top
			output += ref_coord + read_coord;
		} else {
			output += read_coord + ref_coord;
		}
	}
	
	output += ", L " + _scales.ref_interval_scale(map_ref_interval(d.r,d.path[0].R)) + "," + top_y; // ref start
	output += ", L " + _scales.read_scale(d.path[0].Q)      + "," + bottom_y; // read start

	return output;
}

function ref_mapping_path_generator(d,chunk) {

		var bottom = {};
		var top = {};

		if (chunk == true) {
			bottom.y = _positions.chunk.ref_intervals.y;		
			bottom.left = _scales.chunk_ref_interval_scale(d.cum_pos);
			bottom.right = bottom.left + _scales.chunk_ref_interval_scale(d.end)-_scales.chunk_ref_interval_scale(d.start);

			top.y = _positions.chunk.ref_block.y + _positions.chunk.ref_block.height;
		} else {
			bottom.y = _positions.ref_intervals.y;			
			bottom.left = _scales.ref_interval_scale(d.cum_pos);
			bottom.right = bottom.left + _scales.ref_interval_scale(d.end)-_scales.ref_interval_scale(d.start);

			top.y = _positions.ref_block.y + _positions.ref_block.height;
		}
		
		top.left = _scales.whole_ref_scale(map_whole_ref(d.chrom,d.start));
		top.right = _scales.whole_ref_scale(map_whole_ref(d.chrom,d.end));

		return (
				 "M " + bottom.left                          + "," + bottom.y
		 + ", L " + bottom.right                          + "," + bottom.y
		 + ", L " + top.right                           + "," + top.y
		 + ", L " + top.left                           + "," + top.y
		 + ", L " + bottom.left                          + "," + bottom.y
		 )
}

function map_whole_ref(chrom,position) {
	// _Whole_refs has chrom, size, cum_pos

	for (var i = 0; i < _Whole_refs.length; i++) {
		if (_Whole_refs[i].chrom == chrom) {
			return _Whole_refs[i].cum_pos + position;
		}
	}
	return undefined;
}

function map_ref_interval(chrom,position) {
	// _Ref_intervals has chrom, start, end, size, cum_pos
	for (var i = 0; i < _Ref_intervals.length; i++) {
		if (_Ref_intervals[i].chrom == chrom) {
			if (position >= _Ref_intervals[i].start && position <= _Ref_intervals[i].end ) {
				return _Ref_intervals[i].cum_pos + (position - _Ref_intervals[i].start);
			}
		}
	}
	console.log("ERROR: no chrom,pos match found in map_ref_interval()");
	console.log(chrom,position);
	console.log(_Ref_intervals);

}

function map_chunk_ref_interval(chrom,position) {
	// _Ref_intervals has chrom, start, end, size, cum_pos
	for (var i = 0; i < _Chunk_ref_intervals.length; i++) {
		if (_Chunk_ref_intervals[i].chrom == chrom) {
			if (position >= _Chunk_ref_intervals[i].start && position <= _Chunk_ref_intervals[i].end ) {
				return _Chunk_ref_intervals[i].cum_pos + (position - _Chunk_ref_intervals[i].start);
			}
		}
	}
	console.log("ERROR: no chrom,pos match found in map_chunk_ref_interval()");
	console.log(chrom,position);
	console.log(_Chunk_ref_intervals);

}

function get_chromosome_sizes(ref_intervals_by_chrom) {

	var chromosomes = [];
	for (var chrom in ref_intervals_by_chrom) {
		chromosomes.push(chrom);
	}
	for (var chrom in _Ref_sizes_from_header) {
		if (chromosomes.indexOf(chrom) == -1) {
			chromosomes.push(chrom);
		}
	}

	chromosomes.sort(natural_sort);

	_Whole_refs = [];
	var cumulative_whole_ref_size = 0;
	for (var j = 0; j < chromosomes.length; j++){
		var chrom = chromosomes[j];
		var intervals = ref_intervals_by_chrom[chrom];
		if (_Ref_sizes_from_header[chrom] == undefined) {
			if (!_settings.show_only_known_references) {
				var length_guess = intervals[intervals.length-1][1]*2;
				_Whole_refs.push({"chrom":chrom,"size":length_guess,"cum_pos":cumulative_whole_ref_size});
				cumulative_whole_ref_size += length_guess;
			}
		} else {
			_Whole_refs.push({"chrom":chrom, "size":_Ref_sizes_from_header[chrom], "cum_pos":cumulative_whole_ref_size});
			cumulative_whole_ref_size += _Ref_sizes_from_header[chrom];
		}
	}

	_scales.whole_ref_scale.domain([0,cumulative_whole_ref_size]);
	_scales.ref_color_scale.domain(chromosomes);

}


function organize_references_for_chunk() {
	////////////////   Select reference chromosomes to show:   ////////////////////
	// Gather starts and ends for each chromosome
	var ref_pieces = {};
	for (var j = 0; j < _Chunk_alignments.length; j++) {
		alignments = _Chunk_alignments[j].alignments;
		for (var i = 0; i < alignments.length; i++) {
			if (ref_pieces[alignments[i].r] == undefined) {
				ref_pieces[alignments[i].r] = [];
			}
			var interval = [alignments[i].rs,alignments[i].re];
			
			ref_pieces[alignments[i].r].push([Math.min.apply(null,interval),"s"]);
			ref_pieces[alignments[i].r].push([Math.max.apply(null,interval),"e"]);
		}
	}
	
	if (_focal_region != undefined) {
		if (ref_pieces[_focal_region.chrom] == undefined) {
			ref_pieces[_focal_region.chrom] = [];
		}
		ref_pieces[_focal_region.chrom].push([_focal_region.start,"s"]);
		ref_pieces[_focal_region.chrom].push([_focal_region.end,"e"]);
	}

	// For each chromosome, consolidate intervals
	var ref_intervals_by_chrom = {};
	for (var chrom in ref_pieces) {
		ref_intervals_by_chrom[chrom] = planesweep_consolidate_intervals(ref_pieces[chrom]);
	}

	//////////////////////////////////////////////////////////
	get_chromosome_sizes(ref_intervals_by_chrom);

	var chromosomes = [];
	for (var chrom in ref_intervals_by_chrom) {
		chromosomes.push(chrom);
	}

	chromosomes.sort(natural_sort);

	var longest_region = {};
	var length_of_longest_region = 0;

	_Chunk_ref_intervals = [];
	var cumulative_position = 0;
	for (var j = 0; j < chromosomes.length; j++){
		var chrom = chromosomes[j];
		var intervals = ref_intervals_by_chrom[chrom];
		for (var i = 0; i < intervals.length; i++) {
			_Chunk_ref_intervals.push({"chrom":chrom,"start":intervals[i][0],"end":intervals[i][1],"size":intervals[i][1]-intervals[i][0],"cum_pos":cumulative_position});
			var region_length = intervals[i][1]-intervals[i][0];
			cumulative_position += region_length;
			if (region_length > length_of_longest_region) {
				length_of_longest_region = region_length;
				longest_region = {"chrom":chrom,"start":intervals[i][0],"end":intervals[i][1]};
			}
		}
	}
	
	if (_focal_region == undefined) {
		_focal_region = longest_region;	
	}


	_scales.chunk_ref_interval_scale.domain([0,cumulative_position]);

	refresh_visibility();
}


function organize_references_for_read() {
	////////////////   Select reference chromosomes to show:   ////////////////////
	// Gather starts and ends for each chromosome
	var ref_pieces = {};
	for (var i = 0; i < _Alignments.length; i++) {
		if (ref_pieces[_Alignments[i].r] == undefined) {
			ref_pieces[_Alignments[i].r] = [];
		}
		var interval = [_Alignments[i].rs,_Alignments[i].re];

		ref_pieces[_Alignments[i].r].push([Math.min.apply(null,interval),"s"]);
		ref_pieces[_Alignments[i].r].push([Math.max.apply(null,interval),"e"]);
	}

	// For each chromosome, consolidate intervals
	var ref_intervals_by_chrom = {};
	for (var chrom in ref_pieces) {
		ref_intervals_by_chrom[chrom] = planesweep_consolidate_intervals(ref_pieces[chrom]);
	}

	//////////////////////////////////////////////////////////

	var chromosomes = [];
	for (var chrom in ref_intervals_by_chrom) {
		chromosomes.push(chrom);
	}

	chromosomes.sort(natural_sort);

	_Ref_intervals = [];
	var cumulative_position = 0;
	for (var j = 0; j < chromosomes.length; j++){
		var chrom = chromosomes[j];
		var intervals = ref_intervals_by_chrom[chrom];
		for (var i = 0; i < intervals.length; i++) {
			_Ref_intervals.push({"chrom":chrom,"start":intervals[i][0],"end":intervals[i][1],"size":intervals[i][1]-intervals[i][0],"cum_pos":cumulative_position});
			cumulative_position += (intervals[i][1]-intervals[i][0]);
		}
	}
	
	

	_scales.ref_interval_scale.domain([0,cumulative_position]);
}



function refresh_visibility() {
	if (_Whole_refs.length > 0) {
		d3.select("#svg2_panel").style('visibility','visible');
	} else {
		d3.select("#svg2_panel").style('visibility','hidden');
	}

	if (_Chunk_alignments.length > 0) {
		d3.select("#select_reads").style("visibility","visible"); // just the label	
		d3.select("#region_settings_panel").style("display","block");
		// table.style("visibility","visible");
	} else {
		d3.select("#select_reads").style("visibility","hidden"); // just the label	
		d3.select("#region_settings_panel").style("display","none");
		// table.style("visibility","hidden");
	}

	if (_Alignments.length > 0) {
		d3.select("#settings").style('visibility','visible');
		d3.select("#svg1_panel").style('visibility','visible');
	} else {
		d3.select("#settings").style('visibility','hidden');
		d3.select("#svg1_panel").style('visibility','hidden');
	}
}

function draw() {
	if (_Alignments.length == 0) {
		// console.log("no alignments, not drawing anything");
		return;
	}
	if (_settings.ribbon_vs_dotplot == "dotplot") {
		draw_dotplot();
	} else {
		draw_ribbons();
	}
}

function reset_svg2() {
	////////  Clear the svg to start drawing from scratch  ////////
	d3.select("#svg2_panel").selectAll("svg").remove();

	_svg2 = d3.select("#svg2_panel").append("svg")
		.attr("width",_layout.svg2_width)
		.attr("height",_layout.svg2_height);

	d3.select("#svg2_panel").style('visibility','visible');
}


function reset_svg() {
	////////  Clear the svg to start drawing from scratch  ////////
	d3.select("#svg1_panel").selectAll("svg").remove();

	_svg = d3.select("#svg1_panel").append("svg")
		.attr("width",_layout.svg_width)
		.attr("height",_layout.svg_height);
}

function dotplot_alignment_path_generator(d) {
	var output = "M " + _scales.ref_interval_scale(map_ref_interval(d.r,d.path[0].R)) + "," + _scales.read_scale(d.path[0].Q);
	for (var i = 1; i < d.path.length; i++) {
		output += ", L " + _scales.ref_interval_scale(map_ref_interval(d.r,d.path[i].R)) + "," + _scales.read_scale(d.path[i].Q);		
	}
	
	return output;
}

function draw_dotplot() {
	reset_svg();

	if (_Alignments == undefined || _Alignments == []) {
		return;
	}

	// Make square
	var square = Math.min(_layout.svg_height,_layout.svg_width);

	_positions.fractions = {'main':0.8,'top_right':0.05, 'bottom_left':0.15};
	_positions.padding = {"top": square * _positions.fractions.top_right, "right": square * _positions.fractions.top_right, "bottom": square * _positions.fractions.bottom_left, "left": square * _positions.fractions.bottom_left};
	_positions.main = square*_positions.fractions.main;
	// _positions.canvas = {'x':_layout.svg_width-_positions.main-_positions._padding.right,'y':_positions._padding.top,'width':_positions.main,'height':_positions.main};
	_positions.canvas = {'x':_layout.svg_width/2-_positions.main/2-_positions.padding.right,'y':_positions.padding.top,'width':_positions.main,'height':_positions.main};
	
	var canvas = _svg.append("g").attr("class","dotplot_canvas").attr("transform","translate(" + _positions.canvas.x + "," + _positions.canvas.y + ")");
	canvas.append("rect").style("fill","#eeeeee").attr("width",_positions.canvas.width).attr("height",_positions.canvas.height);

	// Relative to canvas
	_positions.ref = {"left":0, "right":_positions.canvas.width, "y":_positions.canvas.height};
	_positions.read = {"top":0, "bottom":_positions.canvas.height, "x":_positions.canvas.width};

	// Draw read
	canvas.append("line").attr("x1",0).attr("x2", 0).attr("y1",_positions.read.top).attr("y2",_positions.read.bottom).style("stroke-width",1).style("stroke", "black");
	canvas.append("text").text("Read").style('text-anchor',"middle")
		 .attr("transform", "translate("+ (-5*_padding.text) + "," + (_positions.canvas.height/2)+")rotate(-90)")


	// Draw ref
	canvas.append("line").attr("x1",_positions.ref.left).attr("x2", _positions.ref.right).attr("y1",_positions.ref.y).attr("y2",_positions.ref.y).style("stroke-width",1).style("stroke", "black");
	canvas.append("text").text("Reference").attr("x",(_positions.ref.left+_positions.ref.right)/2).attr("y",_positions.ref.y+_padding.text*2).style('text-anchor',"middle").attr("dominant-baseline","top");


	_scales.read_scale.range([_positions.read.bottom, _positions.read.top]);
	_scales.ref_interval_scale.range([_positions.ref.left, _positions.ref.right]);
	

	canvas.selectAll("rect.ref_interval").data(_Ref_intervals).enter()
		.append("rect").attr("class","ref_interval")
			.attr("x",function(d) { return _scales.ref_interval_scale(d.cum_pos); })
			.attr("y",0)
			.attr("width", function(d) {return (_scales.ref_interval_scale(d.end)-_scales.ref_interval_scale(d.start));})
			.attr("height", _positions.canvas.height)
			.attr("fill",function(d) {
				if (_settings.colorful) {return _scales.ref_color_scale(d.chrom);} else {return "white"}})
			.style("stroke-width",1).style("stroke", "black")
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + comma_format(d.start) + " - " + comma_format(d.end);
				var x = _positions.canvas.x + _scales.ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
				var y = _positions.canvas.y + _positions.canvas.height + _padding.text;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();})
			.style("stroke-opacity",0.1)
			.attr("fill-opacity",_static.dotplot_ref_opacity)

	// Alignments
	var a_groups = canvas.selectAll("g.alignment").data(_Alignments).enter()
		.append("g").attr("class","alignment");
	a_groups.append("path")
			.filter(function(d) {return d.mq >= _settings.min_mapping_quality})
				.attr("d",dotplot_alignment_path_generator)
				.style("stroke-width",2)
				.style("stroke","black")
				.style("stroke-opacity",1)
				.style("fill","none")
				.on('mouseover', function(d) {
					var text = Math.abs(d.qe-d.qs) + " bp"; 
					var x = _positions.canvas.x + _scales.ref_interval_scale(map_ref_interval(d.r,(d.rs+d.re)/2));
					var y = _padding.text*(-3) + _positions.canvas.y + _scales.read_scale((d.qs+d.qe)/2);
					show_tooltip(text,x,y,_svg);
				})
				.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

	var read_axis = d3.svg.axis().scale(_scales.read_scale).orient("left").ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"))
	var read_axis_label = _svg.append("g")
		.attr("class","axis")
		.attr("transform","translate(" + _positions.canvas.x + "," + _positions.padding.top + ")")
		.call(read_axis)

}

function draw_ribbons() {
	reset_svg();

	if (_Alignments == undefined) {
		return;
	}


	// Calculate layouts within the svg
	_positions.read = {"y":_layout.svg_height*0.75, "x":_layout.svg_width*0.10, "width":_layout.svg_width*0.80, "height":_layout.svg_height*0.03};
	_positions.ref_block = {"y":_layout.svg_height*0.15, "x":_layout.svg_width*0.10, "width":_layout.svg_width*0.80, "height":_layout.svg_height*0.03};
	_positions.ref_intervals = {"y":_layout.svg_height*0.35, "x":_layout.svg_width*0.10, "width":_layout.svg_width*0.80, "height":_layout.svg_height*0.03};

	// Draw read
	_svg.append("rect").attr("class","read").attr("x",_positions.read.x).attr("y",_positions.read.y).attr("width",_positions.read.width).attr("height",_positions.read.height).style("stroke-width",1).style("stroke", "black").attr("fill","black")
		.on('mouseover', function() {
			var text = "read: " + _Alignments[_Alignments.length-1].read_length + " bp";
			var x = _positions.read.x+_positions.read.width/2;
			var y = _positions.read.y+_positions.read.height*3.5;
			show_tooltip(text,x,y,_svg);
		})
	_svg.append("text").text("Read").attr("x",_positions.read.x+_positions.read.width/2).attr("y",_positions.read.y+_positions.read.height*3.5).style('text-anchor',"middle").attr("dominant-baseline","top");
	
	// Draw "Reference" label
	_svg.append("text").text("Reference").attr("x",_positions.ref_block.x+_positions.ref_block.width/2).attr("y",_positions.ref_block.y-_positions.ref_block.height*3).style('text-anchor',"middle").attr("dominant-baseline","middle");


	_scales.read_scale.range([_positions.read.x,_positions.read.x+_positions.read.width]);
	_scales.whole_ref_scale.range([_positions.ref_block.x, _positions.ref_block.x + _positions.ref_block.width]);
	_scales.ref_interval_scale.range([_positions.ref_intervals.x, _positions.ref_intervals.x+_positions.ref_intervals.width]);
	
	// Whole reference chromosomes for the relevant references:
	_svg.selectAll("rect.ref_block").data(_Whole_refs).enter()
		.append("rect").attr("class","ref_block")
			.attr("x",function(d) { return _scales.whole_ref_scale(d.cum_pos); })
			.attr("y",_positions.ref_block.y)
			.attr("width", function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size) - _scales.whole_ref_scale(d.cum_pos));})
			.attr("height", _positions.ref_block.height)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
			.style("stroke-width",1).style("stroke", "black")
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + bp_format(d.size);
				var x = _scales.whole_ref_scale(d.cum_pos + d.size/2);
				var y = _positions.ref_block.y - _padding.text;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

	_svg.selectAll("text.ref_block").data(_Whole_refs).enter()
		.append("text").attr("class","ref_block")
			.filter(function(d) { return (_scales.whole_ref_scale(d.cum_pos + d.size) - _scales.whole_ref_scale(d.cum_pos) > 15);})
				.text(function(d){var chrom = d.chrom; return chrom.replace("chr","")})
				.attr("x", function(d) { return _scales.whole_ref_scale(d.cum_pos + d.size/2)})
				.attr("y",_positions.ref_block.y - _padding.text)
				.style('text-anchor',"middle").attr("dominant-baseline","bottom");
				// .attr("height", _positions.ref_block.height)
				// .attr("width", function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size)-_scales.whole_ref_scale(d.cum_pos));})
				// .attr("font-size",function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size)-_scales.whole_ref_scale(d.cum_pos))/2;});
	
	// Zoom into reference intervals where the read maps:
	_svg.selectAll("rect.ref_interval").data(_Ref_intervals).enter()
		.append("rect").attr("class","ref_interval")
			.attr("x",function(d) { return _scales.ref_interval_scale(d.cum_pos); })
			.attr("y",_positions.ref_intervals.y)
			.attr("width", function(d) {return (_scales.ref_interval_scale(d.end)-_scales.ref_interval_scale(d.start));})
			.attr("height", _positions.ref_intervals.height)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
			.style("stroke-width",1).style("stroke", "black")
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + comma_format(d.start) + " - " + comma_format(d.end);
				var x = _scales.ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
				var y = _positions.ref_intervals.y - _padding.text;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

	_svg.selectAll("path.ref_mapping").data(_Ref_intervals).enter()
		.append("path").attr("class","ref_mapping")
			.filter(function(d) {return map_whole_ref(d.chrom,d.start) != undefined;})
				.attr("d",function(d) {return ref_mapping_path_generator(d,false)})
				// .style("stroke-width",2)
				// .style("stroke","black")
				.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})


	// Alignments
	_svg.selectAll("path.alignment").data(_Alignments).enter()
		.append("path")
			.filter(function(d) {return d.mq >= _settings.min_mapping_quality})
			.attr("class","alignment")
			.attr("d",ribbon_alignment_path_generator)
			.style("stroke-width",function() { if (_settings.ribbon_outline) {return 1;} else {return 0;} })
			.style("stroke","black")
			.style("stroke-opacity",1)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.r);})
			.attr("fill-opacity",_static.alignment_alpha)
			.on('mouseover', function(d) {
				var text = Math.abs(d.qe-d.qs) + " bp"; 
				var x = _scales.read_scale((d.qs+d.qe)/2);
				var y = _positions.read.y - _padding.text;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});


	var read_axis = d3.svg.axis().scale(_scales.read_scale).orient("bottom").ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"))
	var read_axis_label = _svg.append("g")
		.attr("class","axis")
		.attr("transform","translate(" + 0 + "," + (_positions.read.y+_positions.read.height) + ")")
		.call(read_axis)

}


// ===========================================================================
// == Examples
// ===========================================================================

function add_examples_to_navbar() {
	navbar_examples_link = d3.select("#navbar")
	.append("li")
		.attr("class","dropdown")

	navbar_examples_link
			.append("a")
				.html("Examples <span class='caret'></span>")
				.attr("class","dropdown-toggle")
				.attr("data-toggle","dropdown")
				.attr("href","")
		
	navbar_examples = navbar_examples_link.append("ul")
			.attr("class","dropdown-menu")
			.attr("id", "settings_dropdown_menu")
			.attr("role","menu")


	jQuery.ajax({
			url: "examples",
			error: function() {
				console.log("Can't find examples");
			},
			success: function (data) {
				$(data).find("a:contains(.sam)").each(function() {
					// will loop through
					var example_file = $(this).attr("href");

					navbar_examples.append("li").append("a")
						.attr("href",void(0))
						.on("click",function() {read_example(example_file);})
						.text(example_file);
				})
			}
	});
}



function read_example(filename) {

	jQuery.ajax({url: "examples/" + filename, success: function(file_content) {
		sam_input_changed(file_content);
	}})
}

add_examples_to_navbar();



// ===========================================================================
// == Load bam file
// ===========================================================================


document.getElementById('bam_file').addEventListener('change', openBamFile, false);


// $("#chrom_pos_input").keyup(function(event) {
// 	if(event.keyCode == 13) {
// 		go_to_location(this.value);
// 	}
// });

function openBamFile(event) {

	// From bam.iobio, thanks Marth lab!
	if (event.target.files.length != 2) {
		 alert('must select both a .bam and .bai file');
		 return;
	}

	var fileType0 = /[^.]+$/.exec(event.target.files[0].name)[0];
	var fileType1 = /[^.]+$/.exec(event.target.files[1].name)[0];

	if (fileType0 == 'bam' && fileType1 == 'bai') {
		bamFile = event.target.files[0];
		baiFile = event.target.files[1];
	 } else if (fileType1 == 'bam' && fileType0 == 'bai') {
			bamFile = event.target.files[1];
			baiFile = event.target.files[0];
	 } else {
			alert('must select both a .bam and .bai file');
	 }
	_Bam = new Bam( bamFile, { bai: baiFile });

	wait_then_run_when_all_data_loaded();
}



function wait_then_run_when_all_data_loaded() {
	if (_Bam.header != undefined) {
		console.log("ready")
		bam_loaded();
	} else {
		console.log("waiting for data to load")
		window.setTimeout(wait_then_run_when_all_data_loaded,100)  
	}
}


function bam_loaded() {
	clear_data();

	record_bam_header();

	reset_svg2();
	draw_chunk_ref();
	d3.select("#region_selector_panel").style("display","block");

	user_message("Info", "Loaded alignments from " + _Whole_refs.length + " reference sequences (chromosomes). Select a region above to fetch reads.");

	refresh_visibility();
}

function record_bam_header() {
	
	// console.log(bam); 
	// console.log( bam.bam.indices[bam.bam.chrToIndex["chr2"]] );

	// console.log(bam.header.sq);
	_Ref_sizes_from_header = {};
	for (var i in _Bam.header.sq) {
		_Ref_sizes_from_header[_Bam.header.sq[i].name] = _Bam.header.sq[i].end;
	}
	
	var chromosomes = [];
	for (var chrom in _Ref_sizes_from_header) {
		if (chromosomes.indexOf(chrom) == -1) {
			chromosomes.push(chrom);
		}
	}
	chromosomes.sort(natural_sort);

	_Whole_refs = [];
	var cumulative_whole_ref_size = 0;
	for (var j = 0; j < chromosomes.length; j++){
		var chrom = chromosomes[j];
		if (isNaN(_Ref_sizes_from_header[chrom])) {
			console.log("Skipping chromosome: " + chrom + " because its size is not a number");
		} else {
			_Whole_refs.push({"chrom":chrom, "size":_Ref_sizes_from_header[chrom], "cum_pos":cumulative_whole_ref_size});
			cumulative_whole_ref_size += _Ref_sizes_from_header[chrom];	
		}
	}

	_scales.whole_ref_scale.domain([0,cumulative_whole_ref_size]);
	_scales.ref_color_scale.domain(chromosomes);

}

function remove_bam_file() {
	// For when sam input changes, clear bam file to prevent confusion and enable switching back to the bam file
	d3.select('#bam_file').property("value","");
	d3.select("#region_selector_panel").style("display","none");
}

// ===========================================================================
// == Select region
// ===========================================================================


function get_chrom_index(chrom) {
	for (var i = 0; i < _Whole_refs.length; i++) {
		if (_Whole_refs[i].chrom == chrom || _Whole_refs[i].chrom == "chr" + chrom) {
			return i;
		}
	} 
	return undefined;
}


var loading_bam_right_now = false;
function show_waiting_for_bam() {
	user_message("Info","Fetching bam records at position");
	d3.select("#region_go").property("disabled",true);
	d3.select("#region_go").html("Fetching...");
	d3.select("#region_go").style("color","gray");
	loading_bam_right_now = true;
}

function show_bam_is_ready() {
	d3.select("#region_go").property("disabled",false);
	d3.select("#region_go").html("Go");
	d3.select("#region_go").style("color","black");
	loading_bam_right_now = false;
}

function go_to_region(chrom,start,end) {

	if (_Bam != undefined) {
		console.log("Fetching bam records at position");
		show_waiting_for_bam();

		// var step = 1000;
		// for (var i = start; i < end; i += step) {
		// 	console.log(i,i+step);
		// 	_Bam.fetch(chrom,i,i+step,record_fetched_data);
		// }

		// chrom = "chr6";
		// var i = 29800000;
		// var step = 3000; // 893 records
		// var step = 4000; // 974
		// var step = 6000; // 1174
		// var step = 8000; // 1346
		// var step = 10000; // 1646
		// var step = 12000; // 1915
		// var step = 14000; // 2296
		// // var step = 16000; // crash
		// // var step = 20000; // crash

		// _Bam.fetch(chrom,i,i+step,record_fetched_data);
		// var chrId = _Bam.bam.chrToIndex[chrom];
	 //    var chunks;
	 //    if (chrId === undefined) {
	 //        chunks = [];
	 //    } else {
	 //        chunks = _Bam.bam.blocksForRange(chrId, start, end);
	 //        if (!chunks) {
	 //            callback(null, 'Error in index fetch');
	 //        }
	 //        console.log("Chunks:", chunks.length);
	 //    }



		_Bam.fetch(chrom,start,end,use_fetched_data);


	} else {
		console.log("No bam file");
		user_message("Error","No bam file");
	}
}

//////////////////////////////    Fetch bam data from a specific region  //////////////////////////////

function parse_bam_record(record) {
	
	var chrom = record.segment;
	var rstart = record.pos;
	var flag = record.flag;
	var mq = record.mq;
	var raw_cigar = record.cigar;
	
	var strand = "+";
	if ((flag & 16) == 16) {
		strand = "-";
	}

	if (mq == undefined) {
		console.log("record missing mq");
		console.log(record);
	}
	
	var alignments = [];
	
	if (record.SA != undefined) {
		alignments = parse_SA_field(record.SA);	
	}
	
	alignments.push(read_cigar(raw_cigar,chrom,rstart,strand,mq));

	var read_length = alignments[alignments.length-1].read_length;

	for (var i = 0; i < alignments.length; i++) {
		 if (alignments[i].read_length != read_length) {
				user_message("Warning", "read length of primary and supplementary alignments do not match for this read (calculated using cigar strings)");
		 }
	}


	return {"alignments": alignments, "raw":record, "raw_type":"bam", "readname":record.readName};

}


function use_fetched_data(records) {
	console.log("Bam record finished loading");
	show_bam_is_ready();
	// console.log(records);

	var consolidated_records = [];
	if (_settings.keep_duplicate_reads == false) {
		var used_readnames = {};
		for (var i in records) {
			if (used_readnames[records[i].readName] == undefined) {
				consolidated_records.push(records[i]);
				used_readnames[records[i].readName] = true;
			}
		}
	} else {
		consolidated_records = records;
	}
	

	_settings.min_indel_size = 100000000000; 
	_Chunk_alignments = [];
	for (var i in consolidated_records) {
		_Chunk_alignments.push(parse_bam_record(consolidated_records[i]));
	}
	
	chunk_changed();
	user_message("Info","Total reads mapped in region: " + _Chunk_alignments.length);

}


function region_submitted(event) {

	var chrom = d3.select("#region_chrom").property("value");
	var start = parseInt(d3.select("#region_start").property("value").replace(/,/g,""));
	var end = start + 1; //parseInt(d3.select("#region_end").property("value").replace(/,/g,""));

	if (isNaN(start) == true) {
		user_message("Error", "start value:" + d3.select("#region_start").property("value") + " could not be made into a number");
	} //else if (isNaN(end) == true) {
	// 	user_message("Error", "end value:" + d3.select("#region_end").property("value") + " could not be made into a number");
	// }

	var chrom_index = get_chrom_index(chrom);
	if (chrom_index != undefined) {
		chrom = _Whole_refs[chrom_index].chrom;
		if (start > _Whole_refs[chrom_index].size) {
			start = _Whole_refs[chrom_index].size;
		}
		if (end > _Whole_refs[chrom_index].size) {
			end = _Whole_refs[chrom_index].size;
		}
		if (start < 0) {
			start = 0;
		}
		if (end < 0) {
			end = 0;
		}
		if (start > end) {
			var tmp = start;
			start = end;
			end = tmp;
		}

		// Correct any issues with coordinates
		d3.select("#region_chrom").property("value",chrom);
		d3.select("#region_start").property("value",start);
		// d3.select("#region_end").property("value",end);

		go_to_region(chrom,start,end);
		_focal_region = {"chrom":chrom,"start":start,"end":end};

	} else {
		// console.log("Bad");
		user_message("Error","Chromosome does not exist in reference");
	}
}

d3.select("#region_go").on("click",region_submitted);
d3.select("#region_chrom").on("keyup",function(){ if (d3.event.keyCode == 13 && !loading_bam_right_now) {region_submitted()} });
d3.select("#region_start").on("keyup",function(){ if (d3.event.keyCode == 13 && !loading_bam_right_now) {region_submitted()} });
// d3.select("#region_end").on("keyup",function(){ if (d3.event.keyCode == 13) {region_submitted()} });



// ===========================================================================
// == Responsiveness
// ===========================================================================


// Resize SVG and sidebar when window size changes
window.onresize = resizeWindow;


function resizeWindow() {
	responsive_sizing();
}

run();

