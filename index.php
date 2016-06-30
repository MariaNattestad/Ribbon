<!DOCTYPE html>

<html>

<!--		NAVIGATION BAR-->
<?php include "header.html";?>

<link href="css/custom.css" rel="stylesheet">
<link href='https://fonts.googleapis.com/css?family=Lato:300' rel='stylesheet' type='text/css'>
<script src="js/d3.v3.min.js"></script>
<script src="js/d3.tip.v0.6.3.js"></script>
<script src="js/jquery.min.js"></script>
<script src="js/bootstrap.min.js"></script>



<div id="left_panel">
<div id="sam_input_panel">
	
 <textarea class="form-control" placeholder="Paste lines from a sam file"  id="sam_input"></textarea>

</div>
<div id="visualization_panel"><p>visualization panel</p></div>
</div>
<div id="sam_table_panel">
	<p>sam table panel</p>
	<table id="sam_table"></table>
</div>

<script src="js/vis.js"></script>

</body>
</html>


