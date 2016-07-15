<!DOCTYPE html>

<html>

<!--		NAVIGATION BAR-->
<?php include "header.html";?>

<!-- CSS: -->
	<link href='https://fonts.googleapis.com/css?family=Lato:300,900' rel='stylesheet' type='text/css'>
	<!-- Bootstrap core CSS -->
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap theme -->
    <link href="css/bootstrap-theme.min.css" rel="stylesheet">

	<!-- My own styles -->
	<link href="css/custom.css" rel="stylesheet">



<div id="left_panel">
	<div id="svg2_panel"></div>
	<div id="svg1_panel"></div>
</div>

<div id="right_panel">
	<div class="panel-group">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_alignment_input_box">Input read alignments</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_alignment_input_box">
				<div class="panel-body">
					<ul class="nav nav-tabs">
						<li class="active"><a data-toggle="tab" href="#sam">paste sam</a></li>
						<!-- <li><a data-toggle="tab" href="#bed">paste bed</a></li> -->
						<li><a data-toggle="tab" href="#bam">load bam file</a></li>
					</ul>
					
					<div class="tab-content">
						<div id="sam" class="tab-pane fade in active">
							<textarea class="form-control" placeholder="Paste lines from a sam file"  id="sam_input"></textarea>
							<span id="sam_info_icon" ><span class="glyphicon glyphicon-info-sign"></span> Show example</span>
						</div>
						<!-- <div id="bed" class="tab-pane fade">
							<textarea class="form-control" placeholder="Paste lines from a bed file"  id="bed_input"></textarea>
							<span id="bed_info_icon" class="glyphicon glyphicon-info-sign"></span>
						</div> -->
						<div id="bam" class="tab-pane fade">
							<h5>Select bam and corresponding bam.bai</h5>
							<input type="file" name="files[]" id="bam_file"	multiple />
							<span id="bam_info_icon" ><span class="glyphicon glyphicon-info-sign"></span> Instructions</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="panel-group">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_region_picking_box">Select region</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_region_picking_box">
				<div class="panel-body">
					<input class="tiny_input" id="region_chrom" placeholder="chr1"> : 
					<input class="small_input" id="region_start" value="0"> - 
					<input class="small_input" id="region_end" value="100000">
					<button id="region_go">Go</button>
				</div>
			</div>
		</div>
	</div>


	
	<h4 id="select_reads">Select reads</h4>
	<table id="sam_table"></table>
	<div id="user_message" class="alert alert-default" role="alert"></div>
	<br>
	<div id="settings" style="float:left; display: inline-block">
		<h3> Settings</h3>
		<form>
		<table id="settings_table">
			<tr><td class="table_title" colspan="5">General settings</td></tr>
			<tr>
				<td width="45%">Minimum mapping quality: </td>
				<td width="15%"><span id="mq_label">0</span></td>
				<td width="35%"><input type="range" id="mq_slider" value="0"></td>
			</tr>
			<tr>
				<td>Minimum indel size to split: </td>
				<td><span id="indel_size_label">inf</span></td>
				<td><input type="range" id="indel_size_slider" min="0" value="100000"></td>
				
			</tr>
			<tr><td>Show only reference chromosome lengths from header</td>
				<td><input id="only_header_refs_checkbox" type="checkbox"></td>
			</tr>	
<!-- 
			<tr id="table_sep"><td colspan="5"><input class="bootstrap_switch" id="ribbon_vs_dotplot" type="checkbox" name="ribbon_vs_dotplot" data-on-text="Ribbon" data-off-text="Dotplot"></td></tr> -->

			<tr id="table_sep">
				<td colspan="5">
					
					<label class="radio-inline">
						<input class="ribbon_vs_dotplot" id="select_ribbon" type="radio" name="ribbon_vs_dotplot" value="ribbon">Ribbon plot
					</label>

					<label class="radio-inline">
						<input class="ribbon_vs_dotplot" id="select_dotplot"  type="radio" name="ribbon_vs_dotplot" value="dotplot">Dot plot
					</label>

				</td>
			</tr>

			<tr class="dotplot_settings"><td class="table_title" colspan="5">Dot plot settings</td></tr>
			<tr class="dotplot_settings">
				<td>Colors on dotplot: </td><td><input id="colors_checkbox" type="checkbox" checked></td>
			</tr>
			<tr class="ribbon_settings"><td class="table_title" colspan="5">Ribbon plot settings</td></tr>
			<tr class="ribbon_settings">
				<td>Ribbon outline: </td><td><input id="outline_checkbox" type="checkbox" checked></td>
			</tr>
		</table>
	</form>
	</div>
</div>

<!-- Libraries -->
<script src="js/d3.v3.min.js"></script>
<script src="js/jquery.min.js"></script>
<script src="js/bootstrap.min.js"></script>

<!-- Library from bam.iobio for reading a bam file -->
<script src="js/bam/class.js"></script>
<script src="js/bam/bin.js"></script>
<script src="js/bam/inflate.js"></script>
<script src="js/bam/bam.js"></script>
<script src="js/bam/bam.iobio.js"></script>


<!-- Main -->
<script src="js/vis.js"></script>






</body>
</html>


