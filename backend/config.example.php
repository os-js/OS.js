<?php
/**
 * Configration example file for OS.js
 * Use this as a template and call it `config.php` (automatically loads on detection)
 */

// Override directory restrictions
define("HOMEDIR",     "/home/osjs");
define("TMPDIR",      "/tmp");

// Override default configurations
function LoadConfiguration()
{
  // Add some resources for loading
  OSjs::$defaultPreloads[] = Array("type" => "javascript", "src" => "/frontend/extras/jquery.min.js");

  // Add another theme
  OSjs::$defaultCoreSettings['WM']['args']['themes'] = Array(
    'default' => Array('title' => 'Default'),
    'light'   => Array('title' => 'Light')
  );

  // Set the default theme
  OSjs::$defaultUserSettings['WM']['CoreWM']['theme'] = 'light';
}

// ADVANCED: Override handling of sessions/settings.
//           By default OS.js uses just a simple file-storage -
//           Will probably change in the future though.
/*
class OSjsHandler {
  public static function login($username, $password) {
    return self::getUserSettings();
  }

  public static function logout() {
    return true;
  }

  public static function getUserSettings() {
    return OSjs::$defaultUserSettings;
  }

  public static function setUserSettings($data) {
    return true;
  }

  public static function getSessionData() {
    return false;
  }

  public static function setSessionData(Array $a) {
    return true;
  }
}
*/

?>
