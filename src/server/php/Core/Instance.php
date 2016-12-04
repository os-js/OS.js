<?php namespace OSjs\Core;
/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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

use OSjs\Core\Request;
use OSjs\Core\Responder;
use OSjs\Core\Authenticator;
use OSjs\Core\VFS;

use Exception;

/**
 * OS.js Server Instance
 */
class Instance
{
  protected static $DIST = 'dist-dev';
  protected static $CONFIG = [];
  protected static $PACKAGES = [];
  protected static $API = [];
  protected static $VFS = [];
  protected static $MIDDLEWARE = [];

  /////////////////////////////////////////////////////////////////////////////
  // LOADERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Loads configuration files
   */
  final protected static function _loadConfiguration() {
    self::$CONFIG = json_decode(file_get_contents(DIR_SERVER . '/settings.json'));
    self::$PACKAGES = json_decode(file_get_contents(DIR_SERVER . '/packages.json'), true);

    if ( !empty(self::$CONFIG->tz) ) {
      date_default_timezone_set(self::$CONFIG->tz);
    }

    if ( !date_default_timezone_get() ) {
      date_default_timezone_set('UTC');
    }
  }

  /**
   * Loads all Middleware modules
   */
  final protected static function _loadMiddleware() {
    $path = DIR_SELF . '/Modules/Middleware/';
    foreach ( scandir($path) as $file ) {
      if ( substr($file, 0, 1) !== '.' ) {
        require($path . $file);

        $className = 'OSjs\\Modules\\Middleware\\' . pathinfo($file, PATHINFO_FILENAME);
        self::$MIDDLEWARE[] = $className;
      }
    }
  }

  /**
   * Loads API methods
   */
  final protected static function _loadAPI() {
    $path = DIR_SELF . '/Modules/API/';
    foreach ( scandir($path) as $file ) {
      if ( substr($file, 0, 1) !== '.' ) {
        require($path . $file);

        $className = 'OSjs\\Modules\\API\\' . pathinfo($file, PATHINFO_FILENAME);
        self::registerAPIMethods($className);
      }
    }

    foreach ( self::getPackages() as $p => $pkg ) {
      if ( $pkg['type'] == 'extension' ) {
        $path = DIR_ROOT . '/src/packages/' . $p . '/api.php';
        if ( file_exists($path) ) {
          $className = require($path);
          if ( is_string($className) && strlen($className) > 3 ) {
            self::registerAPIMethods($className);
          }
        }
      }
    }
  }

  /**
   * Loads VFS Transports
   */
  final protected static function _loadVFS() {
    $path = DIR_SELF . '/Modules/VFS/';
    foreach ( scandir($path) as $file ) {
      if ( substr($file, 0, 1) !== '.' ) {
        require($path . $file);

        $className = 'OSjs\\Modules\\VFS\\' . pathinfo($file, PATHINFO_FILENAME);
        self::$VFS[] = $className;
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // GETTERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get Loaded configuration
   */
  final public static function GetConfig() {
    return self::$CONFIG;
  }

  /**
   * Get packages manifest
   */
  final public static function GetPackages() {
    return self::$PACKAGES[self::$DIST];
  }

  /**
   * Get current dist
   */
  final public static function GetDist() {
    return self::$DIST;
  }

  /**
   * Gets the VFS modules
   */
  final public static function GetVFSModules() {
    return self::$VFS;
  }

  /////////////////////////////////////////////////////////////////////////////
  // APP
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Shutdown handler
   */
  final public static function shutdown() {
  }

  /**
   * Takes all public methods from a class and registeres them in
   * the API
   */
  final public static function registerAPIMethods($className) {
    foreach ( get_class_methods($className) as $methodName ) {
      if ( substr($methodName, 0, 1) != '_' ) {
        self::$API[$methodName] = $className;
      }
    }
  }

  /**
   * Startup handler
   */
  final public static function run() {
    $root = basename(getcwd());
    if ( in_array($root, ['dist', 'dist-dev']) ) {
      self::$DIST = $root;
    }

    register_shutdown_function([__CLASS__, 'shutdown']);

    define('DIR_ROOT', realpath(__DIR__ . '/../../../../'));
    define('DIR_SERVER', realpath(__DIR__ . '/../../'));
    define('DIR_SELF', realpath(__DIR__ . '/../'));

    try {
      self::_loadConfiguration();
      self::_loadMiddleware();
      self::_loadAPI();
      self::_loadVFS();
    } catch ( Exception $e ) {
      (new Responder())->error('Failed to initialize');
    }

    if ( !defined('DIR_DIST') ) {
      define('DIR_DIST', DIR_ROOT . '/' . self::$DIST);
    }
    define('DIR_PACKAGES', DIR_ROOT . '/src/packages');

    session_start();

    $request = new Request();

    if ( $request->isfs ) {
      if ( $request->method === 'GET' ) {
        $endpoint = 'read';
        $args = [
          'path' => preg_replace('/(^get\/)?/', '', $request->endpoint),
          'raw' => true
        ];
      } else {
        $endpoint = $request->endpoint;
        $args = $request->data;
      }

      try {
        $transport = VFS::GetTransportFromPath($args);

        Authenticator::CheckPermissions($request, 'fs', ['method' => $endpoint, 'arguments' => $args]);


        if ( $transport && is_callable($transport, $endpoint) ) {
          $result = call_user_func_array([$transport, $endpoint], [$request, $args]);
          $request->respond()->json([
            'error' => null,
            'result' => $result
          ]);
        } else {
          $request->respond()->json([
            'error' => 'No such VFS method',
            'result' => null
          ], 500);
        }
      } catch ( Exception $e ) {
        $request->respond()->json([
          'error' => $e->getMessage(),
          'result' => null
        ]);
      }
    } else if ( $request->isapi && $request->method === 'POST' ) {
      Authenticator::CheckPermissions($request, 'api', ['method' => $request->endpoint]);

      if ( isset(self::$API[$request->endpoint]) ) {
        try {
          $result = call_user_func_array([self::$API[$request->endpoint], $request->endpoint], [$request]);

          $request->respond()->json([
            'error' => null,
            'result' => $result
          ]);
        } catch ( Exception $e ) {
          $request->respond()->json([
            'error' => $e->getMessage(),
            'result' => null
          ]);
        }
      } else {
        $request->respond()->json([
          'error' => 'No such API method',
          'result' => null
        ], 500);
      }
      return;
    } else {
      if ( preg_match('/^\/?packages\/(.*\/.*)\/(.*)/', $request->url, $matches) ) {
        if ( !Authenticator::getInstance()->checkPermission($request, 'package', ['path' => $matches[1]]) ) {
          $request->respond()->error('Permission denied!', 403);
        }
      }
      $request->respond()->file(DIR_DIST . $request->url, null, false);
    }

    foreach ( self::$MIDDLEWARE as $className ) {
      $result = $className::request($request);
      if ( !$result ) {
        break;
      }
    }

    $request->respond()->error('File not found', 404);
  }

}
