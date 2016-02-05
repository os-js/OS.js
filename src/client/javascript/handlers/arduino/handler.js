/*!
 * OS.js - JavaScript Operating System
 *
 * Arduino Handler: Login screen and session/settings handling via database
 * PLEASE NOTE THAT THIS AN EXAMPLE ONLY, AND SHOUD BE MODIFIED BEFORE USAGE
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

//
// See doc/pam-handler.txt
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
  var ArduinoHandler = function() {
    OSjs.Core._Handler.apply(this, arguments);
    this._saveTimeout = null;

    API.addHook('onSessionLoaded', function() {
      var pool = OSjs.Core.getSettingsManager().instance('Wizard');
      if ( !pool.get('completed') ) {
        API.launch('ApplicationArduinoWizardSettings');
      }
    });

  };

  ArduinoHandler.prototype = Object.create(OSjs.Core._Handler.prototype);

  ArduinoHandler.prototype.initLoginScreen = function(callback) {
    OSjs.Core._Handler.prototype.initLoginScreen.apply(this, arguments);

    document.getElementById('LoginUsername').value = 'root';

    if ( location.search === '?DEBUGMODE' ) {
      document.getElementById('LoginPassword').value = 'doghunter';
      document.getElementById('LoginForm').onsubmit();
    }
  };

  /**
   * Override default init() method
   */
  ArduinoHandler.prototype.init = function(callback) {
    // Located in src/client/javasript/hander.js
    var self = this;
    this.initLoginScreen(function() {
      OSjs.Core._Handler.prototype.init.call(self, callback);
    });
  };

  /**
   * Arduino login api call
   */
  ArduinoHandler.prototype.login = function(username, password, callback) {
    console.debug('OSjs::Handlers::ArduinoHandler::login()');

    function checkSettingsCompability(settings) {
      // This resets the settings whenever a version update is done
      // these are not written until the user actually performs a save operation
      settings = settings || {};

      var curr = API.getConfig('Version');
      if ( !settings['__version__'] || settings['__version__'] !== curr ) {
        settings = {};
      }
      settings['__version__'] = curr;

      return settings;
    }

    var opts = {username: username, password: password};
    this.callAPI('login', opts, function(response) {
      if ( response.result ) { // This contains an object with user data
        callback({
          userData: response.result.userData,
          userSettings: checkSettingsCompability(response.result.userSettings)
        });
      } else {
        callback(false, response.error ? ('Error while logging in: ' + response.error) : 'Invalid login');
      }
    }, function(error) {
      callback(false, 'Login error: ' + error);
    });
  };

  /**
   * Arduino logout api call
   */
  ArduinoHandler.prototype.logout = function(save, callback) {
    console.debug('OSjs::Handlers::ArduinoHandler::logout()', save);
    var self = this;

    function _finished() {
      var opts = {};
      self.callAPI('logout', opts, function(response) {
        if ( response.result ) {
          callback(true);
        } else {
          callback(false, 'An error occured: ' + (response.error || 'Unknown error'));
        }
      }, function(error) {
        callback(false, 'Logout error: ' + error);
      });
    }

    OSjs.Core._Handler.prototype.logout.call(this, save, _finished);
  };

  /**
   * Override default settings saving
   */
  ArduinoHandler.prototype.saveSettings = function(pool, storage, callback) {
    console.debug('OSjs::Handlers::ArduinoHandler::saveSettings()');

    var self = this;
    var opts = {settings: storage};

    function _save() {
      self.callAPI('settings', opts, function(response) {
        console.debug('ArduinoHandler::syncSettings()', response);
        if ( response.result ) {
          callback.call(self, true);
        } else {
          callback.call(self, false);
        }
      }, function(error) {
        console.warn('ArduinoHandler::syncSettings()', 'Call error', error);
        callback.call(self, false);
      });
    }

    if ( this._saveTimeout ) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }
    setTimeout(_save, 100);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Handler = ArduinoHandler;

})(OSjs.API, OSjs.Utils, OSjs.VFS);
