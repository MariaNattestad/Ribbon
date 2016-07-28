<!DOCTYPE html>

<html>

<?php include "header.html";?>


<div id="left_panel">
	<div id="svg2_panel"></div>
	<div id="svg1_panel"></div>
</div>

<div id="right_panel">
	<div class="panel-group">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_alignment_input_box">Inputs</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_alignment_input_box">
				<div class="panel-body">
					<ul class="nav nav-tabs">
						<li class="active"><a data-toggle="tab" href="#sam">paste sam</a></li>
						<li><a data-toggle="tab" href="#bam">load bam file</a></li>
						<li><a data-toggle="tab" href="#coords">coordinates</a></li>
						<li><a data-toggle="tab" href="#igv">from igv</a></li>
					</ul>
					
					<div class="tab-content">
					<!-- Sam input -->
						<div id="sam" class="tab-pane fade in active">
							<textarea class="form-control" placeholder="Paste lines from a sam file"  id="sam_input"></textarea>
							<span id="sam_info_icon" ><span class="glyphicon glyphicon-info-sign"></span> Show example</span>
						</div>
					<!-- Bam input -->
						<div id="bam" class="tab-pane fade">
							<p>Select bam and corresponding bam.bai</p>
							<input type="file" name="files[]" id="bam_file"	multiple />
							<span id="bam_info_icon" ><span class="glyphicon glyphicon-info-sign"></span> Instructions</span>
						</div>
					<!-- Coords input -->
						<div id="coords" class="tab-pane fade">
							<p>Paste coordinates here:</p>
							<textarea class="form-control" placeholder="Paste lines from a coordinates file (show-coords -lTH)"  id="coords_input"></textarea>
							<hr>
							<p>or upload a file:</p>
							<input type="file" id="coords_file" />
							<span id="coords_info_icon"> <span class="glyphicon glyphicon-info-sign"></span> Show example</span>
						</div>
					<!-- IGV input -->
						<div id="igv" class="tab-pane fade">
							<p> This feature is still being implemented and tested. When the link from IGV works, the instructions here will be as follows:
							</p>
							<p>
							Update to the newest version of IGV. Click on a read of interest within IGV and choose "Send to Ribbon"</p>
							<h4>Data from IGV:</h4>
							<pre readonly id="igv_stats">(empty)</pre>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="panel-group" id="variant_input_panel">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_variant_upload_box">Upload variants</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_variant_upload_box">
				<div class="panel-body">

					<ul class="nav nav-tabs">
						<li class="active"><a data-toggle="tab" href="#upload_variants">upload bed or vcf</a></li>
						<li><a data-toggle="tab" href="#bed">paste bed</a></li>
						<li><a data-toggle="tab" href="#vcf">paste vcf</a></li>
					</ul>
					
					<div class="tab-content">
					<!-- upload variant file -->
						<div id="upload_variants" class="tab-pane fade in active">
							<p>Upload a .vcf or .bed file</p>
							<input type="file" id="variant_file" />
							<p><span class="vcf_info_icon"> <span class="glyphicon glyphicon-info-sign"></span> Instructions for .vcf file</span></p>
							<p><span class="bed_info_icon"> <span class="glyphicon glyphicon-info-sign"></span> Instructions for .bed file</span></p>
						</div>
					<!-- paste bed file -->
						<div id="bed" class="tab-pane fade">
							<p>Paste lines from a bed file here:</p>
							<textarea class="form-control" placeholder="Paste lines from a bed file"  id="bed_input"></textarea>
							<span class="bed_info_icon"> <span class="glyphicon glyphicon-info-sign"></span> Instructions</span>
						</div>
					<!-- paste vcf file -->
						<div id="vcf" class="tab-pane fade">
							<p>Paste lines from a vcf file here:</p>
							<textarea class="form-control" placeholder="Paste lines from a vcf file"  id="vcf_input"></textarea>
							<span class="vcf_info_icon"> <span class="glyphicon glyphicon-info-sign"></span> Instructions</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div id="user_message" class="alert alert-default" role="alert"></div>


	<div class="panel-group" id="variant_table_panel">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_variant_table_box">Inspect variants</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_variant_table_box">
				<div class="panel-body">
					<div id="variant_table_box">
						<p> For bam files, click on a row in the table to fetch reads around that feature. </p>
						<table id="variant_table">

						</table>
					</div>
				</div>
			</div>
		</div>
	</div>


	<div class="panel-group" id="region_selector_panel">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_region_picking_box">Select position</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_region_picking_box">
				<div class="panel-body">
					<div id="region_box">
						<input class="tiny_input" type="text" id="region_chrom" placeholder="chr1"> : 
						<input class="small_input" type="number" id="region_start" placeholder="123456789">
						<!-- - <input class="small_input" id="region_end" value="100000"> -->
						<button id="region_go">Go</button>
					</div>
				</div>
			</div>
		</div>
	</div>


	<div class="panel-group" id="region_settings_panel">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_region_settings_box">Region view settings</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_region_settings_box">
				<div class="panel-body">
					<table id="settings_table">
							<tr><th colspan="3">Filter reads</th></tr>
							<tr><td>Number of alignments</td>
								<td> <span id="num_aligns_range_label"></span> </td>
								<td> <div class="slider" id="num_aligns_range_slider"></div> </td>
							</tr>
							<tr>
								<td>Minimum read/query length</td>
								<!-- <td><span id="min_read_length_input"></span> </td> -->
								<td><input class="snug" type="number" id="min_read_length_input"></input> </td>
								<td> <div class="slider" id="min_read_length_slider"></div> </td>
							</tr>
							<tr>
								<td width="45%" id="region_min_mq_title" >Minimum mapping quality for best alignment: </td>
								<td width="20%"><span id="region_mq_label">0</span></td>
								<td width="30%"><div class="slider" id="region_mq_slider"></td>
							</tr>
							<tr><th colspan="3">Filter references</th></tr>
							<tr>
								<td>Zoom to chromosome</td>
								<td><p id="chrom_highlighted">all</p></td>
								<td>
									<div class="input-group"><input class="form-control"  autocomplete="off" id="chrom_search_input" type="text" placeholder="chr1"><span class="input-group-btn"><button class="btn btn-secondary"  type="button" id="show_all_refs">Show all</button></span>
									</div>
									<ul id="chrom_livesearch"></ul>
								</td>
							</tr>
							<tr>
								<td>Maximum length for reference sequences</td>
								<td><input class="snug" type="number" id="max_ref_length_input"></span> </td>
								<!-- <td><span id="max_ref_length_input"></span> </td> -->
								<td> <div class="slider" id="max_ref_length_slider"></div> </td>
							</tr>
							<tr><th colspan="3">Settings</th></tr>
							<tr>
								<td>Sort reads vertically</td>
								<td colspan="2">
									<select class="form-control" id="read_sorting_dropdown">
										
									 </select>
								</td>
							</tr>
							<tr>
								<td>Color scheme</td>
								<td colspan="2"> 
									<select class="form-control" id="color_scheme_dropdown">
										
								 	</select>
								</td>
							</tr>
					</table>
				</div>
			</div>
		</div>
	</div>

	<div class="panel-group" id="settings">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_detail_settings_box">Detailed view settings</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_detail_settings_box">
				<div class="panel-body">
					<!-- <form> -->
						<table id="settings_table">
							<tr>
								<td>Read selected</td>
								<td colspan="2">
									<input class="snug"  autocomplete="off" type="text" id="readname_search_input">
									<ul id="readname_livesearch"></ul>
								</td>
							</tr>
							<tr>
								<td class="hide_for_coords">Minimum indel size to split: </td>
								<td class="hide_for_coords"><span id="indel_size_label">inf</span></td>
								<td><div class="slider" id="indel_size_slider"></td>
							</tr>
							<tr><th colspan="5">Filter alignments</td></tr>
							<tr>
								<td width="45%" id="min_mq_title">Minimum mapping quality: </td>
								<td width="15%"><span id="mq_label">0</span></td>
								<td width="35%"><div class="slider" id="mq_slider"></td>
							</tr>
							<tr>
								<td>Minimum alignment length: </td>
								<td><span id="align_length_label">inf</span></td>
								<td><div class="slider" id="align_length_slider"></td>
								
							</tr>
							<!-- <tr><td class="hide_for_coords">Show only reference chromosome lengths from header</td>
								<td><input id="only_header_refs_checkbox" type="checkbox"></td>
							</tr>	 -->

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

							<tr class="dotplot_settings"><th colspan="5">Dot plot settings</td></tr>
							<tr class="dotplot_settings">
								<td>Colors on dotplot: </td><td><input id="colors_checkbox" type="checkbox" checked></td>
							</tr>
							<tr class="ribbon_settings"><th colspan="5">Ribbon plot settings</td></tr>
							<tr class="ribbon_settings">
								<td>Ribbon outline: </td><td><input id="outline_checkbox" type="checkbox"></td>
							</tr>
						</table>
					<!-- </form> -->
				</div>
			</div>
		</div>
	</div>
</div>

<script>
	var json_post = undefined;
	json_post = "<?php 
		if (isset($_GET['var1'])) {
			$data=escapeshellcmd($_GET['var1']);
		} else {
			$data="";
		}
		echo $data;
		?>";
</script>

<!-- Libraries -->
<script src="js/d3.v3.min.js"></script>
<script src="js/jquery.min.js"></script>
<script src="js/bootstrap.min.js"></script>



<!-- Special range slider -->
<script src="js/jquery-ui.min.js"></script>

<!-- Library from bam.iobio for reading a bam file -->
<script src="js/bam/class.js"></script>
<script src="js/bam/bin.js"></script>
<script src="js/bam/inflate.js"></script>
<script src="js/bam/bam.js"></script>
<script src="js/bam/bam.iobio.js"></script>


<!-- Cross-browser split -->
<script src="js/cross-browser-split.js"></script>
<!-- Main -->
<script src="js/vis.js"></script>


</body>
</html>


