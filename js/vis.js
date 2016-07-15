
// Calculations for drawing and spacing out elements on the screen

var _padding = {};
var _layout = {};
var _positions;

// Elements on the page
var _svg;

var _svg2; // for read selection

// Data for visualization
var _current_read_index = 0;

var _Chunk_alignments = [];
var _Alignments = [];
var _Ref_intervals = [];
var _Whole_refs = [];

// Reading bam file
var _Bam = undefined;
var _Ref_sizes_from_header = {};

// Selecting region
var _region = {}; // chrom, start, end


// Various global variables to capture UI settings and static variables
var _static = {};
_static.alignment_alpha = 0.5;
_static.ref_interval_padding_fraction = 0;
_static.dotplot_ref_opacity = 0.5;
_static.colors = ["#ff9896", "#c5b0d5", "#8c564b", "#e377c2", "#bcbd22", "#9edae5", "#c7c7c7", "#d62728", "#ffbb78", "#98df8a", "#ff7f0e", "#f7b6d2", "#c49c94", "#dbdb8d", "#aec7e8", "#17becf", "#2ca02c", "#7f7f7f", "#1f77b4", "#9467bd"];

var _settings = {};
_settings.ribbon_vs_dotplot = "ribbon";
_settings.min_mapping_quality = 0;
_settings.min_indel_size = -1; // set to -1 to stop showing indels
_settings.colorful = true;
_settings.ribbon_outline = true;
_settings.show_only_known_references = false;
_settings.keep_duplicate_reads = false;


var _ui_properties = {};
_ui_properties.mq_slider_max = 0;
_ui_properties.indel_size_slider_max = 0;


// Scales for visualization
var _scales = {};
_scales.read_scale = d3.scale.linear();
_scales.whole_ref_scale = d3.scale.linear();
_scales.ref_interval_scale = d3.scale.linear();
_scales.ref_color_scale = d3.scale.ordinal().range(_static.colors);


// Soon to be deprecated: keep for testing read selection
var table;

// How sam table looks
var header = ["selected","read","alignments","chromosomes","min MQ","max MQ"];
var size_readname = 20;
var arrow_color = {"on":"#009900","off":"#cccccc"};
var colors = {"read":"black","ref_block":"green"};



var _tooltip = {};
var show_tooltip = function(text,x,y) {
	_svg.selectAll("g.tip").remove();
	_tooltip.g = _svg.append("g").attr("class","tip");
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

	draw();
}

// For sliders, using .change() would make it run only when user releases slider
$('#mq_slider').bind('input propertychange', function() {
	d3.select("#mq_label").text(this.value);
	_settings.min_mapping_quality = this.value;
	draw();
});

$('#indel_size_slider').bind('input propertychange', function() {
	
	_settings.min_indel_size = this.value;
	if (_settings.min_indel_size > _ui_properties.indel_size_slider_max) {
		// If we go above the maximum, put infinity
		min_indel_size = -1;
		d3.select("#indel_size_label").text("inf");
	} else {
		d3.select("#indel_size_label").text(this.value);
	}
	select_read(); // need to reparse the cigar string, so reselect the read. select_read() includes draw function

});

$('#only_header_refs_checkbox').change(function() {
	_settings.show_only_known_references = this.checked;
	if (_settings.show_only_known_references == false) {
		user_message("Info","Showing chromosome sizes as 2X the maximum alignment observed");
	}
	select_read(); // need to reorganize the references used, not just redraw
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

function hide_results() {
	d3.select("#select_reads").style("visibility","hidden"); // just the label
	table.style("visibility","hidden");
	d3.select("#settings").style('visibility','hidden');
	d3.select("#svg1_panel").style('visibility','hidden');
	d3.select("#svg2_panel").style('visibility','hidden');
}

function show_results() {
	d3.select("#select_reads").style("visibility","visible"); // just the label
	table.style("visibility","visible");
	d3.select("#settings").style('visibility','visible');
	d3.select("#svg1_panel").style('visibility','visible');
	d3.select("#svg2_panel").style('visibility','visible');
}


function draw_chunk_of_alignments() {

	//////////////////////////   Table read picker   //////////////////////////
	// Add all alignments to the table
	table.selectAll("tr").remove();
	table.append("tr").selectAll("th").data(header).enter().append("th").text(function(d){return d;});

	var rows = table.selectAll("tr.data").data(_Chunk_alignments).enter()
		.append("tr").attr("class","data");
	
	rows.append("td").append("span").attr("class","glyphicon glyphicon-arrow-right").style("color",arrow_color.off).on("click",function(d,i) {_current_read_index = i; select_read();});
	
	rows.selectAll("td.data").data(function(read){return parse_record_for_table(read);}).enter()
					.append("td").text(function(d){return d;}).attr("class","data");


	///////////////////////////////////////////////////////////////////////////

	reset_svg2();

	console.log(_Chunk_alignments);







}



function sam_input_changed(sam_input_value) {
		// console.log(d3.select('#sam_input').value);
		var input_text = sam_input_value.split("\n");
		_Ref_sizes_from_header = {};
		_Chunk_alignments = [];
		var unique_readnames = {};

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
		
		// Show results only if there is anything to show
		if (_Chunk_alignments.length > 0) {
			_current_read_index = 0;
			draw_chunk_of_alignments();
			select_read();
			show_results();
		} else {
			hide_results();
			user_message("","");
		}
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
	// console.log("Running");
	responsive_sizing();
	// Read files or input data
	// Run when all data loaded
}

function dict_length(dictionary) {
	var num = 0;
	for (var k in dictionary) {num++;}
	return num;
}


function parse_record_for_table(read_record) {
	
	var fields_to_show = [];
	if (read_record.readname.length>size_readname) {
		fields_to_show.push("..."+read_record.readname.substr(read_record.readname.length-size_readname,read_record.readname.length));	
	} else {
		fields_to_show.push(read_record.readname);	
	}
	var all_chrs = {};
	var max_mq = 0;
	var min_mq = 100000;
	for (var i in read_record.alignments) {
		if (read_record.alignments[i].mq > max_mq) {
			max_mq = read_record.alignments[i].mq
		}
		if (read_record.alignments[i].mq < min_mq) {
			min_mq = read_record.alignments[i].mq
		}
		all_chrs[read_record.alignments[i].r] = true;
	}
	fields_to_show.push(read_record.alignments.length);
	fields_to_show.push(dict_length(all_chrs));
	fields_to_show.push(min_mq);
	fields_to_show.push(max_mq);


	return fields_to_show;
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
	var aligns = sa.split(":")[2].split(";");
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
		d3.select("#user_message").html("").style("visibility","hidden");
	} else {
		d3.select("#user_message").style("visibility","visible");
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
				message_style="default";
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
	}alignment.max_indel
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
			alignments = parse_SA_field(fields[i]);
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
				intervals.push([most_recent_start,starts_and_stops[i][0]]);
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
		console.log("No function yet to get alignment coordinates from bam record");
	} else {
		console.log("Don't recognize record_from_chunk.raw_type, must be sam or bam");
	}
}

function select_read() {
	var readname = _Chunk_alignments[_current_read_index].readname;

	table.selectAll("span").style("color",function(d) {if (d.readname == readname) {return arrow_color.on} else {return arrow_color.off}});

	user_message("","");
	
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
		
		d3.select('#mq_slider').property("max", _ui_properties.mq_slider_max);
		d3.select("#indel_size_slider").property("max",_ui_properties.indel_size_slider_max+1);
	
	}
	

	organize_references();

	_scales.read_scale.domain([0,_Alignments[_Alignments.length-1].read_length]);

	
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

function ref_mapping_path_generator(d) {

		var bottom = {};
		var top = {};

		bottom.y = _positions.ref_intervals.y;
		bottom.left = _scales.ref_interval_scale(d.cum_pos);
		bottom.right = bottom.left + _scales.ref_interval_scale(d.end)-_scales.ref_interval_scale(d.start);

		top.y = _positions.ref_block.y + _positions.ref_block.height;
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

function organize_references() {
	////////////////   Select reference chromosomes to show:   ////////////////////
	// Gather starts and ends for each chromosome
	var ref_pieces = {};
	for (var i = 0; i < _Alignments.length; i++) {
		if (ref_pieces[_Alignments[i].r] == undefined) {
			ref_pieces[_Alignments[i].r] = [];
		}
		var interval = [_Alignments[i].rs,_Alignments[i].re];
		
		var interval_length = Math.abs(_Alignments[i].rs-_Alignments[i].re);
		var padding = Math.round(interval_length*_static.ref_interval_padding_fraction);

		ref_pieces[_Alignments[i].r].push([Math.min.apply(null,interval) - padding,"s"]);
		ref_pieces[_Alignments[i].r].push([Math.max.apply(null,interval) + padding,"e"]);
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


	_Ref_intervals = [];
	var cumulative_position = 0;
	for (var j = 0; j < chromosomes.length; j++){
		var chrom = chromosomes[j];
		var intervals = ref_intervals_by_chrom[chrom];
		for (var i = 0; i < intervals.length; i++) {
			_Ref_intervals.push({"chrom":chrom,"start":intervals[i][0],"end":intervals[i][1],"size":intervals[i][1]-intervals[i][0],"cum_pos":cumulative_position});
			cumulative_position += (intervals[i][1]-intervals[i][0])
		}
	}
	
	_scales.ref_interval_scale.domain([0,cumulative_position]);
}

function draw() {
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

	if (_Alignments == undefined) {
		return;
	}

	// Make square
	_positions = {};
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
				var text = d.chrom;
				var x = _positions.canvas.x + _scales.ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
				var y = _positions.canvas.y + _positions.canvas.height - _padding.text;
				show_tooltip(text,x,y);
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
					show_tooltip(text,x,y);
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
	_positions = {};
	_positions.read = {"y":_layout.svg_height*0.75, "x":_layout.svg_width*0.10, "width":_layout.svg_width*0.80, "height":_layout.svg_height*0.03};
	_positions.ref_block = {"y":_layout.svg_height*0.15, "x":_layout.svg_width*0.10, "width":_layout.svg_width*0.80, "height":_layout.svg_height*0.03};
	_positions.ref_intervals = {"y":_layout.svg_height*0.35, "x":_layout.svg_width*0.10, "width":_layout.svg_width*0.80, "height":_layout.svg_height*0.03};

	// Draw read
	_svg.append("rect").attr("class","read").attr("x",_positions.read.x).attr("y",_positions.read.y).attr("width",_positions.read.width).attr("height",_positions.read.height).style("stroke-width",1).style("stroke", "black").attr("fill",colors.read)
		.on('mouseover', function() {
			var text = "read: " + _Alignments[_Alignments.length-1].read_length + " bp";
			var x = _positions.read.x+_positions.read.width/2;
			var y = _positions.read.y+_positions.read.height*3.5;
			show_tooltip(text,x,y);
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
				var text = d.chrom;
				var x = _scales.whole_ref_scale(d.cum_pos + d.size/2);
				var y = _positions.ref_block.y - _padding.text;
				show_tooltip(text,x,y);
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
				var text = d.chrom;
				var x = _scales.ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
				var y = _positions.ref_intervals.y - _padding.text;
				show_tooltip(text,x,y);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

	_svg.selectAll("path.ref_mapping").data(_Ref_intervals).enter()
		.append("path").attr("class","ref_mapping")
			.filter(function(d) {return map_whole_ref(d.chrom,d.start) != undefined;})
				.attr("d",function(d) {return ref_mapping_path_generator(d)})
				// .style("stroke-width",2)
				// .style("stroke","black")
				.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})


	// Alignments
	_svg.selectAll("path.alignment").data(_Alignments).enter()
		.append("path")
			.filter(function(d) {return d.mq >= _settings.min_mapping_quality})
			.attr("class","alignment")
			.attr("d",function(d) {return ribbon_alignment_path_generator(d)})
			.style("stroke-width",function() { if (_settings.ribbon_outline) {return 1;} else {return 0;} })
			.style("stroke","black")
			.style("stroke-opacity",1)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.r);})
			.attr("fill-opacity",_static.alignment_alpha)
			.on('mouseover', function(d) {
				var text = Math.abs(d.qe-d.qs) + " bp"; 
				var x = _scales.read_scale((d.qs+d.qe)/2);
				var y = _positions.read.y - _padding.text;
				show_tooltip(text,x,y);
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
				.html("Settings <span class='caret'></span>")
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
	record_bam_header();
}

function record_bam_header() {
	
	// console.log(bam); 
	// console.log( bam.bam.indices[bam.bam.chrToIndex["chr2"]] );

	// console.log(bam.header.sq);
	_Ref_sizes_from_header = {};
	for (var i in _Bam.header.sq) {
		_Ref_sizes_from_header[_Bam.header.sq[i].name] = _Bam.header.sq[i].end;
	}
	// console.log(_Ref_sizes_from_header);

}



// ===========================================================================
// == Select region
// ===========================================================================


// function check_region_exists(chrom,start,end) {
// 	// _Whole_refs has chrom, size, cum_pos

// 	for (var i = 0; i < _Whole_refs.length; i++) {
// 		if (_Whole_refs[i].chrom == chrom) {
// 			if (start < 0 || end < 0) {
// 				return false;
// 			}
// 			else if (start > _Whole_refs[i].size || end > _Whole_refs[i].size) {
// 				return false;
// 			} else {
// 				return true;
// 			}
// 		}
// 	}
// 	return false;
// }

function get_chrom_index(chrom) {
	for (var i = 0; i < _Whole_refs.length; i++) {
		if (_Whole_refs[i].chrom == chrom || _Whole_refs.chrom == "chr" + chrom) {
			return i;
		}
	} 
	return undefined;
}

function go_to_region(chrom,start,end) {

	if (_Bam != undefined) {
		_Bam.fetch(chrom,start,end,use_fetched_data);
	} else {
		console.log("No bam file");
		user_message("Error","No bam file");
	}

}

//////////////////////////////    Fetch bam data from a specific region  //////////////////////////////

function use_fetched_data(records) {
	// console.log("use_fetched_data()");
	// console.log(records);

	var consolidated_records = [];
	var used_readnames = {};
	for (var i in records) {
		if (used_readnames[records[i].readName] == undefined) {
			consolidated_records.push(records[i]);
			used_readnames[records[i].readName] = true;
		}
	}

	console.log(consolidated_records);

}


function region_submitted(event) {

	var chrom = d3.select("#region_chrom").property("value");
	var start = parseInt(d3.select("#region_start").property("value").replace(/,/g,""));
	var end = parseInt(d3.select("#region_end").property("value").replace(/,/g,""));

	if (isNaN(start) == true) {
		user_message("Error", "start value:" + d3.select("#region_start").property("value") + " could not be made into a number");
	} else if (isNaN(end) == true) {
		user_message("Error", "end value:" + d3.select("#region_end").property("value") + " could not be made into a number");
	}

	var chrom_index = get_chrom_index(chrom);
	if (chrom_index != undefined) {
		console.log("Good");
		chrom = _Whole_refs[chrom_index].chromosome;
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
		d3.select("#region_end").property("value",end);

	} else {
		// console.log("Bad");
		user_message("Error","Chromosome does not exist in reference");
	}


	go_to_region(chrom,start,end);

	// Return false to prevent page re-load
	return false;  
}

d3.select("#region_go").on("click",region_submitted);
d3.select("#region_chrom").on("keyup",function(){ if (d3.event.keyCode == 13) {region_submitted()} });
d3.select("#region_start").on("keyup",function(){ if (d3.event.keyCode == 13) {region_submitted()} });
d3.select("#region_end").on("keyup",function(){ if (d3.event.keyCode == 13) {region_submitted()} });


// ===========================================================================
// == Responsiveness
// ===========================================================================


// Resize SVG and sidebar when window size changes
window.onresize = resizeWindow;

function resizeWindow() {
	responsive_sizing();
}

run();



// Real data:
// m150516_160506_sherri_c100800332550000001823168409091513_s1_p0/96017/7541_25822 2048  chr2  32866713  60  4817H11M1D5M1D90M2I124M3I59M1D81M2I11M2I33M13041H * 0 0 CTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTGCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTATTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTGTTCTTTTTTTTACTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTC * NM:i:40 MD:Z:11^C5^C15C27C5C4C31C5C21C13C2C21C4C50C12C21C1C22T3^C11C2C3C5C1C1C7T2C6C6C32C13C24  AS:i:339  XS:i:94 SA:Z:chr8,120735173,-,14677S24M1I11M1I13M3I16M2D11M2I6M1I10M1D7M1D10M1D4M1I13M3I17M1I14M2I3M1I5M1D11M2I7M1I6M3I14M1I12M4I4M5I2M1I2M1I2M1I42M1D4M2D16M2I16M3I2M1I15M2I55M1D2M1D8M1D5M1D8M3D18M1I10M1I11M1I29M1D13M2I1M1I23M2I6M2I11M1I7M1I19M2I9M1I5M1D10M1I19M1I15M1D1M1D5M1D5M1D11M2D8M1D11M1I5M1D1M1D26M1I48M1I32M1D13M1D6M1I42M1I40M1D6M1I10M2I14M1I15M1D6M1D5M1I4M1I14M2I30M1I2M1I29M1I14M1I13M1I24M1D10M1I17M2D14M1I6M1D1M2D3M2I10M2I10M1D82M1I4M2D8M1D3M1D4M1I5M1I2M1I13M1D13M1I29M2I27M1I18M1I15M1D6M1D27M1D4M1I43M1D6M1D9M1D1M1D7M1I43M2I16M1D8M1D3M1D6M1D6M1I35M1I7M3D1M2D3M1D13M1D3M1D8M1D2M1D6M1I24M2D5M1I6M1I15M1D16M1I17M1I4M1D3M1D2M1I52M2I16M1I12M1D5M1I4M1D10M2I2M3I35M1D18M1I28M2I33M1I15M1D1M1D7M2D8M3D12M1I10M1D29M1D20M1I46M2I2M1I9M2I9M1D11M1D22M1D48M1D17M1I36M1D10M1I17M1I12M1I7M1I7M1I12M1D8M1D27M1I6M1I18M1I18M1D29M1I7M1I11M1I16M1I30M1D11M1I14M1D17M1I28M1D11M1I15M5D3M4D1M2D2M3D20M2D1M3D8M1D3M1D13M1D5M14D22M1I12M1D11M1I19M1I14M1I7M2D2M1D4M1I5M1I13M1D9M1I9M1I8M1D1M1D9M2D4M1D4M3D6M1I12M1D8M1I7M1I15M2D3M1D5M1D1M3D16M2I6M1D13M1I9M1I22M1I11M1D5M1I18M1D20M2D8M1I6M1I60M1I17M2I3M1I25M2I31M1I5M2I11M1I16M1I5M1I14M1D11M2I24M1I3M1I9M1D15M1I8M1I3M1I4M1I7M2I1M1I46M1I2M1I6M2I29M1D4M1D10M1I12M1D24M71S,60,444;chr2,32866714,+,17490S98M2I78M1I59M2I29M1I104M1I47M369S,11,38;chr2,32866714,+,11645S82M1I102M5I56M3I86M1I26M1I2M1I54M1I7M6208S,0,41;chr2,32866714,+,12802S137M1I38M1D21M1D73M3I10M1I21M1D41M1D18M1D51M5064S,0,37;chr2,32866714,+,5756S81M1I54M1I133M3I123M2I4M1I20M12102S,60,40;chr2,32866714,+,15361S87M3I203M1D18M1D5M1D99M2505S,0,38;chr2,32866714,+,10983S89M1I112M2I54M1I89M3I1M1I70M6875S,6,39;chr2,32866714,+,5415S49M2I158M1I8M2I31M1I2M1I167M12444S,0,40;chr2,32866714,+,5077S15M2D43M1D58M1I26M1D2M1D114M1D53M1D17M2I57M1I23M12792S,60,37;chr2,32866715,+,15837S23M1I25M1I97M2I13M1I20M1I47M1D12M1D123M1D51M2027S,7,38;chr2,32866713,+,14900S30M1I61M2I29M1I107M1D180M2I8M2960S,3,41;chr2,32866714,+,11323S10M1I48M1I38M1I34M1I28M2I4M1I3M1I11M2I70M2I13M1I21M1I22M1I3M1D3M1D105M6530S,60,41;chr2,32866714,+,9045S50M1I81M3I30M6I100M2I83M1D38M1I32M8809S,9,44;chr2,32866714,+,14275S41M1I90M1I5M1I11M2D106M2I56M1I27M1D78M3586S,60,41;chr2,32866714,+,6788S66M1D4M1D71M1I3M1I87M1I40M1I123M2I18M11075S,0,41;chr2,32866714,+,7732S60M1D10M1D126M2D46M1I39M2I48M1I34M1I48M10133S,6,41;chr2,32866714,+,9334S406M2I5M1I4M8529S,60,43;chr2,32866714,+,8054S134M1I87M4I7M5I77M1D38M1D71M9803S,8,46;chr2,32866714,+,7288S94M1I2M1I61M1I94M1I22M1I22M3I14M1D74M1I14M1I2M1I15M10568S,3,44;chr2,32866714,+,13125S66M2I5M1D98M1D4M1D75M2I2M2I20M1I3M1I29M1D4M1I41M1I13M3I13M1I38M4731S,60,44;chr2,32866714,+,16700S42M1I4M1I2M3I38M1I11M1I55M1I42M1I131M3I68M1I9M1I13M1152S,4,47;chr2,32866716,+,6442S42M1I5M1I25M1I48M1I6M1I140M1I51M1D39M2I42M1I14M11418S,60,45;chr2,32866714,+,4138S226M1D12M1D75M2I86M7I15M13720S,60,49;chr2,32866714,+,12338S66M6I37M1I10M3I6M1I11M2I2M1I60M1I61M1I79M1I83M5511S,60,49;chr2,32866714,+,13343S36M2I49M3I5M1I35M1I10M1I8M2I15M2I4M1I81M1I33M1I18M1I24M3I21M1I71M1I5M4502S,60,52;chr2,32866714,+,8410S54M1I25M3I80M1I21M3I38M3I13M3I44M2I42M1I22M3I35M1D41M9436S,60,54;chr2,32866714,+,10098S25M4I27M1I22M1I18M1I87M1I41M2I29M1I5M1I25M6I62M4I21M1I36M1I13M1I4M7743S,60,56;chr7,107769994,+,11959S49M1D6M1D52M1I79M5D88M6047S,58,55;chr7,107769994,+,13974S22M1I22M1D72M1I70M4I94M4021S,45,61;chr7,107769889,+,3801S6M2D7M2I7M2I3M1I17M2I3M1D6M1D9M1I16M2D13M1D4M2I4M2D7M2I10M1D5M1I12M1I15M1D15M5I2M1I29M6I5M1I7M1D2M1D6M1I12M1I2M1I3M1I4M4I10M1I10M4I11M2I106M14070S,19,145;chr20,34228126,+,6152S101M2D65M11963S,12,34;chr20,34228129,+,15247S67M2D34M6D56M2877S,26,33;chr20,34228129,+,12162S67M2D13M1D8M1D12M4D2M1D54M5963S,16,33;chr20,34228130,+,17865S2M1D63M1D3M1D65M283S,34,20;chr20,34228129,+,4746S137M13398S,3,22;chr12,66057593,+,10707S91M7483S,0,0;chr20,34228128,+,15735S4M1D82M3I51M2406S,24,24;chr12,66057585,+,10634S66M1I32M7548S,40,4;chr20,34228129,+,4649S4M1I133M13494S,3,24;chr12,66057593,+,10529S4M1I87M7660S,7,1;chr12,66057592,+,7220S63M1I20M1I8M10968S,19,2;chr21,9321880,+,13716S125M3D23M4D23M1D28M1D14M1D68M1D9M1D15M2D58M4202S,2,142;hs38d1,1692600,+,9918S12M3D58M2I55M8236S,6,22;chrX,40110630,+,18120S23M1D72M66S,1,6;chr18,63063646,+,16638S102M1541S,16,11;chr18,63063640,+,18036S4M2D23M1D3M1D6M1D62M1I5M141S,14,14;chr4,94340260,+,4544S5M1D27M1I60M1I4M13639S,26,12;hs38d1,2589320,+,8988S9M1D98M1I5M9180S,5,21;chr9,122765980,-,7266S52M1D61M2D10M10892S,5,27;chr4,19077839,+,8853S51M1I31M2I8M9335S,6,11;chr5,115298251,-,939S63M3D28M1D61M17190S,3,43;hs38d1,417546,-,797S5M2D58M1D11M3I8M17399S,0,9;chr10,109812363,+,6302S6M1I48M1I1M1I37M11884S,13,14;chr10,86453018,-,3477S5M1I55M3D7M3D43M14693S,0,25;chr19,54998523,+,16401S14M3D55M4D57M1754S,6,34;chr4,49273694,-,11803S5M1I73M1D15M6384S,0,17;chr8,111156003,+,12292S59M5930S,0,0;chr19,8268620,-,874S67M17340S,0,4;chr4,49273694,-,7377S7M1I45M1D2M1D3M1D7M3D24M10815S,4,16;chr4,49273694,-,3976S42M1I46M14216S,0,15;chr2,87907398,-,1613S69M2D22M16577S,0,18;chr8,47331937,+,17149S12M3D10M4D24M1I25M1060S,48,12;chr15,54926030,+,12752S49M1I6M5473S,3,2;chr10,68797478,+,7688S51M10542S,60,0;chr19,36467791,-,9299S62M8920S,13,6;chr2,109851185,-,1916S43M1D2M1D5M2D6M2D1M1D27M4D35M16246S,0,37;chr5,95492637,-,8180S5M1I46M3I15M10031S,0,9;chr10,114138038,-,8359S44M2I9M9867S,10,3;chr3,119174994,+,9786S9M1I41M2I4M8438S,60,4;chr7,102466752,+,16547S43M1691S,60,0;  RG:Z:SKBR3-MHC-598BB67
// m150516_160506_sherri_c100800332550000001823168409091513_s1_p0/96017/7541_25822 2048  chr2  32866713  3 14900H30M1I61M2I29M1I107M1D180M2I8M2960H  * 0 0 CTTTTTTTTTTTTTCTGCTTTTTTTTTTTTCTTTTGTTTTTTTTTTTTTTTTTTTTTTTTTGCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTGTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCCTTTTTTTT * NM:i:41 MD:Z:11C2T1T16C0T25T6C4C28C2C5C21C13C2C21C4C50^C12C21C1C2C23C11C2C3C5C1C1C10C6C6C18C10C2C13C23  AS:i:335  XS:i:332  SA:Z:chr8,120735173,-,14677S24M1I11M1I13M3I16M2D11M2I6M1I10M1D7M1D10M1D4M1I13M3I17M1I14M2I3M1I5M1D11M2I7M1I6M3I14M1I12M4I4M5I2M1I2M1I2M1I42M1D4M2D16M2I16M3I2M1I15M2I55M1D2M1D8M1D5M1D8M3D18M1I10M1I11M1I29M1D13M2I1M1I23M2I6M2I11M1I7M1I19M2I9M1I5M1D10M1I19M1I15M1D1M1D5M1D5M1D11M2D8M1D11M1I5M1D1M1D26M1I48M1I32M1D13M1D6M1I42M1I40M1D6M1I10M2I14M1I15M1D6M1D5M1I4M1I14M2I30M1I2M1I29M1I14M1I13M1I24M1D10M1I17M2D14M1I6M1D1M2D3M2I10M2I10M1D82M1I4M2D8M1D3M1D4M1I5M1I2M1I13M1D13M1I29M2I27M1I18M1I15M1D6M1D27M1D4M1I43M1D6M1D9M1D1M1D7M1I43M2I16M1D8M1D3M1D6M1D6M1I35M1I7M3D1M2D3M1D13M1D3M1D8M1D2M1D6M1I24M2D5M1I6M1I15M1D16M1I17M1I4M1D3M1D2M1I52M2I16M1I12M1D5M1I4M1D10M2I2M3I35M1D18M1I28M2I33M1I15M1D1M1D7M2D8M3D12M1I10M1D29M1D20M1I46M2I2M1I9M2I9M1D11M1D22M1D48M1D17M1I36M1D10M1I17M1I12M1I7M1I7M1I12M1D8M1D27M1I6M1I18M1I18M1D29M1I7M1I11M1I16M1I30M1D11M1I14M1D17M1I28M1D11M1I15M5D3M4D1M2D2M3D20M2D1M3D8M1D3M1D13M1D5M14D22M1I12M1D11M1I19M1I14M1I7M2D2M1D4M1I5M1I13M1D9M1I9M1I8M1D1M1D9M2D4M1D4M3D6M1I12M1D8M1I7M1I15M2D3M1D5M1D1M3D16M2I6M1D13M1I9M1I22M1I11M1D5M1I18M1D20M2D8M1I6M1I60M1I17M2I3M1I25M2I31M1I5M2I11M1I16M1I5M1I14M1D11M2I24M1I3M1I9M1D15M1I8M1I3M1I4M1I7M2I1M1I46M1I2M1I6M2I29M1D4M1D10M1I12M1D24M71S,60,444;chr2,32866714,+,17490S98M2I78M1I59M2I29M1I104M1I47M369S,11,38;chr2,32866714,+,11645S82M1I102M5I56M3I86M1I26M1I2M1I54M1I7M6208S,0,41;chr2,32866713,+,4817S11M1D5M1D90M2I124M3I59M1D81M2I11M2I33M13041S,60,40;chr2,32866714,+,12802S137M1I38M1D21M1D73M3I10M1I21M1D41M1D18M1D51M5064S,0,37;chr2,32866714,+,5756S81M1I54M1I133M3I123M2I4M1I20M12102S,60,40;chr2,32866714,+,15361S87M3I203M1D18M1D5M1D99M2505S,0,38;chr2,32866714,+,10983S89M1I112M2I54M1I89M3I1M1I70M6875S,6,39;chr2,32866714,+,5415S49M2I158M1I8M2I31M1I2M1I167M12444S,0,40;chr2,32866714,+,5077S15M2D43M1D58M1I26M1D2M1D114M1D53M1D17M2I57M1I23M12792S,60,37;chr2,32866715,+,15837S23M1I25M1I97M2I13M1I20M1I47M1D12M1D123M1D51M2027S,7,38;chr2,32866714,+,11323S10M1I48M1I38M1I34M1I28M2I4M1I3M1I11M2I70M2I13M1I21M1I22M1I3M1D3M1D105M6530S,60,41;chr2,32866714,+,9045S50M1I81M3I30M6I100M2I83M1D38M1I32M8809S,9,44;chr2,32866714,+,14275S41M1I90M1I5M1I11M2D106M2I56M1I27M1D78M3586S,60,41;chr2,32866714,+,6788S66M1D4M1D71M1I3M1I87M1I40M1I123M2I18M11075S,0,41;chr2,32866714,+,7732S60M1D10M1D126M2D46M1I39M2I48M1I34M1I48M10133S,6,41;chr2,32866714,+,9334S406M2I5M1I4M8529S,60,43;chr2,32866714,+,8054S134M1I87M4I7M5I77M1D38M1D71M9803S,8,46;chr2,32866714,+,7288S94M1I2M1I61M1I94M1I22M1I22M3I14M1D74M1I14M1I2M1I15M10568S,3,44;chr2,32866714,+,13125S66M2I5M1D98M1D4M1D75M2I2M2I20M1I3M1I29M1D4M1I41M1I13M3I13M1I38M4731S,60,44;chr2,32866714,+,16700S42M1I4M1I2M3I38M1I11M1I55M1I42M1I131M3I68M1I9M1I13M1152S,4,47;chr2,32866716,+,6442S42M1I5M1I25M1I48M1I6M1I140M1I51M1D39M2I42M1I14M11418S,60,45;chr2,32866714,+,4138S226M1D12M1D75M2I86M7I15M13720S,60,49;chr2,32866714,+,12338S66M6I37M1I10M3I6M1I11M2I2M1I60M1I61M1I79M1I83M5511S,60,49;chr2,32866714,+,13343S36M2I49M3I5M1I35M1I10M1I8M2I15M2I4M1I81M1I33M1I18M1I24M3I21M1I71M1I5M4502S,60,52;chr2,32866714,+,8410S54M1I25M3I80M1I21M3I38M3I13M3I44M2I42M1I22M3I35M1D41M9436S,60,54;chr2,32866714,+,10098S25M4I27M1I22M1I18M1I87M1I41M2I29M1I5M1I25M6I62M4I21M1I36M1I13M1I4M7743S,60,56;chr7,107769994,+,11959S49M1D6M1D52M1I79M5D88M6047S,58,55;chr7,107769994,+,13974S22M1I22M1D72M1I70M4I94M4021S,45,61;chr7,107769889,+,3801S6M2D7M2I7M2I3M1I17M2I3M1D6M1D9M1I16M2D13M1D4M2I4M2D7M2I10M1D5M1I12M1I15M1D15M5I2M1I29M6I5M1I7M1D2M1D6M1I12M1I2M1I3M1I4M4I10M1I10M4I11M2I106M14070S,19,145;chr20,34228126,+,6152S101M2D65M11963S,12,34;chr20,34228129,+,15247S67M2D34M6D56M2877S,26,33;chr20,34228129,+,12162S67M2D13M1D8M1D12M4D2M1D54M5963S,16,33;chr20,34228130,+,17865S2M1D63M1D3M1D65M283S,34,20;chr20,34228129,+,4746S137M13398S,3,22;chr12,66057593,+,10707S91M7483S,0,0;chr20,34228128,+,15735S4M1D82M3I51M2406S,24,24;chr12,66057585,+,10634S66M1I32M7548S,40,4;chr20,34228129,+,4649S4M1I133M13494S,3,24;chr12,66057593,+,10529S4M1I87M7660S,7,1;chr12,66057592,+,7220S63M1I20M1I8M10968S,19,2;chr21,9321880,+,13716S125M3D23M4D23M1D28M1D14M1D68M1D9M1D15M2D58M4202S,2,142;hs38d1,1692600,+,9918S12M3D58M2I55M8236S,6,22;chrX,40110630,+,18120S23M1D72M66S,1,6;chr18,63063646,+,16638S102M1541S,16,11;chr18,63063640,+,18036S4M2D23M1D3M1D6M1D62M1I5M141S,14,14;chr4,94340260,+,4544S5M1D27M1I60M1I4M13639S,26,12;hs38d1,2589320,+,8988S9M1D98M1I5M9180S,5,21;chr9,122765980,-,7266S52M1D61M2D10M10892S,5,27;chr4,19077839,+,8853S51M1I31M2I8M9335S,6,11;chr5,115298251,-,939S63M3D28M1D61M17190S,3,43;hs38d1,417546,-,797S5M2D58M1D11M3I8M17399S,0,9;chr10,109812363,+,6302S6M1I48M1I1M1I37M11884S,13,14;chr10,86453018,-,3477S5M1I55M3D7M3D43M14693S,0,25;chr19,54998523,+,16401S14M3D55M4D57M1754S,6,34;chr4,49273694,-,11803S5M1I73M1D15M6384S,0,17;chr8,111156003,+,12292S59M5930S,0,0;chr19,8268620,-,874S67M17340S,0,4;chr4,49273694,-,7377S7M1I45M1D2M1D3M1D7M3D24M10815S,4,16;chr4,49273694,-,3976S42M1I46M14216S,0,15;chr2,87907398,-,1613S69M2D22M16577S,0,18;chr8,47331937,+,17149S12M3D10M4D24M1I25M1060S,48,12;chr15,54926030,+,12752S49M1I6M5473S,3,2;chr10,68797478,+,7688S51M10542S,60,0;chr19,36467791,-,9299S62M8920S,13,6;chr2,109851185,-,1916S43M1D2M1D5M2D6M2D1M1D27M4D35M16246S,0,37;chr5,95492637,-,8180S5M1I46M3I15M10031S,0,9;chr10,114138038,-,8359S44M2I9M9867S,10,3;chr3,119174994,+,9786S9M1I41M2I4M8438S,60,4;chr7,102466752,+,16547S43M1691S,60,0;  XA:Z:chr2,+32866714,14778S20M1I15M1I36M3I62M2I13M6I24M1I1M4I27M1I214M1I3M3068S,47;  RG:Z:SKBR3-MHC-598BB67
// m150118_135518_00118_c100767352550000001823169407221591_s1_p0/70695/10173_22700 2048 17 39261013 20 3771H4M1I1M1I4M2I2M2D5M1I4M1I2M1D1M1D4M1I3M2I1M2D4M7D1M1D1M3D1M3D4M1D2M1I2M4D11M1I7M2D4M1I4M1I13M2I3M2I10M1I3M1D8M1D31M1I13M2D2M1I8M2D5M1I18M1D3M2D25M1D3M1D21M1I4M1D7M1I1M1D16M1D7M2I2M1D1M1D4M2I1M1I5M1I9M1I7M2I1M1D6M2I2M1D3M1I8M3I3M1I1M1D8M3I3M1D3M2I6M14I5M1I2M3I1M1I2M1I3M1I9M2I4M1I5M5I2M4I1M4I1M1I6M1I19M7I2M1D2M1D4M2D6M1I2M2D2M2I1M1D6M3I3M1I8M3I4M3I3M1I2M2I4M2I4M7I1M1D3M1D2M2I3M5I3M1I2M1D6M1I4M1D2M1I1M1I5M1I1M1D1M4I2M4I2M3I5M7I1M1I2M7I1M1I2M4I6M1I1M2I2M1I2M1I1M1I2M1I11M1I1M5D7M5I2M1D2M1D4M3I3M1D4M1D5M2I3M1D2M2D2M2D1M2I3M2I1M1D2M1I4M2I5M1D1M2D1M2D11M2D3M1D5M1D4M2I4M9I1M1I2M1D2M3I2M1I3M3D3M1D9M1I2M2D1M1I3M2I2M1I6M3I4M2D2M2I1M1I2M7D1M1I3M10I3M2I2M3D2M6I4M6I1M1I1M4I17M3D4M1D3M2I4M1D4M1D2M1I3M6I2M1I3M4D2M3I8M1I2M3D2M1I1M1I4M1D2M2D1M2I4M2I2M3I3M3D2M4I1M4D2M1D5M2I1M1I2M3I2M2D1M1I3M1D3M2D1M2I7M1D2M2I2M3I3M2I3M1D2M1I1M1I1M1D1M2D1M1I1M3D2M1D5M1D1M1I6M2D3M1D1M1D1M1I2M1D1M2I1M3D4M2I4M1I3M1D1M2I1M1I2M7I8M1I20M1D3M2I11M1D5M2D7M1I5M2I1M1D6M1D13M1I1M2D2M1D5M5I1M1I1M2I14M1D8M1I3M1I2M6I1M2D6M2I6M1I2M2D7M1I4M7451H * AS:i:791 XS:i:698 SA:Z:2,165585953,-,8M1D11M1D4M1I24M1I18M4I1M1I13M4I19M2I20M1I7M1D4M1I22M1I22M1I7M1I1M1I2M4I9M1I2M3I5M1I5M1I12M1I2M1I10M1I13M1I5M1I47M1D6M1I33M1I15M1I1M1I10M1I31M1I5M2I1M1D28M1I59M1D1M4I3M1I17M1D6M1I11M1D10M1I1M1I23M2I1M2I8M1I50M1I10M1I31M1I15M1D19M1D31M1I9M1I5M1I14M1I14M2I19M1I11M1I4M1I6M1I16M2I6M1I14M2I5M1I4M1D3M1I4M1I6M1I5M1I9M3I18M2I6M1I4M1I10M2I5M1I36M6I6M1I21M1D3M1I17M1I2M1I6M8I1M3I3M3I4M6I4M4D14M2I3M3I6M1I24M1D16M1I3M1I5M1I10M1I5M1I15M1D2M1I7M1I25M1I3M1I1M1D24M1I4M1I11M1I24M1D19M1I10M1D8M1I8M1I5M1D8M1D3M1D2M1I7M2I12M1D6M1I40M1I14M1I8M1D20M1I6M1I29M1I3M1I3M1I11M2I5M1I15M1I18M1I37M2I5M2I9M1D22M2I6M1I22M1D16M2I4M1I10M1I4M1I7M1I3M1I19M2I20M1D11M1D13M1I21M1D10M1I5M4I3M1I4M2D4M1D4M1I13M1I23M1I7M2I16M1I26M1I7M1I13M1I18M1D5M1D6M1I7M1I16M1D5M1D7M1I15M1I1M1I11M1I5M1I21M1I29M2I8M1D7M2I12M1I6M1I17M1I7M1D2M2I30M1I5M1I24M1I10M1I15M4I37M1I25M2I19M1I26M1I4M1I6M1I7M1I6M3I5M1D4M1D9M2I20M1I12M4I4M1I15M1I8M1I1M1D37M2I7M1I12M1I9M1I8M1I14M1D41M1I5M1I6M1I12M1I6M1I13M1I4M3I3M1I17M1I18M1D7M1D3M2I2M2I7M1I6M1I3M1I5M1I15M1I29M1I21M1I4M1I2M1I29M1I4M1I4M2I7M2I17M1I8M2I4M1I24M1I2M1D9M1I20M1D24M1I6M1I6M1I5M2I17M1I15M1I5M1I22M3I3M1I11M3I8M1D6M1D18M1D13M57I1M8I31M3I23M1I24M2I41M1I27M3I22M1D4M1D17M1D3M1I10M1I4M1I28M1I23M2I14M1D9M2I5M1I10M2I17M2I1M1I19M1D6M1I16M1I3M1I9M1I15M1I3M2I46M1I40M1I11M3I1M2I4M5I1M1D17M1I25M1I43M1D4M1I4M2I4M1I27M1I5M1I9M1I7M1I11M2I3M1I28M1I6M1I2M1I6M2I1M1D11M1I2M1I3M2I8M1I16M1I5M1I48M1D8M1I8M1D8M3I18M1D9M1I15M1I10M3I20M1I35M1I14M1I6M1I2M1I9M3I4M1I17M1I6M1D3M1I11M1I12M2I3M2I11M2D1M1I20M1I2M1I32M1I21M1I13M1D28M1D22M2I27M1I15M4I14M1D11M1I21M1I2M1I17M1I24M1I8M1D5M1D8M1I5M1D8M1I14M1I4M1I4M1I21M1I24M1I5M1I9M1D7M1I8M2D8M1I10M1D26M1I13M2I15M3I2M1D1M1D21M1D2M2I45M1I10M1I9M1I24M1D12M1I16M1I4M1I16M1D5M1I11M1D8M1I3M1I7M2I13M1I33M1I20M1I16M1I12M1I28M2I11M1I14M2I31M1I20M1I6M1I16M2I40M1I6M1D21M1I7M1I9M1I7M1I21M1I5M1D12M1I15M1I49M1I11M1I25M1I34M1I10M2I20M1I17M1I2M1I21M1D2M1I14M1I6M1I3M1I9M1D6M1I14M1I4M1I3M2I6M2I28M1I13M1I9M1D1M1D8M1I14M2D3M1I8M2D9M1I14M2D8M1D1M3I8M1I16M1I8M1D28M1I7M2I13M1I2M1D19M5I2M1I5M1D1M2I8M3D2M1I4M1I2M1D1M3D3M3I1M1D2M1I1M5D5M4D4M2D2M2D1M5D1M5D8M2D5M2I4M1D4M1I3M6I3M2I2M3D3M4D2M1I2M2I2M1D4M3I1M2D3M1I2M3I1M5I9M1I2M6D2M1D2M1I3M2D1M7I2M1D2M4I2M2D1M5I2M1I4M3I2M2D2M1D3M1D2M2I3M3D4M1I2M2I1M8D2M2I3M1I3M1I1M2I4M2I1M5D1M1D4M3I2M1D6M8I4M2D1M1D4M6247S,60,847;20,47102025,-,8761S4M3I1M1D7M1D2M4D2M1I3M2I3M1D1M3I2M1D18M1D1M1D16M3D4M4D4M6D5M4D1M1D3M4D1M3D6M7D2M2D3M6D1M5D4M8D2M2I2M3D3M9D3M1I5M1I6M1D2M3D1M5D2M3I4M1I3M1D2M2I1M1I4M5D5M21D2M6D1M1D4M3D3M14D3M6D1M5D2M5D3M2D1M2D1M1D2M1D7M6D1M1D4M2D1M4D3M5D3M1D3M1D1M5D4M3D4M1D1M5I2M1D5M2D2M7D6M5D1M6D4M3D1M1I3M7D6M19D2M1D5M3D3M2D4M8D2M1D1M2D3M2D1M1D4M1I1M2D1M2D9M3D1M7D4M4D2M1D5M1D6M1I1M1D1M3I1M1D2M1I2M5D2M9D1M5D4M2D1M11D1M1I1M3D3M2D2M1D4M1D5M1D12M1D19M1I13M1I6M1I2M2I1M1D6M2I3M1I8M3I7M1I1M1I2M1D1M2I17M1D6M2I2M1I3M2I4M1I6M2I5M4I2M1I1M1I2M1I6M1D2M4I4M2I5M1D2M5I28M1I4M1I11M1D25M1D2M1I4M3I4M1D5M2I1M1I4M1I4M2I3M1I3M1I8M1D6M5I3M1D3M2I3M1I6M1I7M2I2M2I2M20I3M1I3M1I10M3I1M1I3M1I18M1I2M2I6M1I33M1D1M2I27M1D29M1I1M1D6M1I2M1I1M1I2M1I6M1D5M1D23M2I2M16I4M2I1M1I2M2I13M1I7M1I14M1D2M2I6M1I12M1I3M1I2M2I1M1I4M2I1M1I7M1I2M1I3M1I3M1I4M2I1M1I3M1D2M2I15M1I1M1I2M2I13M2I4M2I7M1I3M2I14M1I1M2I8M1I2M1D10M1I12M2I1M1I9M2I2M1D3M5I7M1I3M2I8M1D21M3I4M1I4M1I4M2I5M1I16M1I2M1I13M1I2M1I5M1I6M2I12M3I2M1D4M3I9M3I4M1I3M1I2M2I12M1I3M1I7M2I3M1I3M1I3M1I5M2I11M1D11M1I3M1I4M1I8M3I3M1D1M2I8M1I1M1I8M1I6M1D1M2I10M2I8M1I6M3I5M1D4M2I4M1I2M2I2M1I7M1I2M1D4M1I2M1I1M1I4M2I11M1D9M2D13M2I7M1I11M4I7M1I7M1D1M1I4M2I1M2D18M2I2M9I14M1I3M1I3M1I3M1D7M2I4M1D2M1I4M1I2M2D1M4I4M2D5M2I7M1I1M1I7M1I5M1D2M1I5M1I16M1I8M1I5M2I4M3I4M1I2M1I8M4I2M1D3M1I11M1D1M1I3M5I3M1I2M2I1M1I1M2I3M1I8M2I1M4I2M2I1M1D3M1I2M3I23M3I2M1I2M1D4M8I2M1I8M3I3M1I3M1I11M1I4M1I10M1D31M2I2M1I1M1I14M1I2M8I7M2I2M1I3M1D2M5I2M6I9M3I1M1I4M1I12M2I2M1I3M2I2M1I1M1I3M2I2M3I2M1I7M1I5M1I6M3I3M4I5M1I5M1I7M1I1M1I1M1D2M2I8M1I7M1I3M1I3M1I6M1D10M1I1M1I4M2I3M3I6M2I5M1I12M1I2M1I17M1I2M1I2M3I13M1I23M5I9M1I3M2D2M1I11M4I7M1I5M2I4M1I4M1I4M9I4M5I5M2D3M1I1M1I1M3I5M1D2M3I6M2I2M1D5M1I3M2I2M1I11M9I2M4I13M1D6M2I3M2I1M1D1M1I3M2I11M1I4M6I1M3I3M4I4M1D1M1I2M1I1M1I5M1I4M1D4M3I7M3I3M1I6M1D2M1I1M2I3M2I6M5I12M1I3M1I9M1I13M1D1M1D4M1I2M1I4M1I12M1I6M2D3M1I3M1D15M1I6M1D4M2D1M1I5M1I14M1I2M4I3M1I2M1I4M1I1M1I3M4I3M1I1M1I4M1I15M1I5M1I4M1I11M1D8M1I4M1D7M2I2M2I4M2I3M1I1M1I3M1I18M3I1M1I12M1I5M1I6M1I17M1I2M1I5M2I4M3I1M1I3M1D12M1I8M1D10M1D5M1I1M1I3M2I1M1D5M2I2M1D8M1I3M1D2M1I20M1I13M1D4M1D15M1I28M1D25M1I10M1D26M2I9M1I9M2I1M1I11M1I3M2I9M1I2M1I2M1I7M1D2M1I4M1I2M1I7M2I3M1I1M4I2M4D1M1D1M1I5M2I6M3I5M1I7M2I3M1D1M1I1M2I2M1I3M1I1M1I15M2I3M1I2M1I4M1I5M1I3M1I4M2I5M3I3M1I3M2D5M3I2M2D2M2I9M1I1M2I6M1I9M1I7M1I2M3I4M1I2M1I1M1I19M1D9M1D1M2I11M2I4M1I9M1I3M2I1M1D4M1I4M1I11M1D2M2I1M1I4M197S,60,1159; XA:Z:17,+39239831,3771S4M1I1M1I4M2I2M2D5M1I4M1I2M1D1M1D4M1I2M1I1M3D3M7D4M4D1M4D2M1I4M2D14M1I7M2D4M1I4M1I13M2I3M2I10M1I3M1D8M1D31M1I13M2D2M1I8M2D5M1I13M1I4M2D3M2D25M1D3M1D21M1I4M1D7M1I1M1D16M1D7M2I2M1D1M1D4M2I1M1I5M1I9M1I7M2I1M1D6M2I2M1D3M1I8M3I3M1I1M1D8M3I3M1D3M2I6M14I5M1I2M3I1M1I2M1I3M1I9M2I4M1I5M5I2M4I1M4I1M1I6M1I19M7I2M1D2M1D4M2D6M1I2M2D2M2I1M1D6M3I3M1I8M3I4M3I3M1I2M2I4M2I4M7I1M1D3M1D2M2I3M5I3M1I2M1D6M1I4M1D2M1I1M1I2M2I3M2D1M4I2M4I2M3I5M7I1M1I2M7I1M1I2M4I6M1I1M2I2M1I2M1I1M1I2M1I14M4D6M5I2M1D2M1D4M3I3M1D4M1D5M2I3M1D2M2D2M2D1M2I3M2I1M1D2M1I4M2I5M1D1M2D1M2D11M2D3M1D5M1D4M2I4M9I1M1I2M1D2M3I2M1I3M3D3M1D9M1I2M3I1M1D1M1I1M2D2M1I6M3I3M1I2M1D3M1I2M3D3M1D1M1D3M3I1M4I3M2I1M2D1M5I3M1D4M4I2M2I1M3I2M5I11M3D4M1D3M2I4M1D4M1D1M1I3M3I3M1I3M2D2M5I2M2I3M1I2M1I1M5I2M4I7M2I2M3I4M5I2M14I5M3D3M1D1M2I4M1D4M1D2M1D2M2D4M1I1M1I7M1I3M1D6M2I7M1D7M1D3M1D5M1D2M1D6M2I11M1I2M1D6M9I1M2I17M2I3M2I2M1D2M2D1M2D7M1I8M10I1M1I5M4I1M1D5M2I4M3D1M1D2M3D4M2I2M5D1M8D2M2D8M6D5M2I1M3D3M3D5M1I4M2D3M1D1M4I3M1I2M2I4M7469S,538;
// m150121_184057_00118_c100767502550000001823169407221586_s1_p0/66896/15307_33028 2064 17 39261035 19 3323H3M1I5M1I6M1I1M1I3M1I1M4I5M1I1M2D5M1I2M1D6M1I12M4I4M1I1M3I1M1I1M1I3M1I11M3I4M1I3M9I5M3I2M3I4M1I1M2D1M1I5M2D2M2I2M1I1M1I2M1I1M2I1M2D5M1I5M1I1M1I2M1D4M4I8M2I2M2I3M1D2M4I2M1I3M2D1M1I8M1I2M1D1M1I4M1I3M2I1M1I5M1I12M1I3M2I2M1I1M1I1M3D1M1I3M1I1M1I6M1I3M3D1M1D2M4I3M1D4M9I4M2I1M2I5M4I2M2D1M3I2M1D3M1D7M1I2M1D42M1I10M1I2M1I4M2D9M1D18M1D6M1I4M2I5M2I5M1I7M1I12M2D10M1I3M1D5M2I15M1D1M1I4M1D19M1I7M1D12M1I2M1D4M2I3M2I3M2I6M2I2M1D10M1I10M2I8M2D1M1I7M1D2M2I15M1I6M1I3M1D8M1I1M2D1M2I7M1D12M1I1M1D6M1I2M2I10M2I11M2D1M1I9M1I3M1D2M1I8M1I9M1I1M1D2M1I1M2I4M1I3M1I1M1D5M2I5M1I5M1D6M3I1M1D17M1I1M1I3M1I2M1I3M1I4M1I13M1I2M1D8M3I4M1I5M1I7M1I4M2I2M1D1M1D2M1I6M1I1M1I1M1I1M3I1M1D2M3I1M1I3M1I2M4D2M1I1M1I3M1I1M1D3M6I2M2D8M1D2M2I2M1I2M1D1M3I2M1I2M2I2M1I3M2I2M3I4M8I2M1I3M10I2M1I2M3I1M3I4M1D4M1D1M1I4M1I2M2I7M2I2M1I3M1I3M2I3M2I4M4I2M2I2M1I9M5D4M1D2M1I1M1I4M1D2M2D1M1D2M9D3M1D2M1I2M3D6M1D1M4D3M1I3M1I1M1I1M1I4M2D1M3I4M1I1M1D1M2I3M1I1M2I8M3I1M1D2M2I1M1D1M3D3M2I4M1D4M3I3M3I3M1I1M1I1M1I2M3I9M1D5M1D1M4I2M1D3M3I1M1I1M1I3M1D7M1I6M1I6M2I3M1I2M1I2M1I2M1I3M2D4M2I15M1I6M2I2M1I6M6I5M14I1M1I2M2I2M1I1M1I2M1D1M1I3M2I9M4I1M1I5M1I2M2D2M1D3M1I1M2D1M1D3M2I8M1I2M1D9M1D2M4I1M1I1M4I1M1D2M1I4M1I2M1D5M3I3M1D10M1I4M1D11M1I4M1I1M1D1M2I4M1I9M1I2M1D1M2I6M4I9M4D2M4I1M1I1M1I4M1I2M1I3M1I2M1I1M1I2M1I1M5I2M1D3M4I1M3D2M2D8M1D8M 1D1M2D11M1I2M1I3M2I2M1D2M3I5M1I2M2I4M3I6M3I7M1I1M7D2M1I2M1D3M1I2M3D2M3D2M2D3M3D3M1I1M2D2M1I3M12693H * AS:i:1067 XS:i:972 SA:Z:17,39231091,+,778S8M4I12M5I1M1D6M1I1M1I6M1I4M1D2M2I3M1D8M1I13M1D2M1I17M1I3M1I5M1I19M1I14M2I12M3I6M2I16M1D3M1D2M1D5M1I1M2D12M1D10M1I4M1I9M1D10M1D1M1I9M1D22M2D11M1I30M1D9M1D13M1D2M1D8M1D4M1D1M1I4M1I12M1I9M3I9M6I1M1D7M1D6M2I16M1I4M1I3M1I1M2I1M1D9M1I16M1I1M3I3M1D4M1D7M1D7M2I1M1D9M1I4M1I1M2I1M2D5M1I2M1D4M6I11M1I1M1D17M1I4M1I1M2I2M1D3M1I5M1I17M1D3M2I10M2D8M1I21M1I1M1D9M1I19M2I1M1D14M3I1M1I12M1I8M1I8M1I7M2I3M1D2M2I2M1I23M1I4M2D8M1I16M1I12M1D2M2I8M3I1M1D3M1I5M1I6M1I10M1D12M1I1M1I1M1D3M1I6M1I8M1I19M1I12M1D9M1I4M3I10M2I14M1I10M1I8M1I1M2D5M1I2M1I5M1D11M1I1M5D7M2D2M1D6M1D15M1I2M1I12M1D11M1I6M1D10M1D16M1I2M1D4M1I34M1I1M1I5M11I3M1I11M2I4M1I22M2I2M1D10M1I18M1D4M2I1M1D6M1I8M3I1M1D4M1I1M1D4M1I10M1D5M2I8M2D2M1I7M1D3M2D1M1D8M1I11M2I4M3I4M1I6M1I3M1D4M1I2M1I2M1I5M1I2M1D8M1I5M1I15M2I6M1D9M1D2M2I6M1D5M1I13M1I12M1I3M1I14M1I4M3I3M2D1M1I23M1I6M1I2M1D10M1I4M2I6M1I10M1I9M3I4M1I4M1I11M1I4M1D2M1I2M2D9M4I9M2I6M1I7M2I3M2I13M3I13M1I6M1D3M3I7M1I15M1I7M1I5M1I5M1I29M2D3M1D6M1I9M1I13M5I4M2I4M1I8M1D1M1I4M2I6M1I1M2I11M3I2M1D10M1D10M1I13M2I13M4I6M1I2M2I3M1I26M1I24M2I13M1D12M1D10M1D3M1I8M1I9M3I14M1I10M1I7M2D2M1D10M1I12M1I6M1I18M1I2M1D6M1D7M3D9M3D8M2D1M1I23M5I14M1I4M1D1M3I18M1I16M2I2M1D28M1D10M3I7M1D14M1I1M2D5M2D7M1D8M1I1M1D15M1I5M1I5M1I10M2I8M2I1M1D8M1I3M1D8M1I23M2I16M2D14M1I6M2I5M1I7M1D15M1I32M2I7M1I15M3I7M1I6M1I2M1I5M1I7M1I4M1D1M2I8M1D13M1D3M2I2M4I34M2D7M1I3M1D3M2D8M2I2M1D17M5I3M1I1M2D12M1D15M2I15M1I9M1I1M1D1M1I15M1I4M2I4M3I2M1D12M1I8M1I4M1I12M1I14M3I25M1I9M1I15M2I1M2D18M1I5M1I6M2D20M1I4M1I13M1I10M3I2M1D2M5I3M2I1M1D1M1D2M4I5M7I2M1I3M1I1M1I1M1I2M2D2M1D2M1I2M1I20M2I8M3I5M1D3M1D2M2I17M2I19M1I14M1D3M1I5M1I13M1D6M7I6M5D4M1D2M4I3M1I4M1I4M1D15M3I11M3I9M1I4M1I6M1I15M1D4M5I16M1D13M1D6M1I8M1D3M1I21M2I6M1I2M1D11M1D45M1I10M1I3M2I7M1D1M2I5M1I27M2I14M1I12M1D3M1I4M2I4M1I14M2D4M1D14M1I1M4I21M2I1M1D6M4I12M2D5M2I11M1I28M1I12M1I4M1I3M1I5M4I9M1I6M5I3M1I9M1D4M1I4M1D2M1D3M1I4M1D7M1D6M2I2M1D8M1I6M1I3M1D4M1D7M1D5M1I3M1I11M1I7M1I6M1I17M1D2M2I1M2D9M3I15M1I10M1I2M1I11M2I7M1I2M1D1M5I33M1D10M1I1M2D3M1I9M1I10M1I6M4I4M1I2M1I14M2I1M1D5M2I8M1I13M1D7M1D14M1I2M1I17M1I7M1I10M6I11M1I41M1I11M4I7M1I1M1I2M1I3M1D17M1D4M1D2M1I12M1I5M1D6M1I9M1I1M1D9M3I1M1D12M1I9M3I2M1D8M1I3M2D1M1I20M2I3M1I3M2I5M1I3M3I3M1I1M2I20M3I4M1I9M1I22M1I13M2I7M1I26M1I9M1I7M1I13M2D9M1D6M1I10M1I5M2I8M1I4M1I6M1D4M1I10M2I7M1I8M1D8M1D4M1I2M2I10M1I5M4I2M1D5M1I6M1I2M3I1M1I5M1I14M1I7M1D12M1D23M1D8M5I5M3I1M1I1M1I3M4I3M1I2M1D7M1D1M3I3M1I2M2D2M1I1M1I2M1D2M12I1M4I5M6I3M16I2M1I1M1I1M1I2M2I6M1I30M1I5M1I3M1D1M3I1M1D2M1D5M6D2M12I5M1I2M5I2M3I1M1I8M1I5M7I17M1I11M1I14M1D10M5I1M3I4M1D3M1D2M1D3M1I4M4I4M4I5M6I9M9I3M1D3M3I3M6I1M1I1M1I4M1D2M1D4M1I39M1I2M1I9M1D3M2I6M1D4M2D1M1I5M2I1M1D12M2I6M1D3M2I7M1D3M1I5M2I1M1I26M5I5M1I5M1D6M3I13M2I13M1D2M2D10M4I2M1D11M1I15M1I12M1I6M1I2M1I7M1I3M4I3M1D7M1I3M1D31M2I8M1D5M1I6M1D7M1I3M1I20M1I2M1I9M1I4M1I8M1I8M3I7M2I5M2I5M1I3M2D3M1D3M1D17M1I2M2I7M1I3M2I8M1I1M1D20M1D8M1I7M1I10M1I5M4I2M1D1M2I22M1I5M1D4M1I6M1I6M1I7M1I19M1D16M1D5M2I5M2D13M1D6M5I8M10I1M1I16M7I8M2D3M1D7M1D2M1I5M1D10M1D4M1D4M1I8M1I4M1I4M1D4M3I5M1D9M1D3M1I6M1I6M2I4M1I6M1I1M1D6M2D13M1I2M1D1M1D7M1I9M2D1M1I18M1I9M2I6M1D11M1I9M1I10M2D4M2I3M1I4M1I1M1D22M1D6M1D1M1D1M1D5M1I10M1D26M1I4M1I9M1D5M1I6M1I19M1D20M1I19M2I15M1I20M1D29M2I16M1D4M1I10M1I6M1D1M1I25M1I7M1D1M1I4M1I5M2D6M2I11M1I3M1D4M1I20M1I12M1I1M2D19M1D2M1D5M1I11M1D10M3I12M1D5M2I25M1I4M1I1M1I1M1I21M1I11M1I3M1I6M1D18M1I5M1I15M2I2M1D1M1D7M1I6M1D3M2I13M1I1M1I7M1D3M1D1M3I3M2D5M1D3M1D10M2I2M2I1M2I3M1I1M1D4M5I6M1I12M2D1M1I11M3I1M1D2M1I2M3I7M1D2M2D4M2I5M1I3M1I6M4I2M1I10M2I1M1D7M2I2M1I12M1I1M2D5M1I1M1I2M1I10M2I2M1D4M1I5M3I5M3I3M2I3M1D2M1I15M2I1M3D6M1I3M2I10M1I8M1I8M1I5M1I8M1I9M1I5M1I2M1D2M1I10M1I15M2I6M1I17M1D3M1D3M1D6M1I4M1I4M1D7M1I11M1I8M2D5M2I11M2I1M2D1M1D7M1I10M4I7M1I5M2I23M1I5M1I23M1I12M1D3M1I13M1D1M1D21M1D13M1D6M1I4M1D5M1I10M2I5M1D3M2I7M1I9M3I3M1I11M4I2M10D6M1I5M1D4M1D10M2I3M1I3M2I1M1D5M1I6M1I10M1I2M12I12M2I40M1I9M1I17M1I13M1I10M1I15M1I11M1I10M1D4M1D8M1I10M1I5M2I10M2D21M1I14M1D10M1I10M1I23M1I7M3I19M1I9M1I5M1D3M1D10M1I7M2I4M1I4M1I2M1I13M1D8M1I15M1I3M1I16M1D5M1I9M1I14M1I24M1I12M1I10M1D5M1I4M1I10M2I5M1I42M2I4M1I6M1I8M1D1M2I2M5I21M1D14M1D4M1D2M1D1M1I7M1D7M1I5M1D4M4I5M1I2M2I9M1I9M1I2M1I1M1D5M1I2M1I14M1I1M1D5M2I13M1D12M3I4M2I11M4I12M1D2M3I8M1I7M1I10M5I5M1I2M1I3M3I8M1I15M3I7M2I1M1D5M1I6M1I3M1I1M3I12M2I1M1I5M1D2M1D2M1I35M2I20M2D12M1D6M2I7M3I8M4I3M1I2M1D4M1I7M5I14M1D12M2I13M1I9M2I9M1D5M1D18M5I6M1I19M1I6M2I3M1D5M1I6M1I8M1I14M1D4M1D12M1I9M1I5M1I1M2I1M1D4M1I10M1I3M1I1M1I3M2I6M2I2M1I9M1I2M1D2M1D2M3D5M1D6M1D3M1I2M2I9M4I12M1I11M2I2M1D13M1D8M1D2M3I3M1D1M3I4M1I6M1I1M3D10M1D11M6I5M1D6M1I4M1I5M5I6M7I3M1I1M2I3M1I1M3I3M2I3M2I6M1I1M2I1M1I3M5I1M2I2M1I4M1I4M1I3M1D1M3I3M7I2M13I3M1I3M2I6M1I8M1I1M2I2M1I1M5I1M1I4M7I3M1D1M1I4M2I3M2D5M2D1M3I2M1I2M3I5M1I5M10I1M1I6M5I2M2I1M1I9M2I3M2I3M23I3M1I2M3I1M2I4M5I1M1I4M4I2M8I1M1I5M3I2M1I2M2I1M1I9M2I1M1D3M3I2M2I4M1D1M2I1M2I4M1I2M2I2M1I2M1D5M3I4M1I3M2I7M7I1M1I1M2I1M2I7M2I1M1D1M5I2M1D2M4I2M6I8M10I3M3I1M3I5M9I1M8I2M4I2M1I1M1D4M7I3M1I23M1I11M2I2M1I10M2I1M1D8M4I4M1I3M1D14M2I7M1D4M1D5M1D3M1I10M1I2M1D11M1I8M1I6M2D4M1I6M1I13M1I4M1I5M2I3M1I13M3I15M1D5M1I13M1D4M1I6M1I8M2I6M3I1M1D15M1I10M1D4M1D8M1I1M1D7M1D2M1I9M1I11M1I2M1I12M1I2M1D8M1I8M1D6M1D5M2I3M1I9M1I4M1I2M2I14M2I1M1D8M1I13M1D3M1D10M1D13M1D30M1D9M1D17M2D15M1I3M2I1M1I2M1I11M1I9M1I4M2I1M1D4M2I6M2D5M1I2M1I5M1I26M3I8M1I30M1I3M1I26M1I11M1I8M1D1M1I1M1I13M6D4M1I2M1D1M5D1M1I37M1I15M2D8M1D36M1I6M2I18M1D14M1D8M1I6M1I14M1I6M1I33M1D12M3D2M4I9M1D9M1I8M1I9M2D29M2I2M2D10M1I21M1I21M1D11M1D9M6I3M1I9M1D5M1D11M1I2M1D9M1I6M1D8M2D3M1I12M1I5M2I18M1I5M1I3M1I4M1I7M1I4M2I2M1D10M1D2M1D4M2I1M1D23M2I5M1I3M1I13M1I6M1I9M2D6M1I5M4I5M2D1M2D3M1I1M2I5M1I1M1D1M2D3M1D4M1I2M1D1M1D1M1D2M1I1M2D1M2D4M1D2M7D3M4I4M2D1M2I3M2D1M2I2M1D2M1D1M2D1M5I1M2I5M2I2M5D4M1I1M4D4M1D3M4I1M1I4M2D2M1D1M1D1M1I2M1D4M2I1M2D5M3I3M3D2M1I2M3I2M5I1M4I2M1D1M2D4M4I3M2I2M8I3M2D2M6D3M1D3M1I2M1D1M1D1M1I3M1I2M1I1M2I1M1I2M1I1M4I3M1D1M2D1M4D2M2I1M1I2M6I7M6I2M1D1M3I3M2I1M1D3M1D3M2I1M3D4M5830S,60,2412;1,182682013,-,2S3M1I7M1I6M5I2M3I3M1I9M1I13M1I10M1I1M2I21M1D5M2D3M1I7M1I22M1I11M2I2M2D9M1I6M3I9M1I7M1I2M2I3M10I5M1I6M1D7M1I2M1I5M1I3M3I9M5I4M1I5M2I3M1D3M1I5M2I14M1D1M2I7M1I8M1I2M1I1M2D5M1I37M1D4M2D2M1I3M1D22M2I3M4I2M1D2M1D1M2I10M1I6M1I4M1I1M1I4M1I7M3I6M1I6M2D1M1I1M1I5M2D2M1I3M1I2M1D5M3I2M3I1M1D5M4I1M1I5M2I4M1I2M3I9M1D1M1D5M4I13M1D3M1I10M1D6M1I7M1D3M2I4M1I14M2D5M1D6M1I5M1I15M2I8M1I8M1I17M1I1M2I1M1I8M1I10M1I14M1I14M1I10M1I12M1D1M2I2M1I6M1I1M1D8M1D22M2I2M1D11M1I4M1I1M1I12M1I8M1I17M2D6M1I3M2I4M1I20M1I6M1I9M2I15M1I2M1I2M1I4M1I3M2I5M2I1M1I8M1I6M1I1M1D29M4I1M1I4M1I6M1I3M1I8M1I6M1I4M1I12M1I4M1I3M3I3M1I10M1I6M1I3M2I4M5I2M8I5M1I3M3I1M1I1M2I1M1I2M1I2M5I1M3I1M1I1M3I6M1I4M5D9M1D25M3I16M1I18M1I4M3I9M1I3M1I5M2I4M1D4M2I3M1I4M1I29M1I6M1I5M1I9M1I4M1I12M1I4M1D4M2I4M1I10M1I2M1I19M1D28M1I6M1I3M1I3M3I5M1I8M1I3M1I11M1I3M1I3M1I8M2I22M1I7M1I1M1D1M2I2M1I4M3I9M1I20M1D3M1D5M1D29M1I2M1I12M1D2M2I19M1I7M1D9M1D7M1I1M1I10M1I6M1D3M1I2M1I9M1I16M1I20M1D10M1I8M1I1M1D2M1I14M3I5M1D5M1I5M1D5M1I9M1D19M1D2M1D5M1I7M2I5M1I13M1D7M1I11M2I11M1D18M1I4M1I3M2I9M2I5M1I4M1I4M1D15M1I8M2I13M1I2M1I17M1I3M1D1M2I3M1I2M1I16M1D17M1I15M2D28M1I4M1I4M1I13M1I30M1I2M1I3M2I4M1D9M2I11M1I6M1I41M1I8M1D12M1D15M1I7M2D15M2I2M1D10M1I1M2D2M1D10M1I3M1I2M1D9M4I22M1D9M1I5M3I6M1D9M1I17M1I6M1I12M3I11M1I10M1I39M1I7M2I11M1I12M1I7M1I5M2I5M4I1M1D2M2I1M2D5M2D25M1I2M2I26M1I39M1D5M2D5M1D6M1D25M1I3M2I4M2I2M2D4M3I1M2D2M3D1M1I1M2D3M1I2M1I1M1I1M2D3M1D1M3I11M1D8M2I39M2D3M1I3M1D7M1D12M1I10M1I4M2I4M7D2M4D4M2D1M1I2M3D3M1I8M2D7M1D21M1I3M1I4M1D16M3D1M1I8M1I8M1D1M1D2M2D1M2I19M2D3M1I6M2I4M2I6M1D27M1I1M1I30M1D16M1D3M1I5M1D25M4D1M1I1M2D10M1D8M3D3M6D2M1D1M3I3M1D5M1I10M1I6M1D18M1D1M2I7M1I3M1I11M1I4M2I2M2D8M3D1M1D1M6I7M1I12M1I10M1D2M1I3M2D2M1D1M1I5M1I3M1D4M2D1M1I3M2I2M1I6M6I2M2I2M1I1M4I1M2D3M1D1M2I3M3I6M1I1M1I1M2I3M3I1M4I2M1D4M5I1M2I7M4I1M1I1M1D2M1I1M5I1M2I3M4I12M2I2M2I3M4I2M4I4M4I1M1I2M2I1M1I6M1I1M3D1M1I3M2I1M2D7M11I2M1I10M5I3M3I2M2I1M1D1M1I1M1I5M2I2M2I1M1D4M2I1M5I5M1D1M1I1M1I1M2I2M3D2M1D3M2I2M8I5M2I2M6I1M1D1M1D5M1I1M2I1M2D6M1I4M14090S,60,803; XA:Z:17,-39239853,3323S3M1I5M1I6M1I1M1I3M1I8M2I1M1I5M1I2M1D6M1I12M4I4M1I1M3I1M1I1M1I3M1I11M3I4M1I3M9I5M3I2M3I4M1I1M2D1M1I5M2D2M2I2M1I1M1I2M1I1M2I1M2D5M1I5M1I1M1I2M1D4M4I8M2I2M2I3M1D2M4I2M1I3M2D1M1I8M1I2M1D1M1I4M1I3M2I1M1I5M1I12M1I5M1I4M1I5M1I1M1I6M1I3M3D1M1D2M4I3M1D4M9I2M1I1M2I2M1I5M4I2M2D1M3I2M1D3M1D7M1I2M1D42M1I10M1I2M1I4M2D9M1D18M1D6M1I4M2I5M2I5M1I7M1I12M2D10M1I3M1D5M2I15M1I1M1D4M1D19M1I7M1D12M1I2M1D4M2I3M2I3M2I6M2I2M1D10M1I10M2I10M1D7M1D2M2I15M1I6M1I3M1D8M1I1M2D4M2I4M1D12M1I1M1D6M1I2M2I10M2I11M2D1M1I9M1I3M1D2M1I9M1I8M1I1M1D2M1I1M2I4M1I3M1I1M1D5M2I5M1I5M1D6M1I2M1I17M1I1M1I3M1I2M1I4M1I3M1I13M1I2M1D8M3I4M1I5M1I7M1I4M2I2M1D1M1D2M1I6M3D2M1I1M3I1M1I4M3I3M2I2M1I12M1I1M1I1M2I10M1I8M1I2M2I2M1I1M1D2M1D1M2I3M1I2M1I2M1I2M1D2M1D1M1I1M1I2M2I2M3I2M1I2M1I1M1I2M1I2M1I1M2I1M1D3M3I2M1I4M1D1M1I4M1I3M1I2M2I4M1I2M1I3M1I3M2I2M1I3M1I2M1I3M1I2M1I12M1D4M1D2M1I1M1I4M1D2M3I3M1D2M7I2M2I2M3I1M1I1M1I1M1I3M1I1M2I1M1D2M6I3M1D2M2D10M3I1M1D2M1I1M1D5M2D2M1I3M2I1M1D4M1D1M3D3M2D1M1D6M2D2M1I2M3D1M1D6M6I2M2I1M2D1M1D1M3I2M2I2M1D1M1I2M2I4M1D7M1D3M1I3M2I4M13117S,400;
// m141231_161924_00118_c100750732550000001823151707081555_s1_p0/133962/7772_9685 2048 17 39261129 6 27H5M3D3M1I1M2D5M1D1M9D2M2D14M1I4M1I9M1I3M1I9M1I5M1I16M1D52M1D5M1D1M1D11M1D10M2I10M2I8M1I6M2I18M1I30M1D1M1I6M2I10M1D12M2I23M2D10M2D10M1I8M1I16M1I5M10I4M8I3M4I3M4I1M1I3M4I1M3I2M1I3M3I3M1D3M2D2M4I1M2I2M2D2M1I1M2I2M1D5M1D1M1I1M1I2M3I7M1I2M1I2M1I3M1I3M1416H * AS:i:547 XS:i:534 SA:Z:1,42220087,-,78S2M1I2M2I51M2D6M1I4M1I8M1I3M1I16M1D1M4I4M1I2M1I5M1I5M3I1M1D6M1I2M1I4M2I6M3I2M1I6M1I6M2I1M1D5M1I2M1I4M1I26M1I3M2I8M2I4M1I16M1I5M2I2M1D32M1I7M1D12M1D10M1I28M1I10M1I19M1I4M1I5M1D2M2I41M2D19M1D4M1I8M1I3M1D1M1D14M1I9M5I2M1I3M2I13M1I2M1I11M1I3M2I12M1I5M2I15M1I16M1I11M2I7M1I7M1D14M1I4M1I2M1I54M2I2M1I1M1I5M1I3M5I10M3I5M1I34M1I1M2I7M1I7M1D8M1I10M1I6M3I6M1I5M1D5M1I1M1D2M2I1M1I10M1I21M1I15M1I9M1I37M1I6M1D7M1I4M1I18M3I14M1I1M2I11M2I6M2I3M1I1M1I6M2I7M1I2M1I3M1I1M4I3M2I40M1I1M2I1M1I10M1I6M1I9M1I11M2I2M1I18M1D8M3I14M1I9M1I31M1D2M1I14M1I10M1I3M3I1M1I3M1I6M1D1M2I3M1I2M1I3M5I1M2D7M2I3M2I19M3D1M1I2M3I1M2I1M2I1M1I2M4I2M1I3M3I3M4I2M1I2M3I7M3I1M1I1M1I4M1I1M1I1M1I4M1I5M3I1M1I6M2I1M1D2M7I2M2I4M1D3M385S,60,255; XA:Z:17,+39239947,27S5M3D3M1I1M2D5M1D1M9D2M2D14M1I4M1I9M1I3M1I9M1I5M1I16M1D52M1D5M1D1M1D11M1D10M2I10M2I8M1I6M2I18M1I30M1D1M1I6M2I10M1D12M2I23M2D10M2D10M1I6M2I1M1D16M1I5M10I4M8I3M4I3M4I1M1I3M4I1M3I2M1I3M3I3M1D3M2D2M4I1M2I2M2D2M1I1M2I2M1D5M1D1M1I1M1I2M3I7M1I2M1I2M1I3M1I3M1416S,118;


