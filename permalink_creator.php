<!DOCTYPE html>

<?php 
	// http://stackoverflow.com/questions/4356289/php-random-string-generator
	function generateRandomString($length = 10) {
	    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	    $charactersLength = strlen($characters);
	    $randomString = '';
	    for ($i = 0; $i < $length; $i++) {
	        $randomString .= $characters[rand(0, $charactersLength - 1)];
	    }
	    return $randomString;
	}

	if (isset($_POST['splitthreader'])) {
		// echo $_POST['splitthreader'];
		$data = json_decode($_POST['splitthreader']);
		$filename = generateRandomString(10);
		$file = fopen(dirname(__FILE__) . '/../permalinks/' . $filename . ".json", 'w');
		fwrite($file, json_encode($data));
		fclose($file);

		// echo "http://genomeribbon.com/?perma=" . $filename;
		echo "localhost/ribbon/?perma=" . $filename;
	} else {
		echo "No data given";
	}
?>

