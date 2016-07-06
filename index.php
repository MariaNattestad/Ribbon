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
		<fieldset class="form-group">
			<div class="input-group">
				<span class="input-group-addon">Minimum mapping quality: <span id="mq_label">0</span></span>
				<div class="form-control"> <input type="range" id="mq_slider" value="0"></div>
			</div>
		</fieldset>
		<fieldset class="form-group">
			<div class="input-group">
				<!-- Add Bootstrap switch for ribbons/dotplot -->
				<input class="bootstrap_switch" id="ribbon_vs_dotplot" type="checkbox" name="ribbon_vs_dotplot" data-on-text="Ribbon" data-off-text="Dotplot">
			</div>
		</fieldset>
	</form>
	</div>
</div>

<script src="js/d3.v3.min.js"></script>
<script src="js/jquery.min.js"></script>
<script src="js/bootstrap.min.js"></script>
<script src="js/bootstrap-switch.min.js"></script>
<script> $(".bootstrap_switch").bootstrapSwitch(); </script>


<script src="js/vis.js"></script>


</body>
</html>


