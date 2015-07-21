<?php
/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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
 * OS.js Handler Instance
 */
abstract class APIHandler
{
  /**
   * This function will check for privileges
   */
  public static function checkPrivilege($requires = null) {
    if ( !($user = APIUser::get()) ) {
      throw new Exception("You have no OS.js Session, please log in!");
    }

    if ( is_bool($requires) ) return;

    if ( $requires === null ) {
      $requires = Array();
    } else {
      if ( !is_array($requires) ) {
        $requires = Array($requires);
      }
    }

    $groups = $user->getGroups();
    if ( !in_array(APIUser::GROUP_ADMIN, $groups) ) {
      foreach ( $requires as $req ) {
        if ( !in_array($req, $groups) ) {
          throw new Exception("You are not allowed to use this API function!");
        }
      }
    }
  }
}

/**
 * OS.js API User
 */
class APIUser
{
  const GROUP_VFS = 'vfs';
  const GROUP_API = 'api';
  const GROUP_APPLICATION = 'application';
  const GROUP_CURL = 'curl';
  const GROUP_UPLOAD = 'upload';
  const GROUP_ADMIN = 'admin';

  protected static $_instance;

  protected $id       = -1;
  protected $username = "";
  protected $name     = "";
  protected $groups   = Array();

  protected function __construct(Array $args) {
    $this->id = $args["id"];
    $this->username = $args["username"];
    $this->name = $args["name"];
    $this->groups = $args["groups"];

    $_SESSION["user"] = $this->getData();
  }

  public static function restore() {
    if ( isset($_SESSION["user"]) && ($data = $_SESSION["user"]) ) {
      self::login($data);
    }
  }

  public static function login(Array $args) {
    self::logout();
    return (self::$_instance = new self($args));
  }

  public static function logout() {
    self::$_instance = null;
    unset($_SESSION['user']);
  }

  public static function get() {
    return self::$_instance;
  }

  public function getId() {
    return $this->id;
  }

  public function getUsername() {
    return $this->username;
  }

  public function getName() {
    return $this->name;
  }

  public function getGroups() {
    return $this->groups;
  }

  public function getData() {
    return Array(
      "id" => $this->id,
      "username" => $this->username,
      "name" => $this->name,
      "groups" => $this->groups
    );
  }
}

/**
 * HTTP Request Class
 */
class APIRequest
{
  public $method = "GET";
  public $data   = null;
  public $uri    = "";

  protected function __construct() {
    $this->method = empty($_SERVER['REQUEST_METHOD']) ? 'GET' : $_SERVER['REQUEST_METHOD'];
    $this->uri    = isset($_SERVER["REQUEST_URI"]) ? $_SERVER["REQUEST_URI"] : "/";
    $this->data   = $this->method === 'POST' ? file_get_contents("php://input") : (empty($_SERVER['REQUEST_URI']) ? '' : $this->uri);
  }

  /**
   * Public method for calling the API
   */
  public static function call() {
    $request = new APIRequest();

    if ( preg_match('/API$/', $request->uri) ) {
      $response = API::CoreAPI($request);
    } else if ( preg_match('/FS$/', $request->uri) ) {
      $response = API::FilePOST($request);
    } else if ( preg_match('/\/(([^\/]+\/)+)?(FS)(.*)/', $request->uri) ) {
      $response = API::FileGET($request);
    } else {
      $response = null;
    }

    return $response;
  }
}

/**
 * HTTP Response Class
 */
class APIResponse
{
  public $data      = null;
  public $code      = 200;
  public $error     = null;
  public $headers   = Array();
  public $isJSON    = false;

  public function __construct($json, $data, $error, $code = 0, Array $headers = null) {
    $this->isJSON = (bool) $json;
    $this->data = $data;

    if ( $error ) {
      $this->error = $error;
    }

    if ( $code > 0 ) {
      $this->code = $code;
    }

    if ( $headers ) {
      $this->headers = $headers;
    }
  }

  public static function ErrorHandler() {
    $response = null;

    if ( !is_null($e = error_get_last()) ) {
      $type = 'UNKNOWN';
      switch ((int)$e['type']) {
        case E_ERROR: // 1
          $type = 'E_ERROR';
        break;
        case E_WARNING: // 2
          $type = 'E_WARNING';
        break;
        case E_PARSE: // 4
          $type = 'E_PARSE';
        break;
        case E_NOTICE: // 8
          $type = 'E_NOTICE';
        break;
        case E_CORE_ERROR: // 16
          $type = 'E_CORE_ERROR';
        break;
        case E_CORE_WARNING: // 32
          $type = 'E_CORE_WARNING';
        break;
        case E_CORE_ERROR: // 64
          $type = 'E_COMPILE_ERROR';
        break;
        case E_CORE_WARNING: // 128
          $type = 'E_COMPILE_WARNING';
        break;
        case E_USER_ERROR: // 256
          $type = 'E_USER_ERROR';
        break;
        case E_USER_WARNING: // 512
          $type = 'E_USER_WARNING';
        break;
        case E_USER_NOTICE: // 1024
          $type = 'E_USER_NOTICE';
        break;
        case E_STRICT: // 2048
          $type = 'E_STRICT';
        break;
        case E_RECOVERABLE_ERROR: // 4096
          $type = 'E_RECOVERABLE_ERROR';
        break;
        case E_DEPRECATED: // 8192
          $type = 'E_DEPRECATED';
        break;
        case E_USER_DEPRECATED: // 16384
          $type = 'E_USER_DEPRECATED';
        break;
      }

      if ( !ERRHANDLER && !in_array($type, Array('E_ERROR', 'E_PARSE', 'E_CORE_ERROR', 'E_RECOVERABLE_ERROR')) ) {
        return;
      }

      if ( ob_get_level() ) ob_end_clean();

      $error = $e["message"];
      if ( SHOWERRORS ) {
        $error = implode("\n", Array($e['message'], "Type: {$type}", "Line: {$e['line']}", "File: {$e['file']}"));
      }
      $response = new APIResponse(false, false, $error, 500);
    }

    if ( $response ) {
      $response->output();
    }
  }

  public function output() {
    $headers = $this->headers;
    if ( $this->code == 500 ) {
      $headers[] = "HTTP/1.0 500 Internal Server Error";
    } else if ( $this->code == 404 ) {
      $headers[] = "HTTP/1.0 404 Not Found";
    }

    if ( $this->isJSON ) {
      $headers[] = "Content-type: application/json";
    }

    foreach ( $headers as $h ) {
      header($h);
    }

    if ( $this->isJSON ) {
      $result = Array("result" => false, "error" => null);
      if ( $this->error ) {
        $result["error"] = $this->error;
      } else {
        $result["result"] = $this->data;
      }
      $result = json_encode($result);
    } else {
      if ( $this->error ) {
        $result = $this->error;
      } else {
        $result = $this->data;
      }
    }

    print $result;
  }
}

/**
 * OS.js API Call Wrapper Class
 */
class API
{

  protected static $Methods = Array();
  public static $Handler = null;

  /**
   * File Download Request
   */
  public static function FileGET(APIRequest $req) {
    $result   = false;
    $error    = false;
    $headers  = Array();
    $code     = 0;

    $url = preg_replace('/\/(([^\/]+\/)+)?(FS)/', "", urldecode($req->data));

    call_user_func_array(Array(API::$Handler, 'checkPrivilege'), Array(APIUser::GROUP_VFS));

    try {
      if ( $url ) {
        list($dirname, $req->uri, $protocol, $file) = getRealPath($url);
        if ( file_exists($file) ) {
          session_write_close();
          if ( $data = FS::read($url, Array("raw" => true)) ) {
            list($mime, $etag, $length, $result) = $data;

            $headers[] = "Etag: {$etag}";
            $headers[] = "Content-type: {$mime}; charset=utf-8";
            $headers[] = "Content-length: {$length}";
          } else {
            $code = 500;
            $error = "File read error";
          }
        } else {
          $code = 404;
          $error = "File not found";
        }
      }
    } catch ( Exception $e ) {
      $error = $e->getMessage();
    }

    return new APIResponse(false, $result, $error, $code, $headers);
  }

  /**
   * File Upload Requests
   */
  public static function FilePOST(APIRequest $req) {
    $result = false;
    $error  = false;

    // FIXME: Frontend does not show error
    call_user_func_array(Array(API::$Handler, 'checkPrivilege'), Array(APIUser::GROUP_UPLOAD));

    try {
      if ( isset($_POST['path']) && isset($_FILES['upload']) ) {
        if ( FS::upload($_POST['path'], $_FILES['upload']) ) {
          $result = true;
        } else {
          $error = "File was not uploaded";
        }
      }
    } catch ( Exception $e ) {
      $error = "File upload failed: {$e->getMessage()}";
    }

    return new APIResponse(false, $result, $error);
  }

  /**
   * Core API Requests
   */
  public static function CoreAPI(APIRequest $req) {
    $data = json_decode($req->data, true);
    $error = false;
    $result = false;

    if ( empty($data) ) {
      $error = "No call given";
    } else {
      if ( empty($data['method']) ) {
        $error = "No call data given";
      } else {
        $method = $data['method'];
        $arguments = empty($data['arguments']) ? Array() : $data['arguments'];

        try {

          if ( isset(self::$Methods[$method]["method"]) ) {
            if ( !empty(self::$Methods[$method]["privileges"]) && ($p = self::$Methods[$method]["privileges"]) ) {
              call_user_func_array(Array(API::$Handler, 'checkPrivilege'), Array($p));
            }

            list($error, $result) = call_user_func_array(self::$Methods[$method]["method"], Array($arguments));
          } else {
            $error = "No such API method: {$method}";
          }
        } catch ( Exception $e ) {
          $error = "API Error: {$e->getMessage()}";
        }
      }
    }
    return new APIResponse(true, $result, $error);
  }

  public static function SetHandler($name) {
    API::$Handler = $name;
  }

  public static function AddHandler($name, $cb, $privileges = null) {
    self::$Methods[$name] = Array(
      "method" => $cb,
      "privileges" => $privileges
    );
  }

}

class CoreAPIHandler
{
  public static function application(Array $arguments) {
    $error = null;
    $result = null;

    try {
      call_user_func_array(Array(API::$Handler, 'checkPrivilege'), Array(APIUser::GROUP_APPLICATION));
    } catch ( Exception $e ) {
      $error = $e->getMessage();
    }

    if ( !$error ) {
      $path = empty($arguments['path'])        ? null     : $arguments['path'];
      $an   = empty($arguments['application']) ? null     : $arguments['application'];
      $am   = empty($arguments['method'])      ? null     : $arguments['method'];
      $aa   = empty($arguments['arguments'])   ? Array()  : $arguments['arguments'];

      $aroot = sprintf("%s/%s", REPODIR, $path);
      $apath = sprintf("%s/%s", $aroot, "api.php");

      if ( !file_exists($apath) ) {
        $error = "No such application or API file not available ({$an})!";
      } else {
        require $apath;
        if ( !class_exists($an) || !method_exists($an, 'call') ) {
          $error = "Application API missing!";
        } else {
          try {
            $result = $an::call($am, $aa);//call_user_func_array(Array($an, 'call'), $aa);
          } catch ( Exception $e ) {
            $error = "Application API exception: {$e->getMessage()}";
          }
        }
      }
    }

    return Array($error, $result);
  }

  public static function fs(Array $arguments) {
    $error = null;
    $result = null;

    try {
      call_user_func_array(Array(API::$Handler, 'checkPrivilege'), Array(APIUser::GROUP_VFS));
    } catch ( Exception $e ) {
      $error = $e->getMessage();
    }

    if ( !$error ) {
      $m = $arguments['method'];
      $a = empty($arguments['arguments']) ? Array() : $arguments['arguments'];

      if ( !method_exists('FS', $m) ) {
        $error = "Invalid FS operation: {$m}";
      } else {
        if ( !$a ) {
          $error = "Supply argument for FS operaion: {$m}";
        } else {
          try {
            $result = call_user_func_array(Array("FS", $m), $a);
          } catch ( Exception $e ) {
            $error = "FS operaion error: {$e->getMessage()}";
          }
        }
      }
    }
    return Array($error, $result);
  }

  public static function curl(Array $arguments) {
    $error = null;
    $result = null;

    if ( !function_exists("curl_init") ) {
      throw new Exception("cURL is not supported on this platform");
    }

    try {
      call_user_func_array(Array(API::$Handler, 'checkPrivilege'), Array(APIUser::GROUP_CURL));
    } catch ( Exception $e ) {
      $error = $e->getMessage();
    }

    if ( !$error ) {
      $url      = empty($arguments['url'])     ? null    : $arguments['url'];
      $method   = empty($arguments['method'])  ? "GET"   : strtoupper($arguments['method']);
      $query    = empty($arguments['query'])   ? Array() : $arguments['query'];
      $timeout  = empty($arguments['timeout']) ? 0       : (int) $arguments['timeout'];
      $binary   = empty($arguments['binary'])  ? false   : $arguments['binary'] === true;
      $mime     = empty($arguments['mime'])    ? null    : $arguments['mime'];

      if ( !$mime && $binary ) {
        $mime = "application/octet-stream";
      }

      if ( !$url ) throw new Exception("cURL expects an 'url'");

      $data = "";
      if ( $method === "POST" ) {
        if ( $query ) {
          if ( is_array($query) ) {
            $data = http_build_query($query);
          } else if ( is_string($query) ) {
            $data = $query;
          }
        }
      }

      if ( $ch = curl_init() ) {
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        if ( $timeout ) {
          curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        }
        if ( $data ) {
          curl_setopt($ch, CURLOPT_POST, true);
          curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        }

        $response = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ( $binary && $response ) {
          $response = "data:{$mime};base64," . base64_encode($response);
        }

        $result = Array(
          "httpCode" => $httpcode,
          "body"     => $response
        );

        curl_close($ch);
      } else {
        $error = "Failed to initialize cURL";
      }

    }
    return Array($error, $result);
  }
}

API::AddHandler('application', Array('CoreAPIHandler', 'application'));
API::AddHandler('fs', Array('CoreAPIHandler', 'fs'));
API::AddHandler('curl', Array('CoreAPIHandler', 'curl'));

?>
