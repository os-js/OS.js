<?php

class Settings
{
  protected static $cache;
  public static function get() {
    if ( !self::$cache ) {
      $json = <<<EOJSON

%JSON%

EOJSON;

      $root = dirname(dirname(__DIR__));
      $json = str_replace("%DROOT%", $root, $json);
      self::$cache = (array)json_decode($json, true);
    }

    return self::$cache;
  }

}

?>
