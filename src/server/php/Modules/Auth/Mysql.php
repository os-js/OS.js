<?php namespace OSjs\Modules\Auth;

/*!
 * OS.js - JavaScript Operating System
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
use OSjs\Core\Authenticator;

use PDO;
use Exception;

class Mysql extends Authenticator
{
  protected static $pdo;

  final protected function _query($q, Array $a = []) {
    if ( !self::$pdo ) {
      $config = $this->getConfig();
      self::$pdo = new PDO(sprintf('mysql:host=%s;dbname=%s', $config->host, $config->database), $config->user, $config->password);
    }

    $stmt = self::$pdo->prepare($q);
    $stmt->execute($a);
    return $stmt;
  }


  final public function login(Request $request) {
    if ( $row = self::_query('SELECT * FROM `users` WHERE `username` = ? LIMIT 1;', [$request->data['username']])->fetch() ) {
      if ( password_verify($request->data['password'], str_replace('$2y$', '$2a$', $row['password'])) ) {
        return [
          'id'  => $row['id'],
          'username' => $row['username'],
          'name' => $row['name'],
        ];
      }
    }
    throw new Exception('Invalid login credentials!');
  }

  final public function logout(Request $request) {
    return parent::logout($request);
  }

  final public function checkSession(Request $request) {
    return parent::checkSession($request);
  }

  final public function checkPermission(Request $request, $type, Array $options = []) {
    return parent::checkPermission($request, $type, $options);
  }

}

