/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * PAM Handler: Login screen and session/settings handling via database
 * PLEASE NOTE THAT THIS AN EXAMPLE ONLY, AND SHOUD BE MODIFIED BEFORE USAGE
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

//
// See doc/handler-pam.txt
//

(function(API, Utils, VFS) {
  'use strict';

  window.OSjs  = window.OSjs || {};
  OSjs.Core    = OSjs.Core   || {};

  /////////////////////////////////////////////////////////////////////////////
  // HANDLER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @extends OSjs.Core._Handler
   * @class
   */
  function PAMHandler() {
    OSjs.Core._Handler.apply(this, arguments);
  }

  PAMHandler.prototype = Object.create(OSjs.Core._Handler.prototype);
  PAMHandler.constructor = OSjs.Core._Handler;

  /**
   * Override default init() method
   */
  PAMHandler.prototype.init = function(callback) {
    var self = this;
    return OSjs.Core._Handler.prototype.init.call(this, function() {
      self.initLoginScreen(callback);
    });
  };

  /**
   * PAM login api call
   */
  PAMHandler.prototype.login = function(username, password, callback) {
    return OSjs.Core._Handler.prototype.login.apply(this, arguments);
  };

  /**
   * PAM logout api call
   */
  PAMHandler.prototype.logout = function(save, callback) {
    return OSjs.Core._Handler.prototype.logout.apply(this, arguments);
  };

  /**
   * PAM settings api call
   */
  PAMHandler.prototype.saveSettings = function(pool, storage, callback) {
    return OSjs.Core._Handler.prototype.saveSettings.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Handler = PAMHandler;

})(OSjs.API, OSjs.Utils, OSjs.VFS);
