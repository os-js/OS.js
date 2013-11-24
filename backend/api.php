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

define("SESSIONNAME", preg_replace("/[^0-9]/", "", empty($_SERVER['REMOTE_ADDR']) ? '127.0.0.1' : $_SERVER['REMOTE_ADDR']));
define("HOMEDIR",     "/opt/OSjs/home");
define("TMPDIR",      "/opt/OSjs/tmp");
define("APPDIR",      realpath(dirname(__FILE__) . "/../apps"));
define("MAXUPLOAD",   return_bytes(ini_get('upload_max_filesize')));

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
    if ( strstr($dirname, HOMEDIR) === false ) throw new Exception("Access denied in directory '{$dirname}'");
    if ( !is_dir($dirname) ) {
      throw new Exception("Invalid directory '{$dirname}'");
    }
    if ( !is_readable($dirname) ) {
      throw new Exception("Permission denied in '{$dirname}'");
    }

    $list = Array();
    $mimeFilter = empty($opts['mimeFilter']) ? Array() : $opts['mimeFilter'];


    $files = scandir($dirname);
    foreach ( $files as $fname ) {
      if ( $dirname == "/" && $fname == ".." ) continue;
      if ( $fname == "." ) continue;

      $fpath = realpath(str_replace("//", "/", sprintf("%s/%s", $dirname, $fname)));
      $ftype = is_dir($fpath) ? 'dir' : 'file';

      $fsize = @(($ftype == 'dir' ? '' : filesize($fpath)));
      $hrsize = '';

      if ( $fsize === false ) $fsize = '';
      if ( $ftype !== 'dir' && strlen($fsize) ) {
        $hrsize = humanFileSize($fsize);
      }

      $iter = Array(
        'filename' => $fname,
        'path'     => $fpath,
        'size'     => $fsize,
        'hrsize'   => $hrsize,
        'mime'     => null,
        'type'     => $ftype
      );

      if ( empty($opts['mime']) || $opts['mime'] === true ) {
        if ( $ftype == 'file' ) {
          $finfo = finfo_open(FILEINFO_MIME_TYPE);
          $mime  = finfo_file($finfo, $fpath);
          finfo_close($finfo);

          if ( $mimeFilter ) {
            $skip = true;
            if ( $mime ) {
              foreach ( $mimeFilter as $mf ) {
                if ( preg_match("/{$mf}/", $mime) === 1 ) {
                  $skip = false;
                  break;
                }
              }
            }
            if ( $skip ) continue;
          }

          $iter['mime'] = $mime;
        }
      }

      $list[] = $iter;
    }

    return self::sortdir($list);
  }

  public static function file_put_contents($fname, $content, $opts = null) {
    if ( !$opts || !is_array($opts) ) $opts = Array();
    $fname = unrealpath($fname);

    if ( strstr($fname, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this");
    if ( is_file($fname) ) {
      if ( !is_file($fname) ) throw new Exception("You are writing to a invalid resource");
      if ( !is_writable($fname) ) throw new Exception("Write permission denied");
    } else {
      if ( !is_writable(dirname($fname)) ) throw new Exception("Write permission denied in folder");
    }

    if ( !empty($opts['dataSource']) && $opts['dataSource'] ) {
      $dcontent = preg_replace("/^data\:(.*);base64\,/", "", $content);
      if ( $dcontent === false ) {
        $dcontent = '';
      } else {
        $dcontent = base64_decode($dcontent);
      }
      return file_put_contents($fname, $dcontent) !== false;
    }

    return file_put_contents($fname, $content) !== false;
  }

  public static function file_get_contents($fname, $opts = null) {
    if ( !$opts || !is_array($opts) ) $opts = Array();
    $fname = unrealpath($fname);

    if ( strstr($fname, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this");
    if ( !is_file($fname) ) throw new Exception("You are reading an invalid resource");
    if ( !is_readable($fname) ) throw new Exception("Read permission denied");

    if ( !empty($opts['dataSource']) && $opts['dataSource'] ) {
      $finfo = finfo_open(FILEINFO_MIME_TYPE);
      $mime  = finfo_file($finfo, $fname);
      finfo_close($finfo);

      if ( $mime ) {
        $data = file_get_contents($fname);
        $out  = null;
        return sprintf("data:%s;base64,%s", $mime, base64_encode($data));
      }

      throw new Exception("Failed to read file");
    }

    return file_get_contents($fname);
  }

  public static function delete($fname) {
    $fname = unrealpath($fname);

    if ( strstr($fname, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this");

    if ( is_file($fname) ) {
      if ( !is_writeable($fname) ) throw new Exception("Read permission denied");
    } else if ( is_dir($fname) ) {
      if ( !is_writeable(dirname($fname)) ) throw new Exception("Read permission denied");
      return destroy_dir($fname);
    } else {
      throw new exception("No such file or directory!");
    }

    return unlink($fname);
  }

  public static function move($src, $dest) {
    $src = unrealpath($src);
    $dest = unrealpath($dest);

    if ( strstr($src, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this (1)");
    if ( strstr($dest, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this (2)");
    if ( $src === $dest ) throw new Exception("Source and destination cannot be the same");
    if ( !file_exists($src) ) throw new Exception("File does not exist");
    if ( !is_writeable(dirname($dest)) ) throw new Exception("Permission denied");
    if ( file_exists($dest) ) throw new Exception("Destination file already exist");

    return rename($src, $dest);
  }

  public static function mkdir($dname) {
    $dname = unrealpath($dname);

    if ( strstr($dname, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this");
    if ( file_exists($dname) ) throw new Exception("Destination already exists");

    return mkdir($dname);
  }
}

function getPackageInfo() {
  $list = Array();
  if ( $files = scandir(APPDIR) ) {
    foreach ( $files as $f ) {
      $name = sprintf("%s/%s/package.json", APPDIR, $f);
      if ( file_exists($name) ) {
        if ( $content = file_get_contents($name) ) {
          if ( $data = json_decode($content, true) ) {
            $key = key($data);
            $val = current($data);

            foreach ( $val['preload'] as $k => $v ) {
              $val['preload'][$k]['src'] = sprintf("/apps/%s/%s", $f, $v['src']);
            }

            $list[$key] = $val;
          }
        }
      }
    }
  }
  return $list;
}

function humanFileSize($size,$unit="") {
  if( (!$unit && $size >= 1<<30) || $unit == "GB")
    return number_format($size/(1<<30),2)."GB";
  if( (!$unit && $size >= 1<<20) || $unit == "MB")
    return number_format($size/(1<<20),2)."MB";
  if( (!$unit && $size >= 1<<10) || $unit == "KB")
    return number_format($size/(1<<10),2)."KB";
  return number_format($size)." bytes";
}

function return_bytes($val) {
  $val = trim($val);
  $last = strtolower($val[strlen($val)-1]);
  switch($last) {
    case 'g':
      $val *= 1024;
    case 'm':
      $val *= 1024;
    case 'k':
      $val *= 1024;
  }

  return $val;
}


function destroy_dir($dir) {
  if (!is_dir($dir) || is_link($dir)) return unlink($dir);
  foreach (scandir($dir) as $file) {
    if ($file == '.' || $file == '..') continue; 
    if (!destroy_dir($dir . DIRECTORY_SEPARATOR . $file)) {
      chmod($dir . DIRECTORY_SEPARATOR . $file, 0777);
      if (!destroy_dir($dir . DIRECTORY_SEPARATOR . $file)) return false;
    }
  }
  return rmdir($dir);
}

function setUserSettings($data) {
  $file = TMPDIR . "/___settingsdata-" . SESSIONNAME;
  $d = json_encode($data);
  return ($d && file_put_contents($file, $d)) ? true : false;
}

function getUserSettings() {
  $default = Array(
    'WM' => Array(
      'CoreWM' => Array(
        'theme'       => null,
        'wallpaper'   => null,
        'background'  => null,
        'style'       => Array(
        )
      )
    )
  );

  $data = null;
  $file = TMPDIR . "/___settingsdata-" . SESSIONNAME;
  if ( file_exists($file) ) {
    if ( $c = file_get_contents($file) ) {
      $data = json_decode($c);
    }
  }

  return $data ? $data : $default;
}

function unrealpath($p) {
  return str_replace(Array("../", "./"), "", $p);
}

function getSessionData() {
  $file = TMPDIR . "/___sessiondata-" . SESSIONNAME;
  if ( file_exists($file) ) {
    if ( $c = file_get_contents($file) ) {
      return json_decode($c);
    }
  }
  return false;
}

function setSessionData(Array $a) {
  $file = TMPDIR . "/___sessiondata-" . SESSIONNAME;
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
      'Home' => HOMEDIR,
      'MaxUploadSize' => MAXUPLOAD
    ),

    'WM' => Array(
      'exec'      => 'CoreWM',
      'args'      => Array(
        'themes' => Array('default' => Array('title' => 'Default'))
      )
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
  $apps = getPackageInfo();
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

function error() {
  if ( !is_null($e = error_get_last()) ) {
    if ( ob_get_level() ) ob_end_clean();

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

    header("HTTP/1.0 500 Internal Server Error");
    print $e['message'];
    exit;
  }
}

register_shutdown_function('error');


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
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
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
