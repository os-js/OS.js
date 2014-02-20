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

$_dir = dirname(__FILE__);
if ( file_exists("{$_dir}/config.php") ) require "{$_dir}/config.php";
require "vfs.php";

function out($json) {
  header("Content-type: application/json");
  print json_encode($json);
}

function error() {
  if ( !is_null($e = error_get_last()) ) {

    $type = 'UNKNOWN';
    switch ((int)$e['type']) {
      case E_ERROR: // 1
        $type = 'E_ERROR';
      break;
      case E_WARNING: // 2
        $type = 'E_WARNING';
      break;
      case E_PARSE: // 4
        $type = 'E_PARSE';
      break;
      case E_NOTICE: // 8
        $type = 'E_NOTICE';
      break;
      case E_CORE_ERROR: // 16
        $type = 'E_CORE_ERROR';
      break;
      case E_CORE_WARNING: // 32
        $type = 'E_CORE_WARNING';
      break;
      case E_CORE_ERROR: // 64
        $type = 'E_COMPILE_ERROR';
      break;
      case E_CORE_WARNING: // 128
        $type = 'E_COMPILE_WARNING';
      break;
      case E_USER_ERROR: // 256
        $type = 'E_USER_ERROR';
      break;
      case E_USER_WARNING: // 512
        $type = 'E_USER_WARNING';
      break;
      case E_USER_NOTICE: // 1024
        $type = 'E_USER_NOTICE';
      break;
      case E_STRICT: // 2048
        $type = 'E_STRICT';
      break;
      case E_RECOVERABLE_ERROR: // 4096
        $type = 'E_RECOVERABLE_ERROR';
      break;
      case E_DEPRECATED: // 8192
        $type = 'E_DEPRECATED';
      break;
      case E_USER_DEPRECATED: // 16384
        $type = 'E_USER_DEPRECATED';
      break;
    }

    if ( !ERRHANDLER && !in_array($type, Array('E_ERROR', 'E_PARSE', 'E_CORE_ERROR', 'E_RECOVERABLE_ERROR')) ) {
      return;
    }

    if ( ob_get_level() ) ob_end_clean();
    header("HTTP/1.0 500 Internal Server Error");
    if ( SHOWERRORS ) {
      print implode("\n", Array($e['message'], "Type: {$type}", "Line: {$e['line']}", "File: {$e['file']}"));
    } else {
      print $e['message'];
    }
    exit;
  }
}


//
// Default settings
//
if ( !defined("HOMEDIR") )    define("HOMEDIR",     "/opt/OSjs/home");                                // Filesystem API default dir
if ( !defined("TMPDIR") )     define("TMPDIR",      "/opt/OSjs/tmp");                                 // Temporary files
if ( !defined("ROOTDIR") )    define("ROOTDIR",     realpath(dirname(__FILE__) . '/../'));            // The path to root dir
if ( !defined("APPDIR") )     define("APPDIR",      realpath(dirname(__FILE__) . "/../apps"));        // Default apps dir
if ( !defined("MAXUPLOAD") )  define("MAXUPLOAD",   return_bytes(ini_get('upload_max_filesize')));    // Upload size limit
if ( !defined("ERRHANDLER") ) define("ERRHANDLER",  false);                                           // Report non-errors (warnings, notices etc)
if ( !defined("TIMEZONE") )   define("TIMEZONE",    "Europe/Oslo");                                   // Timezone
if ( !defined("SHOWERRORS") ) define("SHOWERRORS",  true);                                            // Show error reports from backend
if ( !defined("HANDLER") )    define("HANDLER",     null);

date_default_timezone_set(TIMEZONE);

if ( php_sapi_name() == "cli" || defined('__CLI_SCRIPT') ) {
  return;
}

register_shutdown_function('error');

session_start();

//
// Collect request data
//
$method = empty($_SERVER['REQUEST_METHOD']) ? 'GET' : $_SERVER['REQUEST_METHOD'];
$json   = Array("result" => false, "error" => null);
$error  = null;
$result = null;
$data   = $method === 'POST' ? file_get_contents("php://input") : (empty($_SERVER['REQUEST_URI']) ? '' : $_SERVER['REQUEST_URI']);;

//
// GET file request wrapper
//
if ( $method === 'GET' ) {
  if ( isset($_GET['file']) && ($file = unrealpath($_GET['file'])) ) {
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

//
// Upload file
//
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

//
// Normal API call
//
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

      // API call via application
      case 'application' :
        $path = empty($arguments['path'])        ? null     : $arguments['path'];
        $an   = empty($arguments['application']) ? null     : $arguments['application'];
        $am   = empty($arguments['method'])      ? null     : $arguments['method'];
        $aa   = empty($arguments['arguments'])   ? Array()  : $arguments['arguments'];

        $aroot = sprintf("%s/%s", ROOTDIR, $path);
        $apath = sprintf("%s/%s", $aroot, "api.php");
        $valid = false;
        foreach ( explode(":", APPDIR) as $vd ) {
          if ( strstr($aroot, $vd) !== false ) {
            $valid = true;
            break;
          }
        }
        if ( !$valid || !file_exists($apath) ) {
          $error = "No such application or API file not available ({$an})!";
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

      // Filesystem operations
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
              $result = call_user_func_array(Array("FS", $m), $a);
            } catch ( Exception $e ) {
              $error = "FS operaion error: {$e->getMessage()}";
            }
          }
        }
      break;

      // Bugreporting
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

      // Default
      default :
        $found = false;
        if ( HANDLER ) {
          $hdir = sprintf("%s/handlers/%s.php", ROOTDIR, HANDLER);
          if ( file_exists($hdir) ) {
            require $hdir;
            if ( class_exists('APIHandler') && method_exists('APIHandler', 'call') ) {
              $found = true;
              try {
                $result = APIHandler::call($method, $arguments);
              } catch ( Exception $e ) {
                $error = "API Handler call error: {$e->getMessage()}";
              }
            }
          }
        }

        if ( !$found ) {
          $error = "No such API method: {$method}";
        }
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
