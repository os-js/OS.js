<?php

$root = realpath(__DIR__ . '/../');
define("DISTDIR", "{$root}/dist-dev");
require '../src/server-php/server.php';

?>
