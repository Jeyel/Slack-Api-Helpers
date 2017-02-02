<?php
set_time_limit(300);

$filename = $_POST["foldername"] . "/" . $_POST["filename"];
file_put_contents($filename . ".html", "");
?>