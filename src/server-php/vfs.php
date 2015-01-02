<?php
/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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
    $file = sprintf("%s/src/%s", ROOTDIR, "mime.json");
    if ( file_exists($file) ) {
      $arr = (array)json_decode(file_get_contents($file));
      $this->data = (array)$arr["mapping"];
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

  public static function scandir($scandir, Array $opts = Array()) {
    list($dirname, $root, $protocol) = getRealPath($scandir);

    $result = Array();
    $on_root = !$dirname || $dirname == "/";
    if ( file_exists($root) && is_dir($root) ) {
      if ( ($files = scandir($root)) !== false ) {
        foreach ( $files as $f ) {
          if ( $f == "." || ($f == ".." && $on_root) ) continue;

          $opath = implode("/", Array($root, $f));
          if ( $f == ".." ) {
            $tpath = truepath(implode("/", Array($dirname, $f)), false);
          } else {
            $tpath = implode("/", Array($dirname, $f));
          }
          $vpath = sprintf("%s%s", $protocol, $tpath); //$on_root ? preg_replace("/^\//", "", $tpath) : $tpath);

          $iter = Array(
            "filename" => htmlspecialchars($f),
            "path"     => $vpath,
            "size"     => 0,
            "mime"     => null,
            "type"     => is_dir($opath) ? "dir" : "file"
          );

          if ( $iter["type"] == "file" ) {
            if ( is_writable($opath) || is_readable($opath) ) {
              if ( $mime = fileMime($opath) ) {
                $iter["mime"] = $mime;
              }
              if ( ($size = filesize($opath)) !== false ) {
                $iter["size"] = $size;
              }
            }
          }

          $result[] = $iter;
        }
      }
    } else {
      throw new Exception("Directory does not exist");
    }

    return $result;
  }

  public static function upload($path, $file) {
    $dest = "{$path}/{$file['name']}";

    list($dirname, $root, $protocol, $fname) = getRealPath($dest);
    if ( $protocol === "osjs://" ) throw new Exception("Not allowed");

    /*
    if ( file_exists($root) ) {
      throw new Exception("Destination already exist!");
    }
     */
    if ( $file['size'] <= 0 || $file['size'] > MAXUPLOAD ) {
      throw new Exception("The upload request is either empty or too large!");
    }

    session_write_close();
    if ( move_uploaded_file($file['tmp_name'], $root) === true ) {
      //chmod("{$root}/{$file['name']}", 0600);
      return true;
    }

    return false;
  }

  public static function write($fname, $content, $opts = null) {
    if ( !$opts || !is_array($opts) ) $opts = Array();
    list($dirname, $root, $protocol, $fname) = getRealPath($fname);
    if ( $protocol === "osjs://" ) throw new Exception("Not allowed");

    if ( is_file($fname) ) {
      if ( !is_file($fname) ) throw new Exception("You are writing to a invalid resource");
      if ( !is_writable($fname) ) throw new Exception("Write permission denied");
    } else {
      if ( !is_writable(dirname($fname)) ) throw new Exception("Write permission denied in folder");
    }

    $tmp = explode(",", $content, 2);
    if ( sizeof($tmp) > 1 ) {
      $dcontent = array_pop($tmp);
      $dtype    = array_pop($tmp);

      if ( preg_match("/^data\:image/", $dtype) ) {
        $dcontent = str_replace(' ', '+', $dcontent);
      }

      if ( $dcontent === false ) {
        $dcontent = '';
      } else {
        $dcontent = base64_decode($dcontent);
      }

      $content = $dcontent;
    }

    return file_put_contents($fname, $content) !== false;
  }

  public static function read($fname, $opts = null) {
    if ( !$opts || !is_array($opts) ) $opts = Array();

    list($dirname, $root, $protocol, $fname) = getRealPath($fname);

    if ( !is_file($fname) ) throw new Exception("You are reading an invalid resource");
    if ( !is_readable($fname) ) throw new Exception("Read permission denied");

    $etag = null;
    if ( !($mime = fileMime($fname)) ) {
      $mime = "application/octet-stream";
    }

    $handle = fopen($fname, "rb");
    $length = filesize($fname);
    $contents = fread($handle, $length);
    if ( isset($opts["raw"]) ) {
      $etag = md5(serialize(fstat($handle)));
    }
    fclose($handle);

    if ( isset($opts["raw"]) ) {
      return Array($mime, $etag, $length, $contents);
    }

    $encoded = base64_encode($contents);
    $dataURL = sprintf("data:%s;base64,%s", $mime, $encoded);
    return $dataURL;
  }

  public static function delete($fname) {
    list($dirname, $root, $protocol, $fname) = getRealPath($fname);
    if ( $protocol === "osjs://" ) throw new Exception("Not allowed");

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
    list($dirname, $root, $protocol, $src) = getRealPath($src);
    if ( $protocol === "osjs://" ) throw new Exception("Not allowed");
    list($dirname, $root, $protocol, $dest) = getRealPath($dest);
    if ( $protocol === "osjs://" ) throw new Exception("Not allowed");

    if ( $src === $dest ) throw new Exception("Source and destination cannot be the same");
    if ( !file_exists($src) ) throw new Exception("File does not exist");
    if ( !is_writeable(dirname($dest)) ) throw new Exception("Permission denied");
    if ( file_exists($dest) ) throw new Exception("Destination file already exist");

    return copy($src, $dest);
  }

  public static function move($src, $dest) {
    list($dirname, $root, $protocol, $src) = getRealPath($src);
    if ( $protocol === "osjs://" ) throw new Exception("Not allowed");
    list($dirname, $root, $protocol, $dest) = getRealPath($dest);
    if ( $protocol === "osjs://" ) throw new Exception("Not allowed");

    if ( $src === $dest ) throw new Exception("Source and destination cannot be the same");
    if ( !file_exists($src) ) throw new Exception("File does not exist");
    if ( !is_writeable(dirname($dest)) ) throw new Exception("Permission denied");
    if ( file_exists($dest) ) throw new Exception("Destination file already exist");

    return rename($src, $dest);
  }

  public static function mkdir($dname) {
    list($dirname, $root, $protocol, $dname) = getRealPath($dname);
    if ( $protocol === "osjs://" ) throw new Exception("Not allowed");

    if ( file_exists($dname) ) throw new Exception("Destination already exists");

    if ( !mkdir($dname) ) {
      throw new Exception("Failed to create directory");
    }
    return true;
  }

  public static function fileinfo($fname) {
    list($dirname, $root, $protocol, $fname) = getRealPath($fname);

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

  public static function exists($fname) {
    list($dirname, $root, $protocol, $fname) = getRealPath($fname);
    return file_exists($fname);
  }
}

function getRealPath(&$scandir) {
  $scandir  = preg_replace("/\/$/", "", $scandir);
  $scandir  = preg_replace("/\/\.\.?/", "/", $scandir);
  $protocol = "";
  $dirname  = $scandir;
  $realpath = "";

  if ( (preg_match("/^([A-z0-9\-_]+)?\:\/\/?(.*)/", $scandir, $matches)) !== false ) {
    if ( sizeof($matches) === 3 ) {
      $protocol = "{$matches[1]}://";
      $dirname  = $matches[2];
    }
  }
  if ( $protocol === "osjs://" ) {
    $root = sprintf("%s/%s", DISTDIR, preg_replace("/^\//", "", $dirname));
    if ( strstr($root, DISTDIR) === false ) throw new Exception("Access denied in directory '{$root}'");
  } else if ( $protocol === "home://" ) {
    $username = null;
    if ( $user = APIUser::get() ) {
      $username = $user->getUsername();
    }

    if ( !$username ) {
      throw new Exception("No username was found, cannot access home directory");
    }

    $vfsdir = sprintf("%s/%s", VFSDIR, $username);
    $root = sprintf("%s/%s", $vfsdir, preg_replace("/^\//", "", $dirname));
    if ( strstr($root, $vfsdir) === false ) throw new Exception("Access denied in directory '{$root}'");
  } else {
    $root = sprintf("%s/%s", PUBLICDIR, preg_replace("/^\//", "", $dirname));
    if ( strstr($root, PUBLICDIR) === false ) throw new Exception("Access denied in directory '{$root}'");
  }

  $realpath = str_replace(Array("../", "./"), "", $root);

  return Array($dirname, $root, $protocol, $realpath);
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

function truepath($path, $chk = true){
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
    if ( $chk ) {
      if(file_exists($path) && is_link($path) && linkinfo($path)>0)$path=readlink($path);
    }
    // put initial separator that could have been lost
    $path=!$unipath ? '/'.$path : $path;
    return $path;
}

?>
