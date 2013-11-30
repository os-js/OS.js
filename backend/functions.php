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

/**
 * Default handler.
 */
if ( !class_exists("OSjsHandler") ) {
  class OSjsHandler {
    public static function login($username, $password) {
      return self::getUserSettings();
    }

    public static function logout() {
      return true;
    }

    public static function getUserSettings() {
      $data = null;
      $file = TMPDIR . "/___settingsdata-" . SESSIONNAME;
      if ( file_exists($file) ) {
        if ( $c = file_get_contents($file) ) {
          $data = json_decode($c);
        }
      }

      return $data ? $data : OSjs::$defaultUserSettings;
    }

    public static function setUserSettings($data) {
      $file = TMPDIR . "/___settingsdata-" . SESSIONNAME;
      $d = json_encode($data);
      return ($d && file_put_contents($file, $d)) ? true : false;
    }

    public static function getSessionData() {
      $file = TMPDIR . "/___sessiondata-" . SESSIONNAME;
      if ( file_exists($file) ) {
        if ( $c = file_get_contents($file) ) {
          return json_decode($c);
        }
      }
      return false;
    }

    public static function setSessionData(Array $a) {
      $file = TMPDIR . "/___sessiondata-" . SESSIONNAME;
      $d = json_encode($a);
      return file_put_contents($file, $d) ? true : false;
    }
  }
}

/**
 * OSjs API Helpers
 */
class OSjs
{
  public static $defaultPreloads = Array(

  );

  public static $defaultCoreSettings = Array(
    'Core' => Array(
      'Home'          => HOMEDIR,
      'MaxUploadSize' => MAXUPLOAD
    ),

    'WM' => Array(
      'exec'      => 'CoreWM',
      'args'      => Array(
        'themes'      => Array('default' => Array('title' => 'Default'))
      )
    )
  );

  public static $defaultUserSettings = Array(
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

  public static function getPackageInfo() {
    $list = Array();
    if ( $files = scandir(APPDIR) ) {
      foreach ( $files as $f ) {
        $name = sprintf("%s/%s/package.json", APPDIR, $f);
        if ( file_exists($name) ) {
          if ( $content = file_get_contents($name) ) {
            if ( $data = json_decode($content, true) ) {
              $key = key($data);
              $val = current($data);

              if ( !empty($val['enabled']) && ($val['enabled'] === false) ) {
                continue;
              }

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

  public static function getApplicationData($name, $args) {
    $apps = self::getPackageInfo();
    if ( $name === null && $args === null ) {
      return $apps;
    }

    if ( isset($apps[$name]) ) {
      return $apps[$name];
    }

    return false;
  }

  public static function vfs($method, $args) {
    return call_user_func_array(Array("FS", $method), $args);
  }

  public static function getPreloadList() {
    return self::$defaultPreloads;
  }

  public static function getCoreSettings() {
    return self::$defaultCoreSettings;
  }
}

/**
 * Filesystem Helpers
 */
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
          $mime = fileMime($fpath);
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
      if ( ($mime = fileMime($fname)) ) {
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

  public static function copy($src, $dest) {
    $src = unrealpath($src);
    $dest = unrealpath($dest);

    if ( strstr($src, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this (1)");
    if ( strstr($dest, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this (2)");
    if ( $src === $dest ) throw new Exception("Source and destination cannot be the same");
    if ( !file_exists($src) ) throw new Exception("File does not exist");
    if ( !is_writeable(dirname($dest)) ) throw new Exception("Permission denied");
    if ( file_exists($dest) ) throw new Exception("Destination file already exist");

    return copy($src, $dest);
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

  public static function fileinfo($fname) {
    $fname = unrealpath($fname);

    if ( strstr($fname, HOMEDIR) === false ) throw new Exception("You do not have enough privileges to do this");
    if ( !is_file($fname) ) throw new Exception("You are reading an invalid resource");
    if ( !is_readable($fname) ) throw new Exception("Read permission denied");

    $mime = fileMime($fname);
    $data = Array(
      'path'          => dirname($fname),
      'filename'      => basename($fname),
      'size'          => filesize($fname),
      'mime'          => $mime,
      'permissions'   => filePermissions($fname)
    );

    if ( $mime && preg_match("/^image/", $mime) ) {
      if ( function_exists('exif_read_data') ) {
        if ( $exif = exif_read_data($fname) ) {
          if ( $exif !== false ) {
            if ( is_array($exif) ) {
              $tmp = Array();
              foreach ( $exif as $key => $section ) {
                if ( is_array($section) ) {
                  foreach ( $section as $name => $val ) {
                    $tmp[] = "$key.$name: $val";
                  }
                }
              }
              $data['exif'] = implode("\n", $tmp);
            }
          }
        }
      } else {
        $data['exif'] = "No EXIF data could be extracted. Missing 'exif_read_data'";
      }

      if ( !$data['exif'] ) {
        $data['exif'] = "No EXIF data found";
      }
    }

    return $data;
  }
}


function fileMime($fname) {
  $finfo = finfo_open(FILEINFO_MIME_TYPE);
  $mime = finfo_file($finfo, $fname);
  finfo_close($finfo);
  return $mime;
}

function filePermissions($fname) {
  $perms = fileperms($fname);
  $info  = '';

  if (($perms & 0xC000) == 0xC000) {
      // Socket
      $info = 's';
  } elseif (($perms & 0xA000) == 0xA000) {
      // Symbolic Link
      $info = 'l';
  } elseif (($perms & 0x8000) == 0x8000) {
      // Regular
      $info = '-';
  } elseif (($perms & 0x6000) == 0x6000) {
      // Block special
      $info = 'b';
  } elseif (($perms & 0x4000) == 0x4000) {
      // Directory
      $info = 'd';
  } elseif (($perms & 0x2000) == 0x2000) {
      // Character special
      $info = 'c';
  } elseif (($perms & 0x1000) == 0x1000) {
      // FIFO pipe
      $info = 'p';
  } else {
      // Unknown
      $info = 'u';
  }

  // Owner
  $info .= (($perms & 0x0100) ? 'r' : '-');
  $info .= (($perms & 0x0080) ? 'w' : '-');
  $info .= (($perms & 0x0040) ?
              (($perms & 0x0800) ? 's' : 'x' ) :
              (($perms & 0x0800) ? 'S' : '-'));

  // Group
  $info .= (($perms & 0x0020) ? 'r' : '-');
  $info .= (($perms & 0x0010) ? 'w' : '-');
  $info .= (($perms & 0x0008) ?
              (($perms & 0x0400) ? 's' : 'x' ) :
              (($perms & 0x0400) ? 'S' : '-'));

  // World
  $info .= (($perms & 0x0004) ? 'r' : '-');
  $info .= (($perms & 0x0002) ? 'w' : '-');
  $info .= (($perms & 0x0001) ?
              (($perms & 0x0200) ? 't' : 'x' ) :
              (($perms & 0x0200) ? 'T' : '-'));


  return $info;
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

function unrealpath($p) {
  return str_replace(Array("../", "./"), "", $p);
}

?>
