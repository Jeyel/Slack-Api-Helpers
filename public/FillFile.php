<?php
set_time_limit(300);

$filename = $_POST["foldername"] . "/" . $_POST["filename"];
$data = $_POST["data"];
file_put_contents($filename . ".html", $data . "\r\n\r\n", FILE_APPEND);
?>