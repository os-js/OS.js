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
(function(API, Utils, VFS) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};

  /////////////////////////////////////////////////////////////////////////////
  // DEMO STORAGE
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Storage
   */
  var DefaultStorage = function() {
    if ( !OSjs.Compability.localStorage ) {
      throw new Error('Your browser does not support localStorage :(');
    }
    this.prefix = 'OS.js-v2/DemoHandler/';
  };

  DefaultStorage.prototype.set = function(o) {
    console.debug('DefaultStorage::set()', o);
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

  /////////////////////////////////////////////////////////////////////////////
  // DEMO HANDLER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Demo handler - Uses localStorage for sessions, for testing purposes
   */
  var DemoHandler = function() {
    OSjs.Core._Handler.apply(this, arguments);

    this.storage = new DefaultStorage();
  };
  DemoHandler.prototype = Object.create(OSjs.Core._Handler.prototype);

  /**
   * Demo initialization
   */
  DemoHandler.prototype.init = function(callback) {
    console.info('OSjs::DemoHandler::init()');

    if ( window.location.href.match(/^file\:\/\//) ) {
      callback({
        id: 0,
        username: 'demo',
        name: 'Local Server',
        groups: ['demo']
      });
    }

    // Use the 'demo' user
    var self = this;
    this.login('demo', 'demo', function(userData) {
      self.settings.load(self.storage.get()); // IMPORTANT
      self.onLogin(userData, function() {
        callback();
      });
    });
  };

  /**
   * Demo login. Just an example
   */
  DemoHandler.prototype.login = function(username, password, callback) {
    console.info('OSjs::DemoHandler::login()', username);
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

  DemoHandler.prototype.saveSettings = function(callback) {
    var settings = this.settings.get();
    console.debug('OSjs::Handlers::DemoHandler::saveSettings()', settings);
    this.storage.set(settings);
    callback.call(this, true);
  };


  //
  // Exports
  //
  OSjs.Core.Handler = DemoHandler;
})(OSjs.API, OSjs.Utils, OSjs.VFS);
