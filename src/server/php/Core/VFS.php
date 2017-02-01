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
 * VFS Tool Class
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @access protected
 */
abstract class VFS
{

    /**
     * Make a VFS request for internal usage
     *
     * @param string $str The virtual path
     *
     * @access public
     * @return string  The real path
     */
    final public static function GetRealPath($str)
    {
        $transport = self::GetTransportFromPath($str);
        return $transport::getRealPath($str);
    }

    /**
     * Get Transport VFS module from given path
     *
     * @param mixed $args A string or a object from a a request (dest/src map)
     *
     * @access public
     * @return boolean
     */
    final public static function GetTransportFromPath($args)
    {
        $mounts = (array) (Instance::GetConfig()->vfs->mounts ?: []);

        if ($protocol = VFS::GetProtocol($args)) {
            $transport = 'filesystem';

            if (preg_match('/^(https?):/', $protocol)) {
                return 'OSjs\Modules\VFS\Http';
            }

            if (isset($mounts[$protocol])) {
                if (is_array($mounts[$protocol]) && isset($mounts[$protocol]['transport'])) {
                    $transport = $mounts[$protocol]['transport'];
                }
            }

            foreach ( Instance::GetVFSModules() as $className ) {
                if ($className::TRANSPORT === $transport) {
                    return $className;
                }
            }
        }

        return null;
    }

    /**
     * Flattens a path
     *
     * @return string    $path     A path
     *
     * @access public
     * @return string
     */
    public static function GetAbsoluteFilename($path)
    {
        $unipath = strlen($path) == 0 || $path{0} != '/';
        $path = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $path);
        $parts = array_filter(explode(DIRECTORY_SEPARATOR, $path), 'strlen');
        $absolutes = [];

        foreach ($parts as $part) {
            if ('.'  == $part) {
                continue;
            }

            if ('..' == $part) {
                array_pop($absolutes);
            } else {
                $absolutes[] = $part;
            }
        }

        $path = implode(DIRECTORY_SEPARATOR, $absolutes);
        return !$unipath ? '/'.$path : $path;
    }

    /**
     * Gets a protocol from path
     *
     * @param mixed $args A string or a object from a a request (dest/src map)
     *
     * @access public
     * @return string
     */
    public static function GetProtocol($args, $dest = false)
    {
        $path = is_string($args) ? $args : null;

        if (is_array($args)) {
            $checks = $dest ? ['dest'] : ['path', 'src', 'root'];
            foreach ( $checks as $c ) {
                if (isset($args[$c])) {
                    $path = $args[$c];
                    break;
                }
            }
        }

        $parts = explode(':', $path, 2);
        return $parts[0];
    }
}
