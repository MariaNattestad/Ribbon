<!DOCTYPE html>

<html>

<!--		NAVIGATION BAR-->
<?php include "header.html";?>

<link href='https://fonts.googleapis.com/css?family=Lato:300,900' rel='stylesheet' type='text/css'>
<link href="css/bootstrap-switch.min.css" rel="stylesheet">

<!-- My own styles -->
<link href="css/custom.css" rel="stylesheet">


<div id="left_panel">
<div id="sam_input_panel">
	
<textarea class="form-control" placeholder="Paste lines from a sam file"  id="sam_input"></textarea>

</div>
<div id="visualization_panel"></div>
</div>
<div id="sam_table_panel">
	
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
				<td width="5%"></td>
				<td width="35%"><input type="range" id="mq_slider" value="0"></td>
			</tr>
			<tr>
				<td>Minimum indel size to split: </td>
				<td><span id="indel_size_label">inf</span></td>
				<td><input id="indel_checkbox" type="checkbox">
				</td>
				<td><input type="range" id="indel_size_slider" min="0" value="0"></td>
				
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
			<tr class="ribbon_settings"><td class="table_title" colspan="5">Ribbon settings</td></tr>
			<tr class="ribbon_settings">
				<td>Ribbon outline: </td><td><input id="outline_checkbox" type="checkbox" checked></td>
			</tr>
		</table>
	</form>
	</div>
</div>

<script src="js/d3.v3.min.js"></script>
<script src="js/jquery.min.js"></script>
<script src="js/bootstrap.min.js"></script>
<!-- <script src="js/bootstrap-switch.min.js"></script> -->
<!-- <script> $(".bootstrap_switch").bootstrapSwitch(); </script> -->


<script src="js/vis.js"></script>


</body>
</html>


