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

/**
 * HTTP Response Creator
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @access public
 */
class Responder
{
    public static $done = false;

    /**
     * Respond with given content, code and headers
     *
     * @param mixed $data    Response body
     * @param int   $code    Response code
     * @param array $headers Response headers
     *
     * @access public
     * @return void
     */
    public function raw($data, $code, $headers = [])
    {
        self::$done = true;

        if ($code == 500) {
            $headers[] = 'HTTP/1.0 500 Internal Server Error';
        } else if ($code == 404) {
            $headers[] = 'HTTP/1.0 404 Not Found';
        }

        foreach ( $headers as $k => $v) {
            if (is_numeric($k) || empty($k)) {
                header($v);
            } else {
                header(sprintf('%s: %s', $k, $v));
            }
        }

        file_put_contents('php://output', $data);
        Instance::end();
    }

    /**
     * Respond as JSON
     *
     * @param mixed $data JSON Data
     * @param int   $code Optional HTTP response code
     *
     * @access public
     * @return void
     */
    public function json($data, $code = null)
    {
        return $this->raw(
            json_encode($data), $code ?: 200, [
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Content-Type' => 'application/json',
            'Pragma' => 'no-cache',
            'Expires' => 0
            ]
        );
    }

    /**
     * Respond with buffered file output
     *
     * @param String  $path     Path to file
     * @param String  $mime     MIME type
     * @param boolean $error    Trigger error on failure
     * @param String  $cached   Cache identifier
     * @param boolean $download Downloads the file
     *
     * @access public
     * @return void
     */
    public function file($path, $mime = null, $error = true, $cached = false, $download = false)
    {
        session_write_close();

        if (!file_exists($path) || is_dir($path)) {
            if ($error) {
                $this->error('File not found', 404);
            }
            return;
        }
        if ($handle = fopen($path, "rb")) {
            $chunkSize = 1204*1024;
            $size = filesize($path);

            header("Content-type: {$mime}");

            if (!$download && isset($_SERVER['HTTP_RANGE']) && ($range = $_SERVER['HTTP_RANGE'])) {
                $positions = explode('-', preg_replace('/bytes=/', '', $range));
                $start = (int) $positions[0];
                $end = isset($positions[1]) && $positions[1] ? (int) $positions[1] : $size - 1;
                $length = ($end - $start) + 1;

                header('HTTP/1.0 206 Partial Content');
                header("Content-Length: {$length}");
                header("Content-Range: bytes {$start}-{$end}/{$size}");
                header('Accept-Ranges: bytes');

                fseek($handle, $start);
                while ( true ) {
                    if (ftell($handle) >= $end) {
                        break;
                    }
                    print fread($handle, $chunkSize);
                    ob_flush();
                    flush();
                }
            } else {
                if ($cached && !getenv('OSJS_DEBUG')) {
                    $cacheSettings = Instance::GetConfig()->http->cache;
                    if (isset($cacheSettings->$cached)) {
                        foreach ( $cacheSettings->$cached as $k => $v) {
                            header("$k: $v");
                        }
                    }

                    $etag = md5(serialize(fstat($handle)));
                    header("Etag: {$etag}");
                }

                if ( $download ) {
                    header('Content-Disposition: attachment; filename=' . basename($path));
                }

                header("Content-length: {$size}");
                while ( !feof($handle) ) {
                    print fread($handle, $chunkSize);
                    ob_flush();
                    flush();
                }
            }

            fclose($handle);
            exit;
        }
    }

    /**
     * Responds with a buffered remote file (like Http)
     *
     * @param String  $path   Path to file
     * @param boolean $base64 Respond with base-encoded data
     *
     * @access public
     * @return void
     */
    public function remote($path, $base64 = false)
    {
        if ($base64) {
            $mime = 'application/octet-stream';
            if (function_exists('curl_init') && ($ch = curl_init())) {
                curl_setopt($ch, CURLOPT_URL, $path);
                curl_setopt($ch, CURLOPT_HEADER, 1);
                curl_setopt($ch, CURLOPT_NOBODY, 1);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                if ($test = curl_getinfo($ch, CURLINFO_CONTENT_TYPE)) {
                    $parts = explode(';', $test);
                    $mime = $parts[0];
                }
            }
            print "data:{$mime};base64,";
        }

        if (($handle = fopen($path, 'rb')) !== false) {
            while ( !feof($handle) ) {
                if ($base64) {
                    $plain = fread($handle, 57 * 143);
                    $encoded = base64_encode($plain);
                    print chunk_split($encoded, 76, '');
                } else {
                    print fread($handle, 1204*1024);
                }

                ob_flush();
                flush();
            }

            fclose($handle);
        } else {
            $this->raw('File not found', 404);
        }
    }

    /**
     * Respond with error
     *
     * @param String $message Error message
     * @param int    $code    HTTP Response code
     *
     * @access public
     * @return void
     */
    public function error($message, $code = 500)
    {
        /*
        if ( php_sapi_name() === "cli-server") {
        return false;
        }
         */
        return $this->raw($message, $code);
    }
}
