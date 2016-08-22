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
	function get_page_url() {
		$pageURL = 'http://';
		$pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
		return str_replace("/permalink_creator.php", "", $pageURL);
	}
	
	if (isset($_POST['ribbon'])) {
		$data = json_decode($_POST['ribbon']);
		$filename = generateRandomString(10);
		$file = fopen(dirname(__FILE__) . '/permalinks/' . $filename . ".json", 'w');
		fwrite($file, json_encode($data));
		fclose($file);
		$permalink_name = "Ribbon permalink";
		if (isset($_POST["name"])) {
			$permalink_name = escapeshellcmd($_POST["name"]);
			if ($permalink_name == "") {
				$permalink_name = "Ribbon permalink";
			}
		}

		// Add cookie:
		$new_dataset = array( "date"=>time(), "codename"=>$filename, "description"=> $permalink_name );
	    $my_datasets = array();
	    if(isset($_COOKIE["ribbon"])) {
	      $my_datasets = json_decode($_COOKIE["ribbon"], true);
	    }
	    array_push($my_datasets, $new_dataset);
	    setcookie("ribbon", json_encode($my_datasets));

		// echo "http://" . $_SERVER['HTTP_HOST'] .  "/?perma=" . $filename;
		echo get_page_url() . "/?perma=" . $filename;
	} else {
		echo "No data given";
	}
?>