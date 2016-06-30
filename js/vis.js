



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
var sam_data = [];

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

  layout.table_fraction = 0.35;
  layout.canvas_fraction = 0.65;

  layout.left_width = (window_width - padding.left - padding.right) * (1-layout.table_fraction);
  layout.table_width = (window_width - padding.left - padding.right) * layout.table_fraction;
  layout.input_height = (window_height - padding.top - padding.bottom) * (1-layout.canvas_fraction);
  layout.vis_height = (window_height - padding.top - padding.bottom) * layout.canvas_fraction;
  layout.total_height = (window_height - padding.top - padding.bottom);

  layout.canvas_width = layout.left_width - padding.between;
  layout.canvas_height = layout.vis_height - padding.between;

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

    ////////  Clear the svg to start drawing from scratch  ////////
    d3.select("#visualization_panel").selectAll("svg").remove();
    svg = d3.select("#visualization_panel").append("svg")
      .attr("width",layout.canvas_width)
      .attr("height",layout.canvas_height);
    

  d3.select("#sam_table_panel")
    .style("width",layout.table_width + "px")
    .style("height",layout.total_height + "px");
  table = d3.select("#sam_table_panel").select("table");
}


$('#sam_input').bind('input propertychange', function() {
  var input_text = this.value.split("\n");
  sam_data = [];
  for (var i = 0; i < input_text.length; i++) {
    sam_data.push(input_text[i]);
  }

  table.selectAll("tr").remove();
  var rows = table.selectAll("tr").data(sam_data).enter()
    .append("tr");
  
  rows.append("td").text(">").on("click",select_read);
  //rows.append("td").append("input").attr("type","radio");

  rows.selectAll("td.data").data(function(line){return line.split(/[ \t]+/); }).enter()
        .append("td").text(function(d){return d;}).attr("class","data");
});

function run() {
  console.log("Running");
  responsive_sizing();
	// Read files or input data
	// Run when all data loaded
}

function select_read(d) {
  console.log(d);
  svg.append("text").text(d).attr("width",100).attr("height",100).attr("x",100).attr("y",100);

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
