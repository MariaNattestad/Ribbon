<!DOCTYPE html>
<html>
<head>
	<title>Ribbon</title>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="">
	<meta name="author" content="">

	<link rel="icon" type="image/png" href="images/favicon-32x32.png" sizes="32x32">
	<link rel="icon" type="image/png" href="images/favicon-16x16.png" sizes="16x16">

	<!-- CSS: -->
	<link href='https://fonts.googleapis.com/css?family=Lato:300,900' rel='stylesheet' type='text/css'>
	<!-- Bootstrap core CSS -->
	<link href="node_modules/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">
	<!-- Special range slider -->
	<link href="css/jquery-ui.min.css" rel="stylesheet">
	<!-- My d3-livesearch plugin -->
	<link href="css/d3-livesearch.css" rel="stylesheet">
	<link href="css/d3-superTable.css" rel="stylesheet">
	<!-- My own styles -->
	<link href="css/custom.css" rel="stylesheet">
</head>

<!--    NAVIGATION BAR-->

<body role="document">
<div class="navbar navbar-inverse navbar-fixed-top" role="navigation">
	<div class="container">
		
		<div class="navbar-header">
		  <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
			<span class="sr-only">Toggle navigation</span>
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
		  </button>
		  <a class="navbar-brand" href=".">        Ribbon</a>
		</div>
		<div class="navbar-collapse collapse">
		  <ul class="nav navbar-nav" id="navbar">
				  <li><a id="click_getting_started_link">Getting started</a></li>
				  <li><a id="click_info_link">Info</a></li>
				  <li><a id="click_advanced_settings_link">Advanced settings</a></li>
				  <?php
					  $my_datasets = array();

					  if(isset($_COOKIE["ribbon"])) {
						echo '<li class="dropdown">
						<a href="" class="dropdown-toggle" data-toggle="dropdown">My data <span class="caret"></span></a>
						<ul class="dropdown-menu" role="menu">';

						$my_datasets = json_decode($_COOKIE["ribbon"], true);

						$arrlength = count($my_datasets);
						for($x = 0; $x < $arrlength; $x++) {
						  $seconds_ago = time() - $my_datasets[$x]["date"];
						  
						  $time_ago = $seconds_ago;
						  if ($seconds_ago > 60) {
							$minutes_ago = $seconds_ago/60;
							if ($minutes_ago > 60) {
							  $hours_ago = $minutes_ago/60;
							  if ($hours_ago > 24) {
								$days_ago = $hours_ago/24;
								$time_ago = "" . floor($days_ago) . " days";
							  } else {
								$time_ago = "" . floor($hours_ago) . " hours";
							  }
							} else {
							  $time_ago = "" . floor($minutes_ago) . " minutes";
							}
						  } else {
							$time_ago = "" . floor($seconds_ago) . " seconds";
						  }
						  
						  echo "<li><a target='_blank' href='?perma=" . $my_datasets[$x]["codename"] . "'>" . $my_datasets[$x]["description"] . " (" . $time_ago . " ago) </a></li>";
						}

						echo '</ul>';
					  } 
				  ?>
				  
				  <li class="dropdown" id="examples_navbar_item">

					<a href="" class="dropdown-toggle" data-toggle="dropdown">Examples <span class="caret"></span></a>
					<ul class="dropdown-menu" role="menu" id="examples_list">
					<!-- Examples added here from Ajax call within vis.js -->
					</ul>
				  </li>
		  </ul>
		</div><!--/.nav-collapse -->
	</div>
</div>
<!--            End of Navigation Bar        -->


<div id="left_panel">

	<div id="advanced_settings_panel">
		<div class="panel panel-default">
			<div class="panel-heading"><h3 class="panel-title">Advanced settings</h3></div>
			<div class="panel-body">
				<table>
					<tr><th colspan="2">Fetching from a bam file</th></tr>
						<tr><td >Margin around a variant or manually entered coordinate where reads will be pulled from a bam file (use this parameter carefully as importing too much data can crash your web browser due to memory overload)</td>
						<td>
							<input type="number" style="width: 60%" id="bam_fetch_margin" value="100"> bp
						</td>
					</tr>

					<tr><th colspan="2">Automation</th></tr>
					<tr><td colspan="2">Make Ribbon automatically go to each variant in a bedpe file and take pictures of the multi-read view and a selection of reads. Instructions: Load a bedpe file and a bam file first, set the settings below and in the right-side panel as you want them and click Run!  </td></tr>
					<tr>
						<td>Prefix for image files</td>
						<td><input type="text" id="automation_file_prefix" value="Auto-Ribbon"></td>
					</tr>
					<tr>
						<td>Number of reads to take pictures of (randomly selected)</td>
						<td><input type="number" id="automation_max_reads_to_screenshot" value="5"></td>
					</tr>
					<tr>
						<td>Print variant coordinates onto multi-read view</td>
						<td><input type="checkbox" id="add_coordinates_to_figures"></td>
					</tr>
					<tr>
						<td>Download a file with info and coordinates for each variant alongside the images</td>
						<td><input type="checkbox" id="automation_download_info"></td>
					</tr>
					<tr>
						<td>Only select reads with alignments that start or end near the bedpe variant</td>
						<td><input type="checkbox" id="automation_pick_split_reads" checked></td>
					</tr>
					<tr>
						<td style="text-indent: 50px;" >Distance:</td>
						<td><input type="number" id="automation_margin_for_split" value="1000"></td>
					<tr>
						<td></td>
						<td><button class="btn btn-secondary" id="run_automation_button" type="button">Run!</button></td>
					</tr>
				</table>
			</div>
		</div>
	</div>


	<div id="info_panel">
		<!-- GITHUB LINK -->
			<div class="panel panel-default">
			  <div class="panel-heading"><h3 class="panel-title">Information about Ribbon</h3></div>
			  <div class="panel-body">
					<p>Ribbon is made by Maria Nattestad with support from Pacific Biosciences and Cold Spring Harbor Laboratory.</p>
				  <p>The code is open-source at <a href="https://github.com/MariaNattestad/ribbon" target="_blank">https://github.com/MariaNattestad/Ribbon</a></p>
				  <p>
					<p><strong>Please cite our paper on the bioRxiv:</strong></p>
					<p>Ribbon: Visualizing complex genome alignments and structural variation: <a href="http://biorxiv.org/content/early/2016/10/20/082123" target="_blank">http://biorxiv.org/content/early/2016/10/20/082123</a></p>
				</p>
				  <p>Ribbon stands on the shoulders of giants:</p>
				  <ul>
					<li>Visualizations created using <a href="https://d3js.org/">D3</a> from Mike Bostock</li>
					<li>Panel and navigation bar created using styles from <a href="http://getbootstrap.com/">Bootstrap</a></li>
					<li>Remote bam files are read from any publicly accessible URL using a library from <a href="http://bam.iobio.io/">Bam.iobio</a> by the Gabor Marth lab.</li>
					<li>Local bam files are read using Samtools compiled into WebAssembly.</li>
				  </ul>
				  <p>Ribbon also uses two D3 plug-ins created by Maria Nattestad:</p>
				  <ul>
					  <li>Variant table with advanced filtering and sorting created using <a href="https://github.com/MariaNattestad/d3-superTable">D3-superTable</a></li>
					  <li>Live search for chromosome and read names created using <a href="https://github.com/MariaNattestad/d3-livesearch">D3-livesearch</a></li>
				  </ul>
			  </div>
			</div>


			<!-- PAPER LINK -->

			<!-- <div class="panel panel-default">
				<div class="panel-heading"><h3 class="panel-title">How to cite Ribbon</h3></div>
				<div class="panel-body">
					<p>Please cite our pre-print on the bioRxiv: <a href="" target="_blank">link text</a></p>
					Citation information goes here
				</div>
			</div>

			 -->
			<div class="panel panel-default">
				<div class="panel-heading"> <h3 class="panel-title">Contact information</h3></div>
				<div class="panel-body">
					  <!-- <p>Science and web application by <a href="http://marianattestad.com" target="_blank">Maria Nattestad</a></p> -->
					  <!-- <p>Principal investigator / The Boss: <a href="http://schatzlab.cshl.edu" target="_blank">Mike Schatz</a></p> -->
					  <!-- <br> -->
					  <p>For questions contact Maria Nattestad at <a href="mailto:mnattest@cshl.edu?Subject=Question%20About%20Ribbon" target="_top">mnattest@cshl.edu</a></p>
				</div>
			</div>		
	</div>
	<div id="start_panel">
		<div class="panel panel-default">
			<div class="panel-heading"><h3 class="panel-title">Getting started</h3></div>
			<div class="panel-body">
				<p>
					<p><strong>Please cite our paper on the bioRxiv:</strong></p>
					<p>Ribbon: Visualizing complex genome alignments and structural variation: <a href="http://biorxiv.org/content/early/2016/10/20/082123" target="_blank">http://biorxiv.org/content/early/2016/10/20/082123</a></p>
				</p>
				<p>
					<p><strong>Examples:</strong></p>
					<p>PacBio, Illumina, and genome/assembly examples shown in the Examples tab above.</p>
				</p>
				<p>
					<p><strong>Visualize your own alignment data:</strong></p>
					<p>Ribbon can be used for long reads, short reads, paired-end reads, and assembly/genome alignments. Instructions for each data format are available by clicking on "instructions" in each tab on the right.</p>
				</p>
				<p>
					<p><strong>Local installation:</strong></p>
					<p>You can install Ribbon locally from Github by following the instructions here: <a href="https://github.com/MariaNattestad/ribbon" target="_blank">https://github.com/MariaNattestad/Ribbon</a></p>
				</p>
				<p>
					<p><strong>Introduction video:</strong></p>
					<iframe width="560" height="315" src="https://www.youtube.com/embed/Ih4Wf2U10-4?rel=0" frameborder="0" allowfullscreen></iframe>
				</p>
			</div>
		</div>
	</div>

	<div id="svg2_panel"></div>
	<div id="svg1_panel"></div>

</div>


<div id="right_panel">

	<div id='user-message'></div>
	<div class="panel-group" id="data_description_panel">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_info_box">Information</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_info_box">
				<div class="panel-body">
					<div id="user_notes">
						<label>Notes</label>
						<textarea class="form-control" id="notes" placeholder="Add notes here (not saved)"></textarea>
					</div>
					<div>
						<label>Alignment file</label>
						<div id="text_alignment_file_output"></div>
					</div>
					<div class="hide_when_no_variants">
						<label>Variant file</label>
						<div id="text_variant_file_output"></div>
					</div>
					<div>
						<label>Selected region</label>
						<div id="text_region_output">(No region selected)</div>
					</div>
					<div class="when_bam_file_only">
						<label>Bam file queried</label>
						<div id="bam_fetch_info">(No bam file queried)</div>
					</div>
					<hr>
					<div class="input-group">
					  <input type="text" class="form-control" id="permalink_name" placeholder="Type permalink name...">
					  <span class="input-group-btn">
						<button class="btn btn-secondary" id="generate_permalink_button" type="button">Share permalink</button>
					  </span>
					</div>
					<hr>
					  <button id="screenshot_top">Download top view as png</button>
					  <button id="screenshot_bottom">Download bottom view as png</button>
				</div>
			</div>
		</div>
	</div>

	<div class="panel-group" id="region_settings_panel">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_region_settings_box">Multi-read settings</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_region_settings_box">
				<div class="panel-body">
					<ul class="nav nav-tabs">
						<li class="active"><a data-toggle="tab" href="#tab_reference">Reference</a></li>
						<li><a data-toggle="tab" href="#tab_reads">Reads</a></li>
						<li><a data-toggle="tab" href="#tab_settings">Settings</a></li>
						<li id="feature_filter_tab"><a data-toggle="tab" href="#tab_features">Filter features by type</a></li>
					</ul>

					<div class="tab-content">
						<div id="tab_reference" class="tab-pane fade in active">
							<table class="settings_table">
								<col width="45%">
								<col width="20%">
								<col width="30%">
								
								<tr><th colspan="3">Filter reference chromosomes</th></tr>
								<tr>
									<td>Zoom to chromosome</td>
									<td><p id="chrom_highlighted">all</p></td>
									<td>
										<div id="chrom_livesearch"></div>
										<button class="btn btn-secondary"  type="button" id="show_all_refs">Show all</button></span>
									</td>
								</tr>
								<tr>
									<td>Minimum number of alignments:</td>
									<td><p id="min_aligns_for_ref_interval_label">1</p></td>
									<td> <div class="slider" id="min_aligns_for_ref_interval_slider"></div> </td>
								</tr>
								<tr>
									<td>Maximum chromosome length:</td>
									<td><input class="snug" type="number" id="max_ref_length_input"></td>
									<!-- <td><span id="max_ref_length_input"></span> </td> -->
									<td> <div class="slider" id="max_ref_length_slider"></div> </td>
								</tr>
								<tr><th colspan="3">Reference settings</th></tr>
								<tr>
									<td>Color scheme:</td>
									<td colspan="2">
										<select class="form-control" id="color_scheme_dropdown">
											
										 </select>
									</td>
								</tr>
								<tr>
									<td>Collapse reference sequences within distance:</td>
									<td><input id="margin_to_merge_ref_intervals" type="number" value="10000"></td>
								</tr>
								<tr>
									<td>Draw black border on selected region</td>
									<td><input id="draw_focus_rectangle" type="checkbox" checked></td>
								</tr>

							</table>
						</div>

						<!-- Read filtering-->
						<div id="tab_reads" class="tab-pane fade">
							<table class="settings_table">
								<col width="45%">
								<col width="20%">
								<col width="30%">
								<tr><th colspan="3">Filter reads</th></tr>
								<tr><td>Number of alignments:</td>
									<td> <span id="num_aligns_range_label"></span> </td>
									<td> <div class="slider" id="num_aligns_range_slider"></div> </td>
								</tr>
								<tr>
									<td>Minimum read length:</td>
									<td><input class="snug" type="number" id="min_read_length_input"></input> </td>
									<td> <div class="slider" id="min_read_length_slider"></div> </td>
								</tr>
								<tr>
									<td id="region_min_mq_title" >Minimum mapping quality: </td>
									<td><span id="region_mq_label">0</span></td>
									<td><div class="slider" id="region_mq_slider"></div></td>
								</tr>
								<tr><th colspan="3">Read settings</th></tr>
								<tr>
									<td>Sort reads vertically:</td>
									<td colspan="2">
										<select class="form-control" id="read_sorting_dropdown">
											
										 </select>
									</td>
								</tr>
								<tr>
									<td>Orient reads by:</td>
									<td colspan="2">
										<select class="form-control" id="read_orientation_dropdown">
											
										 </select>
									</td>
								</tr>
							</table>
						</div>
						


						<div id="tab_features" class="tab-pane fade">
							<table id="feature_type_table"></table>
						</div>


						<div id="tab_settings" class="tab-pane fade">
							<table class="settings_table">
								<col width="30%">
								<col width="50%">
								<col width="20%">
								<tr><th colspan="3" class="hide_for_coords">Indels</th></tr>
								<tr>
									<td class="hide_for_coords">Show indels as:</td>
									<td colspan="2"> 
										<select class="form-control" id="show_indels_as_dropdown">
											
										 </select>
									</td>
								</tr>
								<tr><th class="when_features_only" colspan="3">Features</th></tr>
								<tr>
									<td class="when_features_only">Show features as:</td>
									<td colspan="2"> 
										<select class="form-control" id="show_features_as_dropdown">
											
										 </select>
									</td>
								</tr>
								<tr><th colspan="3" class="when_variants_only">Variants</th></tr>
								<tr class="when_variants_only">
									<td colspan="2">Show only the chosen variant when others are in view</td>
									<td><input id="show_only_selected_variants" type="checkbox"></td>
								</tr>
							</table>
						</div>
					</div> <!-- end of tab content -->
				</div>
			</div>
		</div>
	</div>

	<div class="panel-group" id="settings">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_detail_settings_box">Single-read settings</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_detail_settings_box">
				<div class="panel-body">
					<div class="panel-body">
						<div id="ribbon_vs_dotplot_container">
							<label class="radio-inline">
								<input class="ribbon_vs_dotplot" id="select_ribbon" type="radio" name="ribbon_vs_dotplot" value="ribbon">Ribbon plot
							</label>

							<label class="radio-inline">
								<input class="ribbon_vs_dotplot" id="select_dotplot"  type="radio" name="ribbon_vs_dotplot" value="dotplot">Dot plot
							</label>
						</div>

						<ul class="nav nav-tabs">
							<li class="active"><a data-toggle="tab" href="#tab_select_read">Select read</a></li>
							<li><a data-toggle="tab" href="#tab_filter_alignments">Filter alignments</a></li>
							<li><a data-toggle="tab" href="#tab_singleread_settings">Settings</a></li>
						</ul>

						<div class="tab-content">
							<div id="tab_select_read" class="tab-pane fade in active">
								<table class="settings_table">
									<col width="50%">
									<col width="20%">
									<col width="30%">
									<tr>
										<th colspan="3">Selected read</th>
									</tr>
									<tr>
										<td style="width:100%" colspan="3"><div id="text_read_output"></div></td>
									</tr>
									<tr>
										<td>Search reads:</td>
										<td colspan="2">
											<div id="readname_livesearch"></div>
										</td>
									</tr>
								</table>
							</div>
							<div id="tab_filter_alignments" class="tab-pane fade">
								<table class="settings_table">
									<col width="50%">
									<col width="20%">
									<col width="30%">
									<tr>
										<td id="min_mq_title">Minimum mapping quality: </td>
										<td><span id="mq_label">0</span></td>
										<td><div class="slider" id="mq_slider"></div></td>
									</tr>
									<tr>
										<td>Minimum alignment length: </td>
										<td><span id="align_length_label">inf</span></td>
										<td><div class="slider" id="align_length_slider"></div></td>
										
									</tr>
								</table>
							</div>
							<div id="tab_singleread_settings" class="tab-pane fade">
								<table class="settings_table">
									<col width="50%">
									<col width="20%">
									<col width="30%">
									<tr>
										<td>Match reference from region view </td>
										<td><input id="ref_match_region_view" type="checkbox" checked></td>
									</tr>
									<tr>
										<td>Highlight selected read</td>
										<td><input id="highlight_selected_read" type="checkbox" checked></td>
									</tr>
									<tr>
										<td class="hide_for_coords">Minimum indel size to split: </td>
										<td class="hide_for_coords"><span id="indel_size_label">inf</span></td>
										<td><div class="slider" id="indel_size_slider"></div></td>
									</tr>
									<tr class="ribbon_settings">
										<td>Alignment outlines on ribbon plot: </td>
										<td><input id="outline_checkbox" type="checkbox" checked/></td>
									</tr>
									<!-- <tr class="dotplot_settings"><th colspan="3">Dot plot settings</th></tr> -->
									<tr class="dotplot_settings">
										<td>Colors on dotplot: </td>
										<td><input id="colors_checkbox" type="checkbox" checked/></td>
									</tr>
									<!-- <tr class="ribbon_settings"><th colspan="3">Ribbon plot settings</th></tr> -->
									
								</table>
							</div>
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
					<a data-toggle="collapse" class="active" href="#collapsible_alignment_input_box">Input alignments</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_alignment_input_box">
				<div class="panel-body">
					<ul class="nav nav-tabs">
						<li class="active"><a data-toggle="tab" href="#sam">sam</a></li>
						<li><a data-toggle="tab" href="#bam">load bam file</a></li>
						<li><a data-toggle="tab" href="#coords">coordinates</a></li>
						<li><a data-toggle="tab" href="#url_bam">bam from url</a></li>
						<!-- <li><a data-toggle="tab" href="#igv">from igv</a></li> -->
					</ul>
					
					<div class="tab-content">
					<!-- Sam input -->
						<div id="sam" class="tab-pane fade in active">
							<p>Paste a few lines from a sam file here:</p>
							<textarea class="form-control" placeholder="Paste lines from a sam file"  id="sam_input"></textarea>

							<hr>
							<p>or upload a small sam file:</p>
							<input type="file" id="sam_file" />
							<p>For larger files (above 10MB) see the "load bam file" tab. </p>
							<span id="sam_info_icon" ><span class="glyphicon glyphicon-info-sign"></span>Instructions</span>
						</div>
					<!-- Bam input -->
						<div id="bam" class="tab-pane fade">
							<p>Select bam and corresponding index (bai/csi)</p>
							<input type="file" name="files[]" id="bam_file"	multiple />
							<span id="bam_info_icon" ><span class="glyphicon glyphicon-info-sign"></span> Instructions</span>
						</div>
						<div id="url_bam" class="tab-pane fade">
							<input type="text" id="bam_url_input" value="http://">
							<input type="submit" id="submit_bam_url" value="Load bam file from a url">
							<p>Make sure the bam file exists and that it has a corresponding index (.bai or .csi) file with an identical filename except for the addition of the .bai or .csi suffix. If the bam file does not exist or cannot be read, a header will fail to appear but there will be no error message. If the header of the bam file does not show up within about 10 seconds, loading the bam file has probably failed and you should check to make sure it actually exists at the given address. (To test for this, put the url into your web browser. If it starts downloading the bam file, then also check whether adding .bai or .csi to the url downloads the index file. If one of these does not start a download, then the file does not exist.)
							</p>
							<p>Note that the bam file does not get read into memory, but the index file does, so if the index file is huge, it will take a while the first time you fetch reads from the bam file. 
							</p>
						</div>
					<!-- Coords input -->
						<div id="coords" class="tab-pane fade">
							<p>Paste coordinates here:</p>
							<textarea class="form-control" placeholder="Paste lines from a coordinates file (show-coords -lTH)"  id="coords_input"></textarea>
							<hr>
							<p>or upload a file:</p>
							<input type="file" id="coords_file" />
							<span id="coords_info_icon"> <span class="glyphicon glyphicon-info-sign"></span>Instructions</span>
						</div>
					<!-- IGV input -->
						<!-- <div id="igv" class="tab-pane fade">
							<p> This feature is still being implemented and tested. When the link from IGV works, the instructions here will be as follows:
							</p>
							<p>
							Update to the newest version of IGV. Click on a read of interest within IGV and choose "Send to Ribbon"</p>
							<h4>Data from IGV:</h4>
							<pre readonly id="igv_stats">(empty)</pre>
						</div> -->
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
						<li class="active"><a data-toggle="tab" href="#upload_variants">upload vcf or bed</a></li>
						<li><a data-toggle="tab" href="#upload_bedpe">upload bedpe</a></li>
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
					<!-- upload bedpe file -->
						<div id="upload_bedpe" class="tab-pane fade">
							<p>Upload a .bedpe file</p>
							<input type="file" id="bedpe_file" />
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

	<div class="panel-group" id="feature_input_panel">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_feature_upload_box">Upload features</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_feature_upload_box">
				<div class="panel-body">
					<p>Upload a bed file with genes, repeats, or any other types of elements you want to annotate</p>
					<input type="file" id="feature_bed_file" />
					<p><span class="bed_info_icon"> <span class="glyphicon glyphicon-info-sign"></span> Instructions for .bed file</span></p>
				</div>
			</div>
		</div>
	</div>
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
						<p> Showing only the first 30 variants. Sort by clicking column names. Filter by typing =chr20, >2000, etc. for each column. For bam files, click on a row in the table to fetch reads around that feature. </p>
						<div id="variant_table_landing">
							<!-- superTable creates a table here out of _Variants -->
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="panel-group" id="bedpe_table_panel">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_bedpe_table_box">Inspect rearrangements</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_bedpe_table_box">
				<div class="panel-body">
					<div id="bedpe_table_box">
						<p> Showing only the first 30 variants. Sort by clicking column names, and filter by typing into the text boxes for each column. For instance, type >20 or =chr2. Separate multiple filters in a single column using spaces. For bam files, click on a row in the table to fetch reads around that feature. </p>
						<div id="bedpe_table_landing">
							<!-- superTable creates a table here out of _Bedpe -->
						</div>
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

	<div class="panel-group" id="feature_table_panel">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#collapsible_feature_table_box">Inspect features</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="collapsible_feature_table_box">
				<div class="panel-body">
					<div id="feature_table_box">
						<p>Showing only the first 15 features. Sort by clicking column names. Filter by typing queries into text input boxes, e.g. =17, >200.</p>
						<div id="feature_table_landing">
							
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>


</div>


<script>
	var splitthreader_data = undefined;
	splitthreader_data = <?php 
		if (isset($_POST['splitthreader'])) {
			echo $_POST['splitthreader'];
		} else {
			echo "''";
		}
		?>;

</script>

<!-- Libraries -->
<script src="node_modules/d3/d3.min.js"></script>
<script src="node_modules/jquery/dist/jquery.min.js"></script>
<script src="node_modules/bootstrap/dist/js/bootstrap.min.js"></script>

<!-- Special range slider -->
<script src="js/jquery-ui.min.js"></script>

<!-- Aioli for running samtools.wasm -->
<script src="node_modules/@robertaboukhalil/aioli/aioli.js"></script>

<!-- My own d3-livesearch plugin -->
<script src="js/d3-livesearch.js"></script>
<script src="js/d3-superTable.js"></script>
<script src="js/saveSvgAsPng.js"></script>
<!-- Cross-browser split -->
<script src="js/cross-browser-split.js"></script>
<!-- Main -->
<script src="js/vis.js"></script>

</body>
</html>
