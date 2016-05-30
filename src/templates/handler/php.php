<?php
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

/**
 * This is your handler class
 *
 * Out-of-the-box support for permissions! You just have to make sure your
 * login method returns the right groups.
 *
 * @link http://os.js.org/doc/tutorials/create-handler.html
 */
class EXAMPLEAPIHandler
  extends APIHandler
{
  public static function login(Array $arguments) {
    $user = APIUser::login(Array(
      "id" => 0,
      "username" => "test",
      "name" => "EXAMPLE handler user",
      "groups" => Array("admin")
    ));
    return Array(false, $user->getData());
  }

  public static function logout(Array $arguments) {
    APIUser::logout();
    return Array(false, true);
  }

  public static function settings(Array $arguments) {
    return Array(false, true);
  }

}

API::AddHandler('login', Array('EXAMPLEAPIHandler', 'login'));
API::AddHandler('logout', Array('EXAMPLEAPIHandler', 'logout'));
API::AddHandler('logout', Array('EXAMPLEAPIHandler', 'settings'));
API::SetHandler('EXAMPLEAPIHandler');

?>
