<?php namespace OSjs\Modules\API;
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
use OSjs\Core\Authenticator;
use OSjs\Core\Request;
use OSjs\Core\Storage;

use Exception;

/**
 * Core API methods
 */
abstract class Core
{
    public static function login(Request $request)
    {
        $authenticator = Authenticator::getInstance();
        $userData = $authenticator->login($request);

        $_SESSION['username'] = $userData['username']; // Set before storage queries!"

        $storage = Storage::getInstance();
        $userSettings = $storage->getSettings($request);
        $blacklist = $storage->getBlacklist($request);

        if ( !isset($userData['groups']) ) {
            $groups = $storage->getGroups($request);
            $userData['groups'] = $groups;
        }

        return [
            'userData' => $userData,
            'userSettings' => $userSettings,
            'blacklistedPackages' => $blacklist
        ];
    }

    public static function logout(Request $request)
    {
        return true;
    }

    public static function settings(Request $request)
    {
        return Storage::getInstance()->setSettings($request);
    }

    public static function users(Request $request)
    {
        throw new Exception('Not available');
    }

    public static function application(Request $request)
    {
        $path = empty($request->data['path']) ? null : $request->data['path'];
        $an = empty($request->data['application']) ? null : $request->data['application'];
        $am = empty($request->data['method']) ? null : $request->data['method'];
        $aa = empty($request->data['args']) ? Array() : $request->data['args'];

        $apath = DIR_PACKAGES . '/' . $path . '/api.php';

        if (!file_exists($apath)) {
            throw new Exception("No such application or API file not available ({$an})!");
        } else {
            $className = include $apath;
            if (is_string($className) && strlen($className) > 3) {
                if (method_exists($className, $am)) {
                    return $className::$am($request, $aa);
                } else {
                    throw new Exception('Application API missing!');
                }
            } else {
                if (!class_exists($an) || !method_exists($an, 'call')) {
                    throw new Exception('Application API missing!');
                } else {
                    return $an::call($am, $aa);
                }
            }
        }

        return null;
    }

    public static function packages(Request $request)
    {
        if ($request->data['command'] === 'list') {
            $request->respond()->json(
                [
                'error' => null,
                'result' => Instance::GetPackages()
                ]
            );
        }

        throw new Exception('Not available');
    }

    public static function curl(Request $request)
    {
        $url = empty($request->data['url']) ? null : $request->data['url'];
        $method = empty($request->data['method']) ? 'GET' : strtoupper($request->data['method']);
        $query = empty($request->data['query']) ? Array() : $request->data['query'];
        $timeout = empty($request->data['timeout']) ? 0 : (int) $request->data['timeout'];
        $binary = empty($request->data['binary']) ? false : $request->data['binary'] === true;
        $mime = empty($request->data['mime']) ? null : $request->data['mime'];

        if (!$mime && $binary) {
            $mime = 'application/octet-stream';
        }

        if (!function_exists('curl_init')) {
            throw new Exception('cURL is not supported on this platform');
        } else if (!$url) {
            throw new Exception('cURL expects an url');
        }

        $data = '';
        if ($method === 'POST') {
            if ($query) {
                if (is_array($query)) {
                    $data = http_build_query($query);
                } else if (is_string($query)) {
                    $data = $query;
                }
            }
        }

        if (!($ch = curl_init())) {
            throw new Exception('Failed to initialize cURL');
        }

        $headers = [];

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

        curl_setopt($ch, CURLOPT_HEADERFUNCTION,
          function($curl, $header) use(&$headers)
        {
            $len = strlen($header);
            $header = explode(':', $header, 2);

            if (count($header) < 2) {
                return $len;
            }

            $headers[strtolower(trim($header[0]))] = trim($header[1]);

            return $len;
          }
        );


        if ($timeout) {
            curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        }
        if ($data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        }

        $response = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($binary && $response) {
            $response = "data:{$mime};base64," . base64_encode($response);
        }

        $result = Array(
            "httpCode" => $httpcode,
            "headers"  => $headers,
            "body"     => $response
        );

        return $result;
    }
}

