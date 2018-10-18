<?php
$pID = $_POST["pID"];
$filename = $_POST["filename"];
$filename = preg_replace('/[^a-z0-9\.]/', '', strtolower($filename));
$filename = "Data/" . $filename . '.' . uniqid();
$txt = $_POST["txt"];
$DataArray = explode(',', $txt);
$myfile = fopen($filename.".txt", "w") or die("Unable to open file!");
$Ct = 0;
for ($i = 0; $i < count($DataArray); $i++) {
	$curr = $DataArray[$i];
    if($curr == "NewLine"){
		fwrite($myfile, "\n");
		$Ct = 0;
	}
	else{
		fwrite($myfile, "$curr");
		if(($i < count($DataArray)-1) and ($DataArray[$i+1] != "NewLine")){
			fwrite($myfile, ",");
		}
		$Ct = $Ct + 1;
	}
}
fclose($myfile);
?>
