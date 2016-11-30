<?php namespace OSjs\Modules\VFS;
/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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

use OSjs\Core\Instance;
use OSjs\Core\Request;
use OSjs\Core\Utils;
use OSjs\Core\VFS;

use Exception;

abstract class Filesystem
{
  const TRANSPORT = 'filesystem';
  const DATE_FORMAT = "Y-m-d\TH:i:s.Z\Z";

  final protected static function _getFileMetadata($filename, $vroot, $path) {
    $type = @is_dir($path) ? 'dir' : 'file';
    $mime = '';
    $size = 0;

    if ( ($mtime = @filemtime($path)) > 0 ) {
      $mtime = date(self::DATE_FORMAT, $mtime);
    }
    if ( ($ctime = @filectime($path)) > 0 ) {
      $ctime = date(self::DATE_FORMAT, $ctime);
    }

    if ( $type === 'file' ) {
      if ( is_writable($path) || is_readable($path) ) {
        $mime = Utils::getMIME($path);
        $size = filesize($path);
      }
    }

    return [
      'filename' => htmlspecialchars($filename),
      'path' => htmlspecialchars($vroot . '/' . $filename),
      'size' => $size ?: 0,
      'type' => $type,
      'mime' => $mime,
      'ctime' => $ctime ?: null,
      'mtime' => $mtime ?: null
    ];
  }

  final protected static function _getRealPath($path) {
    $parts = explode('://', $path, 2);
    $protocol = $parts[0];
    $mounts = (array) (INSTANCE::GetConfig()->vfs->mounts ?: []);

    $replacements = [
      '%UID%' => isset($_SESSION['username']) ? $_SESSION['username'] : -1,
      '%USERNAME%' => isset($_SESSION['username']) ? $_SESSION['username'] : '',
      '%DROOT%' => DIR_ROOT,
      '%DIST%' => Instance::GetDist(),
      '%MOUNTPOINT%' => $protocol
    ];

    $root = null;
    if ( isset($mounts[$protocol]) ) {
      $root = $mounts[$protocol];
    } else if ( isset($mounts['*']) ){
      $root = $mounts['*'];
    }

    if ( !is_string($root) ) {
      $root = $root->destination;
    }

    $path = $root . preg_replace('/^\/?/', '//', VFS::GetAbsoluteFilename($parts[1]));
    return str_replace(array_keys($replacements), array_values($replacements), $path);
  }

  final public static function exists(Request $request, Array $arguments = []) {
    return file_exists(self::_getRealPath($arguments['path']));
  }

  final public static function read(Request $request, Array $arguments = []) {
    $path = self::_getRealPath($arguments['path']);
    $mime = Utils::getMIME($path);

    if ( !isset($arguments["raw"]) ) {
      // NOTE: This is pretty much deprecated ?!?!
      print "data:{$mime};base64,";
      while( !feof($handle) ) {
        $plain = fread($handle, 57 * 143);
        $encoded = base64_encode($plain);
        $encoded = chunk_split($encoded, 76, '');
        echo $encoded;
        ob_flush();
        flush();
      }
    } else {
      $request->respond()->file($path, $mime);
    }
  }

  final public static function upload(Request $request, Array $arguments = []) {
    if ( !isset($_FILES['upload']) || !($file = $_FILES['upload']) ) {
      throw new Exception('Invalid file');
    }

    $config = Instance::GetConfig()->vfs;
    if ( $file['size'] <= 0 || $file['size'] > $config->maxuploadsize ) {
      throw new Exception('The upload request is either empty or too large!');
    }

    session_write_close();

    $path = self::_getRealPath("{$arguments['path']}/{$file['name']}");
    if ( move_uploaded_file($file['tmp_name'], $path) === true ) {
      //chmod("{$root}/{$file['name']}", 0600);
      return true;
    }

    return false;
  }

  final public static function write(Request $request, Array $arguments = []) {
    $data = $arguments['data'];
    if ( empty($arguments['raw']) || $arguments['raw'] === false ) {
      $data = base64_decode(substr($data, strpos($data, ',') + 1));
    }
    return file_put_contents(self::_getRealPath($arguments['path']), $data) !== false;
  }

  final public static function delete(Request $request, Array $arguments = []) {
    $path = self::_getRealPath($arguments['path']);

    if ( is_file($path) ) {
      if ( !is_writeable($path) ) throw new Exception('Read permission denied');
    } else if ( is_dir($path) ) {
      if ( !is_writeable(dirname($path)) ) throw new Exception('Read permission denied');
      return Utils::rmdir($path);
    } else {
      throw new exception('No such file or directory!');
    }

    return unlink($path);
  }

  final public static function copy(Request $request, Array $arguments = []) {
    $src = self::_getRealPath($arguments['src']);
    $dest = self::_getRealPath($arguments['dest']);

    if ( $src === $dest ) throw new Exception('Source and destination cannot be the same');
    if ( !file_exists($src) ) throw new Exception('File does not exist');
    if ( !is_writeable(dirname($dest)) ) throw new Exception('Permission denied');
    if ( file_exists($dest) ) throw new Exception('Destination file already exist');

    return copy($src, $dest);
  }

  final public static function move(Request $request, Array $arguments = []) {
    $src = self::_getRealPath($arguments['src']);
    $dest = self::_getRealPath($arguments['dest']);

    if ( $src === $dest ) throw new Exception('Source and destination cannot be the same');
    if ( !file_exists($src) ) throw new Exception('File does not exist');
    if ( !is_writeable(dirname($dest)) ) throw new Exception('Permission denied');
    if ( file_exists($dest) ) throw new Exception('Destination file already exist');

    return rename($src, $dest);
  }

  final public static function mkdir(Request $request, Array $arguments = []) {
    $path = self::_getRealPath($arguments['path']);

    if ( file_exists($path) ) throw new Exception('Destination already exists');

    if ( !mkdir($path) ) {
      throw new Exception('Failed to create directory');
    }
    return true;
  }

  final public static function find(Request $request, Array $arguments = []) {
    $path = self::_getRealPath($arguments['path']);
    $result = [];

    if ( empty($arguments['query']) ) {
      throw new Exception('No query was given');
    }

    if ( empty($arguments['recursive']) || !$arguments['recursive'] ) {
      if ( ($files = scandir($root)) !== false ) {
        foreach ( $files as $f ) {
          if ( $f == "." || $f == ".." ) continue;

          if ( stristr($f, $arguments['query']) !== false ) {
            $result[] = self::_getFileMetadata($f, $dirname, $root);
          }
        }
      }

      return $result;
    }

    $p = preg_replace('/\/$/', '', $path);
    $limit = isset($arguments['limit']) ? (int) $arguments['limit'] : 0;
    $objects = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($p), RecursiveIteratorIterator::SELF_FIRST);

    foreach( $objects as $name => $object ) {
      if ( stristr($name, $arguments['query']) !== false ) {
        $result[] = self::_getFileMetadata(substr($name, strlen($path)), $dirname, $root);
      }

      if ( $limit && sizeof($result) >= $limit ) {
        break;
      }
    }

    return $result;
  }

  final public static function fileinfo(Request $request, Array $arguments = []) {
    $path = self::_getRealPath($arguments['path']);
    $info = self::_getFileMetadata(basename($path), dirname($arguments['path']), $path);

    if ( preg_match("/^image/", $info['mime']) ) {
      if ( function_exists('exif_read_data') ) {
        if ( $exif = exif_read_data($path) ) {
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
              $info['exif'] = implode("\n", $tmp);
            }
          }
        }
      }
    }

    return $info;
  }

  final public static function scandir(Request $request, Array $arguments = []) {
    $path = self::_getRealPath($arguments['path']);
    if ( !file_exists($path) || !is_dir($path) ) {
      throw new Exception("Directory does not exist");
    }

    return array_values(array_map(function($iter) use($arguments, $path) {
      return self::_getFileMetadata($iter, $arguments['path'], $path . '/' . $iter);
    }, array_filter(scandir($path), function($iter) {
      return !in_array($iter, ['.', '..']);
    })));
  }

  final public static function freeSpace(Request $request, Array $arguments = []) {
    if ( preg_match('/^osjs/', $arguments['root']) ) {
      throw new Exception('Not allowed');
    }

    $path = self::_getRealPath($arguments['root']);
    return disk_free_space($path);
  }
}
