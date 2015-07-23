<?php

class BroadwayAPIHandler {
  public static function broadway(Array $arguments) {
    return Array(false, false);
  }
}

API::AddHandler('broadway', Array('BroadwayAPIHandler', 'broadway'));

?>
