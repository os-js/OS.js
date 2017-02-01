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

use OSjs\Core\Responder;

/**
 * HTTP Request containers
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @access public
 */
class Request
{
    protected $method = 'GET';
    protected $url = '/';
    protected $data = [];
    protected $files = [];
    protected $isfs = false;
    protected $isapi = false;
    protected $endpoint = '';

    /**
     * Constructor
     */
    public function __construct()
    {
        $requestURI = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
        $phpSelf = isset($_SERVER['PHP_SELF']) ? $_SERVER['PHP_SELF'] : '/';

        header('Content-type: text/plain');

        if (substr($phpSelf, -7) == 'api.php') {
            $requestURI = substr($requestURI, strlen(dirname($phpSelf)), strlen($requestURI)) ?: '/';
        }

        $this->method = empty($_SERVER['REQUEST_METHOD']) ? 'GET' : $_SERVER['REQUEST_METHOD'];
        $this->url = $requestURI;

        if ($this->method === 'POST') {
            if (strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
                $this->data = json_decode(file_get_contents('php://input'), true);
            } else {
                $this->data = $_POST;
            }
            $this->files = $_FILES;
        } else {
            if ($this->url === '/') {
                $this->url = '/index.html';
            }

            $this->data = $_GET;
        }

        if (preg_match('/^\/?FS/', $this->url)) {
            $this->isfs = true;
        } else if (preg_match('/^\/?API/', $this->url)) {
            $this->isapi = true;
        }

        if (preg_match('/(FS|API)\/(.*)/', $this->url, $matches)) {
            if (sizeof($matches) > 1) {
                $this->endpoint = $matches[2];
            }
        }
    }

    /**
     * Magical getter
     *
     * @access public
     * @return mixed
     */
    public function __get($key)
    {
        if (isset($this->$key)) {
            return $this->$key;
        }
        return null;
    }

    /**
     * Make a HTTP Respose object
     *
     * @access public
     * @return \OSjs\Core\Responder
     */
    public function respond()
    {
        return new Responder($this);
    }
}
