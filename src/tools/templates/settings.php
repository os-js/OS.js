<?php

class Settings
{
  protected static $cache;
  public static function get() {
    if ( !self::$cache ) {
      $json = <<<EOJSON

%JSON%

EOJSON;

      self::$cache = (array)json_decode($json, true);
    }

    return self::$cache;
  }

}

?>
