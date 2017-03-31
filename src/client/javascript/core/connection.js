/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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

(function(API, Utils) {
  'use strict';

  var _connectionInstance;

  /*
   * Attaches options to a XHR call
   */
  function appendRequestOptions(data, options) {
    options = options || {};

    var onprogress = options.onprogress || function() {};
    var ignore = ['onsuccess', 'onerror', 'onprogress', 'oncanceled'];

    Object.keys(options).forEach(function(key) {
      if ( ignore.indexOf(key) === -1 ) {
        data[key] = options[key];
      }
    });

    data.onprogress = function XHR_onprogress(ev) {
      if ( ev.lengthComputable ) {
        onprogress(ev, ev.loaded / ev.total);
      } else {
        onprogress(ev, -1);
      }
    };

    return data;
  }

  /**
   * Default Connection Implementation
   *
   * @summary Wrappers for communicating over HTTP, WS and NW
   *
   * @constructor Connection
   * @memberof OSjs.Core
   * @mixes OSjs.Helpers.EventHandler
   */
  function Connection() {
    this.index = 0;

    /**
     * If browser is offline
     * @name offline
     * @memberof OSjs.Core.Connection#
     * @type {Boolean}
     */
    this.offline    = false;

    this._evHandler = new OSjs.Helpers.EventHandler(name, []);

    /*eslint consistent-this: "off"*/
    _connectionInstance = this;
  }

  /**
   * Initializes the instance
   *
   * @param {Function}  callback    Callback function
   *
   * @function init
   * @memberof OSjs.Core.Connection#
   */
  Connection.prototype.init = function(callback) {
    var self = this;

    if ( typeof navigator.onLine !== 'undefined' ) {
      Utils.$bind(window, 'offline', function(ev) {
        self.onOffline();
      });
      Utils.$bind(window, 'online', function(ev) {
        self.onOnline();
      });
    }

    callback();
  };

  /**
   * Destroys the instance
   *
   * @function destroy
   * @memberof OSjs.Core.Connection#
   */
  Connection.prototype.destroy = function() {
    Utils.$unbind(window, 'offline');
    Utils.$unbind(window, 'online');

    if ( this._evHandler ) {
      this._evHandler = this._evHandler.destroy();
    }
  };

  /**
   * Default method to perform a resolve on a VFS File object.
   *
   * This should return the URL for given resource.
   *
   * @function getVFSPath
   * @memberof OSjs.Core.Connection#
   *
   * @param   {OSjs.VFS.File}       item      The File Object
   * @param   {Object}              [options] Options. These are added to the URL
   *
   * @return  {String}
   */
  Connection.prototype.getVFSPath = function(item, options) {
    options = options || {};

    var base = API.getConfig('Connection.RootURI', '/');
    if ( window.location.protocol === 'file:' ) {
      return base + item.path.replace(/^osjs:\/\/\//, '');
    }

    var url = API.getConfig('Connection.FSURI', '/');
    if ( item ) {
      url += '/read';
      options.path = item.path;
    } else {
      url += '/upload';
    }

    if ( options ) {
      var q = Object.keys(options).map(function(k) {
        return k + '=' + encodeURIComponent(options[k]);
      });

      if ( q.length ) {
        url += '?' + q.join('&');
      }
    }

    return url;
  };

  /**
   * Get if connection is Online
   *
   * @function isOnline
   * @memberof OSjs.Core.Connection#
   * @return {Boolean}
   */
  Connection.prototype.isOnline = function() {
    return !this.offline;
  };

  /**
   * Get if connection is Offline
   *
   * @function isOffline
   * @memberof OSjs.Core.Connection#
   * @return {Boolean}
   */
  Connection.prototype.isOffline = function() {
    return this.offline;
  };

  /**
   * Called upon a VFS request
   *
   * You can use this to interrupt/hijack operations.
   *
   * It is what gets called 'before' a VFS request takes place
   *
   * @function onVFSRequest
   * @memberof OSjs.Core.Connection#
   *
   * @param   {String}    vfsModule     VFS Module Name
   * @param   {String}    vfsMethod     VFS Method Name
   * @param   {Object}    vfsArguments  VFS Method Arguments
   * @param   {Function}  callback      Callback function
   */
  Connection.prototype.onVFSRequest = function(vfsModule, vfsMethod, vfsArguments, callback) {
    // If you want to interrupt/hijack or modify somehow, just send the two arguments to the
    // callback: (error, result)
    callback(/* continue normal behaviour */);
  };

  /**
   * Called upon a VFS request completion
   *
   * It is what gets called 'after' a VFS request has taken place
   *
   * @function onVFSRequestCompleted
   * @memberof OSjs.Core.Connection#
   *
   * @param   {String}    vfsModule     VFS Module Name
   * @param   {String}    vfsMethod     VFS Method Name
   * @param   {Object}    vfsArguments  VFS Method Arguments
   * @param   {String}    vfsError      VFS Response Error
   * @param   {Mixed}     vfsResult     VFS Response Result
   * @param   {Function}  callback      Callback function
   */
  Connection.prototype.onVFSRequestCompleted = function(vfsModule, vfsMethod, vfsArguments, vfsError, vfsResult, callback) {
    // If you want to interrupt/hijack or modify somehow, just send the two arguments to the
    // callback: (error, result)
    callback(/* continue normal behaviour */);
  };

  /**
   * When browser goes online
   *
   * @function onOnline
   * @memberof OSjs.Core.Connection#
   */
  Connection.prototype.onOnline = function() {
    console.warn('Connection::onOnline()', 'Going online...');
    this.offline = false;

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.notification({title: API._('LBL_INFO'), message: API._('CONNECTION_RESTORED')});
    }

    if ( this._evHandler ) {
      this._evHandler.emit('online');
    }
  };

  /**
   * When browser goes offline
   *
   * @param {Number} reconnecting Amount retries for connection
   *
   * @function onOffline
   * @memberof OSjs.Core.Connection#
   */
  Connection.prototype.onOffline = function(reconnecting) {
    console.warn('Connection::onOffline()', 'Going offline...');

    if ( !this.offline && this._evHandler ) {
      this._evHandler.emit('offline');
    }

    this.offline = true;

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.notification({title: API._('LBL_WARNING'), message: API._(reconnecting ? 'CONNECTION_RESTORE_FAILED' : 'CONNECTION_LOST')});
    }
  };

  /**
   * Default method to perform a call to the backend (API)
   *
   * Please note that this function is internal, and if you want to make
   * a actual API call, use "API.call()" instead.
   *
   * @param {String}    method      API method name
   * @param {Object}    args        API method arguments
   * @param {Function}  cbSuccess   On success
   * @param {Function}  cbError     On error
   * @param {Object}    [options]   Options passed on to the connection request method (ex: Utils.ajax)
   *
   * @return {Boolean}
   *
   * @function request
   * @memberof OSjs.Core.Connection#
   * @see OSjs.Core.API.call
   */
  Connection.prototype.request = function(method, args, cbSuccess, cbError, options) {
    args = args || {};
    cbSuccess = cbSuccess || function() {};
    cbError = cbError || function() {};

    if ( this.offline ) {
      cbError('You are currently off-line and cannot perform this operation!');
      return false;
    } else if ( (API.getConfig('Connection.Type') === 'standalone') ) {
      cbError('You are currently running locally and cannot perform this operation!');
      return false;
    }

    if ( method.match(/^FS:/) ) {
      return this.requestVFS(method.replace(/^FS:/, ''), args, options, cbSuccess, cbError);
    }

    return this.requestAPI(method, args, options, cbSuccess, cbError);
  };

  /**
   * Wrapper for server API XHR calls
   *
   * @param   {String}    method    API Method name
   * @param   {Object}    args      API Method arguments
   * @param   {Object}    options   Call options
   * @param   {Function}  cbSuccess Callback on success
   * @param   {Function}  cbError   Callback on error
   *
   * @function requestAPI
   * @memberof OSjs.Core.Connection#
   * @see OSjs.Core.Connection.request
   *
   * @return {Boolean}
   */
  Connection.prototype.requestAPI = function(method, args, options, cbSuccess, cbError) {
    return false;
  };

  /**
   * Wrapper for server VFS XHR calls
   *
   * @param   {String}    method    API Method name
   * @param   {Object}    args      API Method arguments
   * @param   {Object}    options   Call options
   * @param   {Function}  cbSuccess Callback on success
   * @param   {Function}  cbError   Callback on error
   *
   * @function requestVFS
   * @memberof OSjs.Core.Connection#
   * @see OSjs.Core.Connection.request
   *
   * @return {Boolean}
   */
  Connection.prototype.requestVFS = function(method, args, options, cbSuccess, cbError) {
    if ( method === 'get' ) {
      return this._requestGET(args, options, cbSuccess, cbError);
    } else if ( method === 'upload' ) {
      return this._requestPOST(args, options, cbSuccess, cbError);
    }

    return false;
  };

  /**
   * Makes a HTTP POST call
   *
   * @param   {Object}    form      Call data
   * @param   {Object}    options   Call options
   * @param   {Function}  onsuccess Callback on success
   * @param   {Function}  onerror   Callback on error
   *
   * @function _requestPOST
   * @memberof OSjs.Core.Connection#
   *
   * @return {Boolean}
   */
  Connection.prototype._requestPOST = function(form, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('Connection::_requestPOST()', 'error', arguments);
    };

    Utils.ajax(appendRequestOptions({
      url: OSjs.VFS.Transports.OSjs.path(),
      method: 'POST',
      body: form,
      onsuccess: function Connection_POST_success(result) {
        onsuccess(false, result);
      },
      onerror: function Connection_POST_error(result) {
        onerror('error', null, result);
      },
      oncanceled: function Connection_POST_cancel(evt) {
        onerror('canceled', null, evt);
      }
    }, options));

    return true;
  };

  /**
   * Makes a HTTP GET call
   *
   * @param   {Object}    args      Call data
   * @param   {Object}    options   Call options
   * @param   {Function}  onsuccess Callback on success
   * @param   {Function}  onerror   Callback on error
   *
   * @function _requestGET
   * @memberof OSjs.Core.Connection#
   *
   * @return {Boolean}
   */
  Connection.prototype._requestGET = function(args, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('Connection::_requestGET()', 'error', arguments);
    };

    var self = this;

    Utils.ajax(appendRequestOptions({
      url: args.url || OSjs.VFS.Transports.OSjs.path(args.path),
      method: args.method || 'GET',
      responseType: 'arraybuffer',
      onsuccess: function Connection_GET_success(response, xhr) {
        if ( !xhr || xhr.status === 404 || xhr.status === 500 ) {
          onsuccess({error: xhr.statusText || response, result: null});
          return;
        }
        onsuccess({error: false, result: response});
      },
      onerror: function Connection_GET_error() {
        onerror.apply(self, arguments);
      }
    }, options));

    return true;
  };

  /**
   * Makes a HTTP XHR call
   *
   * @param   {String}    url       Call URL
   * @param   {Object}    args      Call data
   * @param   {Object}    options   Call options
   * @param   {Function}  onsuccess Callback on success
   * @param   {Function}  onerror   Callback on error
   *
   * @function _requestXHR
   * @memberof OSjs.Core.Connection#
   *
   * @return {Boolean}
   */
  Connection.prototype._requestXHR = function(url, args, options, onsuccess, onerror) {
    onerror = onerror || function() {
      console.warn('Connection::_requestXHR()', 'error', arguments);
    };

    var self = this;

    Utils.ajax(appendRequestOptions({
      url: url,
      method: 'POST',
      json: true,
      body: args,
      onsuccess: function Connection_XHR_onsuccess(/*response, request, url*/) {
        onsuccess.apply(self, arguments);
      },
      onerror: function Connection_XHR_onerror(/*error, response, request, url*/) {
        onerror.apply(self, arguments);
      }
    }, options));

    return true;
  };

  /**
   * Subscribe to a event
   *
   * NOTE: This is only available on WebSocket connections
   *
   * @function subscribe
   * @memberof OSjs.Core.Connection#
   * @see OSjs.Helpers.EventHandler#on
   *
   * @param   {String}    k       Event name
   * @param   {Function}  func    Callback function
   *
   * @return  {Number}
   */
  Connection.prototype.subscribe = function(k, func) {
    return this._evHandler.on(k, func, this);
  };

  /**
   * Removes an event subscription
   *
   * @function unsubscribe
   * @memberof OSjs.Core.Connection#
   * @see OSjs.Helpers.EventHandler#off
   *
   * @param   {String}    k       Event name
   * @param   {Number}    [idx]   The hook index returned from subscribe()
   *
   * @return {Boolean}
   */
  Connection.prototype.unsubscribe = function(k, idx) {
    return this._evHandler.off(k, idx);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Connection = Connection;

  /**
   * Get running 'Connection' instance
   *
   * @function getConnection
   * @memberof OSjs.Core
   *
   * @return {OSjs.Core.Connection}
   */
  OSjs.Core.getConnection = function Core_getConnection() {
    return _connectionInstance;
  };

})(OSjs.API, OSjs.Utils);

