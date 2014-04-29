<?php
/**
 * To use with `php -S localhost:8000 bin/php-webserver.php'
 */

if ( preg_match('/^\/API/', $_SERVER["REQUEST_URI"]) ) {
  require '../backend/api.php';
  return true;
if ( preg_match('/^\/FS\//', $_SERVER["REQUEST_URI"]) ) {
  $_GET['file'] = preg_replace('/^\/FS', '', $_SERVER["REQUEST_URI"]);
  require '../backend/api.php';
  return true;
} else if ( preg_match('/^\/FS/', $_SERVER["REQUEST_URI"]) ) {
  $_GET['upload'] = '';
  require '../backend/api.php';
  return true;
}

return false;

?>
