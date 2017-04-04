<?php namespace OSjs\Core;
/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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
use OSjs\Lib\Utils;

use Exception;

/**
 * OS.js Server Instance
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @access public
 */
class Instance
{
    protected static $CONFIG = [];
    protected static $PACKAGES = [];
    protected static $API = [];
    protected static $VFS = [];
    protected static $MIDDLEWARE = [];
    protected static $BASEDIRS = [];

    protected static $done = false;

    /////////////////////////////////////////////////////////////////////////////
    // LOADERS
    /////////////////////////////////////////////////////////////////////////////

    /**
     * Loads configuration files
     *
     * @access protected
     * @return void
     */
    final protected static function _loadConfiguration()
    {
        self::$CONFIG = json_decode(file_get_contents(DIR_SERVER . '/settings.json'));
        self::$PACKAGES = json_decode(file_get_contents(DIR_SERVER . '/packages.json'), true);

        self::$BASEDIRS = [
            DIR_SELF
        ];

        if (!empty(self::$CONFIG->tz)) {
            date_default_timezone_set(self::$CONFIG->tz);
        }

        if (!date_default_timezone_get()) {
            date_default_timezone_set('UTC');
        }

        $overlays = self::$CONFIG->overlays;
        $paths = [];

        foreach ( $overlays as $oname => $overlay ) {
            if ( !empty($overlay->modules) ) {
                $paths = $paths + $overlay->modules;
                foreach ( $overlay->modules as $dir ) {
                    if ( preg_match('/^\/|([A-z]:\\\)/', $dir) ) {
                        self::$BASEDIRS[] = $dir . '/php';
                    } else {
                        self::$BASEDIRS[] = DIR_ROOT . '/' . $dir . '/php';
                    }
                }
            }
        }

        if ( sizeof($paths) ) {
            spl_autoload_register(function($name) use($paths) {
                $name = str_replace('\\', '/', $name);
                if (substr($name, 0, 5) == 'OSjs/') {
                    foreach ( $paths as $dir ) {
                        $name = substr($name, 5, strlen($name));
                        $path = DIR_ROOT . '/' . $dir . '/php/' . $name . '.php';
                        if ( file_exists($path) ) {
                            require $path;
                        }
                    }
                }
            });
        }
    }

    /**
     * Loads all Middleware modules
     *
     * @access protected
     * @return void
     */
    final protected static function _loadMiddleware()
    {
        $paths = self::GetModulePaths('/Modules/Middleware/');

        foreach ( $paths as $path ) {
            if ( is_dir($path) ) {
                foreach ( scandir($path) as $file ) {
                    if (substr($file, 0, 1) !== '.') {
                        include $path . $file;

                        $className = 'OSjs\\Modules\\Middleware\\' . pathinfo($file, PATHINFO_FILENAME);
                        self::$MIDDLEWARE[] = $className;
                    }
                }
            }
        }
    }

    /**
     * Loads API methods
     *
     * @access protected
     * @return void
     */
    final protected static function _loadAPI()
    {
        $paths = self::GetModulePaths('/Modules/API/');

        foreach ( $paths as $path ) {
            if ( is_dir($path) ) {
                foreach ( scandir($path) as $file ) {
                    if (substr($file, 0, 1) !== '.') {
                        include $path . $file;

                        $className = 'OSjs\\Modules\\API\\' . pathinfo($file, PATHINFO_FILENAME);
                        self::registerAPIMethods($className);
                    }
                }
            }
        }

        foreach ( self::getPackages() as $p => $pkg ) {
            if ($pkg['type'] == 'extension' ) {
                $main = Utils::getPackageMainFile($pkg);
                $path = DIR_ROOT . '/src/packages/' . $p . '/' . $main;
                if (file_exists($path)) {
                    $className = include $path;
                    if (is_string($className) && strlen($className) > 3) {
                        self::registerAPIMethods($className);
                    }
                }
            }
        }
    }

    /**
     * Loads VFS Transports
     *
     * @access protected
     * @return void
     */
    final protected static function _loadVFS()
    {
        $paths = self::GetModulePaths('/Modules/VFS/');

        foreach ( $paths as $path ) {
            if ( is_dir($path) ) {
                foreach ( scandir($path) as $file ) {
                    if (substr($file, 0, 1) !== '.') {
                        include $path . $file;

                        $className = 'OSjs\\Modules\\VFS\\' . pathinfo($file, PATHINFO_FILENAME);
                        self::$VFS[] = $className;
                    }
                }
            }
        }
    }

    /////////////////////////////////////////////////////////////////////////////
    // GETTERS
    /////////////////////////////////////////////////////////////////////////////

    /**
     * Get Loaded configuration
     *
     * @access public
     * @return object
     */
    final public static function GetConfig()
    {
        return self::$CONFIG;
    }

    /**
     * Get packages manifest
     *
     * @access public
     * @return object
     */
    final public static function GetPackages()
    {
        return self::$PACKAGES;
    }

    /**
     * Gets the VFS modules
     *
     * @access public
     * @return array
     */
    final public static function GetVFSModules()
    {
        return self::$VFS;
    }

    /**
     * Gets module directories
     *
     * @param string $sub The sub directory
     * @access public
     * @return array
     */
    final public static function GetModulePaths($sub) {
        return array_map(function($dir) use($sub) {
            return $dir . $sub;
        }, self::$BASEDIRS);
    }

    /////////////////////////////////////////////////////////////////////////////
    // APP
    /////////////////////////////////////////////////////////////////////////////

    /**
     * Exits the app
     *
     * @access public
     * @return void
     */
    final public static function end()
    {
        self::$done = true;
        exit;
    }

    /**
     * Shutdown handler
     *
     * @access public
     * @return void
     */
    final public static function shutdown()
    {
        if (!self::$done && !is_null($error = error_get_last())) {
            self::handle($error['type'], $error['message'], $error['file'], $error['line']);
        }
    }

    /**
     * Error handler
     *
     * @access public
     * @return void
     */
    final public static function handle($errno, $errstr, $errfile, $errline)
    {
        @header_remove();

        while ( ob_get_level() ) {
            ob_end_flush();
        }

        header('HTTP/1.0 500 Internal Server Error');
        header('Content-type: text/html');

        print '<html><head></head><body>';
        print '<h1>Error</h1><pre>';
        print print_r(
            [
            'message' => $errstr,
            'type' => $errno,
            'file' => $errfile,
            'line' => $errline
            ], true
        );
        print '</pre></body></html>';
        exit;
    }

    /**
     * Takes all public methods from a class and registeres them in
     * the API
     *
     * @param  string $className The class namespace path
     * @access public
     * @return void
     */
    final public static function registerAPIMethods($className)
    {
        foreach ( get_class_methods($className) as $methodName ) {
            if (substr($methodName, 0, 1) != '_') {
                self::$API[$methodName] = $className;
            }
        }
    }

    /**
     * Startup handler
     *
     * @access public
     * @return void
     */
    final public static function run()
    {
        register_shutdown_function([__CLASS__, 'shutdown']);
        set_error_handler([__CLASS__, 'handle']);

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

        if (!defined('DIR_DIST') ) {
            define('DIR_DIST', DIR_ROOT . '/dist');
        }

        session_start();

        $request = new Request();

        if ($request->isfs) {
            if ($request->method === 'GET') {
                $endpoint = 'read';
                $args = [
                    'path' => isset($request->data['path']) ? rawurldecode($request->data['path']) : null,
                    'download' => !empty($request->data['download']),
                    'raw' => true
                ];
            } else {
                $endpoint = $request->endpoint;
                $args = $request->data;
            }

            try {
                $valid = !in_array($endpoint, ['getRealPath']) && substr($endpoint, 0, 1) !== '_';
                $transport = $valid ? VFS::GetTransportFromPath($args) : null;

                if ($valid && $transport && is_callable($transport, $endpoint)) {
                    Authenticator::CheckPermissions(
                        $request, 'fs', [
                            'method' => $endpoint,
                            'arguments' => $args
                        ]
                    );

                    $result = call_user_func_array([$transport, $endpoint], [$request, $args]);
                    $request->respond()->json(
                        [
                            'error' => null,
                            'result' => $result
                        ]
                    );
                } else {
                    $request->respond()->json(
                        [
                            'error' => 'No such VFS method',
                            'result' => null
                        ], 500
                    );
                }
            } catch ( Exception $e ) {
                $request->respond()->json(
                    [
                        'error' => $e->getMessage(),
                        'result' => null
                    ]
                );
            }
        } else if ($request->isapi && $request->method === 'POST') {
            Authenticator::CheckPermissions($request, 'api', ['method' => $request->endpoint]);

            if (isset(self::$API[$request->endpoint])) {
                try {
                    $result = call_user_func_array([self::$API[$request->endpoint], $request->endpoint], [$request]);

                    $request->respond()->json(
                        [
                            'error' => null,
                            'result' => $result
                        ]
                    );
                } catch ( Exception $e ) {
                    $request->respond()->json(
                        [
                            'error' => $e->getMessage(),
                            'result' => null
                        ]
                    );
                }
            } else {
                $request->respond()->json(
                    [
                        'error' => 'No such API method',
                        'result' => null
                    ], 500
                );
            }
            return;
        } else {
            if (preg_match('/^\/?packages\/(.*\/.*)\/(.*)/', $request->url, $matches)) {
                if (!Authenticator::getInstance()->checkPermission($request, 'package', ['path' => $matches[1]]) ) {
                    $request->respond()->error('Permission denied!', 403);
                }
            }
            $request->respond()->file(DIR_DIST . $request->url, null, false, 'static');
        }

        foreach ( self::$MIDDLEWARE as $className ) {
            $result = $className::request($request);
            if (!$result) {
                break;
            }
        }

        $request->respond()->error('File not found', 404);
    }

}
