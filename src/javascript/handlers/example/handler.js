/*!
 * OS.js - JavaScript Operating System
 *
 * Example Handler: Login screen and session/settings handling via database
 * PLEASE NOTE THAT THIS AN EXAMPLE ONLY, AND SHOUD BE MODIFIED BEFORE USAGE
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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

/*
See doc/example-handler.txt
*/

(function() {
  'use strict';

  window.OSjs   = window.OSjs   || {};
  OSjs.Handlers = OSjs.Handlers || {};

  /**
   * Handler
   */
  var ExampleHandler = function() {
    OSjs.Handlers.Default.apply(this, arguments);
  };
  ExampleHandler.prototype = Object.create(OSjs.Handlers.Default.prototype);

  ExampleHandler.prototype.init = function(callback) {
    //OSjs.Handlers.Default.prototype.init.apply(this, arguments);

    var self      = this;

    function _onLoaded() {
      var container = document.getElementById('Login');
      var login     = document.getElementById('LoginForm');
      var u         = document.getElementById('LoginUsername');
      var p         = document.getElementById('LoginPassword');
      var s         = document.getElementById('LoginSubmit');

      if ( !container ) {
        throw 'Could not find Login Form Container';
      }

      function _restore() {
        s.removeAttribute('disabled');
        u.removeAttribute('disabled');
        p.removeAttribute('disabled');
      }

      function _lock() {
        s.setAttribute('disabled', 'disabled');
        u.setAttribute('disabled', 'disabled');
        p.setAttribute('disabled', 'disabled');
      }

      function _login(username, password) {
        self.login(username, password, function(result, error) {
          if ( error ) {
            alert(error);
            _restore();
            return;
          }
          console.debug('OSjs::Handlers::ExampleHandler::init()', 'login response', result);
          container.parentNode.removeChild(container);

          self.settings.load(result.userSettings); // IMPORTANT
          self.onLogin(result.userData, function() {
            callback();
          });
        });
      }

      login.onsubmit = function(ev) {
        _lock();
        if ( ev ) ev.preventDefault();
        _login(u.value, p.value);
      };

      container.style.display = 'block';
    }

    var uri = '/example.html';
    OSjs.Utils.Ajax(uri, function(response, httpRequest, url) {
      if ( !response ) {
        alert('No content was found for example handler login HTML');
        return;
      }

      document.body.innerHTML += response;

      setTimeout(function() {
        _onLoaded();
      }, 0);
    }, function(error, response, httpRequest) {
      alert('Failed to fetch example handler login HTML');
    }, {method: 'GET', parse: true});
  };

  ExampleHandler.prototype.login = function(username, password, callback) {
    console.debug('OSjs::Handlers::ExampleHandler::login()');
    var opts = {username: username, password: password};
    this.callAPI('login', opts, function(response) {
      if ( response.result ) { // This contains an object with user data
        callback(response.result);
      } else {
        callback(false, response.error ? ('Error while logging in: ' + response.error) : 'Invalid login');
      }

    }, function(error) {
      callback(false, 'Login error: ' + error);
    });
  };

  ExampleHandler.prototype.logout = function(save, callback) {
    console.debug('OSjs::Handlers::ExampleHandler::logout()', save);
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


    OSjs.Handlers.Default.prototype.logout.call(this, save, _finished);
  };

  ExampleHandler.prototype.saveSettings = function(callback) {
    // TODO: You should do an interval here so you don't do stuff multiple times in a row
    console.debug('OSjs::Handlers::DemoHandler::saveSettings()');

    var self = this;
    var settings = this.settings.get();
    var opts = {settings: settings};
    this.callAPI('settings', opts, function(response) {
      console.debug('ExampleHandler::syncSettings()', response);
      if ( response.result ) {
        callback.call(self, true);
      } else {
        callback.call(self, false);
      }
    }, function(error) {
      console.warn('ExampleHandler::syncSettings()', 'Call error', error);
      callback.call(self, false);
    });
  };

  //
  // EXPORTS
  //
  OSjs.Handlers.Current  = ExampleHandler;
})();
