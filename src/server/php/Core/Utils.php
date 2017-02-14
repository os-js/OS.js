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
 * Collection of Utility function
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @access protected
 */
abstract class Utils
{
    /**
     * Gets MIME from path
     *
     * @param string $fname File path
     *
     * @access public
     * @return string
     */
    final public static function getMIME($fname)
    {
        if (function_exists('pathinfo')) {
            if ($ext = pathinfo($fname, PATHINFO_EXTENSION)) {
                $ext = strtolower($ext);
                $mime = (array)Instance::GetConfig()->mimes;
                if (isset($mime[".{$ext}"])) {
                    return $mime[".{$ext}"];
                }
            }
        }

        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $fname);
            finfo_close($finfo);
            return $mime;
        }

        return null;
    }

    /**
     * Remove a directory recursively
     *
     * @param string $dir Path to directory
     *
     * @return boolean
     */
    final public static function rmdir($dir)
    {
        if (!is_dir($dir) || is_link($dir)) {
            return unlink($dir);
        }

        foreach (scandir($dir) as $file) {
            if ($file == '.' || $file == '..') {
                continue;
            }

            if (!self::rmdir($dir . DIRECTORY_SEPARATOR . $file)) {
                chmod($dir . DIRECTORY_SEPARATOR . $file, 0777);
                if (!self::rmdir($dir . DIRECTORY_SEPARATOR . $file)) {
                    return false;
                }
            }
        }
        return rmdir($dir);
    }
}
