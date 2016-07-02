<?php

class Settings
{
  protected static $cache;
  public static function get() {
    if ( !self::$cache ) {
      $json = file_get_contents(ROOTDIR . "/src/server/settings.json");
      $root = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? str_replace('\\', '/', ROOTDIR) : ROOTDIR;
      $json = str_replace("%DROOT%", $root, $json);
      self::$cache = (array)json_decode($json, true);
    }

    return self::$cache;
  }

}

?>
