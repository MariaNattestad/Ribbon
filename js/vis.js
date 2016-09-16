
// Calculations for drawing and spacing out elements on the screen

var _padding = {};
var _layout = {};
var _positions = {};
_positions.multiread = {};
_positions.singleread = {};
_positions.ribbonplot = {};
_positions.dotplot = {};
_positions.fontsize = 12;

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
var _Refs_show_or_hide = {};
var _Variants = [];
var _Bedpe = [];
var _Additional_ref_intervals = [];
var _Features = [];

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

_static.fraction_ref_to_show_whole = 0.30; //  for very large contigs that span most of a reference, we show the whole reference
_static.read_sort_options = [{"id":"original","description":"Original order"},{"id":"longest","description":"Position of longest alignment"},{"id":"priamry","description":"Position of primary alignment in SAM/BAM entry"},{"id":"readname", "description":"Read/query name (natural sort)"},{"id":"num_alignments","description":"Number of alignments"}];
_static.read_orientation_options = [{id:"original", description:"Original orientation"}, {id:"reverse",description:"Reverse orientation"}, {id:"longest",description:"Orientation of longest alignment"},{id:"primary",description:"Orientation of alignment in selected locus (SAM/BAM)"}];
_static.color_schemes = [
	{"name":"Color scheme 1", "colors": 0},
	{"name":"Color scheme 2", "colors": 1},
	{"name":"Color scheme 3", "colors": 2},
];
_static.color_collections = [["#ff9896", "#c5b0d5", "#8c564b", "#e377c2", "#bcbd22", "#9edae5", "#c7c7c7", "#d62728", "#ffbb78", "#98df8a", "#ff7f0e", "#f7b6d2", "#c49c94", "#dbdb8d", "#aec7e8", "#17becf", "#2ca02c", "#7f7f7f", "#1f77b4", "#9467bd"],["#ffff00","#ad0000","#bdadc6", "#00ffff", "#e75200","#de1052","#ffa5a5","#7b7b00","#7bffff","#008c00","#00adff","#ff00ff","#ff0000","#ff527b","#84d6a5","#e76b52","#8400ff","#6b4242","#52ff52","#0029ff","#ffffad","#ff94ff","#004200","gray","black"],['#E41A1C', '#A73C52', '#6B5F88', '#3780B3', '#3F918C', '#47A266','#53A651', '#6D8470', '#87638F', '#A5548D', '#C96555', '#ED761C','#FF9508', '#FFC11A', '#FFEE2C', '#EBDA30', '#CC9F2C', '#AD6428','#BB614F', '#D77083', '#F37FB8', '#DA88B3', '#B990A6', '#999999']]
_static.min_indel_size_for_region_view = 50;
_static.show_indels_as_options = [{"id":"none","description":"None"}, {"id":"gaps","description":"Gaps"}, {"id":"thin","description":"Marks"}, {"id":"numbers","description":"Numbers indicating size"}];
_static.show_features_as_options = [{"id":"none","description":"None"}, {"id":"rectangles","description":"Boxes"}, {"id":"arrows","description":"Arrows"}, {"id":"names","description":"Arrows with names"}];
_static.multiread_layout_fractions = {"header":0.25,"footer":0.02,"variants":0.10,"bedpe":0.05,"features":0.07};
_static.singleread_layout_fractions = {"ref_and_mapping":0.33, "top_bar":0.07, "variants":0.06, "features":0.1, "bottom_bar":0.03};

var _settings = {};
_settings.region_min_mapping_quality = 0;
_settings.max_num_alignments = 1000000;
_settings.min_num_alignments = 1;
_settings.max_ref_length = 0;
_settings.min_aligns_for_ref_interval = 1;
_settings.min_read_length = 0;

_settings.ribbon_vs_dotplot = "ribbon";
_settings.min_mapping_quality = 0;
_settings.min_indel_size = _static.min_indel_size_for_region_view; // set to -1 to stop showing indels
_settings.min_align_length = 0; 

_settings.color_index = 0;
_settings.colorful = true;
_settings.ribbon_outline = false;
_settings.show_only_known_references = true;
_settings.keep_duplicate_reads = false;
_settings.feature_to_sort_reads = "original";
_settings.orient_reads_by = "primary";

_settings.current_input_type = "";
_settings.ref_match_chunk_ref_intervals = true;
_settings.show_only_selected_variants = false;
_settings.margin_to_merge_ref_intervals = 10000;
_settings.show_indels_as = "thin";
_settings.highlight_selected_read = true;
_settings.alignment_info_text = "";
_settings.variant_info_text = "";
_settings.bam_url = undefined;
_settings.fetch_margin = 100;
_settings.show_features_as = "arrows";
_settings.feature_types_to_show = {"protein_coding":true};
_settings.single_chrom_highlighted = false;

var _ui_properties = {};
_ui_properties.region_mq_slider_max = 0;
_ui_properties.region_mq_slider_min = 0;
_ui_properties.num_alignments_slider_max = 1000000;
_ui_properties.ref_length_slider_max = 10; 
_ui_properties.read_length_slider_max = 10; 

_ui_properties.mq_slider_max = 0;
_ui_properties.indel_size_slider_max = 0;
_ui_properties.align_length_slider_max = 0;


// Scales for visualization
var _scales = {};
_scales.read_scale = d3.scale.linear();
_scales.whole_ref_scale = d3.scale.linear();
_scales.chunk_whole_ref_scale = d3.scale.linear();
_scales.ref_interval_scale = d3.scale.linear();
_scales.chunk_ref_interval_scale = d3.scale.linear();
_scales.ref_color_scale = d3.scale.ordinal().range(_static.color_collections[_settings.color_index]);
_scales.variant_color_scale = d3.scale.ordinal();
_scales.feature_color_scale = d3.scale.ordinal();

var _tooltip = {};
function show_tooltip(text,x,y,parent_object) {
	parent_object.selectAll("g.tip").remove();

	_tooltip.width = (text.length + 4) * (_layout.svg_width/100);
	_tooltip.height = (_layout.svg_height/20);

	if (x -_tooltip.width/2 < 0) {
		x = _tooltip.width/2;
	} else if (x + _tooltip.width/2 > parent_object.attr("width")) {
		x = parent_object.attr("width") - _tooltip.width/2;
	}
	if (y - _tooltip.height/2 < 0) {
		y = _tooltip.height/2;
	} else if (y + _tooltip.height/2 > parent_object.attr("height")) {
		y = parent_object.attr("height") - _tooltip.height/2;
	}
	_tooltip.g = parent_object.append("g").attr("class","tip");
	_tooltip.g.attr("transform","translate(" + x + "," + y +  ")").style("visibility","visible");
	
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

	var top_banner_size = 60;
	_padding.top = top_banner_size;
	_padding.bottom = 0;
	_padding.left = 0;
	_padding.right = 0;
	_padding.between = 0.01*window_height;
	_padding.text = _padding.between;
	_padding.between_top_and_bottom_svg = _padding.between*2;

	_layout.right_panel_fraction = 0.35;
	_layout.svg_width_fraction = 1-_layout.right_panel_fraction;

	_layout.svg1_height_fraction = 0.40;

	_layout.left_width = (window_width - _padding.left - _padding.right) * (1-_layout.right_panel_fraction);
	_layout.panel_width = (window_width - _padding.left - _padding.right) * _layout.right_panel_fraction;

	_layout.svg1_box_height = (window_height - _padding.top - _padding.bottom) * _layout.svg1_height_fraction;
	_layout.svg2_box_height = (window_height - _padding.top - _padding.bottom) * (1-_layout.svg1_height_fraction);
	_layout.total_height = (window_height - _padding.top - _padding.bottom);

	_layout.svg_width = _layout.left_width - _padding.between*4;
	_layout.svg_height = _layout.svg1_box_height - _padding.between_top_and_bottom_svg

	_layout.svg2_width = _layout.left_width - _padding.between*4;
	_layout.svg2_height = _layout.svg2_box_height - _padding.between_top_and_bottom_svg

	_layout.input_margin = _padding.between;

	_positions.fontsize = _layout.svg2_width*0.012;
	
	d3.select("#svg1_panel")
		.style("width",_layout.left_width + "px")
		.style("height",_layout.svg1_box_height + "px");

	d3.select("#svg2_panel")
		.style("width",_layout.left_width + "px")
		.style("height",_layout.svg2_box_height + "px");

	d3.select("#right_panel")
		.style("width",_layout.panel_width + "px")
		.style("height",_layout.total_height + "px")
		.style("visibility","visible");

	if (_Chunk_alignments.length > 0 || _Whole_refs.length > 0) {
		draw_region_view();
		draw();	
	}
	refresh_visibility();

}

function adjust_multiread_layout() {
	var remaining_fraction_for_reads = 1.0 - _static.multiread_layout_fractions["header"] - _static.multiread_layout_fractions["footer"];
	var fractional_pos_for_variants = 0;
	var fractional_pos_for_features = 0;

	if (_Variants.length > 0 || _Bedpe.length > 0) {
		remaining_fraction_for_reads -= _static.multiread_layout_fractions["variants"];
	}
	if (_Features.length > 0) {
		remaining_fraction_for_reads -= _static.multiread_layout_fractions["features"];
	}
	_positions.multiread.ref_intervals = {"y":_layout.svg2_height*_static.multiread_layout_fractions["header"], "height":_layout.svg2_height*remaining_fraction_for_reads, "x":_layout.svg2_width*0.05, "width":_layout.svg2_width*0.90};
	_positions.multiread.reads = { "top_y":_positions.multiread.ref_intervals.y, "height":_positions.multiread.ref_intervals.height, "x": _positions.multiread.ref_intervals.x, "width":_positions.multiread.ref_intervals.width };
	

	fractional_pos_for_variants = _static.multiread_layout_fractions["header"] + remaining_fraction_for_reads;
	if (_Variants.length > 0 || _Bedpe.length > 0) {
		fractional_pos_for_features = fractional_pos_for_variants + _static.multiread_layout_fractions["variants"];
	} else {
		fractional_pos_for_features = fractional_pos_for_variants;
	}
	_positions.multiread.variants = {"y":_layout.svg2_height*fractional_pos_for_variants,"rect_height":_layout.svg2_height*_static.multiread_layout_fractions["variants"]*0.9, "ankle_height":_layout.svg2_height*0.015,"bezier_height":_layout.svg2_height*_static.multiread_layout_fractions["variants"]*0.9, "foot_length":_layout.svg2_height*_static.multiread_layout_fractions["variants"]/5, "arrow_size":_layout.svg2_height*_static.multiread_layout_fractions["variants"]/20};
	_positions.multiread.features = {"y":_layout.svg2_height*fractional_pos_for_features,"rect_height":_layout.svg2_height*_static.multiread_layout_fractions["features"], "arrow_size":_layout.svg2_height*_static.multiread_layout_fractions["features"]/7};
}

function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
			vars[key] = value;
	});
	return vars;
}


function open_any_url_files() {
	var url_vars = getUrlVars();
	if (url_vars["perma"] != undefined) {
		read_permalink(url_vars["perma"]);
	}

	if (url_vars["bam"] != undefined) {
		// "http://labshare.cshl.edu/shares/schatzlab/www-data/ribbon/SKBR3_hg19_alignments_near_longrange_variants.chr1.bam"
		// http://localhost/ribbon/?bam=http://labshare.cshl.edu/shares/schatzlab/www-data/ribbon/SKBR3_hg19_alignments_near_longrange_variants.chr1.bam
		read_bam_url(url_vars["bam"]);

	}
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


$('#min_read_length_slider').slider({
	min: 0,
	max: 1000,
	slide: function (event, ui) {
		d3.select("#min_read_length_input").property("value",ui.value);
		_settings.min_read_length = ui.value;
		draw_region_view();
	}
});

$('#min_aligns_for_ref_interval_slider').slider({
	min: 1,
	max: 20,
	slide: function(event,ui) {
		d3.select("#min_aligns_for_ref_interval_label").html(ui.value);
		_settings.min_aligns_for_ref_interval = ui.value;
		apply_ref_filters();
		draw_region_view();
		if (_settings.ref_match_chunk_ref_intervals == true) {
			select_read();
		}
	}
})
$('#max_ref_length_slider').slider({
	min: 0,
	max: 1000,
	slide: function (event, ui) {
		d3.select("#max_ref_length_input").property("value",ui.value);
		_settings.max_ref_length = ui.value;
		max_ref_length_changed();
		apply_ref_filters();
		if (_settings.ref_match_chunk_ref_intervals == true) {
			select_read();
		}
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

$('#align_length_slider').slider( {
	min: 0,
	max: 1000,
	slide: function( event, ui) {
		$("#align_length_label").html(ui.value);
		_settings.min_align_length = ui.value;
		draw();
	}
});

function max_ref_length_changed() {
	for (var i in _Whole_refs) {
		_Refs_show_or_hide[_Whole_refs[i].chrom] = (_Whole_refs[i].size <= _settings.max_ref_length);
	}

	d3.select("#chrom_highlighted").html("by size");
	apply_ref_filters();
	draw_region_view();
}

function search_select_chrom(chrom) {
	// Reset the ref size slider to default
	_settings.max_ref_length = _ui_properties.ref_length_slider_max;
	$('#max_ref_length_slider').slider("option","value", _settings.max_ref_length);
	d3.select("#max_ref_length_input").property("value",_settings.max_ref_length);

	highlight_chromosome(chrom);

}

function search_select_read(d) {
	new_read_selected(d.index);
}

d3.select("#min_read_length_input").on("keyup",function() {
	_settings.min_read_length = parseInt(this.value);
	if (isNaN(_settings.min_read_length)) {
		_settings.min_read_length = 0;
	}

	$('#min_read_length_slider').slider("option","value", _settings.min_read_length);
	draw_region_view();
});

d3.select("#max_ref_length_input").on("keyup",function() {
	_settings.max_ref_length = parseInt(this.value);
	if (isNaN(_settings.max_ref_length)) {
		_settings.max_ref_length = 0;
	}

	$('#max_ref_length_slider').slider("option","value", _settings.max_ref_length);
	max_ref_length_changed();
});


d3.select("#margin_to_merge_ref_intervals").on("keyup",function() {
	_settings.margin_to_merge_ref_intervals = parseInt(this.value);
	if (isNaN(_settings.margin_to_merge_ref_intervals)) {
		_settings.margin_to_merge_ref_intervals = 0;
	}
	organize_references_for_chunk();
	apply_ref_filters();
	draw_region_view();
	select_read();
})

// var image_URIs = [];

// function wait_for_images(callback, counter) {
// 	if (image_URIs.length == 2 || counter > 10) {
// 		callback()
// 	} else {
// 		window.setTimeout(function () {wait_for_images(callback, counter+1)},300);
// 	}
// }

d3.select("#generate_permalink_button").on("click", function() {

	write_permalink();
	// create_image_URIs();
	// wait_for_images(write_permalink,0);

});

// function create_image_URIs() {
// 	svgAsPngUri(document.getElementById("svg_single_read"), {backgroundColor: 'white'}, function(uri) {
// 		console.log("in svgAsPngUri single read");
// 		image_URIs.push(uri);
// 	});
// 	svgAsPngUri(document.getElementById("svg_multi_read"), {backgroundColor: 'white'}, function(uri) {
// 		console.log("in svgAsPngUri multi read");
// 		image_URIs.push(uri);
// 	});

// }

function get_name() {
	var permalink_name = d3.select("#permalink_name").property("value");
	if (permalink_name == "") {
		permalink_name = "Ribbon";
	}
	return permalink_name;
}

d3.select("#screenshot_top").on("click", function() {
	saveSvgAsPng(document.getElementById("svg_multi_read"), get_name()  + "_multi-read.png", {scale: 4});
});

d3.select("#screenshot_bottom").on("click", function() {
	saveSvgAsPng(document.getElementById("svg_single_read"), get_name() + "_single-read.png", {scale: 4});
});


$("#show_all_refs").click(function() {
	show_all_chromosomes();
	apply_ref_filters();
	draw_region_view();
	if (_settings.ref_match_chunk_ref_intervals == true) {
		apply_ref_filters();
		select_read();
	}
})

$("#ref_match_region_view").change(function() {
	_settings.ref_match_chunk_ref_intervals = this.checked;
	select_read(); // need to recalculate ref intervals
})

$('#colors_checkbox').change(function() {
	_settings.colorful = this.checked
	draw();
});


$('#show_only_selected_variants').change(function() {
	_settings.show_only_selected_variants = this.checked
	draw_region_view();
	draw();
});

$('#highlight_selected_read').change(function() {
	_settings.highlight_selected_read = this.checked
	new_read_selected(_current_read_index);
});



$('#outline_checkbox').change(function() {
	_settings.ribbon_outline = this.checked
	draw();
});


$(".ribbon_vs_dotplot").click(function(){
	var value = d3.select("input[name=ribbon_vs_dotplot]:checked").node().value;
	if (_settings.ribbon_vs_dotplot != value) {
		_settings.ribbon_vs_dotplot = value;

		// Show settings specific to each plot
		$(".ribbon_settings").toggle();
		$(".dotplot_settings").toggle();
		
		// Redraw
		draw();	
	}
});


function draw_chunk_ref() {
	if (_Whole_refs.length == 0) {
		// console.log("No references for draw_chunk_ref, not drawing anything");
		return;
	}

	
	_positions.multiread.ref_block = {"y":_layout.svg2_height*0.15, "x":_layout.svg2_width*0.05, "width":_layout.svg2_width*0.90, "height":_layout.svg2_height*0.03};
	// Draw "Reference" label
	_svg2.append("text").attr("id","ref_tag").text("Reference").attr("x",_positions.multiread.ref_block.x+_positions.multiread.ref_block.width/2).attr("y",_positions.multiread.ref_block.y-_positions.multiread.ref_block.height*3).style('text-anchor',"middle").attr("dominant-baseline","middle").style("font-size",_positions.fontsize);


	// _scales.read_scale.range([_positions.read.x,_positions.read.x+_positions.read.width]);
	_scales.chunk_whole_ref_scale.range([_positions.multiread.ref_block.x, _positions.multiread.ref_block.x + _positions.multiread.ref_block.width]);

	// Whole reference chromosomes for the relevant references:
	var ref_blocks = _svg2.selectAll("g.ref_block").data(_Whole_refs).enter()
		.append("g").attr("class","ref_block")
		.filter(function(d) {return _Refs_show_or_hide[d.chrom]})
			.attr("transform",function(d) {return "translate(" + _scales.chunk_whole_ref_scale(d.filtered_cum_pos) + "," + _positions.multiread.ref_block.y + ")"})
			.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();})
			.on("click",function(d) {highlight_chromosome(d.chrom)})
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + bp_format(d.size);
				var x = _scales.chunk_whole_ref_scale(d.filtered_cum_pos + d.size/2);
				var y = _positions.multiread.ref_block.y - _padding.text*3;
				show_tooltip(text,x,y,_svg2);
			});

	ref_blocks.append("rect").attr("class","ref_block")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", function(d) {return (_scales.chunk_whole_ref_scale(d.filtered_cum_pos + d.size) - _scales.chunk_whole_ref_scale(d.filtered_cum_pos));})
		.attr("height", _positions.multiread.ref_block.height)
		.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
		.style("stroke-width",1).style("stroke", "black");
			
	ref_blocks.append("text").attr("class","ref_block")
		.filter(function(d) {return _Refs_show_or_hide[d.chrom]})
			.filter(function(d) { return (_scales.chunk_whole_ref_scale(d.filtered_cum_pos + d.size) - _scales.chunk_whole_ref_scale(d.filtered_cum_pos) > ((_positions.fontsize/5.)*d.chrom.length));})
				.text(function(d){var chrom = d.chrom; return chrom.replace("chr","")})
				.attr("x", function(d) { return _scales.chunk_whole_ref_scale(d.filtered_cum_pos + d.size/2) - _scales.chunk_whole_ref_scale(d.filtered_cum_pos)})
				.attr("y", -_padding.text)
				.style('text-anchor',"middle").attr("dominant-baseline","bottom")
				.style("font-size",_positions.fontsize);
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
	
	_scales.chunk_ref_interval_scale.range([_positions.multiread.ref_intervals.x, _positions.multiread.ref_intervals.x+_positions.multiread.ref_intervals.width]);

	// Zoom into reference intervals where the read maps:
	_svg2.selectAll("rect.ref_interval").data(_Chunk_ref_intervals).enter()
		.append("rect").attr("class","ref_interval")
		.filter(function(d) {return d.cum_pos != -1})
			.attr("x",function(d) { return _scales.chunk_ref_interval_scale(d.cum_pos); })
			.attr("y",_positions.multiread.ref_intervals.y)
			.attr("width", function(d) {return (_scales.chunk_ref_interval_scale(d.end)-_scales.chunk_ref_interval_scale(d.start));})
			.attr("height", _positions.multiread.ref_intervals.height)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
			.attr("fill-opacity",_static.dotplot_ref_opacity)
			.style("stroke-width",1).style("stroke", "black")
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + comma_format(d.start) + " - " + comma_format(d.end);
				var x = _scales.chunk_ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
				var y = _positions.multiread.ref_intervals.y - _padding.text;
				show_tooltip(text,x,y,_svg2);
			})
			.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});

	// Ref interval mapping back to ref
	_svg2.selectAll("path.ref_mapping").data(_Chunk_ref_intervals).enter()
		.append("path").attr("class","ref_mapping")
		.filter(function(d) {return d.cum_pos != -1})
			.filter(function(d) {return map_whole_ref(d.chrom,d.start) != undefined;})
				.attr("d",function(d) {return ref_mapping_path_generator(d,true)})
				.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})

}

function find_features_in_view(features, mapping_function, scale_function) {
	var features_in_view = [];

	for (var i in features) {
		var feature = features[i];
		if (feature.show != false) {
			var start_results = mapping_function(feature.chrom,feature.start);
			var end_results = mapping_function(feature.chrom,feature.end);
			if (start_results.pos != end_results.pos) {
				feature.start_cum_pos = scale_function(start_results.pos);
				feature.start_precision = start_results.precision;
				
				feature.end_cum_pos = scale_function(end_results.pos);
				feature.end_precision = end_results.precision;

				if (feature.end_cum_pos < feature.start_cum_pos + 4) {
					feature.start_cum_pos = feature.start_cum_pos -2;
					feature.end_cum_pos = feature.start_cum_pos + 4;
				} else if (feature.end_cum_pos < feature.start_cum_pos) {
					var tmp = feature.start_cum_pos;
					feature.start_cum_pos = feature.end_cum_pos;
					feature.end_cum_pos  = tmp;
				}
				
				features_in_view.push(feature);
			}
		}
	}
	return features_in_view;
}

function calculate_offsets_for_features_in_view(features_in_view) {
	var padding = 20;
	
	var sweep_list = [];
	for (var i in features_in_view) {
		sweep_list.push([features_in_view[i].start_cum_pos, i]);
	}

	sweep_list.sort(function(a,b) {return a[0] - b[0]});

	var channels = [];
	for (var i in sweep_list) {
		var found = false;
		for (var j in channels) {
			if (channels[j] < features_in_view[sweep_list[i][1]].start_cum_pos) {
				channels[j] = features_in_view[sweep_list[i][1]].end_cum_pos + padding;
				features_in_view[sweep_list[i][1]].offset = j;
				found = true;
				break;
			}
		}
		if (found == false) {
			features_in_view[sweep_list[i][1]].offset = channels.length;
			channels.push(features_in_view[sweep_list[i][1]].end_cum_pos + padding);
		}
	}

	return channels.length;
}

function draw_chunk_features() {
	if (_Chunk_alignments.length > 0) {
		if (_Features.length > 0) {

			var features_in_view = find_features_in_view(_Features,closest_map_chunk_ref_interval,_scales.chunk_ref_interval_scale);
			var max_overlaps = calculate_offsets_for_features_in_view(features_in_view);
			if (_settings.show_features_as == "rectangles") {
				_svg2.selectAll("rect.features").data(features_in_view).enter()
					.append("rect")
						.attr("class",function(d) {if (d.highlight == true) {return "variants highlight"} else {return "variants"}})
						.attr("x",function(d) { return d.start_cum_pos })
						.attr("width",function(d) { return  d.end_cum_pos - d.start_cum_pos})
						.attr("y", function(d) {return _positions.multiread.features.y + _positions.multiread.features.rect_height*d.offset/max_overlaps})
						.attr("height", (_positions.multiread.features.rect_height*0.9/max_overlaps))
						.style("fill",function(d){return _scales.feature_color_scale(d.type)})
						.on('mouseover', function(d) {
							var text = d.name;
							if (d.type != undefined) {
								text = d.name + " (" + d.type + ")";
							}
							var x = (d.start_cum_pos + d.end_cum_pos)/2;
							var y =  _positions.multiread.features.y + _positions.multiread.features.rect_height*d.offset/max_overlaps - _padding.text;
							show_tooltip(text,x,y,_svg2);
						})
						.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});
			} else if (_settings.show_features_as == "arrows" || _settings.show_features_as == "names") {

				var feature_path_generator = function(d) {
					var arrow = -1*_positions.multiread.features.arrow_size,
						x1 = d.start_cum_pos,
						x2 = d.end_cum_pos,
						y = _positions.multiread.features.y + _positions.multiread.features.rect_height*d.offset/max_overlaps,
						direction = Number(d.strand=="+")*2-1;
					var xmid = (x1 + x2)/2;

					return (
						"M " + x1     					+ " " + y 
					 + " L " + xmid   					+ " " + y
					 + " L " + (xmid + arrow*direction) + " " + (y + arrow)
					 + " L " + xmid   					+ " " + y
					 + " L " + (xmid + arrow*direction) + " " + (y - arrow)
					 + " L " + xmid   					+ " " + y
					 + " L " + x2   					+ " " + y);
				}

				_svg2.selectAll("path.features").data(features_in_view).enter()
					.append("path")
						.attr("class",function(d) {if (d.highlight == true) {return "features highlight"} else {return "features"}})
						.attr("d",feature_path_generator)
						.style("stroke",function(d){return _scales.feature_color_scale(d.type)})
						.on('mouseover', function(d) {
							var text = d.name;
							if (d.type != undefined) {
								text = d.name + " (" + d.type + ")";
							}
							var x = (d.start_cum_pos + d.end_cum_pos)/2;
							var y =  _positions.multiread.features.y + _positions.multiread.features.rect_height*d.offset/max_overlaps - _padding.text;
							show_tooltip(text,x,y,_svg2);
						})
						.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});

				if (_settings.show_features_as == "names") {
					var text_boxes = _svg2.selectAll("g.features").data(features_in_view).enter().append("g").attr("class","features")
						.attr("transform",function(d) {return "translate(" + ((d.start_cum_pos + d.end_cum_pos)/2) + "," + (_positions.multiread.features.y + _positions.multiread.features.rect_height*d.offset/max_overlaps - _padding.text) + ")"});

					var height = _positions.multiread.features.rect_height/(max_overlaps+3)*2;
					
					text_boxes.append("text")
						.attr("class",function(d) {if (d.highlight == true) {return "features highlight"} else {return "features"}})
						.attr("x", 0)
						.attr("y", 0)
						.attr("fill",function(d){return _scales.feature_color_scale(d.type)})
						.style("font-size",height)
						.style('text-anchor',"middle").attr("dominant-baseline","ideographic")
						.text(function(d) {return d.name});
				}
			}
		}
	}
}
function draw_chunk_variants() {
	// Show bed file contents:

	if (_Chunk_alignments.length > 0) {
		if (_Variants.length > 0) {

			var variants_in_view = find_features_in_view(_Variants, closest_map_chunk_ref_interval, _scales.chunk_ref_interval_scale);
			var variants_to_show = [];
			for (var i in variants_in_view) {
				if (_settings.show_only_selected_variants == false || variants_in_view[i].highlight == true) {
					variants_to_show.push(variants_in_view[i]);
				}
				
			}

			var max_overlaps = calculate_offsets_for_features_in_view(variants_to_show);
			_svg2.selectAll("rect.variants").data(variants_to_show).enter()
				.append("rect")
					.attr("class",function(d) {if (d.highlight == true) {return "variants highlight"} else {return "variants"}})
					.attr("x",function(d) { return d.start_cum_pos })
					.attr("width",function(d) { return  d.end_cum_pos - d.start_cum_pos})
					.attr("y", function(d) {return _positions.multiread.variants.y + _positions.multiread.variants.rect_height*d.offset/max_overlaps})
					.attr("height", (_positions.multiread.variants.rect_height*0.9/max_overlaps))
					.style("fill",function(d){return _scales.variant_color_scale(d.type)})
					.on('mouseover', function(d) {
						var text = d.name;
						if (d.type != undefined) {
							text = d.name + " (" + d.type + ")";
						}
						var x = (d.start_cum_pos + d.end_cum_pos)/2;
						var y =  _positions.multiread.variants.y + _positions.multiread.variants.rect_height*d.offset/max_overlaps - _padding.text;
						show_tooltip(text,x,y,_svg2);
					})
					.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});
		}


		if (_Bedpe.length > 0) {

			var variants_in_view = [];
			for (var i in _Bedpe) {
				if (_settings.show_only_selected_variants == false || _Bedpe[i].highlight == true) {
					if (map_chunk_ref_interval(_Bedpe[i].chrom1,_Bedpe[i].pos1) != undefined && map_chunk_ref_interval(_Bedpe[i].chrom2,_Bedpe[i].pos2) != undefined) {
						var variant = _Bedpe[i];
						var results1 = closest_map_chunk_ref_interval(variant.chrom1,variant.pos1);
						variant.cum_pos1 = _scales.chunk_ref_interval_scale(results1.pos);

						var results2 = closest_map_chunk_ref_interval(variant.chrom2,variant.pos2); 
						variant.cum_pos2 = _scales.chunk_ref_interval_scale(results2.pos);
						variants_in_view.push(variant);
					}
				}
			}

			var loop_path_generator = function(d) {
				var foot_length = _positions.multiread.variants.foot_length;

				var x1 = d.cum_pos1,
					y_top = _positions.multiread.ref_intervals.y,

					x2 = d.cum_pos2,
					y_foot = _positions.multiread.variants.y,
					y_ankle = _positions.multiread.variants.y + _positions.multiread.variants.ankle_height;

				var arrow = -1*_positions.multiread.variants.arrow_size;

				var xmid = (x1+x2)/2;
				var ymid = _positions.multiread.variants.y + _positions.multiread.variants.ankle_height + _positions.multiread.variants.bezier_height; //y1 + _scales.connection_loops["top"](Math.abs(d.pos1-d.pos2))
				
				var direction1 = Number(d.strand1=="-")*2-1, // negative strands means the read is mappping to the right of the breakpoint
					direction2 = Number(d.strand2=="-")*2-1;

				return (
					 "M " + (x1+foot_length*direction1) + " " + y_foot // toe
				 + " L " + (x1+foot_length*direction1 + arrow*direction1) + " " + (y_foot + arrow) // arrow
				 + " L " + (x1+foot_length*direction1) + " " + (y_foot) // toe
				 + " L " + (x1+foot_length*direction1 + arrow*direction1) + " " + (y_foot - arrow) // arrow
				 + " L " + (x1+foot_length*direction1) + " " + (y_foot) // toe

				 + " L " + x1                          + " " + y_foot // breakpoint
				 // + " L " + x1                          + " " + y_top // up
				 + " L " + x1                          + " " + y_ankle // ankle
				 + " S " + xmid                        + " " + ymid + " " +          x2  + " " + y_ankle // curve to breakpoint
				 // + " L " + x2                          + " " + y_top // up
				 + " L " + x2                          + " " + y_foot // breakpoint

				 + " L " + (x2+foot_length*direction2) + " " + (y_foot) // toe
				 + " L " + (x2+foot_length*direction2 + arrow*direction2) + " " + (y_foot + arrow) // arrow
				 + " L " + (x2+foot_length*direction2) + " " + (y_foot) // toe
				 + " L " + (x2+foot_length*direction2 + arrow*direction2) + " " + (y_foot - arrow) // arrow
				 + " L " + (x2+foot_length*direction2) + " " + y_foot); // toe
			}

			_svg2.selectAll("path.bedpe_variants").data(variants_in_view).enter()
				.append("path")
					.attr("class",function(d) {if (d.highlight == true) {return "bedpe_variants highlight"} else {return "bedpe_variants"}})
					.attr("d",loop_path_generator)
					.style("stroke", "black") // function(d){return _scales.variant_color_scale(d.type)})
					.on('mouseover', function(d) {
						var text = d.name;
						if (d.type != undefined) {
							text = d.name + " (" + d.type + ")";
						}
						var x = (d.cum_pos1 + d.cum_pos2)/2;
						var y =  _positions.multiread.variants.y - _padding.text;
						show_tooltip(text,x,y,_svg2);
					})
					.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});
		}
	}
}

function draw_chunk_alignments() {

	if (_Chunk_alignments.length == 0) {
		return;
	}
	
	// // Focal region
	// if (_focal_region != undefined) {
	// 	_svg2.append("rect").attr("class","focal_region")
	// 	.attr("x",function(d) { return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(_focal_region.chrom,_focal_region.start)); })
	// 	.attr("y",_positions.multiread.ref_intervals.y)
	// 	.attr("width", function(d) {return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(_focal_region.chrom,_focal_region.end)) - _scales.chunk_ref_interval_scale(map_chunk_ref_interval(_focal_region.chrom,_focal_region.start));})
	// 	.attr("height", _positions.multiread.ref_intervals.height )
	// 	.attr("fill","none")
	// 	.style("stroke-width",5)
	// 	.style("stroke", "black");	
	// }
 
	if (_Additional_ref_intervals.length > 0) {
		for (var i in _Additional_ref_intervals) {
			var d = _Additional_ref_intervals[i];
			_Additional_ref_intervals[i].x_pos = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom,d.start));
			_Additional_ref_intervals[i].width = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom,d.end)) - _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom,d.start));
		}
		_svg2.selectAll("rect.focal_regions").data(_Additional_ref_intervals).enter()
			.append("rect").attr("class","focal_regions")
				.filter(function(d) { return isNaN(d.x_pos)===false && isNaN(d.width)===false; })
					.attr("x",function(d) { return d.x_pos })
					.attr("y",_positions.multiread.ref_intervals.y)
					.attr("width", function(d) {return d.width;})
					.attr("height", _positions.multiread.ref_intervals.height )
					.attr("fill","none")
					.style("stroke-width",4)
					.style("stroke", "black");	
		}


	var chunks = [];
	var counter = 0;
	for (var i in _Chunk_alignments) {
		if (_Chunk_alignments[i].alignments[0].read_length >= _settings.min_read_length  && _Chunk_alignments[i].alignments.length <= _settings.max_num_alignments && _Chunk_alignments[i].alignments.length >= _settings.min_num_alignments && _Chunk_alignments[i].max_mq >= _settings.region_min_mapping_quality) {
			var has_visible_alignments = false;
			for (var j in _Chunk_alignments[i].alignments) {
				if (_Refs_show_or_hide[_Chunk_alignments[i].alignments[j].r] == true) {
					has_visible_alignments = true;
					break;
				}
			}
			if (has_visible_alignments) {
				// Copy over all the read's features
				var this_chunk = {};
				for (var key in _Chunk_alignments[i]) {
					this_chunk[key] = _Chunk_alignments[i][key];
				}

				// Filter alignments for each chunk:
				var filtered_alignments = [];
				for (var a in _Chunk_alignments[i].alignments) {
					var d = _Chunk_alignments[i].alignments[a];
					if (_Refs_show_or_hide[d.r] && map_chunk_ref_interval(d.r, d.rs) != undefined) {
						filtered_alignments.push(d);
					}
				}
				this_chunk.unfiltered_alignments = this_chunk.alignments;
				this_chunk.alignments = filtered_alignments;
				chunks.push(this_chunk);
				chunks[counter].index = i; // to remember the data order even after sorting
				counter++;	
			}
		}
	}

	//////////////  SORT READS  //////////////
	if (_settings.feature_to_sort_reads == "num_alignments") {
		// sorting by alignment_length
		chunks.sort(function(a, b){return a.alignments.length-b.alignments.length});
	} else if (_settings.feature_to_sort_reads == "readname") {
		chunks.sort(function(a, b){return natural_sort(a.readname,b.readname)});
		// sorting by readname
	} else if (_settings.feature_to_sort_reads == "original") {
		chunks.sort(function(a, b){return a.index-b.index});
		// sorting by readname
	} else if (_settings.feature_to_sort_reads == "longest") {
		for (var i in chunks) {
			if (chunks[i].longest_ref_pos == undefined) {
				var longest = chunks[i].alignments[chunks[i].index_longest];
				if (longest == undefined) {
					longest = chunks[i].alignments[0];
				}
				chunks[i].longest_ref_pos = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(longest.r, longest.rs));
			}
		}
		chunks.sort(function(a, b){return a.longest_ref_pos-b.longest_ref_pos});
		// sorting by readname
	} else if (_settings.feature_to_sort_reads == "primary") {
		for (var i in chunks) {
			if (chunks[i].primary_ref_pos == undefined) {
				var primary = chunks[i].alignments[chunks[i].index_primary];
				if (primary == undefined) {
					primary = chunks[i].alignments[0];
				}
				chunks[i].primary_ref_pos = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(primary.r, primary.rs));
			}
		}
		chunks.sort(function(a, b){return a.primary_ref_pos-b.primary_ref_pos});
		// sorting by readname
	}


	//////////////  FLIP READS  //////////////
	var num_reads_to_show  = chunks.length;
	for (var i = 0; i < chunks.length; i++) {
		// Whether to flip orientation across all alignments of the read
		if (_settings.orient_reads_by == "primary") {
			chunks[i].flip = (chunks[i].unfiltered_alignments[chunks[i].index_primary].qe - chunks[i].unfiltered_alignments[chunks[i].index_primary].qs < 0);
		} else if (_settings.orient_reads_by == "longest") {
			chunks[i].flip = (chunks[i].unfiltered_alignments[chunks[i].index_longest].qe - chunks[i].unfiltered_alignments[chunks[i].index_longest].qs < 0);
		} else if (_settings.orient_reads_by == "reverse") {
			chunks[i].flip = true;
		} else {
			chunks[i].flip = false;
		}

		// Vertical position:
		chunks[i].read_y = _positions.multiread.reads.top_y + _positions.multiread.reads.height*(i+0.5)/num_reads_to_show;
	}

	//////////////  Draw rows  //////////////
	var alignment_groups = _svg2.selectAll("g.alignment_groups").data(chunks).enter()
		.append("g").attr("class","alignment_groups").attr("transform",function(d) {return "translate(" + 0 + "," + d.read_y + ")"})
		.on("click",function(d) { new_read_selected(d.index);});

	////////////  Draw alignments  //////////////
	if (_settings.show_indels_as == "none") {
		// Draw simple lines
		alignment_groups.selectAll("line.alignment").data(function(read_record){return read_record.alignments}).enter()
			.append("line")
				.attr("class","alignment")
				.attr("x1",function(d) { return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r, d.rs)); })
				.attr("x2",function(d) { return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r, d.re)); })
				.attr("y1",0)
				.attr("y2",0)
				.style("stroke",function(d) {
					if (d3.select(this.parentNode).datum().flip == false) {
						if (d.qs < d.qe) {return "blue"} else {return "red"}	
					} else {
						if (d.qs < d.qe) {return "red"} else {return "blue"}
					}
				})
				.on('mouseover', function(d) {
					var text = "select read";
					var x = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r, (d.rs+d.re)/2));
					var y = d3.select(this.parentNode).datum().read_y - _tooltip.height;
					show_tooltip(text,x,y,_svg2);
				})
				.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});
	} else {
		function chunk_alignment_path_generator(d) {
			var previous_x = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r,d.path[0].R));
			var previous_read_position = d.path[0].Q;
			
			var output = "M " + previous_x + " " + 0;

			for (var i = 1; i < d.path.length; i++) {
				var current_x = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r,d.path[i].R));
				var current_read_position = d.path[i].Q;
				if (current_read_position == previous_read_position) { // current_x == previous_x ||
					output += " M " + current_x + " " + 0;	
				} else {
					output += " L " + current_x + " " + 0;
				}
				previous_x = current_x;
				previous_read_position = current_read_position;
			}
			return output;
		}

		// Draw paths to allow indels
		alignment_groups.selectAll("path.alignment").data(function(read_record){return read_record.alignments}).enter()
			.append("path")
				.attr("class","alignment")
				.attr("d",chunk_alignment_path_generator)
				.style("stroke",function(d) {
					if (d3.select(this.parentNode).datum().flip == false) {
						if (d.qs < d.qe) {return "blue"} else {return "red"}	
					} else {
						if (d.qs < d.qe) {return "red"} else {return "blue"}
					}
				})
				.on('mouseover', function(d) {
					var text = "select read";
					var x = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r, (d.rs+d.re)/2));
					var y = d3.select(this.parentNode).datum().read_y - _tooltip.height;
					show_tooltip(text,x,y,_svg2);
				})
				.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});

		// Record all of the insertions and deletions from these alignments
		if (_settings.show_indels_as != "none" && _settings.show_indels_as != "gaps") {
			for (var i in chunks) {
				for (var j in chunks[i].alignments) {
					chunks[i].alignments[j].deletions = [];
					chunks[i].alignments[j].insertions = [];

					var path = chunks[i].alignments[j].path;
					var previous_ref_pos = path[0].R;
					var previous_read_pos = path[0].Q;
					for (var p = 1; p < path.length; p++) {
						var current_ref_pos = path[p].R;
						var current_read_pos = path[p].Q;
						if (current_read_pos == previous_read_pos && current_ref_pos != previous_ref_pos) {
							chunks[i].alignments[j].deletions.push({"R1":previous_ref_pos, "R2":current_ref_pos, "size":Math.abs(current_ref_pos - previous_ref_pos), "chrom":chunks[i].alignments[j].r});
						}
						if (current_ref_pos == previous_ref_pos && current_read_pos != previous_read_pos) {
							chunks[i].alignments[j].insertions.push({"R":current_ref_pos, "size":Math.abs(current_read_pos - previous_read_pos), "chrom":chunks[i].alignments[j].r});
						}
						previous_ref_pos = current_ref_pos;
						previous_read_pos = current_read_pos;
					}
				}
			}

			if (_settings.show_indels_as == "thin" || _settings.show_indels_as == "numbers") {
				var deletion_groups = alignment_groups.selectAll("g.alignment_deletions").data(function(read_record){return read_record.alignments}).enter()
					.append("g").attr("class","alignment_deletions")
						.selectAll("g.deletions").data(function(alignment) {return alignment.deletions}).enter()
							.append("g")
							.attr("class","deletions")
							.on('mouseover', function(d) {
								var text = d.size + "bp deletion";
								var x = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom, (d.R1+d.R2)/2));
								var y = d3.select(this.parentNode.parentNode).datum().read_y - _tooltip.height;
								show_tooltip(text,x,y,_svg2);
							})
							.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});

				deletion_groups.append("line")
					.attr("x1",function(d) {return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom, d.R1))})
					.attr("x2",function(d) {return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom, d.R2))})
					.attr("y1",0)
					.attr("y2",0)
					.style("stroke",function(d) {
						if (d3.select(this.parentNode).datum().flip == false) {
							if (d.qs < d.qe) {return "blue"} else {return "red"}	
						} else {
							if (d.qs < d.qe) {return "red"} else {return "blue"}
						}
					})
					.style("stroke-width",1)
					.style("stroke-opacity",0.5);




				var insertion_groups = alignment_groups.selectAll("g.alignment_insertions").data(function(read_record){return read_record.alignments}).enter()
					.append("g").attr("class","alignment_insertions")
						.selectAll("g.insertions").data(function(alignment) {return alignment.insertions}).enter()
							.append("g")
							.attr("class","insertions")
							.on('mouseover', function(d) {
								var text = d.size + "bp insertion";
								var x = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom, d.R));
								var y = d3.select(this.parentNode.parentNode).datum().read_y - _tooltip.height;
								show_tooltip(text,x,y,_svg2);
							})
							.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});

				insertion_groups.append("circle")
					.attr("cx",function(d) {return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom, d.R))})
					.attr("cy",0)
					.attr("r",function(d) {return Math.min(_layout.svg_height/40, _positions.multiread.reads.height/num_reads_to_show)*0.5})
					.style("fill",function(d) {
						if (d3.select(this.parentNode).datum().flip == false) {
							if (d.qs < d.qe) {return "blue"} else {return "red"}	
						} else {
							if (d.qs < d.qe) {return "red"} else {return "blue"}
						}
					})
					.style("stroke","black")
					.style("stroke-width",1);
					
				if (_settings.show_indels_as == "numbers") {
					
					var height = (_positions.multiread.reads.height/num_reads_to_show)*0.9; //_layout.svg_height/40;
					var width = height*4;

					deletion_groups.append("rect")
							.attr("width",width)
							.attr("x",function(d) {return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom, (d.R1+d.R2)/2)) - width/2})
							.attr("height",height)
							.attr("y",(-height/2))
							.attr("fill","white");
					deletion_groups.append("text")
						.text(function(d) {return d.size})
						.attr("x", function(d) {return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom, (d.R1+d.R2)/2))})
						.attr("y", 0)
						.style("font-size",height)
						.style('text-anchor',"middle").attr("dominant-baseline","middle");


					insertion_groups.append("rect")
							.attr("width",width)
							.attr("x",function(d) {return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom, d.R)) - width/2})
							.attr("height",height)
							.attr("y",(-height/2))
							.attr("fill","black");
					insertion_groups.append("text")
						.text(function(d) {return d.size})
						.attr("x", function(d) {return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.chrom, d.R))})
						.attr("y", 0)
						.style("fill","white")
						.style("font-size",height)
						.style('text-anchor',"middle").attr("dominant-baseline","middle");
				}
			}
		}
	}
}

function draw_region_view() {
	reset_svg2();
	draw_chunk_ref();
	adjust_multiread_layout();

	if (_Chunk_alignments.length > 0) {
		draw_chunk_ref_intervals();
		draw_chunk_alignments();
		draw_chunk_variants();
		draw_chunk_features();
	}
}

function clear_data() {
	_Alignments = [];
	_Chunk_alignments = [];
	_Whole_refs = [];
	_Ref_intervals = [];
	_Chunk_ref_intervals = [];
	_Ref_sizes_from_header = {};
}

function highlight_chromosome(chromosome) {
	
	if (_settings.single_chrom_highlighted == true) {
		show_all_chromosomes();
		apply_ref_filters();
		draw_region_view();
		if (_settings.ref_match_chunk_ref_intervals == true) {
			apply_ref_filters();
			select_read();
		}
		_settings.single_chrom_highlighted = false;
	} else {
		for (var chrom in _Refs_show_or_hide) {
			// console.log("hiding " + chrom);
			_Refs_show_or_hide[chrom] = false;
		}
		_Refs_show_or_hide[chromosome] = true;

		apply_ref_filters();
		draw_region_view();

		if (_settings.ref_match_chunk_ref_intervals == true) {
			select_read();
		}

		d3.select("#chrom_highlighted").html(chromosome);
		d3.select("#show_all_refs").style("display","inline");
		_settings.single_chrom_highlighted = true;
	}
}

function show_all_chromosomes() {
	for (var i in _Chunk_ref_intervals) {
		_Refs_show_or_hide[_Chunk_ref_intervals[i].chrom] = true;
	}
	for (var i in _Whole_refs) {
		_Refs_show_or_hide[_Whole_refs[i].chrom] = true;
	}
	d3.select("#chrom_highlighted").html("all");
	d3.select("#show_all_refs").style("display","none");
}

function apply_feature_filters() {
	for (var f in _Features) {
		if (_settings.feature_types_to_show[_Features[f].type] === true) {
			_Features[f].show = true;
		} else {
			_Features[f].show = false;
		}
	}
}

function apply_ref_filters() {
	var interval_cumulative_position = 0;
	for (var i in _Chunk_ref_intervals) {
		if (_Refs_show_or_hide[_Chunk_ref_intervals[i].chrom] == true) {
			if (_Chunk_ref_intervals[i].num_alignments >= _settings.min_aligns_for_ref_interval) {
				_Chunk_ref_intervals[i].cum_pos = interval_cumulative_position;
				interval_cumulative_position += _Chunk_ref_intervals[i].size;
			} else {
				_Chunk_ref_intervals[i].cum_pos = -1;
			}
		} else {
			_Chunk_ref_intervals[i].cum_pos = -1;
		}
	}
	var whole_cumulative_position = 0;
	for (var i in _Whole_refs) {
		if (_Refs_show_or_hide[_Whole_refs[i].chrom] == true) {
			_Whole_refs[i].filtered_cum_pos = whole_cumulative_position;
			whole_cumulative_position += _Whole_refs[i].size;
		}
	}

	_scales.chunk_ref_interval_scale.domain([0,interval_cumulative_position]);
	_scales.chunk_whole_ref_scale.domain([0,whole_cumulative_position]);

	var chromosomes = d3.keys(_Refs_show_or_hide);
	chromosomes.sort(function(a, b){return a.length-b.length});

	var chrom_livesearch = d3.livesearch().max_suggestions_to_show(5).search_list(chromosomes).selection_function(search_select_chrom).placeholder(chromosomes[0]);
	d3.select("#chrom_livesearch").call(chrom_livesearch);

}

function chunk_changed() {

	// Show results only if there is anything to show
	if (_Chunk_alignments.length > 0) {

		all_read_analysis(); // calculates features of each alignment and adds these variables to _Chunk_alignments
		
		organize_references_for_chunk();

		show_all_chromosomes();
		apply_ref_filters();

		d3.select("#variant_input_panel").style("display","block");
		d3.select("#feature_input_panel").style("display","block");

		draw_region_view();
		
		new_read_selected(0);

		var readname_livesearch = d3.livesearch().max_suggestions_to_show(5).search_list(_Chunk_alignments).search_key("readname").selection_function(search_select_read).placeholder(_Chunk_alignments[0].readname);
		d3.select("#readname_livesearch").call(readname_livesearch); 

	} else {
		_Alignments = [];
		_Chunk_ref_intervals = [];
		draw_region_view();
		user_message("","");
	}
	
	refresh_visibility();

}

function sam_input_changed(sam_input_value) {
		_settings.current_input_type = "sam";
		// Check match refs from region view checkbox by default
		_settings.ref_match_chunk_ref_intervals = true;
		d3.select("#ref_match_region_view").property("checked",true);
		refresh_ui_for_new_dataset();
		reset_settings_for_new_dataset();
		
		clear_data();
		clear_coords_input();
		remove_coords_file();
		remove_bam_file();

		var input_text = sam_input_value.split("\n");
		_Ref_sizes_from_header = {};
		_Chunk_alignments = [];
		var unique_readnames = {};
		// _settings.min_indel_size = _static.min_indel_size_for_region_view;

		for (var i = 0; i < input_text.length; i++) {
			var columns = input_text[i].split(/\s+/);
			if (columns[0][0] == "@") {
				if (columns[0].substr(0,3) == "@SQ") {
					_Ref_sizes_from_header[columns[1].split(":")[columns[1].split(":").length-1]] = parseInt(columns[2].split(":")[columns[2].split(":").length-1]);	
				}
			} else if (columns.length >= 3) {
				if (columns.length >= 6) {
					var parsed_line = parse_sam_coordinates(input_text[i]);
					if (parsed_line != undefined) {
						if (unique_readnames[parsed_line.readname] == undefined || _settings.keep_duplicate_reads) {
							_Chunk_alignments.push(parsed_line);
							unique_readnames[parsed_line.readname] = true;
						}
					}
				} else {
					user_message("Error","Lines from a sam file must have at least 6 columns, and must contain SA tags in order to show secondary/supplementary alignments.");
					return;
				}
			}
		}

		_focal_region = undefined;
		
		refresh_visibility();
		chunk_changed();
		d3.select("#text_region_output").html("Showing sam input");
	
}

$('#sam_input').bind('input propertychange', function() {
	_settings.alignment_info_text = "Sam from text field";
	set_alignment_info_text(); 
	sam_input_changed(this.value)
});

d3.select("#sam_info_icon").on("click", function() {
	user_message("Instructions","Create a sam file using an aligner such as BWA. Upload it here if it a small file (less than 10MB) or paste a few lines from the sam file into the text box. For larger files, load it as a bam file instead.");
});


d3.select("#bam_info_icon").on("click", function() {
	user_message("Instructions","Create a bam file using an aligner such as BWA. If you get a sam file convert it to a bam file: <pre>samtools view -bS my_file.sam > my_file.bam</pre>Next sort the bam file:<pre>samtools sort my_file.bam my_file.sorted</pre>Then index the sorted bam file: <pre>samtools index my_file.sorted.bam</pre>Finally, select the my_file.sorted.bam and the my_file.sorted.bam.bai files. The bam file is not uploaded, but is read locally on your computer using the .bai file as the index. (This is secure because a site can only access the files you chose.)");
});


d3.select("#coords_info_icon").on("click", function() {
	user_message("Instructions","The coordinates must be the same as MUMmer's show-coords -lTH. This means 11 tab-separated columns without a header: <ol><li>Ref start</li><li>Ref end</li><li>Query start</li><li>Query end</li><li>Ref alignment length</li><li>Query alignment length</li><li>Percent Identity</li><li>Total reference length</li><li>Total query length</li><li>Reference name(chromosome)</li><li>Query_name</li></ol>");
});


d3.selectAll(".bed_info_icon").on("click", function() {
	user_message("Instructions","Paste or upload a bed file of variants or other features to look at. <p> Columns: </p><ol><li>chromosome (reference) </li><li>start position (reference)</li><li>end position (reference)</li><li>name (optional)</li><li>score (optional)</li><li>strand (optional)</li><li>type/category (optional)</li></ol> All optional fields can be used for filtering or showing tooltips with information, but only the first 3 columns are required for basic functionality.");
});


d3.selectAll(".vcf_info_icon").on("click", function() {
	user_message("Instructions","Paste or upload a vcf file of variants to look at. <p> Requirements: columns: </p><ol><li>chromosome (reference) </li><li> position (reference)</li><li>ID (optional)</li></ol> The 8th column may contain optional information including STRAND (+/-), TYPE or SVTYPE, and END (the end position where the 2nd column is the start). All optional fields can be used for filtering or showing tooltips with information, but only the first 2 columns are required for basic functionality.");
});



function parse_coords_columns(columns) {
	//     [S1]     [E1]  |     [S2]     [E2]  |  [LEN 1]  [LEN 2]  |  [% IDY]  |  [LEN R]  [LEN Q]  | [TAGS]
	// ==========================================================================================================
	// 38231172 38246777  | 242528828 242513174  |    15606    15655  |    97.69  | 133797422 249250621  | chr10       1

	var alignment = {
		r: columns[9],
		rs: parseInt(columns[0]),
		re: parseInt(columns[1]),
		qs: parseInt(columns[2]),
		qe: parseInt(columns[3]),
		mq: parseFloat(columns[6]),
		read_length: parseInt(columns[8]),
		max_indel: null // no indel in coordinates, disable the indel options upon null

	}
	alignment.aligned_length = Math.abs(alignment.re - alignment.rs);

	alignment.path = [];
	alignment.path.push({"R":alignment.rs, "Q":alignment.qs});
	alignment.path.push({"R":alignment.re, "Q":alignment.qe});

	return alignment;
}


function coords_input_changed(coords_input_value) {
	_settings.current_input_type = "coords";

	// Uncheck match refs from region view checkbox by default
	_settings.ref_match_chunk_ref_intervals = false;
	d3.select("#ref_match_region_view").property("checked",false);
	refresh_ui_for_new_dataset();
	reset_settings_for_new_dataset();

	clear_data();
	clear_sam_input();
	remove_bam_file();

	var input_text = coords_input_value.split("\n");
	_Ref_sizes_from_header = {};
	// _settings.min_indel_size = -1;

	var alignments_by_query = {};

	for (var i = 0; i < input_text.length; i++) {
		var columns = input_text[i].split(/\s+/);

		//     [S1]     [E1]  |     [S2]     [E2]  |  [LEN 1]  [LEN 2]  |  [% IDY]  |  [LEN R]  [LEN Q]  | [TAGS]
		// ==========================================================================================================
		// 38231172 38246777  | 242528828 242513174  |    15606    15655  |    97.69  | 133797422 249250621  | chr10       1

		if (columns.length == 11) {
			var readname = columns[10];
			if (alignments_by_query[readname] == undefined) {
				alignments_by_query[readname] = [];
			}
			alignments_by_query[readname].push(parse_coords_columns(columns));
			_Ref_sizes_from_header[columns[9]] = parseInt(columns[7]);
		} else if (columns.length < 3) {
			continue;
		} else if (columns.length != 11) {
			user_message("Error","The coordinates must be the same as MUMmer's show-coords -lTH. This means 11 tab-separated columns without a header: <ol><li>Ref start</li><li>Ref end</li><li>Query start</li><li>Query end</li><li>Ref alignment length</li><li>Query alignment length</li><li>Percent Identity</li><li>Total reference length</li><li>Total query length</li><li>Reference name(chromosome)</li><li>Query_name</li></ol>");
			refresh_visibility();
			return;
		}
	}

	_Chunk_alignments = [];
	for (var readname in alignments_by_query) {
		_Chunk_alignments.push({
			"alignments": alignments_by_query[readname],
			"raw_type":"coords",
			"readname":readname
		});
	}


	_focal_region = undefined;
	
	refresh_visibility();
	chunk_changed();
	d3.select("#text_region_output").html("Showing coordinate input");
}


$('#coords_input').bind('input propertychange', function() {remove_coords_file(); coords_input_changed(this.value)});


function calculate_type_colors(variant_list) {
	var variant_types = {};
	for (var i in variant_list) {
		if (variant_types[variant_list[i].type] == undefined) {
			variant_types[variant_list[i].type] = 1;
		} else {
			variant_types[variant_list[i].type]++;
		}
	}
	var other_colors_index = 0;
	var colors_for_variants = [];
	var variant_names = [];
	for (var type in variant_types) {
		variant_names.push(type);
		if (type.toUpperCase().indexOf("DEL") != -1 || type.toUpperCase().indexOf("PROTEIN") != -1) {
			colors_for_variants.push("blue");
		} else if (type.toUpperCase().indexOf("INS") != -1 || type.toUpperCase().indexOf("RNA") != -1) {
			colors_for_variants.push("red");
		} else if (type.toUpperCase().indexOf("INV") != -1 || type.toUpperCase().indexOf("PSEUDO") != -1) {
			colors_for_variants.push("orange");
		} else if (type.toUpperCase().indexOf("TRA") != -1) {
			colors_for_variants.push("black");	
		} else if (type.toUpperCase().indexOf("BND") != -1) {
			colors_for_variants.push("black");	
		} else if (type.toUpperCase().indexOf("DUP") != -1) {
			colors_for_variants.push("green");
		} else if (variant_types[type] > 1) {
			colors_for_variants.push(_static.color_collections[2][other_colors_index])
			other_colors_index++;
		} else {
			colors_for_variants.push("#eeeeee");
		}
	}
	return {"names":variant_names, "colors":colors_for_variants};
}

// function feature_row_click(d) {
// 	d3.select("#text_region_output").html("Selected variant: "  + d.name + " (" + d.type + ") at " + d.chrom + ":" + d.start + "-" + d.end);
// 	// Mark variant as selected:
// 	for (var i in _Features) {
// 		_Features[i].highlight = (_Features[i].name == d.name);
// 	}
// 	var query_start = (d.start+d.end)/2;
// 	var query_end = (d.start+d.end)/2+1;
// 	_Additional_ref_intervals = [{"chrom":d.chrom,"start":query_start,"end":query_end}];
// 	go_to_region(d.chrom,query_start,query_end);
// }


function variant_row_click(d) {
	_Additional_ref_intervals = [{"chrom":d.chrom,"start":d.start,"end":d.end}];
	d3.select("#text_region_output").html("Selected variant: "  + d.name + " (" + d.type + ") at " + d.chrom + ":" + d.start + "-" + d.end);
	// Mark variant as selected:
	for (var i in _Variants) {
		_Variants[i].highlight = (_Variants[i].name == d.name);
	}
	go_to_region(d.chrom,(d.start+d.end)/2,(d.start+d.end)/2+1);
}

function check_bam_done_fetching() {
	if (_loading_bam_right_now == true) {
		return false;
	} else {
		return true;
	}
}

function show_feature_table() {
	d3.select("#feature_table_panel").style("display","block");
	
	d3.select("#feature_table_landing").call(
		d3.superTable()
			.table_data(_Features)
			.num_rows_to_show(15)
			.show_advanced_filters(true)
	);
	d3.select(".d3-superTable-table").selectAll("input").on("focus",function() {
		user_message("Instructions","Filter table on each column by typing for instance =17 to get all rows where that column is 17, you can also do >9000 or <9000. You can also apply multiple filters in the same column, just separate them with spaces.");
	});
}
function show_variant_table() {
	d3.select("#variant_table_panel").style("display","block");
	
	d3.select("#variant_table_landing").call(
		d3.superTable()
			.table_data(_Variants)
			.num_rows_to_show(15)
			.show_advanced_filters(true)
			.click_function(variant_row_click)
			.check_ready_function(check_bam_done_fetching)
	);
	d3.select(".d3-superTable-table").selectAll("input").on("focus",function() {
		user_message("Instructions","Filter table on each column by typing for instance =17 to get all rows where that column is 17, you can also do >9000 or <9000. You can also apply multiple filters in the same column, just separate them with spaces.");
	});

}
function bedpe_row_click(d) {
	console.log("go to regions:", d.chrom1 , ":",  d.pos1, " and ",  d.chrom2, ":", d.pos2);
	var regions = [];
	regions.push({"chrom":d.chrom1,"pos":d.pos1});
	regions.push({"chrom":d.chrom2,"pos":d.pos2});
	fetch_regions(regions);
	_Additional_ref_intervals = [
		{"chrom":d.chrom1,"start":d.pos1,"end":d.pos1+1},
		{"chrom":d.chrom2,"start":d.pos2,"end":d.pos2+1}
	];

	d3.select("#text_region_output").html("Selected bedpe variant: "  + d.name + " (" + d.type + ") at " + d.chrom1 + ":" + d.pos1 + " and " +  d.chrom2 + ":" + d.pos2);

	// Mark variant as selected:
	for (var i in _Bedpe) {
		_Bedpe[i].highlight = (_Bedpe[i].name == d.name);
	}

}

function show_bedpe_table() {
	d3.select("#bedpe_table_panel").style("display","block");
	
	d3.select("#bedpe_table_landing").call(
		d3.superTable()
			.table_data(_Bedpe)
			.num_rows_to_show(15)
			.show_advanced_filters(true)
			.click_function(bedpe_row_click)
			.check_ready_function(check_bam_done_fetching)
	);
	d3.select(".d3-superTable-table").selectAll("input").on("focus",function() {
		user_message("Instructions","Filter table on each column by typing for instance =17 to get all rows where that column is 17, you can also do >9000 or <9000. Separate multiple filters in the same column with spaces.");
	});
}

function bed_input_changed(bed_input) {
	var input_text = bed_input.split("\n");
	
	_Variants = [];
	for (var i in input_text) {
		var columns = input_text[i].split(/\s+/);
		if (columns.length>2) {
			var start = parseInt(columns[1]);
			var end = parseInt(columns[2]);
			var score = parseFloat(columns[4]);
			if (isNaN(score)) {
				score = 0;
			}
			if (isNaN(start) || isNaN(end)) {
				user_message("Error","Bed file must contain numbers in columns 2 and 3. Found: <pre>" + columns[1] + " and " + columns[2] + "</pre>.");
				return;
			}
			_Variants.push({"chrom":columns[0],"start":start, "end":end, "size": end - start, "name":columns[3] || "", "score":score ,"strand":columns[5],"type":columns[6] || ""});
		}
	}

	user_message("Info","Loaded " + _Variants.length + " bed entries");
	
	clear_vcf_input();
	update_variants();
	draw_region_view();
	refresh_ui_elements();
}

function bedpe_input_changed(bedpe_input) {
	var input_text = bedpe_input.split("\n");
	// chrom1, start1, stop1, chrom2, start2, stop2, name, score, strand1, strand2, type
	
	_Bedpe = [];
	for (var i in input_text) {
		var columns = input_text[i].split(/\s+/);
		if (columns.length>2) {
			var chrom1 = columns[0];
			var start1 = parseInt(columns[1]);
			var end1 = parseInt(columns[2]);
			var chrom2 = columns[3];
			var start2 = parseInt(columns[4]);
			var end2 = parseInt(columns[5]);
			var name = columns[6];
			var score = parseFloat(columns[7]);
			var strand1 = columns[8];
			var strand2 = columns[9];
			var type = columns[10];
			// if (isNaN(score)) {
			// 	score = 0;
			// }
			if (isNaN(start1) || isNaN(end1)) {
				user_message("Error","Bedpe file must contain numbers in columns 2,3,5, and 6. Found: <pre>" + columns[1] + ", " + columns[2] + ", " +  columns[4] + ", and " + columns[5] + "</pre>.");
				return;
			}
			var pos1 = parseInt((start1+end1)/2);
			var pos2 = parseInt((start2+end2)/2);
			var size = Infinity;
			if (chrom1 == chrom2) {
				size = Math.abs(pos1-pos2);
			}
			_Bedpe.push({"name": name, "score": score, "type": type, "size": size, "chrom1": chrom1, "pos1":pos1,"strand1": strand1,"chrom2": chrom2, "pos2":pos2, "strand2": strand2});
		}
	}

	user_message("Info","Loaded " + _Bedpe.length + " bedpe entries");
	
	update_bedpe();
	draw_region_view();
	refresh_ui_elements();
}

function update_variants() {
	var color_calculations = calculate_type_colors(_Variants);
	_scales.variant_color_scale.domain(color_calculations.names).range(color_calculations.colors);
	show_variant_table();
}

function update_bedpe() {
	var color_calculations = calculate_type_colors(_Bedpe);
	_scales.variant_color_scale.domain(color_calculations.names).range(color_calculations.colors);
	show_bedpe_table();
}


function update_features() {
	var color_calculations = calculate_type_colors(_Features);
	_scales.feature_color_scale.domain(color_calculations.names).range(color_calculations.colors);
	show_feature_table();
}


$('#bed_input').bind('input propertychange', function() {remove_variant_file(); bed_input_changed(this.value)});


function vcf_input_changed(vcf_input) {
	var input_text = vcf_input.split("\n");
	
	_Variants = [];
	var ID_counter = 1;
	for (var i in input_text) {
		if (input_text[i][0] != "#") {
			var columns = input_text[i].split(/\s+/);
			if (columns.length>=3) {
				var start = parseInt(columns[1]);
				var end = start;
				var type = "";
				var strand = "";
				var score = parseFloat(columns[4]);
				var name = columns[2];
				if (name == ".") {
					name = "#" + ID_counter;
					ID_counter++;
				}
				if (isNaN(score)) {
					score = 0;
				}
				if (isNaN(start) || isNaN(end)) {
					user_message("Error","VCF file must contain a number in column 2. Found: <pre>" + columns[1] + "</pre>.");
					return;
				}
				if (columns[7] != undefined) {
					var info_fields = columns[7].split(";");
					for (var field in info_fields) {
						var info = info_fields[field].split("=");
						if (info.length == 2) {
							if (info[0] == "END") {
								end = parseInt(info[1]);
							} else if (info[0] == "TYPE" || info[0] == "SVTYPE") {
								type = info[1];
							} else if (info[0] == "STRAND") {
								strand = info[1];
							}
						}
					}
				}
				if (type == "") {
					type = columns[4];
				}
				_Variants.push({"chrom":columns[0],"start":start, "end":end, "size": end - start, "name":name, "score":score,"strand":strand,"type":type});
			}
		}
	}

	user_message("Info","Loaded " + _Variants.length + " vcf entries");
	clear_bed_input();
	update_variants();
	draw_region_view();
	refresh_ui_elements();
}


$('#vcf_input').bind('input propertychange', function() {remove_variant_file(); vcf_input_changed(this.value)});

function remove_variant_file() {
	// For when sam input or coords text input changes, clear bam file to prevent confusion and enable switching back to the bam file
	d3.select('#variant_file').property("value","");
}


function run() {
	responsive_sizing();
	refresh_visibility();
	user_message("Instructions","Start by loading alignments below");
}

function dict_length(dictionary) {
	var num = 0;
	for (var k in dictionary) {num++;}
	return num;
}

function all_read_analysis() {
	
	var overall_max_mq = 0;
	var overall_min_mq = 100000000;
	var overall_max_num_alignments = 0;
	var max_readlength = 0;

	for (var j in _Chunk_alignments) {
		var read_record = _Chunk_alignments[j];
		_Chunk_alignments[j].index = j;
		// var all_chrs = {};
		var max_mq = 0;
		var min_mq = 10000000;
		if (read_record.alignments[0].read_length > max_readlength) {
			max_readlength = read_record.alignments[0].read_length;
		}

		// var min_mq = 100000;
		var index_longest = 0;
		for (var i in read_record.alignments) {
			if (read_record.alignments[i].mq > max_mq) {
				max_mq = read_record.alignments[i].mq;
			}
			if (read_record.alignments[i].mq < min_mq) {
				min_mq = read_record.alignments[i].mq;
			}

			if (read_record.alignments[i].aligned_length > read_record.alignments[index_longest].aligned_length) {
				index_longest = i;
			}
			// all_chrs[read_record.alignments[i].r] = true;
		}
		_Chunk_alignments[j].index_longest = index_longest;

		_Chunk_alignments[j].max_mq = max_mq;
		if (max_mq > overall_max_mq) {
			overall_max_mq = max_mq;
		}
		if (min_mq < overall_min_mq) {
			overall_min_mq = min_mq;
		}

		if (_Chunk_alignments[j].alignments.length > overall_max_num_alignments) {
			overall_max_num_alignments = _Chunk_alignments[j].alignments.length;
		}

		_Chunk_alignments[j].index_primary = _Chunk_alignments[j].alignments.length - 1; // for sam and bam we put in the SA tags and then added the main alignment at the end

	}

	_ui_properties.region_mq_slider_max = overall_max_mq; 
	_ui_properties.region_mq_slider_min = overall_min_mq; 
	_ui_properties.num_alignments_slider_max = overall_max_num_alignments; 
	_ui_properties.read_length_slider_max = max_readlength;


	_settings.max_num_alignments = overall_max_num_alignments;
	_settings.min_num_alignments = 1;
	_settings.region_min_mapping_quality = overall_min_mq;
	_settings.min_mapping_quality = overall_min_mq;
	// _settings.min_indel_size = _static.min_indel_size_for_region_view;
	_settings.min_align_length = 0;
	// _settings.min_aligns_for_ref_interval = 0;
	_settings.min_read_length = 0;
}

function feature_type_checkbox(d) {
	_settings.feature_types_to_show[d.type] = d3.event.target.checked;
	apply_feature_filters();
	draw_region_view();
	draw();
}
function make_feature_type_table() {
	d3.select("#feature_filter_tab").style("display","inline");

	var type_counts = {};
	_settings.feature_types_to_show = {};

	for (var i in _Features) {
		if (type_counts[_Features[i].type] == undefined) {
			type_counts[_Features[i].type] = 1;
			_settings.feature_types_to_show[_Features[i].type] = false;
		} else {
			type_counts[_Features[i].type]++;
		}
	}
	
	// Put into list so we can sort it
	var data_for_table = [];
	for (var type in type_counts) {
		data_for_table.push({"type":type,"count":type_counts[type]})
	}
	data_for_table.sort(function(a, b){return b.count-a.count});

	var header = ["type","count","show"];
	d3.select("#feature_type_table").html("");
	d3.select("#feature_type_table").append("tr").selectAll("th").data(header).enter().append("th").html(function(d) {return d});
	var rows = d3.select("#feature_type_table").selectAll("tr.data").data(data_for_table).enter().append("tr").attr("class","data");
	rows.append("td").html(function(d) {return d.type});
	rows.append("td").html(function(d) {return d.count});
	rows.append("td").append("input").property("type","checkbox").property("checked",false).on("change",feature_type_checkbox);
}


function create_dropdowns() {
	d3.select("select#read_orientation_dropdown").selectAll("option").data(_static.read_orientation_options).enter()
		.append("option")
			.text(function(d){return d.description})
			.property("value",function(d){return d.id})
			.property("selected", function(d) {return d.id === _settings.orient_reads_by});

	d3.select("select#read_orientation_dropdown").on("change",function(d) {
		_settings.orient_reads_by = this.options[this.selectedIndex].value;
		draw_region_view();
		draw();
	});

	d3.select("select#read_sorting_dropdown").selectAll("option").data(_static.read_sort_options).enter()
		.append("option")
			.text(function(d){return d.description})
			.property("value",function(d){return d.id})
			.property("selected", function(d) {return d.id === _settings.feature_to_sort_reads});

	d3.select("select#read_sorting_dropdown").on("change",function(d) {
		_settings.feature_to_sort_reads = this.options[this.selectedIndex].value;
		draw_region_view();
	});


	d3.select("select#color_scheme_dropdown").selectAll("option").data(_static.color_schemes).enter()
		.append("option")
			.text(function(d){return d.name})
			.property("value",function(d){return d.colors});

	d3.select("select#color_scheme_dropdown").on("change",function(d) {
		_settings.color_index = this.options[this.selectedIndex].value;
		_scales.ref_color_scale.range(_static.color_collections[_settings.color_index]);
		draw_region_view();
		draw();
	});

	d3.select("select#show_indels_as_dropdown").selectAll("option").data(_static.show_indels_as_options).enter()
		.append("option")
			.text(function(d){return d.description})
			.property("value",function(d){return d.id})
			.property("selected", function(d) {return d.id === _settings.show_indels_as});

	d3.select("select#show_indels_as_dropdown").on("change",function(d) {
		_settings.show_indels_as = this.options[this.selectedIndex].value;
		draw_region_view();
	});

	d3.select("select#show_features_as_dropdown").selectAll("option").data(_static.show_features_as_options).enter()
		.append("option")
			.text(function(d){return d.description})
			.property("value",function(d){return d.id})
			.property("selected", function(d) {return d.id === _settings.show_features_as});

	d3.select("select#show_features_as_dropdown").on("change",function(d) {
		_settings.show_features_as = this.options[this.selectedIndex].value;
		draw_region_view();
		draw();
	});
}

function reset_settings_for_new_dataset() {
	if (_settings.current_input_type == "coords") {
		_settings.orient_reads_by = "longest";
		_settings.show_indels_as = "none";
	} else if (_settings.current_input_type == "sam" || _settings.current_input_type == "bam") {
		_settings.orient_reads_by = "primary";
		_settings.show_indels_as = "thin";
	}
}

function refresh_ui_for_new_dataset() {
	
	if (_settings.current_input_type == "coords") {
		$("#min_mq_title").html("Minimum % identity: ");
		$('#mq_slider').slider("option","step", 0.01);
		$("#region_min_mq_title").html("Minimum % identity of best alignment:");
		$('#region_mq_slider').slider("option","step", 0.01);

		d3.selectAll(".hide_for_coords").style("color","#dddddd");
		// Disable indel size slider
		$("#indel_size_slider").slider("option","disabled",true);

		// Disable header refs only checkbox
		$("#only_header_refs_checkbox").attr("disabled",true);

		$("#show_indels_as_dropdown").attr("disabled",true);
		
	} else if (_settings.current_input_type == "sam" || _settings.current_input_type == "bam") {
		$("#min_mq_title").html("Minimum mapping quality: ");
		$('#mq_slider').slider("option","step", 1);
		$("#region_min_mq_title").html("Minimum mapping quality of best alignment:");
		$('#region_mq_slider').slider("option","step", 1);
		
		d3.selectAll(".hide_for_coords").style("color","black");
		// Enable indel size slider
		$("#indel_size_slider").slider("option","disabled",false);

		// Enable header refs only checkbox
		$("#only_header_refs_checkbox").attr("disabled",false);
		$("#show_indels_as_dropdown").attr("disabled",false);	
	}
	
	create_dropdowns();
}

function refresh_ui_elements() {

	if (_Variants.length > 0 || _Bedpe.length > 0) {
		d3.selectAll(".when_variants_only").style("color","black");
		$("#show_only_selected_variants").attr("disabled",false);
	} else {
		d3.selectAll(".when_variants_only").style("color","#dddddd");
		$("#show_only_selected_variants").attr("disabled",true);
	}
	if (_Features.length > 0) {
		d3.selectAll(".when_features_only").style("color","black");
		$("#show_features_as_dropdown").attr("disabled",false);
	} else {
		d3.selectAll(".when_features_only").style("color","#dddddd");
		$("#show_features_as_dropdown").attr("disabled",true);
	}

	// Mapping quality in region view
	$('#region_mq_slider').slider("option","max", _ui_properties.region_mq_slider_max);
	$('#region_mq_slider').slider("option","min", _ui_properties.region_mq_slider_min);
	$('#region_mq_slider').slider("option","value", _settings.region_min_mapping_quality);
	$("#region_mq_label").html(_settings.region_min_mapping_quality);

	$('#max_ref_length_slider').slider("option","max", _ui_properties.ref_length_slider_max);
	$('#max_ref_length_slider').slider("option","value", _settings.max_ref_length);
	d3.select("#max_ref_length_input").property("value",_settings.max_ref_length);

	
	$('#min_read_length_slider').slider("option","max", _ui_properties.read_length_slider_max);
	$('#min_read_length_slider').slider("option","value", _settings.min_read_length);
	d3.select("#min_read_length_input").property("value", _settings.min_read_length);

	// Number of alignments in region view
	$( "#num_aligns_range_slider" ).slider("option","max",_ui_properties.num_alignments_slider_max);
	$( "#num_aligns_range_slider" ).slider("values",0,_settings.min_num_alignments);
	$( "#num_aligns_range_slider" ).slider("values",1,_settings.max_num_alignments);
	$( "#num_aligns_range_label" ).html( "" + _settings.min_num_alignments + " - " + _settings.max_num_alignments );


	// Mapping quality in read detail view
	$('#mq_slider').slider("option","max", _ui_properties.mq_slider_max);
	$('#mq_slider').slider("option","min", _ui_properties.region_mq_slider_min);
	$('#mq_slider').slider("option","value", _settings.min_mapping_quality);
	$("#mq_label").html(_settings.min_mapping_quality);


	// Indel size in read detail view
	$('#indel_size_slider').slider("option","max", _ui_properties.indel_size_slider_max+1);
	$('#indel_size_slider').slider("option","value", _settings.min_indel_size);
	$("#indel_size_label").html(_settings.min_indel_size);

	// Alignment length in read detail view
	$('#align_length_slider').slider("option","max", _ui_properties.align_length_slider_max);
	$('#align_length_slider').slider("option","value", _settings.min_align_length);
	$("#align_length_label").html(_settings.min_align_length);

	// Minimum alignments for each reference interval
	$('#min_aligns_for_ref_interval_slider').slider("option","value", _settings.min_aligns_for_ref_interval);
	$('#min_aligns_for_ref_interval_label').html(_settings.min_aligns_for_ref_interval);

	// Dot plot vs. Ribbon plot
	if (_settings.ribbon_vs_dotplot == "ribbon") {
		d3.selectAll(".ribbon_settings").style("display","table-row");
		d3.selectAll(".dotplot_settings").style("display","none");
		d3.select("#select_ribbon").property("checked",true);
		d3.select("#select_dotplot").property("checked",false);
	} else {
		d3.selectAll(".dotplot_settings").style("display","table-row");
		d3.selectAll(".ribbon_settings").style("display","none");
		d3.select("#select_dotplot").property("checked",true);
		d3.select("#select_ribbon").property("checked",false);
	}

	// All checkboxes
	d3.select("#ref_match_region_view").property("checked", _settings.ref_match_chunk_ref_intervals);
	d3.select('#colors_checkbox').property("checked", _settings.colorful);
	d3.select('#show_only_selected_variants').property("checked", _settings.show_only_selected_variants);
	d3.select('#highlight_selected_read').property("checked", _settings.highlight_selected_read);
	d3.select('#outline_checkbox').property("checked", _settings.ribbon_outline);

	// All dropdowns
	d3.select("select#read_orientation_dropdown").selectAll("option").property("selected", function(d) {return d.id === _settings.orient_reads_by});
	d3.select("select#read_sorting_dropdown").selectAll("option").property("selected", function(d) {return d.id === _settings.feature_to_sort_reads});
	d3.select("select#color_scheme_dropdown").selectAll("option").property("selected",function(d){return d.id === _settings.color_index});
	d3.select("select#show_indels_as_dropdown").selectAll("option").property("selected", function(d) {return d.id === _settings.show_indels_as});
	d3.select("select#show_features_as_dropdown").selectAll("option").property("selected", function(d) {return d.id === _settings.show_features_as});

}

function parse_cigar(cigar_string) {
	// console.log(cigar_string);
	var cigar_regex = /(\d+)(\D)/;
	var parsed = cigar_string.split(cigar_regex);
	if (parsed.length < 2) {
		user_message("Error","This doesn't look like a SAM/BAM file. The 6th column must be a valid cigar string.");
		console.log("Failed cigar string:", cigar_string);
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

		if (message_type == "Permalink") {
			d3.select("#user_message").html('<strong>'+ message_type + ': </strong><a href="' + message + '" target="_blank">' + message + '</a> <p>Permalinks recreate the current view with all the data and settings except that it only takes the current snapshot of a bam file instead of copying the whole thing.<p>').attr("class","alert alert-success");
		} else {
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
				case "Instructions":
					message_style="success";
					break;
				default:
					message_style="info";
			}
			d3.select("#user_message").html("<strong>"+ message_type + ": </strong>" + message).attr("class","alert alert-" + message_style);
		}
	}
}

function cigar_coords(cigar) {
	// cigar must already be parsed using parse_cigar()

	var coords = {};
	coords.read_alignment_length = 0;
	coords.ref_alignment_length = 0;
	
	coords.front_padding_length = 0; // captures S/H clipping at the beginning of the cigar string (what the ref considers the start location)
	coords.end_padding_length = 0; // captures S/H clipping at the end of the cigar string (what the ref considers the end location)

	var no_matches_yet = true;
	for (var i = 0; i < cigar.length; i++) {
		var num = cigar[i].num;
		switch (cigar[i].type) {
			case "H":
				if (no_matches_yet) {
					coords.front_padding_length += num;
				} else {
					coords.end_padding_length += num;
				}
				break;
			case "S":
				if (no_matches_yet) {
					coords.front_padding_length += num;
				} else {
					coords.end_padding_length += num;
				}
				break;
			case "M":
				no_matches_yet = false;
				coords.read_alignment_length += num;
				coords.ref_alignment_length += num;
				break;
			case "=":
				no_matches_yet = false;
				coords.read_alignment_length += num;
				coords.ref_alignment_length += num;
				break;
			case "X":
				no_matches_yet = false;
				coords.read_alignment_length += num;
				coords.ref_alignment_length += num;
				break;
			case "I":
				no_matches_yet = false;
				coords.read_alignment_length += num;
				break;
			case "D":
				no_matches_yet = false;
				coords.ref_alignment_length += num;
				break;
			case "N": // "Skipped region from the reference" -- sam format specification
				no_matches_yet = false;
				coords.ref_alignment_length += num; 
				break;
			case "P": // "Padding: silent deletion from padded reference" -- sam format specification
				no_matches_yet = false;
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
	alignment.aligned_length = coordinates.read_alignment_length;

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

	var fields = line.split(/\s+/);
	var record = {};
	record.segment = fields[2];
	record.pos = parseInt(fields[3]);
	record.flag = parseInt(fields[1]);
	record.mq = parseInt(fields[4]);
	record.cigar = fields[5];
	record.readName = fields[0];

	for (var i = 0; i < fields.length; i++) {
		if (fields[i].substr(0,2) == "SA") {
			record.SA = fields[i].split(":")[2];
			break;
		}
	}
	return parse_bam_record(record);
}

function planesweep_consolidate_intervals(starts_and_stops) {
	
	// Add margin to the stop points
	for (var i = 0; i < starts_and_stops.length; i++) {
		if (starts_and_stops[i][1] == "e") {
			starts_and_stops[i][0] = starts_and_stops[i][0]+_settings.margin_to_merge_ref_intervals;
		}
	}
	
	starts_and_stops.sort(function(a, b){return a[0]-b[0]});

	var intervals = [];
	var coverage = 0;
	var alignment_count = 0;
	var most_recent_start = -1;
	for (var i = 0; i < starts_and_stops.length; i++) {
		if (starts_and_stops[i][1]=="s") {
			coverage++;
			alignment_count++;
			if (coverage == 1) { // coverage was 0, now starting new interval
				most_recent_start = starts_and_stops[i][0];
			}
		} else if (starts_and_stops[i][1]=="e") {
			coverage--;
			if (coverage == 0) { // coverage just became 0, ending current interval
				// Remove margin from the final stop point before recording, avoiding margins on the edges of the intervals
				intervals.push([most_recent_start, starts_and_stops[i][0]-_settings.margin_to_merge_ref_intervals, alignment_count]);
				alignment_count = 0; // reset
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
	} else if (record_from_chunk.raw_type == "coords") {
		return record_from_chunk; // no indels
	} else {
		console.log("Don't recognize record_from_chunk.raw_type, must be sam or bam");
	}
}

function new_read_selected(index) {
	_current_read_index = index;
	select_read();
	_svg2.selectAll("g.alignment_groups").attr("id",function(d) {if (d.index == _current_read_index && _settings.highlight_selected_read) {return "selected_read_in_region_view"} else { return ""}});
}


function select_read() {
	var readname = _Chunk_alignments[_current_read_index].readname;

	user_message("","");

	// Show read info
	

	d3.select("#text_read_output").html("Read name: " + _Chunk_alignments[_current_read_index].readname + "<br>Number of alignments: " + _Chunk_alignments[_current_read_index].alignments.length);
	

	// d3.select("#text_read_output").property("value","Read name: " + _Chunk_alignments[_current_read_index].readname + "\n" + "Number of alignments: " + _Chunk_alignments[_current_read_index].alignments.length );

	//  + "\n" + "Number of alignments: " + _Chunk_alignments[_current_read_index].alignments.length

	// _settings.min_indel_size = 1000000000; // parse alignments for new read first without indels
	_Alignments = reparse_read(_Chunk_alignments[_current_read_index]).alignments;
	
	_ui_properties.mq_slider_max = 0;
	_ui_properties.indel_size_slider_max = 0;
	_ui_properties.align_length_slider_max = 0; 
	for (var i in _Alignments) {
		var alignment = _Alignments[i];
		if (alignment.mq > _ui_properties.mq_slider_max) {
			_ui_properties.mq_slider_max = alignment.mq;
		}
		if (alignment.max_indel > _ui_properties.indel_size_slider_max) {
			_ui_properties.indel_size_slider_max = alignment.max_indel;
		}
		if (alignment.aligned_length > _ui_properties.align_length_slider_max) {
			_ui_properties.align_length_slider_max = alignment.aligned_length;
		}
	}

	_settings.min_align_length = 0;
	if (_settings.min_indel_size == _static.min_indel_size_for_region_view) {
		_settings.min_indel_size = _ui_properties.indel_size_slider_max + 1;	
	}

	if (_settings.ref_match_chunk_ref_intervals) {
		organize_refs_for_read_same_as_chunk();
	} else {
		organize_references_for_read();
	}
	
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
	var top_y = _positions.singleread.bottom_bar.y + _positions.singleread.bottom_bar.height;
	
	function get_top_coords(datum,index) {
		// if ((_settings.ref_match_chunk_ref_intervals == false) || (_Refs_show_or_hide[datum.r] && d.num_alignments >= _settings.min_aligns_for_ref_interval)) {
		var cum_pos = map_ref_interval(datum.r,datum.path[index].R);
		if (cum_pos != undefined) {
			return _scales.ref_interval_scale(map_ref_interval(datum.r,datum.path[index].R))  + "," + top_y;
		}
		else {
			return _scales.read_scale(datum.path[index].Q)  + " " + (top_y+(bottom_y-top_y)*2./3.);
		}
	}

	var output = "M " + get_top_coords(d,0) ; // ref start
	output += " L " + _scales.read_scale(d.path[0].Q)      + " " + bottom_y; // read start

	for (var i = 1; i < d.path.length; i++) {
		var ref_coord = " L " + get_top_coords(d,i); // ref 
		var read_coord = " L " + _scales.read_scale(d.path[i].Q)     	+ " " + bottom_y; // read 
		if (i % 2 == 0) { // alternate reference and read side so top goes to top
			output += ref_coord + read_coord;
		} else {
			output += read_coord + ref_coord;
		}
	}
	
	output += " L " + get_top_coords(d,0); // ref start
	output += " L " + _scales.read_scale(d.path[0].Q)      + " " + bottom_y; // read start

	return output;
}

function ref_mapping_path_generator(d,chunk) {

		var bottom = {};
		var top = {};

		if (chunk == true) {
			bottom.y = _positions.multiread.ref_intervals.y;		
			bottom.left = _scales.chunk_ref_interval_scale(d.cum_pos);
			bottom.right = bottom.left + _scales.chunk_ref_interval_scale(d.end)-_scales.chunk_ref_interval_scale(d.start);
			
			top.y = _positions.multiread.ref_block.y + _positions.multiread.ref_block.height;
			top.left = _scales.chunk_whole_ref_scale(map_chunk_whole_ref(d.chrom,d.start));
			top.right = _scales.chunk_whole_ref_scale(map_chunk_whole_ref(d.chrom,d.end));
		} else {
			bottom.y = _positions.singleread.top_bar.y;			
			bottom.left = _scales.ref_interval_scale(d.cum_pos);
			bottom.right = bottom.left + _scales.ref_interval_scale(d.end)-_scales.ref_interval_scale(d.start);
			
			top.y = _positions.singleread.ref_block.y + _positions.singleread.ref_block.height;
			top.left = _scales.whole_ref_scale(map_whole_ref(d.chrom,d.start));
			top.right = _scales.whole_ref_scale(map_whole_ref(d.chrom,d.end));
		}
		

		return (
				 "M " + bottom.left                          + " " + bottom.y
		 + " L " + bottom.right                          + " " + bottom.y
		 + " L " + top.right                           + " " + top.y
		 + " L " + top.left                           + " " + top.y
		 + " L " + bottom.left                          + " " + bottom.y
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
function map_chunk_whole_ref(chrom,position) {
	// _Whole_refs has chrom, size, cum_pos

	for (var i = 0; i < _Whole_refs.length; i++) {
		if (_Whole_refs[i].chrom == chrom) {
			return _Whole_refs[i].filtered_cum_pos + position;
		}
	}
	return undefined;
}

function map_ref_interval(chrom,position) {
	// _Ref_intervals has chrom, start, end, size, cum_pos
	for (var i = 0; i < _Ref_intervals.length; i++) {
		if (_Ref_intervals[i].chrom == chrom && _Ref_intervals[i].cum_pos != -1) {
			if (position >= _Ref_intervals[i].start && position <= _Ref_intervals[i].end ) {
				return _Ref_intervals[i].cum_pos + (position - _Ref_intervals[i].start);
			}
		}
	}
	// console.log("ERROR: no chrom,pos match found in map_ref_interval()");
	// console.log(chrom,position);
	// console.log(_Ref_intervals);
	return undefined;
}

function map_chunk_ref_interval(chrom,position) {
	
	// _Chunk_ref_intervals has chrom, start, end, size, cum_pos
	for (var i = 0; i < _Chunk_ref_intervals.length; i++) {
		if (_Chunk_ref_intervals[i].chrom == chrom && _Chunk_ref_intervals[i].cum_pos != -1) {
			if (position >= _Chunk_ref_intervals[i].start && position <= _Chunk_ref_intervals[i].end ) {
				return _Chunk_ref_intervals[i].cum_pos + (position - _Chunk_ref_intervals[i].start);
			}
		}
	}
	
	return undefined;
	// console.log("ERROR: no chrom,pos match found in map_chunk_ref_interval()");
	// console.log(chrom,position);
	// console.log(_Chunk_ref_intervals);
}

function closest_map_ref_interval(chrom,position) {
	// _Ref_intervals has chrom, start, end, size, cum_pos
	var closest = 0;
	var best_distance = -1;
	for (var i = 0; i < _Ref_intervals.length; i++) {
		if (_Ref_intervals[i].chrom == chrom && _Ref_intervals[i].cum_pos != -1) {
			if (position >= _Ref_intervals[i].start && position <= _Ref_intervals[i].end ) {
				return {"precision":"exact","pos": _Ref_intervals[i].cum_pos + (position - _Ref_intervals[i].start)};
			}
			if (Math.abs(position - _Ref_intervals[i].start) < best_distance || best_distance == -1) {
				closest = _Ref_intervals[i].cum_pos;
				best_distance = Math.abs(position - _Ref_intervals[i].start);
			}
			if (Math.abs(position - _Ref_intervals[i].end) < best_distance) {
				closest = _Ref_intervals[i].cum_pos + _Ref_intervals[i].end - _Ref_intervals[i].start;
				best_distance = Math.abs(position - _Ref_intervals[i].end);
			}
		}
	}
	// If no exact match found by the end, return the closest
	if (best_distance != -1) {
		return {"precision":"inexact","pos": closest};
	} else {
		return {"precision":"none","pos": closest};
	}
}

function closest_map_chunk_ref_interval(chrom,position) {
	// _Chunk_ref_intervals has chrom, start, end, size, cum_pos
	var closest = 0;
	var best_distance = -1;
	for (var i in _Chunk_ref_intervals) {
		if (_Chunk_ref_intervals[i].chrom == chrom && _Chunk_ref_intervals[i].cum_pos != -1 ) {
			if (position >= _Chunk_ref_intervals[i].start && position <= _Chunk_ref_intervals[i].end ) {
				return {"precision":"exact","pos": _Chunk_ref_intervals[i].cum_pos + (position - _Chunk_ref_intervals[i].start)};
			}
			if (Math.abs(position - _Chunk_ref_intervals[i].start) < best_distance || best_distance == -1) {
				closest = _Chunk_ref_intervals[i].cum_pos;
				best_distance = Math.abs(position - _Chunk_ref_intervals[i].start);
			}
			if (Math.abs(position - _Chunk_ref_intervals[i].end) < best_distance) {
				closest = _Chunk_ref_intervals[i].cum_pos + _Chunk_ref_intervals[i].end - _Chunk_ref_intervals[i].start;
				best_distance = Math.abs(position - _Chunk_ref_intervals[i].end);
			}
		}
	}

	// If no exact match found by the end, return the closest
	if (best_distance != -1) {
		return {"precision":"inexact","pos": closest};
	} else {
		return {"precision":"none","pos": closest};	
	}	
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

	_ui_properties.ref_length_slider_max = 0;


	_Whole_refs = [];
	var cumulative_whole_ref_size = 0;
	for (var j = 0; j < chromosomes.length; j++){
		var chrom = chromosomes[j];
		var intervals = ref_intervals_by_chrom[chrom];
		var new_ref_data = undefined;
		if (_Ref_sizes_from_header[chrom] == undefined) {
			var length_guess = intervals[intervals.length-1][1]*2;
			if (!_settings.show_only_known_references) {
				new_ref_data = {"chrom":chrom,"size":length_guess,"cum_pos":cumulative_whole_ref_size};
				// cumulative_whole_ref_size += length_guess;
			}
		} else {
			new_ref_data = {"chrom":chrom, "size":_Ref_sizes_from_header[chrom], "cum_pos":cumulative_whole_ref_size};
			// cumulative_whole_ref_size += _Ref_sizes_from_header[chrom];
		}

		if (new_ref_data != undefined) {
			if (new_ref_data.size > _ui_properties.ref_length_slider_max) {
				_ui_properties.ref_length_slider_max = new_ref_data.size;
			}
			_Whole_refs.push(new_ref_data);
			cumulative_whole_ref_size += new_ref_data.size;
		}
	}
	
	_settings.max_ref_length = _ui_properties.ref_length_slider_max;

	_scales.whole_ref_scale.domain([0,cumulative_whole_ref_size]);
	_scales.ref_color_scale.domain(chromosomes);
}

function ref_intervals_from_ref_pieces(ref_pieces) {
	// For each chromosome, consolidate intervals
	var ref_intervals_by_chrom = {};
	for (var chrom in ref_pieces) {
		ref_intervals_by_chrom[chrom] = planesweep_consolidate_intervals(ref_pieces[chrom]);
		
		if (_Ref_sizes_from_header[chrom] != undefined) {
			var chrom_sum = 0;
			var chrom_sum_num_alignments = 0;
			for (var i in ref_intervals_by_chrom[chrom]) {
				chrom_sum += (ref_intervals_by_chrom[chrom][i][1]-ref_intervals_by_chrom[chrom][i][0]);
				chrom_sum_num_alignments += ref_intervals_by_chrom[chrom][i][2];
			}
			// console.log(chrom_sum*1.0/_Ref_sizes_from_header[chrom]);
			if (chrom_sum*1.0/_Ref_sizes_from_header[chrom] > _static.fraction_ref_to_show_whole) {
				// console.log(ref_intervals_by_chrom[chrom]);
				ref_intervals_by_chrom[chrom] = [[0, _Ref_sizes_from_header[chrom], chrom_sum_num_alignments]];
			}	
		}
	}
	return ref_intervals_by_chrom;
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
	
	// If a focal region was specified from querying the bam file, be sure to include it
	if (_focal_region != undefined) {
		if (ref_pieces[_focal_region.chrom] == undefined) {
			ref_pieces[_focal_region.chrom] = [];
		}
		ref_pieces[_focal_region.chrom].push([_focal_region.start,"s"]);
		ref_pieces[_focal_region.chrom].push([_focal_region.end,"e"]);
	}

	if (_Additional_ref_intervals != undefined) {
		for (var i in _Additional_ref_intervals) {
			var region = _Additional_ref_intervals[i]
			if (ref_pieces[region.chrom] == undefined) {
				ref_pieces[region.chrom] = [];
			}
			var start = region.start - 1000;
			if (start < 0) {
				start = 0;
			}
			var end = region.end + 1000;
			ref_pieces[region.chrom].push([start,"s"]);
			ref_pieces[region.chrom].push([end,"e"]);
		}
	}

	var ref_intervals_by_chrom = ref_intervals_from_ref_pieces(ref_pieces);

	//////////////////////////////////////////////////////////
	get_chromosome_sizes(ref_intervals_by_chrom);

	var chromosomes = [];
	for (var chrom in ref_intervals_by_chrom) {
		chromosomes.push(chrom);
	}

	chromosomes.sort(natural_sort);

	// var longest_region = {};
	// var length_of_longest_region = 0;

	_Chunk_ref_intervals = [];
	var cumulative_position = 0;
	for (var j = 0; j < chromosomes.length; j++){
		var chrom = chromosomes[j];
		var intervals = ref_intervals_by_chrom[chrom];
		for (var i in intervals) {
			_Chunk_ref_intervals.push({"chrom":chrom,"start":intervals[i][0],"end":intervals[i][1],"size":intervals[i][1]-intervals[i][0],"cum_pos":cumulative_position,"num_alignments":intervals[i][2]});
			var region_length = intervals[i][1]-intervals[i][0];
			cumulative_position += region_length;
			// if (region_length > length_of_longest_region) {
			// 	length_of_longest_region = region_length;
			// 	longest_region = {"chrom":chrom,"start":intervals[i][0],"end":intervals[i][1]};
			// }
		}
	}

	// if (_focal_region == undefined) {
	// 	_focal_region = longest_region;	
	// }


	_scales.chunk_ref_interval_scale.domain([0,cumulative_position]);

	refresh_visibility();
}

function organize_refs_for_read_same_as_chunk() {
	_Ref_intervals = _Chunk_ref_intervals;
	_scales.ref_interval_scale.domain(_scales.chunk_ref_interval_scale.domain());
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

	if (_focal_region != undefined) {
		if (ref_pieces[_focal_region.chrom] == undefined) {
			ref_pieces[_focal_region.chrom] = [];
		}
		ref_pieces[_focal_region.chrom].push([_focal_region.start,"s"]);
		ref_pieces[_focal_region.chrom].push([_focal_region.end,"e"]);
	}

	if (_Additional_ref_intervals != undefined) {
		for (var i in _Additional_ref_intervals) {
			var region = _Additional_ref_intervals[i]
			if (ref_pieces[region.chrom] == undefined) {
				ref_pieces[region.chrom] = [];
			}
			var start = region.start - 1000;
			if (start < 0) {
				start = 0;
			}
			var end = region.end + 1000;
			ref_pieces[region.chrom].push([start,"s"]);
			ref_pieces[region.chrom].push([end,"e"]);
		}
	}



	// For each chromosome, consolidate intervals
	var ref_intervals_by_chrom = ref_intervals_from_ref_pieces(ref_pieces);


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

	if (_Whole_refs.length > 0 || _Chunk_alignments.length > 0) {
		d3.select("#svg2_panel").style('visibility','visible');
		// d3.select("#image_capture_test_landing").style("display","none");
	} else {
		d3.select("#svg2_panel").style('visibility','hidden');
		// d3.select("#image_capture_test_landing").style("display","block");
	}

	if (_Chunk_alignments.length > 0) {
		d3.select("#region_settings_panel").style("display","block");
		d3.select("#data_description_panel").style("display","block");
		
	} else {
		d3.select("#region_settings_panel").style("display","none");
		d3.select("#data_description_panel").style("display","none");
	}

	if (_Alignments.length > 0) {
		d3.select("#settings").style('display','block');
		d3.select("#svg1_panel").style('visibility','visible');
	} else {
		d3.select("#settings").style('display','none');
		d3.select("#svg1_panel").style('visibility','hidden');
	}
	if (_Variants.length > 0 || _Bedpe.length > 0) {
		d3.selectAll(".hide_when_no_variants").style("display","block");
	} else {
		d3.selectAll(".hide_when_no_variants").style("display","none");
	}
}

function draw() {
	if (_Alignments.length == 0) {
		// console.log("no alignments, not drawing anything");
		return;
	}
	adjust_singleread_layout();

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
		.attr("height",_layout.svg2_height)
		.attr("id","svg_multi_read")
		.style("background-color","#ffffff");

	_svg2.append("text")
			.attr("id","no_alignments_message")
			.attr("x",_layout.svg2_width/2)
			.attr("y",_layout.svg2_height/2)
			.style('text-anchor',"middle").attr("dominant-baseline","middle")
			// .attr("fill","orange")
			// .text("No reads in the bam file at this location");

	d3.select("#svg2_panel").style('visibility','visible');
}


function reset_svg() {
	////////  Clear the svg to start drawing from scratch  ////////
	d3.select("#svg1_panel").selectAll("svg").remove();

	_svg = d3.select("#svg1_panel").append("svg")
		.attr("width",_layout.svg_width)
		.attr("height",_layout.svg_height)
		.attr("id","svg_single_read")
		.style("background-color","#ffffff");
}

function dotplot_alignment_path_generator(d) {

	var previous_x = _scales.ref_interval_scale(map_ref_interval(d.r,d.path[0].R));
	var previous_y = _scales.read_scale(d.path[0].Q);
	var output = "M " + previous_x + " " + previous_y;

	for (var i = 1; i < d.path.length; i++) {
		var current_x = _scales.ref_interval_scale(map_ref_interval(d.r,d.path[i].R));
		var current_y = _scales.read_scale(d.path[i].Q);
		if (current_x == previous_x || current_y == previous_y) {
			output += " M " + current_x + " " + current_y;	
		} else {
			output += " L " + current_x + " " + current_y;	
		}
		previous_x = current_x;
		previous_y = current_y;
	}
	
	return output;
}

function draw_dotplot() {
	reset_svg();

	if (_Alignments == undefined || _Alignments == []) {
		return;
	}
	
	draw_singleread_header();
	_positions.dotplot.canvas = {'x':_positions.singleread.ref_intervals.x,'y':_positions.singleread.bottom_bar.y + _positions.singleread.bottom_bar.height,'width':_positions.singleread.ref_intervals.width,'height':_layout.svg_height - (_positions.singleread.bottom_bar.y + _positions.singleread.bottom_bar.height) - _layout.svg_height*0.05};

	var canvas = _svg.append("g").attr("class","dotplot_canvas").attr("transform","translate(" + _positions.dotplot.canvas.x + "," + _positions.dotplot.canvas.y + ")");
	canvas.append("rect").style("fill","#eeeeee").attr("width",_positions.dotplot.canvas.width).attr("height",_positions.dotplot.canvas.height);

	// Relative to canvas
	_positions.ref = {"left":0, "right":_positions.dotplot.canvas.width, "y":_positions.dotplot.canvas.height};
	_positions.read = {"top":0, "bottom":_positions.dotplot.canvas.height, "x":_positions.dotplot.canvas.width};

	// Draw read
	canvas.append("line").attr("x1",0).attr("x2", 0).attr("y1",_positions.read.top).attr("y2",_positions.read.bottom).style("stroke-width",1).style("stroke", "black");
	_svg.append("text").text("Read / Query").style('text-anchor',"middle").attr("dominant-baseline","hanging")
		 .attr("transform", "translate("+ 0 + "," + (_positions.dotplot.canvas.y + _positions.dotplot.canvas.height/2)+")rotate(-90)").style("font-size",_positions.fontsize);

	// Draw ref
	canvas.append("line").attr("x1",_positions.ref.left).attr("x2", _positions.ref.right).attr("y1",_positions.ref.y).attr("y2",_positions.ref.y).style("stroke-width",1).style("stroke", "black");
	_svg.append("text").text("Reference").attr("x",_positions.dotplot.canvas.x + _positions.dotplot.canvas.width/2).attr("y",_layout.svg_height).style('text-anchor',"middle").attr("dominant-baseline","ideographic").style("font-size",_positions.fontsize);

	_scales.ref_interval_scale.range([_positions.ref.left, _positions.ref.right]);
	
	canvas.selectAll("rect.ref_interval").data(_Ref_intervals).enter()
		.append("rect").attr("class","ref_interval")
			.filter(function(d) {return d.cum_pos != -1})
			.attr("x",function(d) { return _scales.ref_interval_scale(d.cum_pos); })
			.attr("y",0)
			.attr("width", function(d) {return (_scales.ref_interval_scale(d.end)-_scales.ref_interval_scale(d.start));})
			.attr("height", _positions.dotplot.canvas.height)
			.attr("fill",function(d) {
				if (_settings.colorful) {return _scales.ref_color_scale(d.chrom);} else {return "white"}})
			.style("stroke-width",1).style("stroke", "black")
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + comma_format(d.start) + " - " + comma_format(d.end);
				var x = _positions.dotplot.canvas.x + _scales.ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
				var y = _positions.dotplot.canvas.y + _positions.dotplot.canvas.height + _padding.text;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();})
			.style("stroke-opacity",0.1)
			.attr("fill-opacity",_static.dotplot_ref_opacity)

	// Alignments
	var flip = false;
	
	if (_settings.orient_reads_by == "primary") {
		var primary_alignment = _Chunk_alignments[_current_read_index].alignments[_Chunk_alignments[_current_read_index].index_primary];
		flip = (primary_alignment.qe - primary_alignment.qs < 0);
	} else if (_settings.orient_reads_by == "longest") {
		var longest_alignment = _Chunk_alignments[_current_read_index].alignments[_Chunk_alignments[_current_read_index].index_longest];
		flip = (longest_alignment.qe - longest_alignment.qs < 0);
	} else if (_settings.orient_reads_by == "reverse") {
		flip = true;
	} else {
		flip = false;
	}

	if (flip == true) {
		// _scales.read_scale.range([ _positions.read.x+_positions.read.width, _positions.read.x]); // from ribbon plot
		_scales.read_scale.range([_positions.read.top, _positions.read.bottom]);
	} else {
		// _scales.read_scale.range([_positions.read.x, _positions.read.x+_positions.read.width]); // from ribbon plot
		_scales.read_scale.range([_positions.read.bottom, _positions.read.top]);
	}

	var a_groups = canvas.selectAll("g.alignment").data(_Alignments).enter()
		.append("g").attr("class","alignment");
	a_groups.append("path")
			.filter(function(d) {return d.mq >= _settings.min_mapping_quality && d.aligned_length >= _settings.min_align_length})
			.filter(function(d) {return map_ref_interval(d.r,d.rs) != undefined && map_ref_interval(d.r,d.re) != undefined})
				.attr("d",dotplot_alignment_path_generator)
				.style("stroke-width",2)
				.style("stroke","black")
				.style("stroke-opacity",1)
				.style("fill","none")
				.on('mouseover', function(d) {
					var text = Math.abs(d.qe-d.qs) + " bp"; 
					var x = _positions.dotplot.canvas.x + _scales.ref_interval_scale(map_ref_interval(d.r,(d.rs+d.re)/2));
					var y = _padding.text*(-3) + _positions.dotplot.canvas.y + _scales.read_scale((d.qs+d.qe)/2);
					show_tooltip(text,x,y,_svg);
				})
				.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

	var read_axis = d3.svg.axis().scale(_scales.read_scale).orient("left").ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"))
	var read_axis_label = _svg.append("g")
		.attr("class","axis")
		.attr("transform","translate(" + _positions.dotplot.canvas.x + "," + _positions.dotplot.canvas.y + ")")
		.style("font-size",_positions.fontsize)
		.call(read_axis);
	read_axis_label.selectAll("text").style("font-size",_positions.fontsize);

	if (_Additional_ref_intervals.length > 0) {
		canvas.selectAll("rect.focal_regions").data(_Additional_ref_intervals).enter()
			.append("rect").attr("class","focal_regions")
				.attr("x",function(d) {  return _scales.ref_interval_scale(map_ref_interval(d.chrom,d.start)); })
				.attr("y", _positions.read.top)
				.attr("width", function(d) { return _scales.ref_interval_scale(map_ref_interval(d.chrom,d.end)) - _scales.ref_interval_scale(map_ref_interval(d.chrom,d.start));})
				.attr("height", _positions.read.bottom - _positions.read.top)
				.attr("fill","none")
				.style("stroke-width",4)
				.style("stroke", "#333333");
	}
}

function adjust_singleread_layout() {
	
	_positions.singleread.top_bar = {"y":_layout.svg_height*_static.singleread_layout_fractions.ref_and_mapping, "height": _layout.svg_height*_static.singleread_layout_fractions.top_bar};

	var total_header = _static.singleread_layout_fractions.ref_and_mapping;

	if (_Features.length > 0 || _Variants.length > 0 || _Bedpe.length > 0) {
		total_header += _static.singleread_layout_fractions.top_bar;
	}

	if (_Features.length > 0) {
		_positions.singleread.features = {"arrow_size":_layout.svg2_height*_static.singleread_layout_fractions["features"]/7};
		_positions.singleread.features.y = _layout.svg_height*total_header;
		total_header += _static.singleread_layout_fractions.features;
		_positions.singleread.features.rect_height = _layout.svg_height*_static.singleread_layout_fractions.features;
	}

	if (_Variants.length > 0 || _Bedpe.length > 0) {
		_positions.singleread.variants = {};
		_positions.singleread.variants.y = _layout.svg_height*total_header;
		total_header += _static.singleread_layout_fractions.variants;
		_positions.singleread.variants.height = _layout.svg_height*_static.singleread_layout_fractions.variants;
	}
	
	_positions.singleread.ref_block = {"y":_layout.svg_height*0.15, "x":_positions.multiread.ref_intervals.x, "width":_positions.multiread.ref_intervals.width, "height":_layout.svg_height*0.03};
	_positions.singleread.ref_intervals = {"x":_positions.singleread.ref_block.x, "width":_positions.singleread.ref_block.width};
	
	_positions.singleread.bottom_bar = {"y":_layout.svg_height*total_header, "height": _layout.svg_height*_static.singleread_layout_fractions.bottom_bar}
	// total_header += _static.singleread_layout_fractions.bottom_bar;
}

function draw_singleread_header() {
	adjust_singleread_layout();

	// Draw "Reference" label
	_svg.append("text").attr("id","ref_tag").text("Reference").attr("x",_positions.singleread.ref_block.x+_positions.singleread.ref_block.width/2).attr("y",_positions.singleread.ref_block.y-_positions.singleread.ref_block.height*3).style('text-anchor',"middle").attr("dominant-baseline","middle").style("font-size",_positions.fontsize);
	
	_scales.whole_ref_scale.range([_positions.singleread.ref_block.x, _positions.singleread.ref_block.x + _positions.singleread.ref_block.width]);
	_scales.ref_interval_scale.range([_positions.singleread.ref_intervals.x, _positions.singleread.ref_intervals.x+_positions.singleread.ref_intervals.width]);
	
	// Whole reference chromosomes for the relevant references:
	_svg.selectAll("rect.ref_block").data(_Whole_refs).enter()
		.append("rect").attr("class","ref_block")
			.attr("x",function(d) { return _scales.whole_ref_scale(d.cum_pos); })
			.attr("y",_positions.singleread.ref_block.y)
			.attr("width", function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size) - _scales.whole_ref_scale(d.cum_pos));})
			.attr("height", _positions.singleread.ref_block.height)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
			.style("stroke-width",1).style("stroke", "black")
			.on("click",function(d) {highlight_chromosome(d.chrom)})
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + bp_format(d.size);
				var x = _scales.whole_ref_scale(d.cum_pos + d.size/2);
				var y = _positions.singleread.ref_block.y - _padding.text;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

	_svg.selectAll("text.ref_block").data(_Whole_refs).enter()
		.append("text").attr("class","ref_block")
			.filter(function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size) - _scales.whole_ref_scale(d.cum_pos) > ((_positions.fontsize/5.)*d.chrom.length));})
				.text(function(d){var chrom = d.chrom; return chrom.replace("chr","")})
				.attr("x", function(d) { return _scales.whole_ref_scale(d.cum_pos + d.size/2)})
				.attr("y",_positions.singleread.ref_block.y - _padding.text)
				.style('text-anchor',"middle").attr("dominant-baseline","bottom")
				.style("font-size",_positions.fontsize);
				// .attr("height", _positions.singleread.ref_block.height)
				// .attr("width", function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size)-_scales.whole_ref_scale(d.cum_pos));})
				// .attr("font-size",function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size)-_scales.whole_ref_scale(d.cum_pos))/2;});
	
	// Zoom into reference intervals where the read maps:
	_svg.selectAll("rect.top_bar").data(_Ref_intervals).enter()
		.append("rect").attr("class","top_bar")
			.filter(function(d) {return ((_settings.ref_match_chunk_ref_intervals == false) || (_Refs_show_or_hide[d.chrom] && d.num_alignments >= _settings.min_aligns_for_ref_interval))})
				.attr("x",function(d) { return _scales.ref_interval_scale(d.cum_pos); })
				.attr("y",_positions.singleread.top_bar.y)
				.attr("width", function(d) {return (_scales.ref_interval_scale(d.end)-_scales.ref_interval_scale(d.start));})
				.attr("height", _positions.singleread.bottom_bar.y - _positions.singleread.top_bar.y)
				.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
				.style("stroke-width",1).style("stroke", "black").style("opacity",0.5)
				.on('mouseover', function(d) {
					var text = d.chrom + ": " + comma_format(d.start) + " - " + comma_format(d.end);
					var x = _scales.ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
					var y = _positions.singleread.top_bar.y - _padding.text;
					show_tooltip(text,x,y,_svg);
				})
				.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

	_svg.selectAll("rect.bottom_bar").data(_Ref_intervals).enter()
		.append("rect").attr("class","bottom_bar")
			.filter(function(d) {return ((_settings.ref_match_chunk_ref_intervals == false) || (_Refs_show_or_hide[d.chrom] && d.num_alignments >= _settings.min_aligns_for_ref_interval))})
				.attr("x",function(d) { return _scales.ref_interval_scale(d.cum_pos); })
				.attr("y",_positions.singleread.bottom_bar.y)
				.attr("width", function(d) {return (_scales.ref_interval_scale(d.end)-_scales.ref_interval_scale(d.start));})
				.attr("height", _positions.singleread.bottom_bar.height)
				.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
				.style("stroke-width",1).style("stroke", "black")
				.on('mouseover', function(d) {
					var text = d.chrom + ": " + comma_format(d.start) + " - " + comma_format(d.end);
					var x = _scales.ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
					var y = _positions.singleread.bottom_bar.y - _padding.text;
					show_tooltip(text,x,y,_svg);
				})
				.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});


	_svg.selectAll("path.ref_mapping").data(_Ref_intervals).enter()
		.append("path").attr("class","ref_mapping")
			.filter(function(d) {return map_whole_ref(d.chrom,d.start) != undefined && ((_settings.ref_match_chunk_ref_intervals == false) || (_Refs_show_or_hide[d.chrom] && d.num_alignments >= _settings.min_aligns_for_ref_interval))})
				.attr("d",function(d) {return ref_mapping_path_generator(d,false)})
				.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})


	/////////////////////////   Variants   /////////////////////////////
	if (_Variants.length > 0) {
		var variants_in_view = find_features_in_view(_Variants, closest_map_ref_interval, _scales.ref_interval_scale);
		var variants_to_show = [];
		for (var i in variants_in_view) {
			if (_settings.show_only_selected_variants == false || variants_in_view[i].highlight == true) {
				variants_to_show.push(variants_in_view[i]);
			}
		}
		
		var max_overlaps = calculate_offsets_for_features_in_view(variants_to_show);

		_svg.selectAll("rect.variants").data(variants_to_show).enter()
			.append("rect")
			.attr("class",function(d) {if (d.highlight == true) {return "variants highlight"} else {return "variants"}})
				.attr("x",function(d) { return d.start_cum_pos })
				.attr("width",function(d) { return  d.end_cum_pos - d.start_cum_pos})
				.attr("y", function(d) {return _positions.singleread.variants.y + _positions.singleread.variants.height*d.offset/max_overlaps})
				.attr("height", _positions.singleread.variants.height/max_overlaps*0.9)
				.style("fill",function(d){return _scales.variant_color_scale(d.type)})
				.on('mouseover', function(d) {
					var text = d.name;
					if (d.type != undefined) {
						text = d.name + " (" + d.type + ")";
					}
					var x = (d.start_cum_pos + d.end_cum_pos)/2;
					var y =  _positions.singleread.variants.y +  _positions.singleread.ref_intervals.height/max_overlaps + _padding.text;
					show_tooltip(text,x,y,_svg);
				})
				.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});
	}

	if (_Features.length > 0) {
		draw_singleread_features();
	}
	if (_Bedpe.length > 0) {
		var variants_in_view = []
		for (var i in _Bedpe) {
			if (_settings.show_only_selected_variants == false || _Bedpe[i].highlight == true) {
				var variant = _Bedpe[i];
				var results1 = closest_map_ref_interval(variant.chrom1,variant.pos1);
				var results2 = closest_map_ref_interval(variant.chrom2,variant.pos2); 
				
				if (results1.precision == "exact" && results2.precision == "exact") {
					variant.cum_pos1 = _scales.ref_interval_scale(results1.pos);
					variant.cum_pos2 = _scales.ref_interval_scale(results2.pos);
					variants_in_view.push(variant);
				}
			}
		}

		var loop_path_generator = function(d) {

			var foot_length = _positions.multiread.variants.foot_length;

			var bottom_y = _positions.singleread.variants.y + _positions.singleread.variants.height*0.9; 
			var highest_point = _positions.singleread.variants.height*0.7; 
			var x1 = d.cum_pos1,
				y_ankle = bottom_y - highest_point/2,

				x2 = d.cum_pos2,
				y_foot = bottom_y;

			var arrow = -1*_positions.multiread.variants.arrow_size;

			var xmid = (x1+x2)/2;
			var ymid = bottom_y - highest_point*2;  // bezier curve pointing toward 2*highest_point ends up around highest_point at the top of the curve
			
			var direction1 = Number(d.strand1=="-")*2-1, // negative strands means the read is mappping to the right of the breakpoint
				direction2 = Number(d.strand2=="-")*2-1;

			if (isNaN(xmid) == true) {
				console.log("xmid is not a number");
				console.log(d);
			}
			if (isNaN(direction1) == true) {
				console.log("direction1 is not a number");
				console.log(d);
			}

			return (
				 "M " + (x1+foot_length*direction1) + " " + y_foot // toe
			 + " L " + (x1+foot_length*direction1 + arrow*direction1) + " " + (y_foot + arrow) // arrow
			 + " L " + (x1+foot_length*direction1) + " " + (y_foot) // toe
			 + " L " + (x1+foot_length*direction1 + arrow*direction1) + " " + (y_foot - arrow) // arrow
			 + " L " + (x1+foot_length*direction1) + " " + (y_foot) // toe

			 + " L " + x1                          + " " + y_foot // breakpoint
			 // + " L " + x1                          + " " + y_top // up
			 + " L " + x1                          + " " + y_ankle // ankle
			 + " S " + xmid                        + " " + ymid + " " +          x2  + " " + y_ankle // curve to breakpoint
			 // + " L " + x2                          + " " + y_top // up
			 + " L " + x2                          + " " + y_foot // breakpoint

			 + " L " + (x2+foot_length*direction2) + " " + (y_foot) // toe
			 + " L " + (x2+foot_length*direction2 + arrow*direction2) + " " + (y_foot + arrow) // arrow
			 + " L " + (x2+foot_length*direction2) + " " + (y_foot) // toe
			 + " L " + (x2+foot_length*direction2 + arrow*direction2) + " " + (y_foot - arrow) // arrow
			 + " L " + (x2+foot_length*direction2) + " " + y_foot); // toe
		}

		_svg.selectAll("path.bedpe_variants").data(variants_in_view).enter()
			.append("path")
				.attr("class",function(d) {if (d.highlight == true) {return "bedpe_variants highlight"} else {return "bedpe_variants"}})
				.attr("d",loop_path_generator)
				.style("stroke", "black") // function(d){return _scales.variant_color_scale(d.type)}) // colors are hard to see
				.on('mouseover', function(d) {
					var text = d.name;
					if (d.type != undefined) {
						text = d.name + " (" + d.type + ")";
					}
					var x = (d.cum_pos1 + d.cum_pos2)/2;
					var y =  _positions.singleread.variants.y - _padding.text;
					show_tooltip(text,x,y,_svg);
				})
				.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});
	}
}


function draw_singleread_features() {
	var features_in_view = find_features_in_view(_Features, closest_map_ref_interval, _scales.ref_interval_scale);
	var max_overlaps = calculate_offsets_for_features_in_view(features_in_view);
	if (_settings.show_features_as == "rectangles") {
		_svg.selectAll("rect.features").data(features_in_view).enter()
			.append("rect")
				.attr("class",function(d) {if (d.highlight == true) {return "variants highlight"} else {return "variants"}})
				.attr("x",function(d) { return d.start_cum_pos })
				.attr("width",function(d) { return  d.end_cum_pos - d.start_cum_pos})
				.attr("y", function(d) {return _positions.singleread.features.y + _positions.singleread.features.rect_height*d.offset/max_overlaps})
				.attr("height", (_positions.singleread.features.rect_height*0.9/max_overlaps))
				.style("fill",function(d){return _scales.feature_color_scale(d.type)})
				.on('mouseover', function(d) {
					var text = d.name;
					if (d.type != undefined) {
						text = d.name + " (" + d.type + ")";
					}
					var x = (d.start_cum_pos + d.end_cum_pos)/2;
					var y =  _positions.singleread.features.y + _positions.singleread.features.rect_height*d.offset/max_overlaps - _padding.text;
					show_tooltip(text,x,y,_svg);
				})
				.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});
	} else if (_settings.show_features_as == "arrows" || _settings.show_features_as == "names") {
		var feature_path_generator = function(d) {
			var arrow = -1*_positions.singleread.features.arrow_size,
				x1 = d.start_cum_pos,
				x2 = d.end_cum_pos,
				y = _positions.singleread.features.y + _positions.singleread.features.rect_height*d.offset/max_overlaps,
				direction = Number(d.strand=="+")*2-1;
			var xmid = (x1 + x2)/2;

			return (
				"M " + x1     					+ " " + y 
			 + " L " + xmid   					+ " " + y
			 + " L " + (xmid + arrow*direction) + " " + (y + arrow)
			 + " L " + xmid   					+ " " + y
			 + " L " + (xmid + arrow*direction) + " " + (y - arrow)
			 + " L " + xmid   					+ " " + y
			 + " L " + x2   					+ " " + y);
		}

		_svg.selectAll("path.features").data(features_in_view).enter()
			.append("path")
				.attr("class",function(d) {if (d.highlight == true) {return "features highlight"} else {return "features"}})
				.attr("d",feature_path_generator)
				.style("stroke",function(d){return _scales.feature_color_scale(d.type)})
				.on('mouseover', function(d) {
					var text = d.name;
					if (d.type != undefined) {
						text = d.name + " (" + d.type + ")";
					}
					var x = (d.start_cum_pos + d.end_cum_pos)/2;
					var y =  _positions.singleread.features.y + _positions.singleread.features.rect_height*d.offset/max_overlaps - _padding.text;
					show_tooltip(text,x,y,_svg);
				})
				.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

		if (_settings.show_features_as == "names") {
			var text_boxes = _svg.selectAll("g.features").data(features_in_view).enter().append("g").attr("class","features")
				.attr("transform",function(d) {return "translate(" + ((d.start_cum_pos + d.end_cum_pos)/2) + "," + (_positions.singleread.features.y + _positions.singleread.features.rect_height*d.offset/max_overlaps - _padding.text) + ")"});

			var height = _positions.singleread.features.rect_height/(max_overlaps+3)*2;
			
			text_boxes.append("text")
				.attr("class",function(d) {if (d.highlight == true) {return "features highlight"} else {return "features"}})
				.attr("x", 0)
				.attr("y", 0)
				.attr("fill",function(d){return _scales.feature_color_scale(d.type)})
				.style("font-size",height)
				.style('text-anchor',"middle").attr("dominant-baseline","ideographic")
				.text(function(d) {return d.name});
		}
	}
}

function draw_ribbons() {
	reset_svg();

	if (_Alignments == undefined) {
		return;
	}
	draw_singleread_header();

	// Calculate layouts within the svg
	_positions.read = {"y":_layout.svg_height*0.85, "x":_positions.multiread.ref_intervals.x, "width":_positions.multiread.ref_intervals.width, "height":_layout.svg_height*0.03};
	
	// Draw read
	_svg.append("rect").attr("class","read").attr("x",_positions.read.x).attr("y",_positions.read.y).attr("width",_positions.read.width).attr("height",_positions.read.height).style("stroke-width",1).style("stroke", "black").attr("fill","black")
		.on('mouseover', function() {
			var text = "read: " + _Alignments[_Alignments.length-1].read_length + " bp";
			var x = _positions.read.x+_positions.read.width/2;
			var y = _positions.read.y+_positions.read.height*3.5;
			show_tooltip(text,x,y,_svg);
		})
		.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});
	_svg.append("text").text("Read / Query").attr("x",_positions.read.x+_positions.read.width/2).attr("y",_layout.svg_height).style('text-anchor',"middle").attr("dominant-baseline","ideographic").style("font-size",_positions.fontsize);
	
	

	// Alignments
	var flip = false;
	
	if (_settings.orient_reads_by == "primary") {
		var primary_alignment = _Chunk_alignments[_current_read_index].alignments[_Chunk_alignments[_current_read_index].index_primary];
		flip = (primary_alignment.qe - primary_alignment.qs < 0);
	} else if (_settings.orient_reads_by == "longest") {
		var longest_alignment = _Chunk_alignments[_current_read_index].alignments[_Chunk_alignments[_current_read_index].index_longest];
		flip = (longest_alignment.qe - longest_alignment.qs < 0);
	} else if (_settings.orient_reads_by == "reverse") {
		flip = true;
	} else {
		flip = false;
	}

	if (flip == true) {
		_scales.read_scale.range([ _positions.read.x+_positions.read.width, _positions.read.x]);
	} else {
		_scales.read_scale.range([_positions.read.x, _positions.read.x+_positions.read.width]);
	}
	_svg.selectAll("path.alignment").data(_Alignments).enter()
		.append("path")
			.filter(function(d) {return d.mq >= _settings.min_mapping_quality && d.aligned_length >= _settings.min_align_length})
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
		.call(read_axis);
	read_axis_label.selectAll("text").style("font-size",_positions.fontsize);

}

// ===========================================================================
// == Examples
// ===========================================================================

function show_info_panel() {
	if (d3.select("#info_panel").style("display") == "none") {
		d3.select("#info_panel").style("display","block");	
	} else {
		d3.select("#info_panel").style("display","none");
	}
}

d3.select("#click_info_link").on("click",show_info_panel)

function add_examples_to_navbar() {
	var core_url = window.location.href.split("?")[0];
	d3.select("#examples_navbar_item").style("visibility","visible");
	navbar_examples = d3.select("ul#examples_list");

	jQuery.ajax({
		url: "permalinks",
		cache: false,
		error: function() {
			navbar_examples.append("li").html("Create examples using permalinks and then rename the .json file in the permalinks folder to E_*.json where * is a quick dataset description with underscores instead of spaces, and they will automatically appear here.");
		},
		success: function (data) {
			$(data).find("a").each(function() {
				// will loop through
				var example_file = $(this).attr("href");
				if (example_file.substr(0,2) == "E_" && example_file.substr(example_file.length-5,example_file.length) == ".json") {
					
					var name = example_file.substr(2,example_file.length-7).replace(/_/g," ");
					navbar_examples.append("li").append("a")
						.attr("target","_blank")
						.attr("href", (core_url+"?perma=" + example_file.substr(0, example_file.length-5)))
						.text(name);
				}
			})
		}
	});
}

function variants_just_loaded() {
	refresh_visibility();
	d3.select("#collapsible_variant_upload_box").attr("class","panel-collapse collapse");
}

function set_alignment_info_text() {
	d3.select("#text_alignment_file_output").html(_settings.alignment_info_text);
}

function set_variant_info_text() {
	d3.select("#text_variant_file_output").html(_settings.variant_info_text);	
}

function load_bam_url_in_background(url) {
	_Bam = new Bam(url);
	_Bam.getHeader(function() {console.log("got header from url bam")});
	_settings.alignment_info_text = "Bam from url: " + url;
	_settings.bam_url = url;
}

function read_bam_url(url) {
	_Bam = new Bam(url);
	_Bam.getHeader(function() {console.log("got header")});
	wait_then_run_when_bam_file_loaded();
	_settings.alignment_info_text = "Bam from url: " + url;
	_settings.bam_url = url;
	set_alignment_info_text();
}


function load_json_bam(header) {
	// Check match refs from region view checkbox by default
	_settings.ref_match_chunk_ref_intervals = true;
	d3.select("#ref_match_region_view").property("checked",true);
	refresh_ui_for_new_dataset();
	reset_settings_for_new_dataset();

	clear_sam_input();
	clear_coords_input();

	clear_data();

	record_bam_header(header);

	organize_references_for_chunk();
	show_all_chromosomes();
	apply_ref_filters();

	reset_svg2();
	draw_chunk_ref();
	d3.select("#collapsible_alignment_input_box").attr("class","panel-collapse collapse");

	d3.select("#region_selector_panel").style("display","block");
	d3.select("#variant_input_panel").style("display","block");
	d3.select("#feature_input_panel").style("display","block");

}


function write_permalink() {
	
	d3.select("#generate_permalink_button").html("Creating permalink...");
	d3.select("#generate_permalink_button").property("disabled",true);

	var permalink_name = get_name();
	var header = [];
	for (var i in _Whole_refs) {
		header.push({"name":_Whole_refs[i].chrom, "end":_Whole_refs[i].size});
	}
	var post_data = {"ribbon_perma": {
		"header":header, 
		"alignments": _Chunk_alignments, 
		"variants":_Variants, 
		"bedpe":_Bedpe, 
		"features":_Features, 
		"_Refs_show_or_hide":_Refs_show_or_hide,
		"config": {"focus_regions":_Additional_ref_intervals, "selected_read":_current_read_index, "settings":_settings},
		"permalink_name": permalink_name//,
		// "images": image_URIs
	}};
	if (_Chunk_alignments.length > 800) {
		user_message("Warning", "A large dataset may fail to create a permalink. Reduce upload file size if this occurs.");	
	}
	
	jQuery.ajax({
		type: "POST",
		url: "permalink_creator.php",
		data: {ribbon: JSON.stringify(post_data), name: permalink_name},
		success: function(data) {
			user_message("Permalink", data);
			d3.select("#generate_permalink_button").property("disabled",false);
			d3.select("#generate_permalink_button").html("Share permalink");
		},
		error: function(e) {
			alert("Error:" + e.message);
			d3.select("#generate_permalink_button").property("disabled",false);
			d3.select("#generate_permalink_button").html("Share permalink");
		}
	});
}


function read_permalink(id) {
	user_message("Info","Loading data from permalink");

	jQuery.ajax({
		url: "permalinks/" + id + ".json", 
		success: function(file_content) {
			// Data type
			var json_data = null; 
			if (typeof(file_content) === "object") {
				json_data = file_content;
			} else if (typeof(file_content) === "string"){
				var file_content = file_content.replace(/\n/g,"\\n").replace(/\t/g,"\\t");
				json_data = JSON.parse(file_content);
			} else {
				console.log("Cannot read permalink, returned type is not object or string");
			}

			// // If images
			// if (json_data["ribbon_perma"]["images"] != undefined) {
			// 	console.log(json_data["ribbon_perma"]["images"].length);
			// 	console.log(json_data["ribbon_perma"]["images"][0].length);
			// 	console.log(json_data["ribbon_perma"]["images"][1].length);
			// 	d3.select("#image_capture_test_landing")
			// 		.append("img").property("src", json_data["ribbon_perma"]["images"][0]);
			// 	d3.select("#image_capture_test_landing")
			// 		.append("img").property("src", json_data["ribbon_perma"]["images"][1]);
			// }

			// Alignments
			if (json_data["ribbon_perma"] != undefined) {

				if (json_data["ribbon_perma"]["config"]["settings"]["bam_url"] != undefined) {
					load_bam_url_in_background(json_data["ribbon_perma"]["config"]["settings"]["bam_url"]);
				}
				if (json_data["ribbon_perma"]["config"]["focus_regions"] != undefined) {
					_Additional_ref_intervals = json_data["ribbon_perma"]["config"]["focus_regions"];
				}
				if (json_data["ribbon_perma"]["header"] != undefined) {
					load_json_bam(json_data["ribbon_perma"]["header"]);	
				}
				if (json_data["ribbon_perma"]["alignments"] != undefined) {
					_Chunk_alignments = json_data["ribbon_perma"]["alignments"];
					chunk_changed();
					tell_user_how_many_records_loaded();
				}
				if (json_data["ribbon_perma"]["_Refs_show_or_hide"] != undefined) {
					_Refs_show_or_hide = json_data["ribbon_perma"]["_Refs_show_or_hide"];
				}
				if (json_data["ribbon_perma"]["variants"] != undefined && json_data["ribbon_perma"]["variants"].length > 0) {
					_Variants = json_data["ribbon_perma"]["variants"];
					update_variants();
				}
				if (json_data["ribbon_perma"]["features"] != undefined && json_data["ribbon_perma"]["features"].length > 0) {
					_Features = json_data["ribbon_perma"]["features"];
					update_features();
				}
				if (json_data["ribbon_perma"]["bedpe"] != undefined && json_data["ribbon_perma"]["bedpe"].length > 0) {
					_Bedpe = json_data["ribbon_perma"]["bedpe"];
					update_bedpe();
				}
				if (json_data["ribbon_perma"]["config"]["selected_read"] != undefined) {
					new_read_selected(json_data["ribbon_perma"]["config"]["selected_read"]);
				}

				if (json_data["ribbon_perma"]["config"]["settings"] != undefined) {
					_settings = json_data["ribbon_perma"]["config"]["settings"];
					// For backwards compatibility:
					if (_settings.color_index == undefined) {
						_settings.color_index = 0;
					}
					if (_settings.feature_types_to_show == undefined) {
						_settings.feature_types_to_show = {"protein_coding":true};
					}
					refresh_ui_for_new_dataset();
					_scales.ref_color_scale.range(_static.color_collections[_settings.color_index]);
					apply_ref_filters();
					draw_region_view();
					refresh_visibility();
					refresh_ui_elements();
					set_alignment_info_text();
					set_variant_info_text();
					select_read();
					d3.select("#text_region_output").html("Showing permalink: " + id);
				}
				if (json_data["ribbon_perma"]["permalink_name"] != undefined) {
					d3.select("#notes").property("value", json_data["ribbon_perma"]["permalink_name"]);
				}
			} else {
				if (json_data["bam"] != undefined) {
					if (json_data["bam"]["header"]["sq"] != undefined) {
						// header must be [{name: , end: }, {name: , end: }]
						_settings.current_input_type = "bam";
						load_json_bam(json_data["bam"]["header"]["sq"]);
					} else {
						user_message("JSON object has bam, but bam does not contain key: header.sq");
					}
					// json_data["bam"]["records"] is a list of records fitting parse_bam_record()
					if (json_data["bam"]["records"] != undefined) {
						use_fetched_data(json_data["bam"]["records"]);	
					} else {
						user_message("JSON object has bam, but bam does not contain key: records");
					}
				} else if (json_data["bam_url"] != undefined) {
					read_bam_url(json_data["bam_url"]);
				} else if (json_data["sam"] != undefined) {
					sam_input_changed(json_data["sam"]);
				}

				if (json_data["bedpe"] != undefined) {
					bedpe_input_changed(json_data["bedpe"]);
				}

				if (json_data["bed"] != undefined) {
					bed_input_changed(json_data["bed"]);
				} else if (json_data["vcf"] != undefined) {
					vcf_input_changed(json_data["vcf"]);
				}
			}
		},
		error: function(e) {
			user_message("Error", "Permalink not found on server")
		}
	});
}

add_examples_to_navbar();

// ===========================================================================
// == Load bed file
// ===========================================================================

function open_bedpe_file(event) {
	if (this.files[0].size > 1000000) {
		user_message("Warning","Loading large file may take a while.");
	}
	
	var file_extension = /[^.]+$/.exec(this.files[0].name)[0];
	if (file_extension == "bedpe") {
		var raw_data;
		var reader = new FileReader();
		reader.readAsText(this.files[0]);
		reader.onload = function(event) {
			raw_data = event.target.result;
			bedpe_input_changed(raw_data);
			variants_just_loaded();
		}
		_settings.variant_info_text="Bedpe from file: " + this.files[0].name;
		set_variant_info_text();
	}
}
function open_variant_file(event) {
	if (this.files[0].size > 1000000) {
		user_message("Warning","Loading large file may take a while.");
	}
	
	var file_extension = /[^.]+$/.exec(this.files[0].name)[0];
	if (file_extension == "vcf") {
		var raw_data;
		var reader = new FileReader();
		reader.readAsText(this.files[0]);
		reader.onload = function(event) {
			raw_data = event.target.result;
			clear_vcf_input();
			vcf_input_changed(raw_data);
			variants_just_loaded();
		}
		_settings.variant_info_text="Variants from file: " + this.files[0].name;
		set_variant_info_text(); 
		
	}
	else if (file_extension == "bed") {
		var raw_data;
		var reader = new FileReader();
		reader.readAsText(this.files[0]);
		reader.onload = function(event) {
			raw_data = event.target.result;
			clear_bed_input();
			bed_input_changed(raw_data);
			variants_just_loaded();
		}
		_settings.variant_info_text="Variants from file: " + this.files[0].name;
		set_variant_info_text();
	} else {
		user_message("Error", "File extension must be .bed or .vcf");
	}
}

function features_just_loaded() {
	// refresh_visibility();
	d3.select("#collapsible_feature_upload_box").attr("class","panel-collapse collapse");
}

function read_feature_bed(raw_data) {
	var input_text = raw_data.split("\n");
	
	_Features = [];
	for (var i in input_text) {
		var columns = input_text[i].split(/\s+/);
		if (columns.length>2) {
			var start = parseInt(columns[1]);
			var end = parseInt(columns[2]);
			var score = parseFloat(columns[4]);
			if (isNaN(score)) {
				score = 0;
			}
			if (isNaN(start) || isNaN(end)) {
				user_message("Error","Bed file must contain numbers in columns 2 and 3. Found: <pre>" + columns[1] + " and " + columns[2] + "</pre>.");
				return;
			}
			_Features.push({"chrom":columns[0],"start":start, "end":end, "size": end - start, "name":columns[3] || "", "score":score ,"strand":columns[5],"type":columns[6] || ""});
		}
	}

	user_message("Info","Loaded " + _Features.length + " features from bed file");
	
	update_features();
	draw_region_view();
	draw();
	refresh_ui_elements();

	make_feature_type_table();
}



function open_feature_bed_file(event) {
	if (this.files[0].size > 1000000) {
		user_message("Warning","Loading large file may take a while.");
	}
	
	var file_extension = /[^.]+$/.exec(this.files[0].name)[0];
	if (file_extension == "bed") {
		var raw_data;
		var reader = new FileReader();
		reader.readAsText(this.files[0]);
		reader.onload = function(event) {
			raw_data = event.target.result;
			read_feature_bed(raw_data);
			features_just_loaded();
		}
	} else {
		user_message("Error","File extension must be .bed");
	}
}

d3.select("#variant_file").on("change",open_variant_file);
d3.select("#bedpe_file").on("change",open_bedpe_file);
d3.select("#feature_bed_file").on("change", open_feature_bed_file);

// ===========================================================================
// == Load coords file
// ===========================================================================


function open_coords_file(event) {
	console.log("in open_coords_file");
		
	var raw_data;
	var reader = new FileReader();

	if (this.files[0].size > 1000000) {
		user_message("Info","Loading large file may take a little while.");
	}

	reader.readAsText(this.files[0]);
	reader.onload = function(event) {
		raw_data = event.target.result;
		clear_coords_input();
		coords_input_changed(raw_data);
		d3.select("#collapsible_alignment_input_box").attr("class","panel-collapse collapse");
	}
	_settings.alignment_info_text = "Coords from file: " + this.files[0].name;
	set_alignment_info_text();
}

d3.select("#coords_file").on("change",open_coords_file);



function open_sam_file(event) {
	console.log("in open_sam_file");
		
	var raw_data;
	var reader = new FileReader();

	if (this.files[0].size > 10000000) {
		user_message("Error","File larger than 10MB. Please choose a smaller file or load it as a bam file instead");
		return;
	}
	if (this.files[0].size > 1000000) {
		user_message("Info","Loading large file may take a little while.");
	}

	reader.readAsText(this.files[0]);
	reader.onload = function(event) {
		raw_data = event.target.result;
		clear_sam_input();
		sam_input_changed(raw_data);
		d3.select("#collapsible_alignment_input_box").attr("class","panel-collapse collapse");
	}

	_settings.alignment_info_text = "Sam from file: " + this.files[0].name;
	set_alignment_info_text();
}

d3.select("#sam_file").on("change",open_sam_file);



// ===========================================================================
// == Load bam file
// ===========================================================================

function open_bam_file(event) {

	create_bam(event.target.files);
}

document.getElementById('bam_file').addEventListener('change',open_bam_file,false);

function create_bam(files) {

	// From bam.iobio, thanks Marth lab!
	if (files.length != 2) {
		 alert('must select both a .bam and .bai file');
		 return;
	}

	var fileType0 = /[^.]+$/.exec(files[0].name)[0];
	var fileType1 = /[^.]+$/.exec(files[1].name)[0];

	if (fileType0 == 'bam' && fileType1 == 'bai') {
		bamFile = files[0];
		baiFile = files[1];
	 } else if (fileType1 == 'bam' && fileType0 == 'bai') {
			bamFile = files[1];
			baiFile = files[0];
	 } else {
			alert('must select both a .bam and .bai file');
	 }
	_Bam = new Bam( bamFile, { bai: baiFile });

	_settings.alignment_info_text = "Bam from file: " + bamFile.name;
	set_alignment_info_text();

	wait_then_run_when_bam_file_loaded();
}


function wait_then_run_when_bam_file_loaded(counter) {
	if (counter == undefined) {
		counter = 0;
	} else if (counter > 30) {
		user_message("Error","File taking too long to load")
		return;
	}
	if (_Bam.header != undefined) {
		console.log("ready");
		bam_loaded();
	} else {
		console.log("waiting for data to load")
		window.setTimeout(function () {wait_then_run_when_bam_file_loaded(counter+1)},300)
	}
}

function clear_sam_input() {
	d3.select('#sam_input').property("value","");
}

function clear_coords_input() {
	d3.select('#coords_input').property("value","");
}
function clear_bed_input() {
	d3.select('#bed_input').property("value","");
}

function clear_vcf_input() {
	d3.select('#vcf_input').property("value","");
}



function bam_loaded() {
	_settings.current_input_type = "bam";
	// Check match refs from region view checkbox by default
	_settings.ref_match_chunk_ref_intervals = true;
	d3.select("#ref_match_region_view").property("checked",true);
	refresh_ui_for_new_dataset();
	reset_settings_for_new_dataset();

	clear_sam_input();
	clear_coords_input();

	clear_data();

	record_bam_header(_Bam.header.sq);

	organize_references_for_chunk();
	show_all_chromosomes();
	apply_ref_filters();

	reset_svg2();
	draw_chunk_ref();
	d3.select("#collapsible_alignment_input_box").attr("class","panel-collapse collapse");

	d3.select("#region_selector_panel").style("display","block");
	d3.select("#variant_input_panel").style("display","block");
	d3.select("#feature_input_panel").style("display","block");


	var PG_count = 0;
	var header_list = _Bam.header.toStr.split('\n');
	for (var i in header_list) {
		if (header_list[i].substr(0,3) == "@PG") {
			PG_count++;
		}
	}

	if (PG_count == 0) {
		user_message("Warning", "No header found. Are you sure this is a bam file?");
	}
	else if (PG_count == 1) {
		if (_Bedpe.length > 0 || _Variants.length > 0) {
			d3.select("#collapsible_variant_upload_box").attr("class","panel-collapse collapse");
			user_message("Info", "Loaded alignments from " + _Whole_refs.length + " reference sequences (chromosomes). Click on rows in the table to fetch reads in those regions.");
		} else {
			user_message("Info", "Loaded alignments from " + _Whole_refs.length + " reference sequences (chromosomes). Select a region to fetch reads or upload variants to inspect. ");	
		}	
	} else {
		user_message("Warning", "Bam files with multiple @PG header lines have been found to have issues fetching records. This bam file has " + PG_count + " lines starting with @PG. If you experience issues when fetching reads from this bam file, remove all @PG lines except one. Loaded alignments from " + _Whole_refs.length + " reference sequences (chromosomes).");
	}
	
	refresh_visibility();
}

function record_bam_header(sq_list) {
	// sq_list = [{name:  , end:}];

	_Ref_sizes_from_header = {};
	for (var i in sq_list) {
		_Ref_sizes_from_header[sq_list[i].name] = sq_list[i].end;
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
function remove_coords_file() {
	// For when sam input or coords text input changes, clear bam file to prevent confusion and enable switching back to the bam file
	d3.select('#coords_file').property("value","");
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


var _loading_bam_right_now = false;
function show_waiting_for_bam() {
	user_message("Info","Fetching bam records at position");
	d3.select("#region_go").property("disabled",true);
	d3.select("#region_go").html("Fetching...");
	d3.select("#region_go").style("color","gray");
	d3.selectAll(".fetch_table_button").html("...");
	_loading_bam_right_now = true;

	_svg2.select("#no_alignments_message")
			.attr("fill","blue")
			.text("Fetching from bam file...");
}

function show_bam_is_ready() {
	d3.select("#region_go").property("disabled",false);
	d3.select("#region_go").html("Go");
	d3.select("#region_go").style("color","black");
	d3.selectAll(".fetch_table_button").html("go to variant");
	_loading_bam_right_now = false;
}


var _Bam_records_from_multiregions = [];
var _num_loaded_regions = 0;
var _num_bam_records_to_load = 0;

function my_fetch(chrom, start, end, callback) {

	var padded_start = start - _settings.fetch_margin;
	if (padded_start < 0) {
		padded_start = 0;
	}
	var padded_end = end + _settings.fetch_margin;

	
	if (_Bam.sourceType == "url") {
		// var records = [];
		var rawRecords = "";
		var region = chrom + ":" + padded_start + "-" + padded_end;
		var cmd = new iobio.cmd(_Bam.iobio.samtools,['view', _Bam.bamUri, region], {ssl:_Bam.ssl,})
		cmd.on('error', function(error) {
			// console.log(error);
		})
		cmd.on('data', function(data, options) {
			rawRecords += data;
		});
		cmd.on('end', function() {
			callback(parse_bam_text(rawRecords));
		});

		cmd.run();
	} else {
		_Bam.fetch(chrom, padded_start, padded_end, callback);
	}
}

function fetch_regions(regions) {
	if (_Bam != undefined) {
		console.log("Fetching bam records at position");
		show_waiting_for_bam();

		_num_bam_records_to_load = regions.length;
		_num_loaded_regions = 0;
		_Bam_records_from_multiregions = [];

		for (var i in regions) {
			my_fetch(regions[i].chrom,regions[i].pos,regions[i].pos+1,use_additional_fetched_data);
		}
	} else {
		console.log("No bam file");
		user_message("Error","No bam file");
	}
}

function check_if_all_bam_records_loaded() {
	if (_num_loaded_regions >= _num_bam_records_to_load) {
		// All bam records loaded, now consolidate to prevent duplicate reads:
		console.log("Bam record finished loading");
		show_bam_is_ready();
		var consolidated_records = [];
		if (_settings.keep_duplicate_reads == false) {
			var used_readnames = {};
			for (var i in _Bam_records_from_multiregions) {
				if (used_readnames[_Bam_records_from_multiregions[i].readName] == undefined) {
					consolidated_records.push(_Bam_records_from_multiregions[i]);
					used_readnames[_Bam_records_from_multiregions[i].readName] = true;
				}
			}
		} else {
			consolidated_records = _Bam_records_from_multiregions;
		}
		_Bam_records_from_multiregions = []; // reset to empty

		// _settings.min_indel_size = _static.min_indel_size_for_region_view;
		_Chunk_alignments = [];
		for (var i in consolidated_records) {
			var parsed = parse_bam_record(consolidated_records[i]);
			if (parsed != undefined) {
				_Chunk_alignments.push(parsed);	
			}
		}
		chunk_changed();
		tell_user_how_many_records_loaded();

	}
}


function use_additional_fetched_data(records) {
	_Bam_records_from_multiregions = _Bam_records_from_multiregions.concat(records);
	_num_loaded_regions++;
	check_if_all_bam_records_loaded();
}

function go_to_region(chrom,start,end) {
	_focal_region = {"chrom":chrom,"start":start,"end":end};

	if (_Bam != undefined) {
		console.log("Fetching bam records at position");
		show_waiting_for_bam();

		my_fetch(chrom,start,end,use_fetched_data);
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
	if (raw_cigar == "*" || raw_cigar=="") {
		return undefined;
	}

	if (mq == undefined) {
		console.log("record missing mq");
		console.log(record);
	}
	
	var alignments = [];
	
	// console.log("parsing SA field");
	if (record.SA != undefined && record.SA != "") {
		alignments = parse_SA_field(record.SA);	
	}
	// console.log("done with SA field, reading primary cigar string");
	alignments.push(read_cigar(raw_cigar,chrom,rstart,strand,mq));

	var read_length = alignments[alignments.length-1].read_length;

	for (var i = 0; i < alignments.length; i++) {
		 if (alignments[i].read_length != read_length) {
				user_message("Warning", "read length of primary and supplementary alignments do not match for this read (calculated using cigar strings)");
		 }
	}

	return {"alignments": alignments, "raw":record, "raw_type":"bam", "readname":record.readName};

}

function parse_bam_text(bam_text) {
	var bam_records = [];
	var lines = bam_text.split("\n");

	for (var i = 0; i < lines.length; i++) {
		var columns = lines[i].split(/\s+/);
		if (columns[0][0] != "@" && columns.length >= 3) {
			if (columns.length >= 6) {
				var SA = "";
				// We only need the SA tag
				for (var j = 0; j < columns.length; j++) {
					if (columns[j].substr(0,2) == "SA") {
						SA = columns[j].split(":")[2];
					}
				}

				bam_records.push({"readName":columns[0],"segment":columns[2], "pos":parseInt(columns[3]), "flag":parseInt(columns[1]), "mq": parseInt(columns[4]), "cigar": columns[5], "SA":SA});

			}
		}
	}
	// console.log("done parsing bam text");

	// create list of BamRecords:
	// {"segment": "chr1","pos":48492988, "flag": 2048, "mq": 60, "cigar":"83984M382H", "tags": "NMskdjfkdjf SAsdkjfskdf etc"}
	return bam_records;

}

function use_fetched_data(records) {
	console.log("Bam record finished loading");

	show_bam_is_ready();
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

	// _settings.min_indel_size = _static.min_indel_size_for_region_view;
	_Chunk_alignments = [];
	for (var i in consolidated_records) {
		var parsed = parse_bam_record(consolidated_records[i]);
		if (parsed != undefined) {
			_Chunk_alignments.push(parsed);	
		}
	}
	chunk_changed();
	tell_user_how_many_records_loaded();
	
}

function tell_user_how_many_records_loaded() {
	if (_Chunk_alignments.length == 0) {
		_svg2.select("#no_alignments_message")
			.attr("fill","red")
			.text("No reads in the bam file at this location");
			
	} else {
		_svg2.select("#no_alignments_message")
			.attr("fill","white")
			.text("");
	}
	user_message("Info","Total reads mapped in region: " + _Chunk_alignments.length);
}

function region_submitted(event) {

	var chrom = d3.select("#region_chrom").property("value");
	if (chrom == "") {
		user_message("Error","No chromosome given");
		return;
	}
	var start = parseInt(d3.select("#region_start").property("value").replace(/,/g,""));


	if (isNaN(start) == true) {
		user_message("Error", "start value:" + d3.select("#region_start").property("value") + " could not be made into a number");
		return;
	} //else if (isNaN(end) == true) {
	// 	user_message("Error", "end value:" + d3.select("#region_end").property("value") + " could not be made into a number");
	// }

	var end = start + 1; //parseInt(d3.select("#region_end").property("value").replace(/,/g,""));


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

		_Additional_ref_intervals = [{"chrom":chrom,"start":start,"end":end}];
		d3.select("#text_region_output").html("Showing reads at position: " + chrom + ": " + start);
	} else {
		// console.log("Bad");
		user_message("Error","Chromosome does not exist in reference");
	}
}



d3.select("#region_go").on("click",region_submitted);
d3.select("#region_chrom").on("keyup",function(){ if (d3.event.keyCode == 13 && !_loading_bam_right_now) {region_submitted()} });
d3.select("#region_start").on("keyup",function(){ if (d3.event.keyCode == 13 && !_loading_bam_right_now) {region_submitted()} });
// d3.select("#region_end").on("keyup",function(){ if (d3.event.keyCode == 13) {region_submitted()} });


function submit_bam_url() {
	var url = d3.select("#bam_url_input").property("value");
	console.log(url);
	read_bam_url(url);

}
d3.select("#submit_bam_url").on("click",submit_bam_url);

if (splitthreader_data != "") {
	console.log("Found SplitThreader data");
	_Bedpe = [];
	for (var i in splitthreader_data) {
		_Bedpe.push({"chrom1":splitthreader_data[i].chrom1, "pos1":parseInt(splitthreader_data[i].pos1),"strand1": splitthreader_data[i].strand1,"chrom2":splitthreader_data[i].chrom2, "pos2":parseInt(splitthreader_data[i].pos2), "strand2": splitthreader_data[i].strand2,"name": splitthreader_data[i].variant_name, "score": splitthreader_data[i].score, "type":splitthreader_data[i].variant_type});
	}
	user_message("Instructions","You have loaded rearrangements from SplitThreader! Now select a bam file above to view read alignments in those regions.");
	$('.nav-tabs a[href="#bam"]').tab('show');


	update_bedpe();
	draw_region_view();
	refresh_ui_elements();
}

window.addEventListener("beforeunload", function (e) {
	var confirmationMessage = 'Leave Ribbon?';

	(e || window.event).returnValue = confirmationMessage; //Gecko + IE
	return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
});



// ===========================================================================
// == Responsiveness
// ===========================================================================


// Resize SVG and sidebar when window size changes
window.onresize = resizeWindow;


function resizeWindow() {
	responsive_sizing();
}


run();
open_any_url_files();
