<?php
/*!
 * OS.js - JavaScript Operating System
 *
 * Example Handler: Login screen and session/settings handling via database
 * PLEASE NOTE THAT THIS AN EXAMPLE ONLY, AND SHOUD BE MODIFIED BEFORE USAGE
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

/*
See doc/example-handler.txt
*/

define("APIHANDLER_DSN", "mysql:host=localhost;dbname=osjs");
define("APIHANDLER_USER", "osjs");
define("APIHANDLER_PASS", "osjs");

/**
 * APIHandler for sessions via database
 */
class APIHandler
{
  public static function call($method, Array $arguments) {
    $args = Array(1002 => "SET NAMES 'utf8'");
    if ( !($db = new PDO(APIHANDLER_DSN, APIHANDLER_USER, APIHANDLER_PASS, $args)) ) {
      throw "Could not set up database connection";
    }
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $result = null;
    switch ( $method ) {
      case 'login' :
        unset($_SESSION['user']);

        $q = "SELECT `id`, `username`, `name`, `groups`, `settings` FROM `users` WHERE `username` = ? AND `password` = ? LIMIT 1;";
        $a = Array($arguments['username'], $arguments['password']);

        $response = false;
        if ( $stmt = $db->prepare($q) ) {
          $stmt->setFetchMode(PDO::FETCH_ASSOC);
          if ( $stmt->execute($a) ) {
            if ( $row = $stmt->fetch() ) {
              $response = Array(
                "userData" => Array(
                  "id"        => (int) $row['id'],
                  "username"  => $row['username'],
                  "name"      => $row['name'],
                  "groups"    => (Array)json_decode($row['groups'])
                ),
                "userSettings"  => (Array)json_decode($row['settings'])
              );

              if ( !$response['userData']['groups'] ) {
                $response['userData']['groups'] = Array();
              }
              if ( !$response['userSettings'] ) {
                $response['userSettings'] = null;
              }
            } else {
              throw new Exception("Invalid login credentials");
            }
          }
        }

        if ( $result = $response ) {
          $_SESSION['user'] = $response['userData'];
        }
      break;

      case 'settings' :
        if ( !isset($_SESSION['user']) ) {
          throw new Exception("Cannot set settings without user session");
        }
        $q = "UPDATE `users` SET `settings` = ? WHERE `id` = ?;";
        $a = Array(json_encode($arguments['settings']), $_SESSION['user']['id']);
        if ( $stmt = $db->prepare($q) ) {
          $result = $stmt->execute($a);
        }
      break;

      case 'logout' :
        unset($_SESSION['user']);
        $result = true;
      break;
    }

    return $result;
  }
}

?>
