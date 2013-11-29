<?php
/**
 * Configration example file for OS.js
 * Use this as a template and call it `config.php` (automatically loads on detection)
 */

// Override directory restrictions
define("HOMEDIR",     "/home/osjs");
define("TMPDIR",      "/tmp");

// Add some resources for loading
OSjs::$defaultPreloads[] = Array("type" => "javascript", "src" => "/frontend/extras/jquery.min.js");

// Add another theme
OSjs::$defaultCoreSettings['WM']['args']['themes'] = Array(
  'default' => Array('title' => 'Default'),
  'light'   => Array('title' => 'Light')
);

// Set the default theme
OSjs::$defaultUserSettings['WM']['CoreWM']['theme'] = 'light';

?>
