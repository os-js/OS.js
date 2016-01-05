<?php

class Settings
{
  protected static $cache;
  public static function get() {
    if ( !self::$cache ) {
      $json = file_get_contents(ROOTDIR . "/src/server/settings.json");
      $json = str_replace("%DROOT%", ROOTDIR, $json);
      self::$cache = (array)json_decode($json, true);
    }

    return self::$cache;
  }

}

?>
