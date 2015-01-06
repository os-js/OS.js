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

(function(Utils, VFS, API) {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT CONNECTION MANAGER
  /////////////////////////////////////////////////////////////////////////////

  var ConnectionManager = function(type, url, cb) {
    cb = cb || function() {};

    this.type       = type;
    this.url        = url;
    this.offline    = false;
    this.connection = null;
    /*
    this._wsmid     = 0;
    this._wscb      = {};
    */

    var self = this;

    if ( typeof navigator.onLine !== 'undefined' ) {
      window.addEventListener('offline', function(ev) {
        self.onOffline();
      });
      window.addEventListener('online', function(ev) {
        self.onOnline();
      });
    }

    /*
    if ( this.type === 'websocket' ) {
      this.offline = true;

      //this.connection = new WebSocket(this.url);
      this.connection = new WebSocket('ws://10.0.0.52:8889');
      this.connection.onopen = function() {
        self.offline = false;
      };
      this.connection.onclose = function() {
        self.offline = true;
      };
      this.connection.onerror = function(ev) {
        console.error('Connection error', ev);
      };
      this.connection.onmessage = function(ev) {
        var data = JSON.parse(ev.data);
        var id = data.id;

        if ( self._wscb[id] ) {
          if ( data.error ) {
            self._wscb[id].cbError(data.error, data);
          } else {
            self._wscb[id].cbSuccess(data);
          }
          delete self._wscb[id];
        }
      };
    }
    */
  };

  ConnectionManager.prototype.destroy = function() {
    var self = this;
    /*
    if ( this.connection ) {
      this.connection.close();
      this.connection = null;
      this._wscb = {};
    }
    */

    if ( typeof navigator.onLine !== 'undefined' ) {
      window.removeEventListener('offline', function(ev) {
        self.onOffline();
      });
      window.removeEventListener('online', function(ev) {
        self.onOnline();
      });
    }
  };

  ConnectionManager.prototype.callAPI = function(method, args, cbSuccess, cbError, options) {
    if ( this.offline ) {
      cbError('You are currently off-line and cannot perform this operation!');
      return false;
    }

    args      = args      || {};
    cbSuccess = cbSuccess || function() {};
    cbError   = cbError   || function() {};

    console.group('ConnectionManager::callAPI()');
    console.log('Method', method);
    console.log('Arguments', args);
    console.groupEnd();

    /*
    if ( this.connection ) {
      var id = 'msg_' + this._wsmid;
      this._wscb[id] = {
        args: args,
        cbSuccess: cbSuccess,
        cbError: cbError
      };

      this.connection.send(JSON.stringify({
        id: id,
        method: method,
        args: args
      }));

      this._wsmid++;

      return true;
    }
    */

    var data = {
      url: this.url,
      method: 'POST',
      json: true,
      body: {
        'method'    : method,
        'arguments' : args
      },
      onsuccess: function(response, request, url) {
        cbSuccess.apply(this, arguments);
      },
      onerror: function(error, response, request, url) {
        cbError.apply(this, arguments);
      }
    };

    if ( options ) {
      Object.keys(options).forEach(function(key) {
        data[key] = options[key];
      });
    }

    return Utils.ajax(data);
  };

  ConnectionManager.prototype.onOnline = function() {
    console.warn('ConnectionManager::onOnline()', 'Going online...');
    this.offline = false;

    var wm = API.getWMInstance();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are On-line!'});
    }
  };

  ConnectionManager.prototype.onOffline = function() {
    console.warn('ConnectionManager::onOffline()', 'Going offline...');
    this.offline = true;

    var wm = API.getWMInstance();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are Off-line!'});
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.ConnectionManager = ConnectionManager;

})(OSjs.Utils, OSjs.VFS, OSjs.API);

