<?php
/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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

require "functions.php";
if ( file_exists("config.php") ) require "config.php";

define("SESSIONNAME", preg_replace("/[^0-9]/", "", empty($_SERVER['REMOTE_ADDR']) ? '127.0.0.1' : $_SERVER['REMOTE_ADDR']));
define("MAXUPLOAD",   return_bytes(ini_get('upload_max_filesize')));

if ( !defined("HOMEDIR") )  define("HOMEDIR",     "/opt/OSjs/home");
if ( !defined("TMPDIR") )   define("TMPDIR",      "/opt/OSjs/tmp");
if ( !defined("APPDIR") )   define("APPDIR",      realpath(dirname(__FILE__) . "/../apps"));

register_shutdown_function('error');
date_default_timezone_set('Europe/Oslo');

$method = empty($_SERVER['REQUEST_METHOD']) ? 'GET' : $_SERVER['REQUEST_METHOD'];
$json   = Array("result" => false, "error" => null);
$error  = null;
$result = null;
$data   = $method === 'POST' ? file_get_contents("php://input") : (empty($_SERVER['REQUEST_URI']) ? '' : $_SERVER['REQUEST_URI']);;

if ( $method === 'GET' ) {
  if ( isset($_GET['file']) && ($file = $_GET['file']) ) {
    try {
      if ( strstr($file, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this");
      if ( !is_file($file) ) throw new Exception("You are reading an invalid resource");
      if ( !is_readable($file) ) throw new Exception("Read permission denied");
    } catch ( Exception $e ) {
      header("HTTP/1.0 500 Internal Server Error");
      print $e->getMessage();
      exit;
    }

    if ( file_exists($file) ) {
        if ( ($mime = fileMime($file)) ) {
          header("Content-type: {$mime}");
          print file_get_contents($file);
        } else {
          header("HTTP/1.0 500 Internal Server Error");
          print "No valid MIME";
        }
    } else {
      header("HTTP/1.0 404 Not Found");
      print "File not found";
    }
  }
  exit;
}

if ( isset($_GET['upload']) ) {
  if ( isset($_POST['path']) && isset($_FILES['upload']) ) {
    $dest = unrealpath($_POST['path'] . '/' . $_FILES['upload']['name']);

    if ( strstr($dest, HOMEDIR) === false ) {
      header("HTTP/1.0 500 Internal Server Error");
      print "Invalid destination!";
      exit;
    }
    if ( file_exists($dest) ) {
      header("HTTP/1.0 500 Internal Server Error");
      print "Destination already exist!";
      exit;
    }
    if ( $_FILES['upload']['size'] <= 0 || $_FILES['upload']['size'] > MAXUPLOAD ) {
      header("HTTP/1.0 500 Internal Server Error");
      print "The upload request is either empty or too large!";
      exit;
    }

    if ( move_uploaded_file($_FILES['upload']['tmp_name'], $dest) ) {
      chmod($dest, 0600);
    }
  }
  exit;
}

if ( empty($data) ) {
  $error = "No call given";
} else {
  $data = json_decode($data, true);
  if ( empty($data['method']) ) {
    $error = "No call data given";
  } else {
    $method = $data['method'];
    $arguments = empty($data['arguments']) ? Array() : $data['arguments'];
    switch ( $method ) {
      case 'boot' :
        $result = Array(
          "preload" => getPreloadList(),
          "settings" => getCoreSettings()
        );
      break;

      case 'login' :
        if ( doLogin($arguments['username'], $arguments['password']) ) {
          $result = Array(
            "success" => true,
            "settings" => getUserSettings()
          );
        } else {
          $error = "Invalid login credentials!";
        }
      break;

      case 'logout' :
        $result = Array(
          "success" => true
        );
      break;

      case 'launch' :
        $an = empty($arguments['application']) ? null : $arguments['application'];
        $aa = empty($arguments['arguments']) ? Array() : $arguments['arguments'];
        if ( !($d = getApplicationData($an, $aa)) ) {
          $error = "Failed to launch '{$an}'";
        } else {
          $result = $d;
        }
      break;

      case 'application' :
        $an = empty($arguments['application']) ? null : $arguments['application'];
        $am = empty($arguments['method']) ? null : $arguments['method'];
        $aa = empty($arguments['arguments']) ? Array() : $arguments['arguments'];

        $apath = sprintf("%s/%s/%s", APPDIR, $an, "api.php");
        if ( strstr($apath, APPDIR) === false || !file_exists($apath) ) {
          $error = "No such application or API file not available!";
        } else {
          require $apath;
          if ( !class_exists($an) || !method_exists($an, 'call') ) {
            $error = "Application API missing!";
          } else {
            try {
              $result = $an::call($am, $aa);//call_user_func_array(Array($an, 'call'), $aa);
            } catch ( Exception $e ) {
              $error = "Application API exception: {$e->getMessage()}";
            }
          }
        }
      break;

      case 'fs' :
        $m = $arguments['method'];
        $a = empty($arguments['arguments']) ? Array() : $arguments['arguments'];

        if ( !method_exists('FS', $m) ) {
          $error = "Invalid FS operation: {$m}";
        } else {
          if ( !$a ) {
            $error = "Supply argument for FS operaion: {$m}";
          } else {
            try {
              $result = doFSOperation($m, $a);
            } catch ( Exception $e ) {
              $error = "FS operaion error: {$e->getMessage()}";
            }
          }
        }
      break;

      case 'bugreport' :
        if ( isset($arguments['data']) && ($data = $arguments['data']) ) {
          if ( $data = json_encode($data) ) {
            if ( file_exists("bugreport.php") ) {
              try {
                require "bugreport.php";
                $result = BugReport::send($data);
              } catch ( Exception $e ) {
                $error = $e->getMessage();
              }
            }
          }
        }
      break;

      default :
        $error = "No such API method: {$method}";
      break;
    }
  }
}

if ( $error ) {
  $json["error"] = $error;
} else {
  $json["result"] = $result;
}

print out($json);
exit;
?>
