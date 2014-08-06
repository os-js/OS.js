/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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
(function() {
  "use strict";

  window.OSjs   = window.OSjs   || {};
  OSjs.Handlers = OSjs.Handlers || {};

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT HANDLING CODE
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Storage
   */
  var DefaultStorage = function() {
    if ( !OSjs.Compability.localStorage ) {
      throw "Your browser does not support localStorage :(";
    }
    this.prefix = 'OS.js-v2/DemoHandler/';
  };

  DefaultStorage.prototype.set = function(o) {
    console.debug("DefaultStorage::set()", o);
    for ( var i in o ) {
      if ( o.hasOwnProperty(i) ) {
        localStorage.setItem(this.prefix + i, JSON.stringify(o[i]));
      }
    }
  };

  DefaultStorage.prototype.get = function() {
    var ret = {};
    for ( var i in localStorage ) {
      if ( localStorage.hasOwnProperty(i) ) {
        if ( i.indexOf(this.prefix) === 0 ) {
          ret[i.replace(this.prefix, '')] = JSON.parse(localStorage[i]) || null;
        }
      }
    }
    return ret;
  };

  /**
   * Demo handler - Uses localStorage for sessions, for testing purposes
   */
  var DemoHandler = function() {

    OSjs.Handlers.Default.apply(this, arguments);

    this.storage = new DefaultStorage();
  };
  DemoHandler.prototype = Object.create(OSjs.Handlers.Default.prototype);

  /**
   * Demo initialization
   */
  DemoHandler.prototype.init = function(callback) {
    console.info("OSjs::DemoHandler::init()");

    var self = this;
    var _finished = function(locale) {
      OSjs.Locale.setLocale(locale || self.config.Core.Locale);
      if ( callback ) {
        callback();
      }
    };

    // Use the 'demo' user
    this.login('demo', 'demo', function(userData) {
      userData = userData || {};
      self.userData = userData;                 // Set our user session info
      self.settings.load(self.storage.get());   // Load previously used settings

      // Ensure we get the user-selected locale configured from WM
      self.getUserSettings('Core', function(result) {
        var locale = null;
        if ( result ) {
          if ( (typeof result.Locale !== 'undefined') && result.Locale ) {
            locale = result.Locale;
          }
        }
        _finished(locale);
      });
    });
  };

  /**
   * Demo login. Just an example
   */
  DemoHandler.prototype.login = function(username, password, callback) {
    console.info("OSjs::DemoHandler::login()", username);
    if ( username === 'demo' && password === 'demo' ) {
      var userData = {
        id:         1,
        username:   'demo',
        name:       'Demo User',
        groups:     ['demo']
      };

      callback.call(this, userData);
      return;
    }
    callback.call(this, false, "Invalid login");
  };

  DemoHandler.prototype.saveSettings = function(callback) {
    var settings = this.settings.get();
    console.debug('OSjs::Handlers::DemoHandler::saveSettings()', settings);
    this.storage.set(settings);
    callback.call(this, true);
  };


  OSjs.Handlers.Current  = DemoHandler; // Set this as the default handler
})();
