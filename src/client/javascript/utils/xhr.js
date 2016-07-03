/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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
(function() {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Common function for handling all types of XHR calls
   * including download/upload and JSONP
   *
   * @function ajax
   * @memberof OSjs.Utils
   *
   * @param   {Object}     args                        Aguments (see below)
   * @param   {String}     args.url                    The URL
   * @param   {String}     [args.method=GET]           HTTP Call method
   * @param   {Mixed}      [args.body]                 Body to send (for POST)
   * @param   {integer}    [args.timeout=0]            Timeout (in milliseconds)
   * @param   {String}     [args.responseType=null]    HTTP Response type
   * @param   {Object}     [args.requestHeaders=null]  Tuple with headers
   * @param   {Boolean}    [args.json=false]           Handle as a JSON request/response
   * @param   {Boolean}    [args.jsonp=false]          Handle as a JSONP request
   * @param   {Array}      [args.acceptcodes]          Array of accepted status codes for success signal [arraybuffer]
   * @param   {Function}   [args.onerror]              onerror callback => fn(error, evt, request, url)
   * @param   {Function}   [args.onsuccess]            onsuccess callback => fn(result, request, url)
   * @param   {Function}   [args.oncreated]            oncreated callback => fn(request)
   * @param   {Function}   [args.onfailed]             onfailed callback => fn(evt)
   * @param   {Function}   [args.oncanceled]           oncanceled callback => fn(evt)
   * @param   {Function}   [args.ontimeout]            ontimeout callback => fn(evt)
   */
  OSjs.Utils.ajax = function(args) {
    var request;
    args = OSjs.Utils.argumentDefaults(args, {
      onerror          : function() {},
      onsuccess        : function() {},
      onprogress       : function() {},
      oncreated        : function() {},
      onfailed         : function() {},
      oncanceled       : function() {},
      ontimeout        : function() {},
      acceptcodes      : [200, 201, 304],
      method           : 'GET',
      responseType     : null,
      requestHeaders   : {},
      body             : null,
      timeout          : 0,
      json             : false,
      url              : '',
      jsonp            : false
    });

    function getResponse(ctype) {
      var response = request.responseText;
      if ( args.json && ctype.match(/^application\/json/) ) {
        response = JSON.parse(response);
      }
      return response;
    }

    function onReadyStateChange() {
      var result;

      function _onError(error) {
        error = OSjs.API._('ERR_UTILS_XHR_FMT', error);
        console.warn('Utils::ajax()', 'onReadyStateChange()', error);
        args.onerror(error, result, request, args.url);
      }

      if ( request.readyState === 4 ) {
        try {
          var ctype = request.getResponseHeader('content-type') || '';
          result = getResponse(ctype);
        } catch (ex) {
          _onError(ex.toString());
          return;
        }

        if ( request.status === 200 || request.status === 201 ) {
          args.onsuccess(result, request, args.url);
        } else {
          _onError(request.status.toString());
        }
      }
    }

    function requestJSONP() {
      var loaded  = false;
      OSjs.Utils.$createJS(args.url, function() {
        if ( (this.readyState === 'complete' || this.readyState === 'loaded') && !loaded) {
          loaded = true;
          args.onsuccess();
        }
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        args.onsuccess();
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        args.onerror();
      });
    }

    function cleanup() {
      if ( request.upload ) {
        request.upload.removeEventListener('progress', args.onprogress, false);
      } else {
        request.removeEventListener('progress', args.onprogress, false);
      }
      request.removeEventListener('error', args.onfailed, false);
      request.removeEventListener('abort', args.oncanceled, false);
      request.onerror = null;
      request.onload = null;
      request.onreadystatechange = null;
      request.ontimeut = null;
      request = null;
    }

    function requestJSON() {
      request = new XMLHttpRequest();
      try {
        request.timeout = args.timeout;
      } catch ( e ) {}

      if ( request.upload ) {
        request.upload.addEventListener('progress', args.onprogress, false);
      } else {
        request.addEventListener('progress', args.onprogress, false);
      }

      request.ontimeout = function(evt) {
        args.ontimeout(evt);
      };

      if ( args.responseType === 'arraybuffer' ) { // Binary
        request.onerror = function(evt) {
          var error = request.response || OSjs.API._('ERR_UTILS_XHR_FATAL');
          args.onerror(error, evt, request, args.url);

          cleanup();
        };
        request.onload = function(evt) {
          if ( args.acceptcodes.indexOf(request.status) >= 0 ) {
            args.onsuccess(request.response, request, args.url);
          } else {
            OSjs.VFS.abToText(request.response, 'text/plain', function(err, txt) {
              var error = txt || err || OSjs.API._('ERR_UTILS_XHR_FATAL');
              args.onerror(error, evt, request, args.url);
            });
          }

          cleanup();
        };
      } else {
        request.addEventListener('error', args.onfailed, false);
        request.addEventListener('abort', args.oncanceled, false);
        request.onreadystatechange = onReadyStateChange;
      }

      request.open(args.method, args.url, true);

      Object.keys(args.requestHeaders).forEach(function(h) {
        request.setRequestHeader(h, args.requestHeaders[h]);
      });

      request.responseType = args.responseType || '';

      args.oncreated(request);
      request.send(args.body);
    }

    if ( (OSjs.API.getConfig('Connection.Type') === 'standalone') ) {
      args.onerror('You are currently running locally and cannot perform this operation!', null, request, args.url);
      return;
    }

    if ( args.json && (typeof args.body !== 'string') && !(args.body instanceof FormData) ) {
      args.body = JSON.stringify(args.body);
      if ( typeof args.requestHeaders['Content-Type'] === 'undefined' ) {
        args.requestHeaders['Content-Type'] = 'application/json';
      }
    }

    console.debug('Utils::ajax()', args);

    if ( args.jsonp ) {
      requestJSONP();
      return;
    }

    requestJSON();
  };

  /**
   * Preload a list of resources
   *
   * @example
   * [
   *  {
   *
   *    "type": "javascript" // or "stylesheet",
   *    "src": "url/uri"
   *  }
   * ]
   *
   * @function preload
   * @memberof OSjs.Utils
   *
   * @param   {Array}     list              The list of resources
   * @param   {Function}  callback          Callback when done => fn(totalCount, failedArray, successArray)
   * @param   {Function}  callbackProgress  Callback on progress => fn(currentNumber, totalNumber)
   */
  OSjs.Utils.preload = (function() {
    var _LOADED = {};

    function isCSSLoaded(path) {
      var result = false;
      (document.styleSheet || []).forEach(function(iter, i) {
        if ( iter.href.indexOf(path) !== -1 ) {
          result = true;
          return false;
        }
        return true;
      });
      return result;
    }

    function createStyle(src, callback, opts) {
      opts = opts || {};
      opts.check = (typeof opts.check === 'undefined') ? true : (opts.check === true);
      opts.interval = opts.interval || 50;
      opts.maxTries = opts.maxTries || 10;

      function _finished(result) {
        _LOADED[src] = result;
        console.info('Stylesheet', src, result);
        callback(result, src);
      }

      /*
      if ( document.createStyleSheet ) {
        document.createStyleSheet(src);
        _finished(true);
        return;
      }
      */

      OSjs.Utils.$createCSS(src);
      if ( opts.check === false || (typeof document.styleSheet === 'undefined') || isCSSLoaded(src) ) {
        _finished(true);
        return;
      }

      var tries = opts.maxTries;
      var ival = setInterval(function() {
        console.debug('Stylesheet', 'check', src);
        if ( isCSSLoaded(src) || (tries <= 0) ) {
          ival = clearInterval(ival);
          _finished(tries > 0);
          return;
        }
        tries--;
      }, opts.interval);
    }

    function createScript(src, callback) {
      var _finished = function(result) {
        _LOADED[src] = result;
        console.info('JavaScript', src, result);
        callback(result, src);
      };

      var loaded  = false;
      OSjs.Utils.$createJS(src, function() {
        if ( (this.readyState === 'complete' || this.readyState === 'loaded') && !loaded) {
          loaded = true;
          _finished(true);
        }
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        _finished(true);
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        _finished(false);
      });
    }

    function checkType(item) {
      if ( typeof item === 'string' ) {
        item = {src: item};
      }

      if ( !item.type ) {
        item.type = (function(src) {
          if ( src.match(/\.js$/i) ) {
            return 'javascript';
          } else if ( src.match(/\.css$/i) ) {
            return 'stylesheet';
          }
          return 'unknown';
        })(item.src);
      }

      return item;
    }

    return function(list, callback, callbackProgress, args) {
      list = (list || []).slice();
      args = args || {};

      var successes = [];
      var failed = [];

      console.group('Utils::preload()', list.length);

      function getSource(item) {
        var src = item.src;
        if ( src.substr(0, 1) !== '/' && !src.match(/^(https?|ftp)/) ) {
          src = window.location.pathname + src;
        }

        if ( !src.match(/^(https?|ftp)/) && src.indexOf('?') === -1 ) {
          if ( OSjs.API.getConfig('Connection.Dist') === 'dist' && OSjs.API.getConfig('Connection.AppendVersion') ) {
            src += '?ver=' + OSjs.API.getConfig('Connection.AppendVersion');
          }
        }
        return src;
      }

      OSjs.Utils.asyncs(list, function(item, index, next) {
        function _loaded(success, src) {
          (callbackProgress || function() {})(index, list.length);
          (success ? successes : failed).push(src);
          next();
        }

        if ( item ) {
          item = checkType(item);

          if ( _LOADED[item.src] === true && (item.force !== true && args.force !== true) ) {
            _loaded(true);
            return;
          }

          var src = getSource(item);
          if ( item.type.match(/^style/) ) {
            createStyle(src, _loaded);
            return;
          } else if ( item.type.match(/script$/) ) {
            createScript(src, _loaded);
            return;
          } else {
            failed.push(src);
          }
        }

        next();
      }, function() {
        console.groupEnd();
        (callback || function() {})(list.length, failed, successes);
      });
    };
  })();

})();
