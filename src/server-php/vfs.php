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
 * MIME Helpers
 */
class MIME
{
  protected $data;
  protected static $instance;

  protected function __construct() {
    $file = sprintf("%s/%s", ROOTDIR, "mime.json");
    if ( file_exists($file) ) {
      $this->data = json_decode(file_get_contents($file));
    }
  }

  public static function get() {
    if ( !self::$instance ) {
      self::$instance = new self();
    }
    return self::$instance;
  }

  public function getData() {
    return $this->data;
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

  public static function scandir($orgdir, Array $opts = Array()) {
    $dirname = VFSDIR . $orgdir;

    if ( strstr($dirname, VFSDIR) === false ) throw new Exception("Access denied in directory '{$dirname}'");
    if ( !is_dir($dirname) ) {
      throw new Exception("Invalid directory '{$orgdir}'");
    }
    if ( !is_readable($dirname) ) {
      throw new Exception("Permission denied in '{$orgdir}'");
    }

    $list = Array();
    $mimeFilter = empty($opts['mimeFilter']) ? Array() : $opts['mimeFilter'];
    $typeFilter = empty($opts['typeFilter']) ? null    : $opts['typeFilter'];

    // We need to test for errors here!
    $tmp = Array();
    foreach ( $mimeFilter as $m ) {
      if ( preg_match("/{$m}/", null) !== false ) {
        $tmp[] = $m;
      }
    }
    $mimeFilter = $tmp;

    $files = scandir($dirname);
    foreach ( $files as $fname ) {
      if ( $orgdir == "/" && $fname == ".." ) continue;
      if ( $fname == "." ) continue;

      $ofpath = truepath(str_replace("//", "/", sprintf("%s/%s", $orgdir, $fname)));
      $fpath  = realpath(str_replace("//", "/", sprintf("%s/%s", $dirname, $fname)));
      $ftype  = is_dir($fpath) ? 'dir' : 'file';

      if ( $typeFilter && $ftype !== $typeFilter ) continue;

      $fsize = @(($ftype == 'dir' ? '' : filesize($fpath)));

      if ( $fsize === false ) $fsize = '';

      $iter = Array(
        'filename' => htmlspecialchars($fname),
        'path'     => htmlspecialchars($ofpath),
        'size'     => $fsize,
        'mime'     => null,
        'type'     => $ftype
      );

      if ( empty($opts['mime']) || $opts['mime'] === true ) {
        if ( $ftype == 'file' ) {
          $mime = (is_writable($fpath) || is_readable($fpath)) ? fileMime($fpath) : null;
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
    $fname = unrealpath(VFSDIR . $fname);

    if ( strstr($fname, VFSDIR) === false ) throw new Exception("You do not have enough privileges to do this");
    if ( is_file($fname) ) {
      if ( !is_file($fname) ) throw new Exception("You are writing to a invalid resource");
      if ( !is_writable($fname) ) throw new Exception("Write permission denied");
    } else {
      if ( !is_writable(dirname($fname)) ) throw new Exception("Write permission denied in folder");
    }

    if ( !empty($opts['dataSource']) && $opts['dataSource'] ) {
      $tmp = explode(",", $content, 2);
      if ( sizeof($tmp) > 1 ) {
        //$dcontent = preg_replace("/^data\:(.*);base64\,/", "", $content);

        $dcontent = array_pop($tmp);
        $dtype    = array_pop($tmp);

        if ( preg_match("/^data\:image/", $dtype) ) {
          $dcontent =  str_replace(' ', '+', $dcontent);
        }

        if ( $dcontent === false ) {
          $dcontent = '';
        } else {
          $dcontent = base64_decode($dcontent);
        }

        $content = $dcontent;
      }
    }

    return file_put_contents($fname, $content) !== false;
  }

  public static function file_get_contents($fname, $opts = null) {
    if ( !$opts || !is_array($opts) ) $opts = Array();
    $fname = unrealpath(VFSDIR . $fname);

    if ( strstr($fname, VFSDIR) === false ) throw new Exception("You do not have enough privileges to do this");
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
    $fname = unrealpath(VFSDIR . $fname);

    if ( strstr($fname, VFSDIR) === false ) throw new Exception("You do not have enough privileges to do this");

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
    $src = unrealpath(VFSDIR . $src);
    $dest = unrealpath(VFSDIR . $dest);

    if ( strstr($src, VFSDIR) === false ) throw new Exception("You do not have enough privileges to do this (1)");
    if ( strstr($dest, VFSDIR) === false ) throw new Exception("You do not have enough privileges to do this (2)");
    if ( $src === $dest ) throw new Exception("Source and destination cannot be the same");
    if ( !file_exists($src) ) throw new Exception("File does not exist");
    if ( !is_writeable(dirname($dest)) ) throw new Exception("Permission denied");
    if ( file_exists($dest) ) throw new Exception("Destination file already exist");

    return copy($src, $dest);
  }

  public static function move($src, $dest) {
    $src = unrealpath(VFSDIR . $src);
    $dest = unrealpath(VFSDIR . $dest);

    if ( strstr($src, VFSDIR) === false ) throw new Exception("You do not have enough privileges to do this (1)");
    if ( strstr($dest, VFSDIR) === false ) throw new Exception("You do not have enough privileges to do this (2)");
    if ( $src === $dest ) throw new Exception("Source and destination cannot be the same");
    if ( !file_exists($src) ) throw new Exception("File does not exist");
    if ( !is_writeable(dirname($dest)) ) throw new Exception("Permission denied");
    if ( file_exists($dest) ) throw new Exception("Destination file already exist");

    return rename($src, $dest);
  }

  public static function mkdir($dname) {
    $dname = unrealpath(VFSDIR . $dname);

    if ( strstr($dname, VFSDIR) === false ) throw new Exception("You do not have enough privileges to do this");
    if ( file_exists($dname) ) throw new Exception("Destination already exists");

    return mkdir($dname);
  }

  public static function fileinfo($fname) {
    $fname = unrealpath(VFSDIR . $fname);

    if ( strstr($fname, VFSDIR) === false ) throw new Exception("You do not have enough privileges to do this");
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

  public static function fileexists($fname) {
    $fname = unrealpath(VFSDIR . $fname);
    if ( strstr($fname, VFSDIR) === false ) throw new Exception("You do not have enough privileges to do this");
    return file_exists($fname);
  }
}


function fileMime($fname) {
  if ( function_exists('pathinfo') ) {
    if ( $ext = pathinfo($fname, PATHINFO_EXTENSION) ) {
      $ext = strtolower($ext);
      $force = MIME::get()->getData();
      if ( isset($force[".{$ext}"]) ) {
        return $force[".{$ext}"];
      }
    }
  }

  if ( function_exists('finfo_open') ) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $fname);
    finfo_close($finfo);
    return $mime;
  }
  return null;
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

function truepath($path){
    // whether $path is unix or not
    $unipath=strlen($path)==0 || $path{0}!='/';
    // attempts to detect if path is relative in which case, add cwd
    if(strpos($path,':')===false && $unipath)
        $path=getcwd().DIRECTORY_SEPARATOR.$path;
    // resolve path parts (single dot, double dot and double delimiters)
    $path = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $path);
    $parts = array_filter(explode(DIRECTORY_SEPARATOR, $path), 'strlen');
    $absolutes = array();
    foreach ($parts as $part) {
        if ('.'  == $part) continue;
        if ('..' == $part) {
            array_pop($absolutes);
        } else {
            $absolutes[] = $part;
        }
    }
    $path=implode(DIRECTORY_SEPARATOR, $absolutes);
    // resolve any symlinks
    if(file_exists($path) && is_link($path) && linkinfo($path)>0)$path=readlink($path);
    // put initial separator that could have been lost
    $path=!$unipath ? '/'.$path : $path;
    return $path;
}

?>
