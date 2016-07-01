



// Calculations for drawing and spacing out elements on the screen
var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0];

var window_width;
var window_height;

var padding = {};
var layout = {};

// Elements on the page
var svg;
var table;


// How sam table looks
var header = ["selected","read","flag","chrom","start","MQ","CIGAR"];
var size_readname = 20;
var arrow_color = {"on":"#009900","off":"#cccccc"};
var colors = {"read":"blue","ref_block":"green"};

// Data for visualization
var Alignments;
var Readname;
var read_length;
var Reference_intervals = {}; // by chromosome, contains [start,stop] genomic locations for which parts of the reference we are drawing

var ref_intervals;
var whole_refs;

// Scales for visualization
var positions;

var read_scale = d3.scale.linear();
var whole_ref_scale = d3.scale.linear();
var ref_interval_scale = d3.scale.linear();
var ref_color_scale = d3.scale.category20();




function responsive_sizing() {
  console.log("responsive_sizing");

  window_width = (w.innerWidth || e.clientWidth || g.clientWidth)*0.98;
  window_height = (w.innerHeight || e.clientHeight || g.clientHeight)*0.96;

  top_banner_size = 60;
  padding.top = top_banner_size;
  padding.bottom = 0;
  padding.left = 0;
  padding.right = 0;
  padding.between = 0.01*window_height;
  padding.text = padding.between;

  layout.table_fraction = 0.35;
  layout.canvas_fraction = 0.65;

  layout.left_width = (window_width - padding.left - padding.right) * (1-layout.table_fraction);
  layout.table_width = (window_width - padding.left - padding.right) * layout.table_fraction;
  layout.input_height = (window_height - padding.top - padding.bottom) * (1-layout.canvas_fraction);
  layout.vis_height = (window_height - padding.top - padding.bottom) * layout.canvas_fraction;
  layout.total_height = (window_height - padding.top - padding.bottom);

  layout.svg_width = layout.left_width - padding.between*4;
  layout.svg_height = layout.vis_height - padding.between*4;

  layout.input_margin = padding.between;


  d3.select("#sam_input_panel")
    .style("width",layout.left_width + "px")
    .style("height",layout.input_height + "px")
    .style("padding",layout.input_margin + "px")

    d3.select("#sam_input")
      .style("height",(layout.input_height-layout.input_margin*2) + "px");

  d3.select("#visualization_panel")
    .style("width",layout.left_width + "px")
    .style("height",layout.vis_height + "px");

  d3.select("#sam_table_panel")
    .style("width",layout.table_width + "px")
    .style("height",layout.total_height + "px");
  table = d3.select("#sam_table_panel").select("table");

  draw();
}


$('#sam_input').bind('input propertychange', function() {
  var input_text = this.value.split("\n");
  var sam_data = [];
  for (var i = 0; i < input_text.length; i++) {
    if (input_text[i].split(/[ \t]+/).length>=6) {
      sam_data.push(input_text[i]);  
    }
  }

  table.selectAll("tr").remove();
  table.append("tr").selectAll("th").data(header).enter().append("th").text(function(d){return d;});

  var rows = table.selectAll("tr.data").data(sam_data).enter()
    .append("tr").attr("class","data");
  
  rows.append("td").append("span").attr("class","glyphicon glyphicon-arrow-right").style("color",arrow_color.off).on("click",select_read);
  if (sam_data.length > 0) {
    select_read(sam_data[0]);
  }

  rows.selectAll("td.data").data(function(line){return parse_sam_line_for_table(line);}).enter()
        .append("td").text(function(d){return d;}).attr("class","data");

});

function run() {
  console.log("Running");
  responsive_sizing();
	// Read files or input data
	// Run when all data loaded
}

function parse_sam_line_for_table(line) {
  var fields = line.split(/[ \t]+/);
  var readname = fields[0];
  var cigar = parse_cigar(fields[5]);
  var fields_to_show = fields.slice(0,header.length-1);

  fields_to_show[0] = "..."+readname.substr(readname.length-size_readname,readname.length);
  fields_to_show[5] = cigar[0]["num"]+cigar[0]["type"] + "..." + cigar[cigar.length-1]["num"] + cigar[cigar.length-1]["type"];

  return fields_to_show;
}

function parse_cigar(cigar_string) {
  // console.log(cigar_string);
  var cigar_regex = /(\d+)(\D)/;
  var parsed = cigar_string.split(cigar_regex);
  if (parsed.length < 2) {
    alert("This doesn't look like a sam file. The 6th column must be a valid cigar string.");
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

function alignment_length_from_cigar(cigar) {
  // must be parsed cigar string
  var output = {};
  output.qlength = 0;
  output.rlength = 0;
  for (var i = 0; i < cigar.length; i++) {
    switch (cigar[i].type) {
      case "H":
        break;
      case "S":
        break;
      case "M":
        output.qlength += cigar[i].num;
        output.rlength += cigar[i].num;
        break;
      case "I":
        output.qlength += cigar[i].num;
        break;
      case "D":
        output.rlength += cigar[i].num;
        break;
      default:
        console.log("Don't recognize cigar character: ", cigar[i].type, ", assuming it advances both query and reference, like a match or mismatch");
        output.qlength += cigar[i].num;
        output.rlength += cigar[i].num;
    }
  }
  return output;
}

function parse_SA_field(sa) {
  var alignments = [];
  var aligns = sa.split(":")[2].split(";");
  for (var i = 0; i < aligns.length; i++) {
    var fields = aligns[i].split(",");
    if (fields.length >= 6) {
      var start = parseInt(fields[1]);
      var cigar = parse_cigar(fields[3]);
      var alignment_lengths = alignment_length_from_cigar(cigar);
      var qstart = 0;
      if (cigar[0].type == "S" || cigar[0].type == "H") {
        qstart = cigar[0].num;
      }
      var strand = fields[2];
      if (strand == "+") {
        alignments.push({"r":fields[0], "rs":start,  "re":start+alignment_lengths.rlength, "qs":qstart, "qe":qstart+alignment_lengths.qlength, "mq":parseInt(fields[4]) });
      } else {
        alignments.push({"r":fields[0], "re":start,  "rs":start+alignment_lengths.rlength, "qs":qstart, "qe":qstart+alignment_lengths.qlength, "mq":parseInt(fields[4]) });
      }
    } else if (fields.length > 1) {
      console.log("ignoring alternate alignment because it doesn't have all 6 columns:");
      console.log(fields);
    }
    
  }

  return alignments;
}
function get_read_length(cigar) {
  var readlength = 0;
  for (var i = 0; i < cigar.length; i++) {
    switch (cigar[i].type) {
      case "H":
        readlength += cigar[i].num;
        break;
      case "S":
        readlength += cigar[i].num;
        break;
      case "M":
        readlength += cigar[i].num;
        break;
      case "I":
        readlength += cigar[i].num;
        break;
      case "D":
        break;
      default:
        console.log("Don't recognize cigar character: ", cigar[i].type, ", assuming it advances both query and reference, like a match or mismatch");
        readlength += cigar[i].num;
    }
  }
  return readlength;
}
function parse_sam_coordinates(line) {
  var fields = line.split(/[ \t]+/);
  
  var chrom = fields[2];
  var start = parseInt(fields[3]);
  var cigar = parse_cigar(fields[5]);
  read_length = get_read_length(cigar);
  var alignment_lengths = alignment_length_from_cigar(cigar);
  var qstart = 0;
  if (cigar[0].type == "S" || cigar[0].type == "H") {
    qstart = cigar[0].num;
  }

  var flag = parseInt(fields[1]);

  for (var i = 0; i < fields.length; i++) {
    if (fields[i].substr(0,2) == "SA") {
      var alignments = parse_SA_field(fields[i]);
    }
  }

  // add main alignment
  if (flag & 16 == 0) {
    // forward
    alignments.push({"r":chrom, "rs":start, "re":start+alignment_lengths.rlength, "qs":qstart, "qe":qstart+alignment_lengths.qlength, "mq":parseInt(fields[4])});
  } else {
    // reverse
    alignments.push({"r":chrom, "re":start, "rs":start+alignment_lengths.rlength, "qs":qstart, "qe":qstart+alignment_lengths.qlength, "mq":parseInt(fields[4])});
  }
  
  return alignments;
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


function select_read(line) {
  Readname = line.split(/[ \t]+/)[0];


  table.selectAll("span").style("color",function(d) {if (d.split(/[ \t]+/)[0] == Readname) {return arrow_color.on} else {return arrow_color.off}});

  Alignments = parse_sam_coordinates(line);


  ////////////////   Select reference chromosomes to show:   ////////////////////
  // Gather starts and ends for each chromosome
  var ref_pieces = {};
  for (var i = 0; i < Alignments.length; i++) {
    if (ref_pieces[Alignments[i].r] == undefined) {
      ref_pieces[Alignments[i].r] = [];
    }
    var interval = [Alignments[i].rs,Alignments[i].re];
    
    var interval_length = Math.abs(Alignments[i].rs-Alignments[i].re);
    var padding = Math.round(interval_length*0.5);
    
    ref_pieces[Alignments[i].r].push([Math.min.apply(null,interval) - padding,"s"]);
    ref_pieces[Alignments[i].r].push([Math.max.apply(null,interval) + padding,"e"]);
  }

  // For each chromosome, consolidate intervals
  for (var chrom in ref_pieces) {
    Reference_intervals[chrom] = planesweep_consolidate_intervals(ref_pieces[chrom]);
  }

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


function alignment_path_generator(d) {
  // d is an alignment with r, rs, re, qs, qe, mq
  // r = chrom
  // rs = ref start
  // re = ref end
  // qs = query start
  // qe = query end
  // mq = mapping quality

  var bottom = {};
  var top = {};

  // read
  bottom.y = positions.read.y;
  bottom.left = read_scale(d.qs);
  bottom.right = read_scale(d.qe);

  // ref interval
  top.y = positions.ref_intervals.y + positions.ref_intervals.height;
  top.left = ref_interval_scale(map_ref_interval(d.r,d.rs));
  top.right = ref_interval_scale(map_ref_interval(d.r,d.re));

  return (
       "M " + bottom.left                          + "," + bottom.y
   + ", L " + bottom.right                          + "," + bottom.y
   + ", L " + top.right                           + "," + top.y
   + ", L " + top.left                           + "," + top.y
   )
}
function ref_mapping_path_generator(d) {

    var bottom = {};
    var top = {};

    bottom.y = positions.ref_intervals.y;
    bottom.left = ref_interval_scale(d.cum_pos);
    bottom.right = bottom.left + ref_interval_scale(d.end)-ref_interval_scale(d.start);

    top.y = positions.ref_block.y + positions.ref_block.height;
    top.left = whole_ref_scale(map_whole_ref(d.chrom,d.start));
    top.right = whole_ref_scale(map_whole_ref(d.chrom,d.end));

    return (
         "M " + bottom.left                          + "," + bottom.y
     + ", L " + bottom.right                          + "," + bottom.y
     + ", L " + top.right                           + "," + top.y
     + ", L " + top.left                           + "," + top.y
     )
}

function map_whole_ref(chrom,position) {
  // whole_refs has chrom, size, cum_pos

  for (var i = 0; i < whole_refs.length; i++) {
    if (whole_refs[i].chrom == chrom) {
      return whole_refs[i].cum_pos + position;
    }
  }
}

function map_ref_interval(chrom,position) {
  // ref_intervals has chrom, start, end, size, cum_pos
  for (var i = 0; i < ref_intervals.length; i++) {
    if (ref_intervals[i].chrom == chrom) {
      if (position > ref_intervals[i].start && position < ref_intervals[i].end ) {
        return ref_intervals[i].cum_pos + (position - ref_intervals[i].start);
      }
    }
  }
  console.log("ERROR: no chrom,pos match found in map_ref_interval()");
}

function draw() {

  ////////  Clear the svg to start drawing from scratch  ////////
  d3.select("#visualization_panel").selectAll("svg").remove();
  svg = d3.select("#visualization_panel").append("svg")
    .attr("width",layout.svg_width)
    .attr("height",layout.svg_height);

  if (Alignments == undefined) {
    return;
  }


  // Calculate layouts within the svg
  positions = {};
  positions.read = {"y":layout.svg_height*0.75, "x":layout.svg_width*0.10, "width":layout.svg_width*0.80, "height":layout.svg_height*0.03};
  positions.ref_block = {"y":layout.svg_height*0.15, "x":layout.svg_width*0.10, "width":layout.svg_width*0.80, "height":layout.svg_height*0.03};
  positions.ref_intervals = {"y":layout.svg_height*0.35, "x":layout.svg_width*0.10, "width":layout.svg_width*0.80, "height":layout.svg_height*0.03};

  // Draw read
  svg.append("rect").attr("class","read").attr("x",positions.read.x).attr("y",positions.read.y).attr("width",positions.read.width).attr("height",positions.read.height).style("stroke-width",1).style("stroke", "black").attr("fill",colors.read);
  svg.append("text").text(Readname).attr("x",positions.read.x+positions.read.width/2).attr("y",positions.read.y+positions.read.height*2.5).style('text-anchor',"middle").attr("dominant-baseline","top");
  svg.append("text").text("Read").attr("x",positions.read.x+positions.read.width/2).attr("y",positions.read.y+positions.read.height*5).style('text-anchor',"middle").attr("dominant-baseline","top");
  

  // Draw ref block
  // svg.append("rect").attr("class","ref_block").attr("x",positions.ref_block.x).attr("y",positions.ref_block.y).attr("width",positions.ref_block.width).attr("height",positions.ref_block.height).style("stroke-width",1).style("stroke", "black").attr("fill",colors.ref_block);
  svg.append("text").text("Reference").attr("x",positions.ref_block.x+positions.ref_block.width/2).attr("y",positions.ref_block.y-positions.ref_block.height*5.5).style('text-anchor',"middle").attr("dominant-baseline","middle");



  var chromosomes = [];
  for (var chrom in Reference_intervals) {
    chromosomes.push(chrom);
  }

  chromosomes.sort(natural_sort);

  ref_intervals = [];
  var cumulative_position = 0;

  // Note: this takes the largest mapping point as the end of the chromosome because it assumes we don't have reference chromosomes
  whole_refs = [];
  var cumulative_whole_ref_size = 0;
  for (var j = 0; j < chromosomes.length; j++){
    var chrom = chromosomes[j];
    console.log(chrom);
    var intervals = Reference_intervals[chrom];
    for (var i = 0; i < intervals.length; i++) {
      ref_intervals.push({"chrom":chrom,"start":intervals[i][0],"end":intervals[i][1],"size":intervals[i][1]-intervals[i][0],"cum_pos":cumulative_position});
      cumulative_position += (intervals[i][1]-intervals[i][0])
    }
    whole_refs.push({"chrom":chrom,"size":intervals[intervals.length-1][1],"cum_pos":cumulative_whole_ref_size});
    cumulative_whole_ref_size += intervals[intervals.length-1][1];

  }


  read_scale.domain([0,read_length]).range([positions.read.x,positions.read.x+positions.read.width]);
  whole_ref_scale.domain([0,cumulative_whole_ref_size]).range([positions.ref_block.x, positions.ref_block.x + positions.ref_block.width]);
  ref_interval_scale.domain([0,cumulative_position]).range([positions.ref_intervals.x, positions.ref_intervals.x+positions.ref_intervals.width]);
  ref_color_scale.domain(chromosomes);


  // Whole reference chromosomes for the relevant references:
  svg.selectAll("rect.ref_block").data(whole_refs).enter()
    .append("rect").attr("class","ref_block")
      .attr("x",function(d) { return whole_ref_scale(d.cum_pos); })
      .attr("y",positions.ref_block.y)
      .attr("width", function(d) {return (whole_ref_scale(d.cum_pos + d.size) - whole_ref_scale(d.cum_pos));})
      .attr("height", positions.ref_block.height)
      .attr("fill",function(d) {return ref_color_scale(d.chrom);})
      .style("stroke-width",1).style("stroke", "black");

  svg.selectAll("text.ref_block").data(whole_refs).enter()
    .append("text").attr("class","ref_block")
      .filter(function(d) { return (whole_ref_scale(d.cum_pos + d.size) - whole_ref_scale(d.cum_pos) > 10);})
        .attr("x", function(d) { return whole_ref_scale(d.cum_pos + d.size/2)})
        .attr("y",positions.ref_block.y - padding.text)
        .attr("height", positions.ref_block.height)
        // .attr("width", function(d) {return (whole_ref_scale(d.cum_pos + d.size)-whole_ref_scale(d.cum_pos));})
        .style('text-anchor',"middle").attr("dominant-baseline","bottom")
        // .attr("font-size",function(d) {return (whole_ref_scale(d.cum_pos + d.size)-whole_ref_scale(d.cum_pos))/2;})
        .text(function(d){return d.chrom;});
  
  // Zoom into reference intervals where the read maps:
  svg.selectAll("rect.ref_interval").data(ref_intervals).enter()
    .append("rect").attr("class","ref_interval")
      .attr("x",function(d) { return ref_interval_scale(d.cum_pos); })
      .attr("y",positions.ref_intervals.y)
      .attr("width", function(d) {return (ref_interval_scale(d.end)-ref_interval_scale(d.start));})
      .attr("height", positions.ref_intervals.height)
      .attr("fill",function(d) {return ref_color_scale(d.chrom);})
      .style("stroke-width",1).style("stroke", "black");

  svg.selectAll("path.ref_mapping").data(ref_intervals).enter()
    .append("path").attr("class","ref_mapping")
      .attr("d",function(d) {return ref_mapping_path_generator(d)})
      // .style("stroke-width",2)
      // .style("stroke","black")
      .attr("fill",function(d) {return ref_color_scale(d.chrom);})


  svg.selectAll("path.alignment").data(Alignments).enter()
    .append("path").attr("class","alignment")
      .attr("d",function(d) {return alignment_path_generator(d)})
      // .style("stroke-width",2)
      // .style("stroke","black")
      .attr("fill",function(d) {return ref_color_scale(d.r);})
}

// ===========================================================================
// == Responsiveness
// ===========================================================================

// 
// Resize SVG and sidebar when window size changes
window.onresize = resizeWindow;

function resizeWindow() {
  responsive_sizing();
}

run();


// m150516_160506_sherri_c100800332550000001823168409091513_s1_p0/96017/7541_25822 2048  chr2  32866713  60  4817H11M1D5M1D90M2I124M3I59M1D81M2I11M2I33M13041H * 0 0 CTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTGCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTATTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTGTTCTTTTTTTTACTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTC * NM:i:40 MD:Z:11^C5^C15C27C5C4C31C5C21C13C2C21C4C50C12C21C1C22T3^C11C2C3C5C1C1C7T2C6C6C32C13C24  AS:i:339  XS:i:94 SA:Z:chr8,120735173,-,14677S24M1I11M1I13M3I16M2D11M2I6M1I10M1D7M1D10M1D4M1I13M3I17M1I14M2I3M1I5M1D11M2I7M1I6M3I14M1I12M4I4M5I2M1I2M1I2M1I42M1D4M2D16M2I16M3I2M1I15M2I55M1D2M1D8M1D5M1D8M3D18M1I10M1I11M1I29M1D13M2I1M1I23M2I6M2I11M1I7M1I19M2I9M1I5M1D10M1I19M1I15M1D1M1D5M1D5M1D11M2D8M1D11M1I5M1D1M1D26M1I48M1I32M1D13M1D6M1I42M1I40M1D6M1I10M2I14M1I15M1D6M1D5M1I4M1I14M2I30M1I2M1I29M1I14M1I13M1I24M1D10M1I17M2D14M1I6M1D1M2D3M2I10M2I10M1D82M1I4M2D8M1D3M1D4M1I5M1I2M1I13M1D13M1I29M2I27M1I18M1I15M1D6M1D27M1D4M1I43M1D6M1D9M1D1M1D7M1I43M2I16M1D8M1D3M1D6M1D6M1I35M1I7M3D1M2D3M1D13M1D3M1D8M1D2M1D6M1I24M2D5M1I6M1I15M1D16M1I17M1I4M1D3M1D2M1I52M2I16M1I12M1D5M1I4M1D10M2I2M3I35M1D18M1I28M2I33M1I15M1D1M1D7M2D8M3D12M1I10M1D29M1D20M1I46M2I2M1I9M2I9M1D11M1D22M1D48M1D17M1I36M1D10M1I17M1I12M1I7M1I7M1I12M1D8M1D27M1I6M1I18M1I18M1D29M1I7M1I11M1I16M1I30M1D11M1I14M1D17M1I28M1D11M1I15M5D3M4D1M2D2M3D20M2D1M3D8M1D3M1D13M1D5M14D22M1I12M1D11M1I19M1I14M1I7M2D2M1D4M1I5M1I13M1D9M1I9M1I8M1D1M1D9M2D4M1D4M3D6M1I12M1D8M1I7M1I15M2D3M1D5M1D1M3D16M2I6M1D13M1I9M1I22M1I11M1D5M1I18M1D20M2D8M1I6M1I60M1I17M2I3M1I25M2I31M1I5M2I11M1I16M1I5M1I14M1D11M2I24M1I3M1I9M1D15M1I8M1I3M1I4M1I7M2I1M1I46M1I2M1I6M2I29M1D4M1D10M1I12M1D24M71S,60,444;chr2,32866714,+,17490S98M2I78M1I59M2I29M1I104M1I47M369S,11,38;chr2,32866714,+,11645S82M1I102M5I56M3I86M1I26M1I2M1I54M1I7M6208S,0,41;chr2,32866714,+,12802S137M1I38M1D21M1D73M3I10M1I21M1D41M1D18M1D51M5064S,0,37;chr2,32866714,+,5756S81M1I54M1I133M3I123M2I4M1I20M12102S,60,40;chr2,32866714,+,15361S87M3I203M1D18M1D5M1D99M2505S,0,38;chr2,32866714,+,10983S89M1I112M2I54M1I89M3I1M1I70M6875S,6,39;chr2,32866714,+,5415S49M2I158M1I8M2I31M1I2M1I167M12444S,0,40;chr2,32866714,+,5077S15M2D43M1D58M1I26M1D2M1D114M1D53M1D17M2I57M1I23M12792S,60,37;chr2,32866715,+,15837S23M1I25M1I97M2I13M1I20M1I47M1D12M1D123M1D51M2027S,7,38;chr2,32866713,+,14900S30M1I61M2I29M1I107M1D180M2I8M2960S,3,41;chr2,32866714,+,11323S10M1I48M1I38M1I34M1I28M2I4M1I3M1I11M2I70M2I13M1I21M1I22M1I3M1D3M1D105M6530S,60,41;chr2,32866714,+,9045S50M1I81M3I30M6I100M2I83M1D38M1I32M8809S,9,44;chr2,32866714,+,14275S41M1I90M1I5M1I11M2D106M2I56M1I27M1D78M3586S,60,41;chr2,32866714,+,6788S66M1D4M1D71M1I3M1I87M1I40M1I123M2I18M11075S,0,41;chr2,32866714,+,7732S60M1D10M1D126M2D46M1I39M2I48M1I34M1I48M10133S,6,41;chr2,32866714,+,9334S406M2I5M1I4M8529S,60,43;chr2,32866714,+,8054S134M1I87M4I7M5I77M1D38M1D71M9803S,8,46;chr2,32866714,+,7288S94M1I2M1I61M1I94M1I22M1I22M3I14M1D74M1I14M1I2M1I15M10568S,3,44;chr2,32866714,+,13125S66M2I5M1D98M1D4M1D75M2I2M2I20M1I3M1I29M1D4M1I41M1I13M3I13M1I38M4731S,60,44;chr2,32866714,+,16700S42M1I4M1I2M3I38M1I11M1I55M1I42M1I131M3I68M1I9M1I13M1152S,4,47;chr2,32866716,+,6442S42M1I5M1I25M1I48M1I6M1I140M1I51M1D39M2I42M1I14M11418S,60,45;chr2,32866714,+,4138S226M1D12M1D75M2I86M7I15M13720S,60,49;chr2,32866714,+,12338S66M6I37M1I10M3I6M1I11M2I2M1I60M1I61M1I79M1I83M5511S,60,49;chr2,32866714,+,13343S36M2I49M3I5M1I35M1I10M1I8M2I15M2I4M1I81M1I33M1I18M1I24M3I21M1I71M1I5M4502S,60,52;chr2,32866714,+,8410S54M1I25M3I80M1I21M3I38M3I13M3I44M2I42M1I22M3I35M1D41M9436S,60,54;chr2,32866714,+,10098S25M4I27M1I22M1I18M1I87M1I41M2I29M1I5M1I25M6I62M4I21M1I36M1I13M1I4M7743S,60,56;chr7,107769994,+,11959S49M1D6M1D52M1I79M5D88M6047S,58,55;chr7,107769994,+,13974S22M1I22M1D72M1I70M4I94M4021S,45,61;chr7,107769889,+,3801S6M2D7M2I7M2I3M1I17M2I3M1D6M1D9M1I16M2D13M1D4M2I4M2D7M2I10M1D5M1I12M1I15M1D15M5I2M1I29M6I5M1I7M1D2M1D6M1I12M1I2M1I3M1I4M4I10M1I10M4I11M2I106M14070S,19,145;chr20,34228126,+,6152S101M2D65M11963S,12,34;chr20,34228129,+,15247S67M2D34M6D56M2877S,26,33;chr20,34228129,+,12162S67M2D13M1D8M1D12M4D2M1D54M5963S,16,33;chr20,34228130,+,17865S2M1D63M1D3M1D65M283S,34,20;chr20,34228129,+,4746S137M13398S,3,22;chr12,66057593,+,10707S91M7483S,0,0;chr20,34228128,+,15735S4M1D82M3I51M2406S,24,24;chr12,66057585,+,10634S66M1I32M7548S,40,4;chr20,34228129,+,4649S4M1I133M13494S,3,24;chr12,66057593,+,10529S4M1I87M7660S,7,1;chr12,66057592,+,7220S63M1I20M1I8M10968S,19,2;chr21,9321880,+,13716S125M3D23M4D23M1D28M1D14M1D68M1D9M1D15M2D58M4202S,2,142;hs38d1,1692600,+,9918S12M3D58M2I55M8236S,6,22;chrX,40110630,+,18120S23M1D72M66S,1,6;chr18,63063646,+,16638S102M1541S,16,11;chr18,63063640,+,18036S4M2D23M1D3M1D6M1D62M1I5M141S,14,14;chr4,94340260,+,4544S5M1D27M1I60M1I4M13639S,26,12;hs38d1,2589320,+,8988S9M1D98M1I5M9180S,5,21;chr9,122765980,-,7266S52M1D61M2D10M10892S,5,27;chr4,19077839,+,8853S51M1I31M2I8M9335S,6,11;chr5,115298251,-,939S63M3D28M1D61M17190S,3,43;hs38d1,417546,-,797S5M2D58M1D11M3I8M17399S,0,9;chr10,109812363,+,6302S6M1I48M1I1M1I37M11884S,13,14;chr10,86453018,-,3477S5M1I55M3D7M3D43M14693S,0,25;chr19,54998523,+,16401S14M3D55M4D57M1754S,6,34;chr4,49273694,-,11803S5M1I73M1D15M6384S,0,17;chr8,111156003,+,12292S59M5930S,0,0;chr19,8268620,-,874S67M17340S,0,4;chr4,49273694,-,7377S7M1I45M1D2M1D3M1D7M3D24M10815S,4,16;chr4,49273694,-,3976S42M1I46M14216S,0,15;chr2,87907398,-,1613S69M2D22M16577S,0,18;chr8,47331937,+,17149S12M3D10M4D24M1I25M1060S,48,12;chr15,54926030,+,12752S49M1I6M5473S,3,2;chr10,68797478,+,7688S51M10542S,60,0;chr19,36467791,-,9299S62M8920S,13,6;chr2,109851185,-,1916S43M1D2M1D5M2D6M2D1M1D27M4D35M16246S,0,37;chr5,95492637,-,8180S5M1I46M3I15M10031S,0,9;chr10,114138038,-,8359S44M2I9M9867S,10,3;chr3,119174994,+,9786S9M1I41M2I4M8438S,60,4;chr7,102466752,+,16547S43M1691S,60,0;  RG:Z:SKBR3-MHC-598BB67
// m150516_160506_sherri_c100800332550000001823168409091513_s1_p0/96017/7541_25822 2048  chr2  32866713  3 14900H30M1I61M2I29M1I107M1D180M2I8M2960H  * 0 0 CTTTTTTTTTTTTTCTGCTTTTTTTTTTTTCTTTTGTTTTTTTTTTTTTTTTTTTTTTTTTGCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTGTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTCCTTTTTTTT * NM:i:41 MD:Z:11C2T1T16C0T25T6C4C28C2C5C21C13C2C21C4C50^C12C21C1C2C23C11C2C3C5C1C1C10C6C6C18C10C2C13C23  AS:i:335  XS:i:332  SA:Z:chr8,120735173,-,14677S24M1I11M1I13M3I16M2D11M2I6M1I10M1D7M1D10M1D4M1I13M3I17M1I14M2I3M1I5M1D11M2I7M1I6M3I14M1I12M4I4M5I2M1I2M1I2M1I42M1D4M2D16M2I16M3I2M1I15M2I55M1D2M1D8M1D5M1D8M3D18M1I10M1I11M1I29M1D13M2I1M1I23M2I6M2I11M1I7M1I19M2I9M1I5M1D10M1I19M1I15M1D1M1D5M1D5M1D11M2D8M1D11M1I5M1D1M1D26M1I48M1I32M1D13M1D6M1I42M1I40M1D6M1I10M2I14M1I15M1D6M1D5M1I4M1I14M2I30M1I2M1I29M1I14M1I13M1I24M1D10M1I17M2D14M1I6M1D1M2D3M2I10M2I10M1D82M1I4M2D8M1D3M1D4M1I5M1I2M1I13M1D13M1I29M2I27M1I18M1I15M1D6M1D27M1D4M1I43M1D6M1D9M1D1M1D7M1I43M2I16M1D8M1D3M1D6M1D6M1I35M1I7M3D1M2D3M1D13M1D3M1D8M1D2M1D6M1I24M2D5M1I6M1I15M1D16M1I17M1I4M1D3M1D2M1I52M2I16M1I12M1D5M1I4M1D10M2I2M3I35M1D18M1I28M2I33M1I15M1D1M1D7M2D8M3D12M1I10M1D29M1D20M1I46M2I2M1I9M2I9M1D11M1D22M1D48M1D17M1I36M1D10M1I17M1I12M1I7M1I7M1I12M1D8M1D27M1I6M1I18M1I18M1D29M1I7M1I11M1I16M1I30M1D11M1I14M1D17M1I28M1D11M1I15M5D3M4D1M2D2M3D20M2D1M3D8M1D3M1D13M1D5M14D22M1I12M1D11M1I19M1I14M1I7M2D2M1D4M1I5M1I13M1D9M1I9M1I8M1D1M1D9M2D4M1D4M3D6M1I12M1D8M1I7M1I15M2D3M1D5M1D1M3D16M2I6M1D13M1I9M1I22M1I11M1D5M1I18M1D20M2D8M1I6M1I60M1I17M2I3M1I25M2I31M1I5M2I11M1I16M1I5M1I14M1D11M2I24M1I3M1I9M1D15M1I8M1I3M1I4M1I7M2I1M1I46M1I2M1I6M2I29M1D4M1D10M1I12M1D24M71S,60,444;chr2,32866714,+,17490S98M2I78M1I59M2I29M1I104M1I47M369S,11,38;chr2,32866714,+,11645S82M1I102M5I56M3I86M1I26M1I2M1I54M1I7M6208S,0,41;chr2,32866713,+,4817S11M1D5M1D90M2I124M3I59M1D81M2I11M2I33M13041S,60,40;chr2,32866714,+,12802S137M1I38M1D21M1D73M3I10M1I21M1D41M1D18M1D51M5064S,0,37;chr2,32866714,+,5756S81M1I54M1I133M3I123M2I4M1I20M12102S,60,40;chr2,32866714,+,15361S87M3I203M1D18M1D5M1D99M2505S,0,38;chr2,32866714,+,10983S89M1I112M2I54M1I89M3I1M1I70M6875S,6,39;chr2,32866714,+,5415S49M2I158M1I8M2I31M1I2M1I167M12444S,0,40;chr2,32866714,+,5077S15M2D43M1D58M1I26M1D2M1D114M1D53M1D17M2I57M1I23M12792S,60,37;chr2,32866715,+,15837S23M1I25M1I97M2I13M1I20M1I47M1D12M1D123M1D51M2027S,7,38;chr2,32866714,+,11323S10M1I48M1I38M1I34M1I28M2I4M1I3M1I11M2I70M2I13M1I21M1I22M1I3M1D3M1D105M6530S,60,41;chr2,32866714,+,9045S50M1I81M3I30M6I100M2I83M1D38M1I32M8809S,9,44;chr2,32866714,+,14275S41M1I90M1I5M1I11M2D106M2I56M1I27M1D78M3586S,60,41;chr2,32866714,+,6788S66M1D4M1D71M1I3M1I87M1I40M1I123M2I18M11075S,0,41;chr2,32866714,+,7732S60M1D10M1D126M2D46M1I39M2I48M1I34M1I48M10133S,6,41;chr2,32866714,+,9334S406M2I5M1I4M8529S,60,43;chr2,32866714,+,8054S134M1I87M4I7M5I77M1D38M1D71M9803S,8,46;chr2,32866714,+,7288S94M1I2M1I61M1I94M1I22M1I22M3I14M1D74M1I14M1I2M1I15M10568S,3,44;chr2,32866714,+,13125S66M2I5M1D98M1D4M1D75M2I2M2I20M1I3M1I29M1D4M1I41M1I13M3I13M1I38M4731S,60,44;chr2,32866714,+,16700S42M1I4M1I2M3I38M1I11M1I55M1I42M1I131M3I68M1I9M1I13M1152S,4,47;chr2,32866716,+,6442S42M1I5M1I25M1I48M1I6M1I140M1I51M1D39M2I42M1I14M11418S,60,45;chr2,32866714,+,4138S226M1D12M1D75M2I86M7I15M13720S,60,49;chr2,32866714,+,12338S66M6I37M1I10M3I6M1I11M2I2M1I60M1I61M1I79M1I83M5511S,60,49;chr2,32866714,+,13343S36M2I49M3I5M1I35M1I10M1I8M2I15M2I4M1I81M1I33M1I18M1I24M3I21M1I71M1I5M4502S,60,52;chr2,32866714,+,8410S54M1I25M3I80M1I21M3I38M3I13M3I44M2I42M1I22M3I35M1D41M9436S,60,54;chr2,32866714,+,10098S25M4I27M1I22M1I18M1I87M1I41M2I29M1I5M1I25M6I62M4I21M1I36M1I13M1I4M7743S,60,56;chr7,107769994,+,11959S49M1D6M1D52M1I79M5D88M6047S,58,55;chr7,107769994,+,13974S22M1I22M1D72M1I70M4I94M4021S,45,61;chr7,107769889,+,3801S6M2D7M2I7M2I3M1I17M2I3M1D6M1D9M1I16M2D13M1D4M2I4M2D7M2I10M1D5M1I12M1I15M1D15M5I2M1I29M6I5M1I7M1D2M1D6M1I12M1I2M1I3M1I4M4I10M1I10M4I11M2I106M14070S,19,145;chr20,34228126,+,6152S101M2D65M11963S,12,34;chr20,34228129,+,15247S67M2D34M6D56M2877S,26,33;chr20,34228129,+,12162S67M2D13M1D8M1D12M4D2M1D54M5963S,16,33;chr20,34228130,+,17865S2M1D63M1D3M1D65M283S,34,20;chr20,34228129,+,4746S137M13398S,3,22;chr12,66057593,+,10707S91M7483S,0,0;chr20,34228128,+,15735S4M1D82M3I51M2406S,24,24;chr12,66057585,+,10634S66M1I32M7548S,40,4;chr20,34228129,+,4649S4M1I133M13494S,3,24;chr12,66057593,+,10529S4M1I87M7660S,7,1;chr12,66057592,+,7220S63M1I20M1I8M10968S,19,2;chr21,9321880,+,13716S125M3D23M4D23M1D28M1D14M1D68M1D9M1D15M2D58M4202S,2,142;hs38d1,1692600,+,9918S12M3D58M2I55M8236S,6,22;chrX,40110630,+,18120S23M1D72M66S,1,6;chr18,63063646,+,16638S102M1541S,16,11;chr18,63063640,+,18036S4M2D23M1D3M1D6M1D62M1I5M141S,14,14;chr4,94340260,+,4544S5M1D27M1I60M1I4M13639S,26,12;hs38d1,2589320,+,8988S9M1D98M1I5M9180S,5,21;chr9,122765980,-,7266S52M1D61M2D10M10892S,5,27;chr4,19077839,+,8853S51M1I31M2I8M9335S,6,11;chr5,115298251,-,939S63M3D28M1D61M17190S,3,43;hs38d1,417546,-,797S5M2D58M1D11M3I8M17399S,0,9;chr10,109812363,+,6302S6M1I48M1I1M1I37M11884S,13,14;chr10,86453018,-,3477S5M1I55M3D7M3D43M14693S,0,25;chr19,54998523,+,16401S14M3D55M4D57M1754S,6,34;chr4,49273694,-,11803S5M1I73M1D15M6384S,0,17;chr8,111156003,+,12292S59M5930S,0,0;chr19,8268620,-,874S67M17340S,0,4;chr4,49273694,-,7377S7M1I45M1D2M1D3M1D7M3D24M10815S,4,16;chr4,49273694,-,3976S42M1I46M14216S,0,15;chr2,87907398,-,1613S69M2D22M16577S,0,18;chr8,47331937,+,17149S12M3D10M4D24M1I25M1060S,48,12;chr15,54926030,+,12752S49M1I6M5473S,3,2;chr10,68797478,+,7688S51M10542S,60,0;chr19,36467791,-,9299S62M8920S,13,6;chr2,109851185,-,1916S43M1D2M1D5M2D6M2D1M1D27M4D35M16246S,0,37;chr5,95492637,-,8180S5M1I46M3I15M10031S,0,9;chr10,114138038,-,8359S44M2I9M9867S,10,3;chr3,119174994,+,9786S9M1I41M2I4M8438S,60,4;chr7,102466752,+,16547S43M1691S,60,0;  XA:Z:chr2,+32866714,14778S20M1I15M1I36M3I62M2I13M6I24M1I1M4I27M1I214M1I3M3068S,47;  RG:Z:SKBR3-MHC-598BB67


