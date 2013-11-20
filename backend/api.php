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

define("SESSIONNAME", empty($_SERVER['REMOTE_ADDR']) ? '127.0.0.1' : $_SERVER['REMOTE_ADDR']);
define("HOMEDIR", "/opt/OSjs");

class FS
{
  protected static function sortdir($list) {
    $result = Array();
    $order = Array('dir', 'application', 'file');

    $tmp = Array();
    foreach ( $list as $i ) {
      if ( !isset($tmp[$i['type']]) ) {
        $tmp[$i['type']] = Array();
      }
      $tmp[$i['type']][$i['filename']] = $i;
    }

    foreach ( array_keys($tmp) as $k ) {
      ksort($tmp[$k]);
    }

    foreach ( $order as $o ) {
      if ( isset($tmp[$o]) ) {
        foreach ( $tmp[$o] as $f ) {
          $result[] = $f;
        }
      }
    }

    return $result;
  }

  public static function scandir($dirname, Array $opts = Array()) {
    if ( !is_dir($dirname) ) {
      throw new Exception("Invalid directory");
    }
    if ( !is_readable($dirname) ) {
      throw new Exception("Permission denied");
    }
    if ( preg_match("/^\/tmp/", $dirname) === false || strstr($dirname, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this");

    $list = Array();

    $files = scandir($dirname);
    foreach ( $files as $fname ) {
      if ( $dirname == "/" && $fname == ".." ) continue;
      if ( $fname == "." ) continue;

      $fpath = realpath(str_replace("//", "/", sprintf("%s/%s", $dirname, $fname)));
      $ftype = is_dir($fpath) ? 'dir' : 'file';

      $fsize = ($ftype == 'dir' ? 0 : @filesize($fname));
      if ( $fsize === false ) $fsize = '';

      $iter = Array(
        'filename' => $fname,
        'path'     => $fpath,
        'size'     => $fsize,
        'mime'     => null,
        'type'     => $ftype
      );

      if ( empty($opts['mime']) || $opts['mime'] === true ) {
        if ( $ftype == 'file' ) {
          $finfo = finfo_open(FILEINFO_MIME_TYPE); // return mime type ala mimetype extension
          $mime = finfo_file($finfo, $fpath);
          finfo_close($finfo);

          $iter['mime'] = $mime;
        }
      }

      $list[] = $iter;
    }

    return self::sortdir($list);
  }

  public static function file_put_contents($fname, $content) {
    if ( is_file($fname) ) {
      if ( !is_file($fname) ) throw new Exception("You are writing to a invalid resource");
      if ( !is_writable($fname) ) throw new Exception("Write permission denied");
    } else {
      if ( !is_writable(dirname($fname)) ) throw new Exception("Write permission denied in folder");
    }
    if ( preg_match("/^\/tmp/", $fname) === false || strstr($fname, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this");
    return file_put_contents($fname, $content) !== false;
  }

  public static function file_get_contents($fname) {
    if ( !is_file($fname) ) throw new Exception("You are reading an invalid resource");
    if ( !is_readable($fname) ) throw new Exception("Read permission denied");
    if ( preg_match("/^\/tmp/", $fname) === false || strstr($fname, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this");
    return file_get_contents($fname);
  }
}

function setUserSettings($data) {
  return true;
}

function getUserSettings() {
  /*
  $file = "/tmp/___settingsdata";
  if ( file_exists($file) ) {
    if ( $c = file_get_contents($file) ) {
      return json_decode($c);
    }
  }
  return false;
   */
  return Array(
    'WM' => Array(
      'CoreWM' => Array(
        'theme'     => 'default',
        'wallpaper' => 'osjs:///themes/wallpapers/noise_red.png'
      )
    )
  );
}

function getSessionData() {
  $file = "/tmp/___sessiondata-" . SESSIONNAME;
  if ( file_exists($file) ) {
    if ( $c = file_get_contents($file) ) {
      return json_decode($c);
    }
  }
  return false;
}

function setSessionData(Array $a) {
  $file = "/tmp/___sessiondata-" . SESSIONNAME;
  $d = json_encode($a);
  return file_put_contents($file, $d) ? true : false;
}

function getPreloadList() {
  return Array(
  );
}

function getCoreSettings() {
  return Array(
    'Core' => Array(
      'Home' => HOMEDIR
    ),

    'WM' => Array(
      'exec'      => 'CoreWM',
      'args'      => Array()
    )
  );
}

function doLogin($username, $password) {
  return true;
}

function doFSOperation($method, $args) {
  return call_user_func_array(Array("FS", $method), $args);
}

function getApplicationData($name, $args) {
  $apps = Array(
    'CoreWM'                    => Array(
      'name'      => "OS.js Window Manager",
      'singular'  => true,
      'mime'      => null,
      'icon'      => null,
      'preload'   => Array(
        Array('src' => '/apps/CoreWM/main.js', 'type' => 'javascript'),
        Array('src' => '/apps/CoreWM/main.css', 'type' => 'stylesheet')
      )
    ),
    'CoreService'               => Array(
      'name'      => "OS.js Core Service",
      'singular'  => true,
      'mime'      => null,
      'icon'      => null,
      'preload'   => Array(
        Array('src' => '/apps/CoreService/main.js', 'type' => 'javascript')
      )
    ),
    'ApplicationProcessViewer'  => Array(
      'name'    => "Process Viewer",
      'mime'    => null,
      'icon'    => "apps/gnome-monitor.png",
      'preload' => Array(
        Array('src' => '/apps/ProcessViewer/main.js', 'type' => 'javascript'),
        Array('src' => '/apps/ProcessViewer/main.css', 'type' => 'stylesheet')
      )
    ),
    'ApplicationPreview'  => Array(
      'name'    => "Preview",
      'mime'    => Array('^image\/', '^video\/', '^audio\/'),
      'icon'    => "mimetypes/image.png",
      'preload' => Array(
        Array('src' => '/apps/Preview/main.js', 'type' => 'javascript'),
        Array('src' => '/apps/Preview/main.css', 'type' => 'stylesheet')
      )
    ),
    'ApplicationTextpad'  => Array(
      'name'    => "Textpad",
      'mime'    => Array('^text\/', '^application\/x\-empty'),
      'icon'    => "apps/accessories-text-editor.png",
      'preload' => Array(
        Array('src' => '/apps/Textpad/main.js', 'type' => 'javascript'),
        Array('src' => '/apps/Textpad/main.css', 'type' => 'stylesheet')
      )
    ),
    'ApplicationFileManager'    => Array(
      'name'    => "File Manager",
      'mime'    => null,
      'icon'    => "apps/file-manager.png",
      'preload' => Array(
        Array('src' => '/apps/FileManager/main.js', 'type' => 'javascript'),
        Array('src' => '/apps/FileManager/main.css', 'type' => 'stylesheet')
      )
    ),
    'ApplicationSettings'    => Array(
      'name'    => "Settings",
      'mime'    => null,
      'icon'    => "categories/applications-system.png",
      'preload' => Array(
        Array('src' => '/apps/Settings/main.js', 'type' => 'javascript'),
        Array('src' => '/apps/Settings/main.css', 'type' => 'stylesheet')
      )
    )
  );

  if ( $name === null && $args === null ) {
    return $apps;
  }

  if ( isset($apps[$name]) ) {
    return $apps[$name];
  }

  return false;
}

function out($json) {
  header("Content-type: application/json");
  print json_encode($json);
}

$method = empty($_SERVER['REQUEST_METHOD']) ? 'GET' : $_SERVER['REQUEST_METHOD'];
$json   = Array("result" => false, "error" => null);
$error  = null;
$result = null;
$data   = $method === 'POST' ? file_get_contents("php://input") : (empty($_SERVER['REQUEST_URI']) ? '' : $_SERVER['REQUEST_URI']);;

if ( $method === 'GET' ) {
  if ( isset($_GET['file']) && ($file = $_GET['file']) ) {
    // FIXME
    $continue = false;
    try {
      if ( !is_file($file) ) throw new Exception("You are reading an invalid resource");
      if ( !is_readable($file) ) throw new Exception("Read permission denied");
      if ( preg_match("/^\/tmp/", $file) === false || strstr($file, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this");
      $continue = true;
    } catch ( Exception $e ) {
      header("HTTP/1.0 500 Internal Server Error");
      print $e->getMessage();
    }

    if ( $continue && file_exists($file) ) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE); // return mime type ala mimetype extension
        $mime = finfo_file($finfo, $file);
        finfo_close($finfo);

        if ( $mime ) {
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
    move_uploaded_file($_FILES['upload']['tmp_name'], $_POST['path'] . '/' . $_FILES['upload']['name']);
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

        switch ( $an ) {
          case "CoreService" :
            if ( $am == 'getCache' ) {
              $result = Array(
                'applications' => getApplicationData(null, null)
              );
            } else if ( $am == 'getSession' ) {
              $result = getSessionData();
            } else if ( $am == 'setSession' ) {
              $data = empty($aa['data']) ? Array() : $aa['data'];
              $result = setSessionData($data);
            } else if ( $am == 'setSettings' ) {
              $data = empty($aa['data']) ? Array() : $aa['data'];
              $result = setUserSettings($data);
            } else {
              $error = "Invalid CoreService call";
            }
          break;

          default :
            $error = "No such application";
          break;
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
?>
