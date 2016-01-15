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

  window.OSjs = window.OSjs || {};
  OSjs.Utils  = OSjs.Utils  || {};

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Common function for handling all types of XHR calls
   * including download/upload and JSONP
   *
   * @param   Object      args      Aguments (see below)
   *
   * @option args String     url                  The URL
   * @option args String     method               HTTP Call method: (POST/GET, default = GET)
   * @option args Mixed      body                 Optional body to send (for POST)
   * @option args integer    timeout              Optional timeout (in milliseconds)
   * @option args String     responseType         HTTP Response type (default = null)
   * @option args Object     requestHeaders       Tuple with headers (default = null)
   * @option args boolean    json                 Handle as a JSON request/response (default = false)
   * @option args boolean    jsonp                Handle as a JSONP request (default = false)
   * @option args Function   onerror              onerror callback
   * @option args Function   onsuccess            onsuccess callback
   * @option args Function   oncreated            oncreated callback
   * @option args Function   onfailed             onfailed callback
   * @option args Function   oncanceled           oncanceled callback
   * @option args Function   ontimeout            ontimeout callback
   *
   * @return  void
   *
   * @api     OSjs.Utils.ajax()
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
        try {
          response = JSON.parse(response);
        } catch (ex) {
          console.warn('Utils::ajax()', 'handleResponse()', ex);
        }
      }

      return response;
    }

    function onReadyStateChange() {
      if ( request.readyState === 4 ) {
        var ctype = request.getResponseHeader('content-type') || '';
        var result = getResponse(ctype);

        if ( request.status === 200 || request.status === 201 ) {
          args.onsuccess(result, request, args.url);
        } else {
          var error = OSjs.API._('ERR_UTILS_XHR_FMT', request.status.toString());
          args.onerror(error, result, request, args.url);
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
      request.timeout = args.timeout;

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
          if ( request.status === 200 || request.status === 201 || request.status === 304 ) {
            args.onsuccess(request.response, request);
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
      args.onerror('You are currently running locally and cannot perform this operation!');
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
   * Format of list is:
   * [
   *  {
   *
   *    "type": "javascript" // or "stylesheet",
   *    "src": "url/uri"
   *  }
   * ]
   *
   * @param   Array     list              The list of resources
   * @param   Function  callback          Callback when done => fn(totalCount, failedArray, successArray)
   * @param   Function  callbackProgress  Callback on progress => fn(currentNumber, totalNumber)
   *
   * @return  void
   *
   * @api     OSjs.Utils.preload()
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

    return function(list, callback, callbackProgress) {
      list = (list || []).slice();

      var successes  = [];
      var failed     = [];
      var index      = 0;

      console.group('Utils::preload()', list);

      function finished() {
        console.groupEnd();

        (callback || function() {})(list.length, failed, successes);
      }

      (function _next() {
        if ( index >= list.length ) {
          finished();
          return;
        }

        function _loaded(success, src) {
          index++;

          (callbackProgress || function() {})(index, list.length);
          (success ? successes : failed).push(src);
          _next();
        }

        var item = list[index];
        if ( item ) {
          if ( (item.force !== true) && _LOADED[item.src] === true ) {
            _loaded(true);
            return;
          }

          var src = item.src;
          if ( item.type.match(/^style/) ) {
            createStyle(src, _loaded);
          } else if ( item.type.match(/script$/) ) {
            createScript(src, _loaded);
          }
        } else {
          _next();
        }

      })();
    };
  })();

})();
