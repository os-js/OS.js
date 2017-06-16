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

/**
 * Storage Class
 *
 * This class is the basis for handling user storage
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @access protected
 */
abstract class Storage
{
    protected static $INSTANCE;

    /**
     * Create a new instance
     */
    protected function __construct()
    {
    }

    /**
     * Gets user settings
     *
     * @access public
     * @param  \OSjs\Core\Request $request The HTTP request
     * @throws \Exception On failure
     * @return array Settings tree
     */
    public function getSettings(Request $request)
    {
        return [];
    }

    /**
     * Sets user settings
     *
     * @access public
     * @param  \OSjs\Core\Request $request The HTTP request
     * @throws \Exception On failure
     * @return boolean
     */
    public function setSettings(Request $request)
    {
        return true;
    }

    /**
     * Gets module configuration
     *
     * @access public
     * @return object
     */
    final public function getConfig()
    {
        $name = strtolower(str_replace('OSjs\\Modules\\Storage\\', '', get_class($this)));
        return Instance::getConfig()->modules->auth->$name;
    }

    /**
     * Get (or create) a new instance of the Storage
     *
     * @access public
     * @return \OSjs\Core\Storage But with a top-class instance
     */
    public static function getInstance()
    {
        if (!self::$INSTANCE) {
            $name = Instance::GetConfig()->storage;
            $name = 'OSjs\\Modules\\Storage\\' . ucfirst($name);
            self::$INSTANCE = new $name();
        }
        return self::$INSTANCE;
    }
}
