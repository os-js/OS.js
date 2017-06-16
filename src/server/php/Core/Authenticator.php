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

use OSjs\Core\Instance;
use OSjs\Core\Request;
use OSjs\Core\VFS;

use Exception;

/**
 * Authenticator Class
 *
 * This class is the basis for handling Authentication
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @access public
 */
class Authenticator
{
    protected static $INSTANCE;

    /**
     * Create a new instance
     */
    protected function __construct()
    {
    }

    /**
     * Performs a login
     *
     * @access public
     * @param  \OSjs\Core\Request $request The HTTP request
     * @throws \Exception On failure
     * @return mixed   Login result
     */
    public function login(Request $request)
    {
        throw new Exception('Invalid login handle');
    }

    /**
     * Performs a logout
     *
     * @access public
     * @param  \OSjs\Core\Request $request The HTTP request
     * @throws \Exception On failure
     * @return mixed   Login result
     */
    public function logout(Request $request)
    {
        foreach ( array_keys($_SESSION) as $k ) {
            unset($_SESSION[$k]);
        }

        return true;
        return parent::logout($request);
    }

    /**
     * Checks the permissions of the given type
     *
     * @access public
     * @param  \OSjs\Core\Request $request The HTTP request
     * @param  string             $type    The request type (name)
     * @param  array              $options Options
     *
     * @return void
     */
    public static function CheckPermissions(Request $request, $type, Array $options = [])
    {
        $authenticator = self::getInstance();

        if (!$authenticator->checkSession($request)) {
            $error = 'You have no OS.js Session, please log in!';
            if (($request->isfs && $request->endpoint !=  'read') || $request->isapi) {
                $request->respond()->json([
                    'error' => $error
                ], 403);
            } else {
                $request->respond()->error($error, 403);
            }
        }

        if (!$authenticator->checkPermission($request, $type, $options) ) {
            $error = 'Access denied!';
            if (($request->isfs && $request->endpoint !=  'read') || $request->isapi) {
                $request->respond()->json([
                    'error' => $error
                ], 403);
            } else {
                $request->respond()->error($error, 403);
            }
        }
    }

    /**
     * Gets the current configuration from settings
     *
     * @access public
     * @return object The configuration tree
     */
    final public function getConfig()
    {
        $name = strtolower(str_replace('OSjs\\Modules\\Auth\\', '', get_class($this)));
        return Instance::getConfig()->modules->auth->$name;
    }

    /**
     * Checks the current session
     *
     * @param  \OSjs\Core\Request $request The HTTP request
     * @access public
     * @return boolean
     */
    public function checkSession(Request $request)
    {
        if ($request->isapi && in_array($request->endpoint, ['login'])) {
            return true;
        }
        return isset($_SESSION['username']);
    }

    /**
     * Checks a VFS permission
     *
     * @param array   $checks  Array of permission checks
     * @param object  $config  The configuration tree
     * @param array   $options A set of options
     * @param boolean $dest    If this is a destination and not a source
     *
     * @access protected
     * @return boolean
     */
    protected function _checkFsPermission(Array &$checks, $config, $options, $dest = false)
    {
        if ($dest && empty($options['arguments']['dest'])) {
            return true;
        }

        $proto = VFS::GetProtocol($options['arguments'], $dest);
        if ($fsgroups = (array)$config->vfs->groups) {
            if (isset($fsgroups[$proto]) ) {
                $g = $fsgroups[$proto];

                foreach ( is_array($g) ? $g : [$g] as $i ) {
                    $checks[] = $i;
                }
            }
        }

        $mounts = (array) $config->vfs->mounts;
        if (isset($mounts[$proto]) && is_array($mounts[$proto]) && isset($mounts[$proto]['ro'])) {
            if ($dest ) {
                $map = ['upload', 'write', 'delete', 'copy', 'move', 'mkdir'];
            } else {
                $map = ['upload', 'write', 'delete', 'mkdir'];
            }

            if ($mounts[$proto]['ro'] && in_array($request->endpoint, $map)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks a permission
     *
     * @param \OSjs\Core\Request $request The HTTP request
     * @param string             $type    Permission type (name)
     * @param array              $options Options
     *
     * @access public
     * @return boolean
     */
    public function checkPermission(Request $request, $type, Array $options = [])
    {
        if ($type === 'package') {
            $blacklist = Authenticator::getInstance()->getBlacklist($request);
            return !in_array($options['path'], $blacklist);
        }

        $checks = [];
        $config = Instance::GetConfig();

        if ($type === 'fs') {
            $checks = ['fs'];

            if (!$this->_checkFsPermission($checks, $config, $options)
                || !$this->_checkFsPermission($checks, $config, $options, true)
            ) {
                return false;
            }
        } else if ($type === 'api') {
            $apigroups = (array)$config->api->groups;
            if (isset($apigroups[$request->endpoint])) {
                $g = $apigroups[$request->endpoint];
                $checks = is_array($g) ? $g : [$g];
            }
        }

        if ($checks) {
            $groups = Authenticator::getInstance()->getGroups($request);
            if (in_array('admin', $groups) ) {
                return true;
            } else if (sizeof(array_diff($groups, $checks))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Gets user package blacklist
     *
     * @access public
     * @param  \OSjs\Core\Request $request The HTTP request
     * @throws \Exception On failure
     * @return array
     */
    public function getBlacklist(Request $request)
    {
        return [];
    }

    /**
     * Get (or create) a new instance of the Authenticator
     *
     * @access public
     * @return \OSjs\Core\Authenticator But with a top-class instance
     */
    public static function getInstance()
    {
        if (!self::$INSTANCE ) {
            $name = Instance::GetConfig()->authenticator;
            $name = 'OSjs\\Modules\\Auth\\' . ucfirst($name);
            self::$INSTANCE = new $name();
        }
        return self::$INSTANCE;
    }
}
