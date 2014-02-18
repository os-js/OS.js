"use strict";
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
    this.prefix = 'andersevenrud.github.io/OS.js-v2/';
  };

  DefaultStorage.prototype.set = function(k, v) {
    localStorage.setItem(this.prefix + k, JSON.stringify(v));
  };

  DefaultStorage.prototype.get = function(k) {
    var val = localStorage.getItem(this.prefix + k);
    return val ? JSON.parse(val) : null;
  };

  /**
   * Demo handler - Uses localStorage for sessions, for testing purposes
   */
  var DemoHandler = function() {
    OSjs.Handlers.Default.apply(this, arguments);

    this.storage  = new DefaultStorage();
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

    this.login('demo', 'demo', function(userData) {
      userData = userData || {};
      self.userData = userData;

      // You would normally use 'userData.settings' here!
      self.setUserSettings('User', userData, function() {

        // Ensure we get the user-selected locale
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
    });
  };

  /**
   * Demo login
   */
  DemoHandler.prototype.login = function(username, password, callback) {
    console.info("OSjs::DemoHandler::login()", username);
    if ( username === 'demo' && password === 'demo' ) {
      var userData = {
        id:         1,
        username:   'demo',
        name:       'Demo User',
        groups:     ['demo'],
        settings:   {
          Core : {
            Locale: 'en_US'
          }
        }
      };

      callback(userData);
      return;
    }
    callback(false, "Invalid login");
  };

  /**
   * Sets a setting in given category
   */
  DemoHandler.prototype._setSetting = function(cat, values, callback) {
    this.storage.set(cat, values);
    callback(true);
  };

  /**
   * Sets a list of settings in given category
   */
  DemoHandler.prototype._setSettings = function(cat, key, opts, callback) {
    if ( key === null ) {
      this.storage.set(cat, opts);
    } else {
      var settings = this.storage.get(cat);
      if ( typeof settings !== 'object' || !settings ) {
        settings = {};
      }
      if ( typeof settings[key] !== 'object' || !settings[key] ) {
        settings[key] = {};
      }
      settings[key] = opts;

      this.storage.set(cat, settings);
    }
    callback(true);
  };

  /**
   * Gets settings from given category
   */
  DemoHandler.prototype._getSettings = function(cat, key, callback) {
    var s = this.storage.get(cat) || {};
    if ( key === null ) {
      callback(s);
      return;
    } else if ( s[key] ) {
      callback(s[key]);
      return;
    }
    callback(false);
  };

  OSjs.Handlers.Current  = DemoHandler; // Set this as the default handler
})();
