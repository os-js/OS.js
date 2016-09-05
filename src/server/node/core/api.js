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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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
(function(_path, _fs) {
  'use strict';

  /**
   * @namespace API
   */

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Login Wrapper. This is just a placeholder. The function is bound in the handler
   *
   * @param   {Object}    server          Server object
   * @param   {Object}    args            API Call Arguments
   * @param   {String}    args.username   Username
   * @param   {String}    args.password   Password
   * @param   {Function}  callback        Callback function => fn(error, result)
   *
   * @function login
   * @memberof API
   */
  module.exports.login = function(server, args, callback) {
    callback('No handler assigned', {});
  };

  /**
   * Logout Wrapper. This is just a placeholder. The function is bound in the handler
   *
   * @param   Object    server      Server object
   * @param   Object    args        API Call Arguments
   * @param   Function  callback    Callback function => fn(error, result)
   *
   * @function logout
   * @memberof API
   */
  module.exports.logout = function(server, args, callback) {
    callback('No handler assigned', {});
  };

  /**
   * Settings storing Wrapper. This is just a placeholder. The function is bound in the handler
   *
   * @param   Object    server      Server object
   * @param   Object    args        API Call Arguments
   * @param   Function  callback    Callback function => fn(error, result)
   *
   * @option  args      Object    settings    Settings Tree
   *
   * @function settings
   * @memberof API
   */
  module.exports.settings = function(server, args, callback) {
    callback('No handler assigned', {});
  };

  /**
   * Application API Call
   *
   * @param   {Object}    server           Server object
   * @param   {Object}    args             API Call Arguments
   * @param   {String}    args.path        Package Path (ex: default/FileManager)
   * @param   {String}    args.method      API Method name
   * @param   {Array}     args.arguments   List of arguments to API Method
   * @param   {Function}  callback         Callback function => fn(error, result)
   *
   * @function application
   * @memberof API
   */
  module.exports.application = function(server, args, callback) {
    var apath = args.path || null;
    var ameth = args.method || null;
    var aargs = args['arguments'] || [];

    var aroot = _path.join(server.config.repodir, apath);
    var fpath = _path.join(aroot, 'api.js');

    try {
      require(fpath)[ameth](aargs, function(error, result) {
        callback(error, result);
      }, server.request, server.response, server.config, server.handler);
    } catch ( e ) {
      server.logger.log(server.logger.WARNING, e.stack, e.trace);

      callback('Application API error or missing: ' + e.toString(), null);
    }
  };

  /**
   * cURL API Call
   *
   * <pre><code>
   * NOTE: If you do a non-POST request with a body (with type of object) and no
   * query string was defined in the url, this method will try to transform the
   * given body data and append to the url.
   * </code></pre>
   *
   * @example
   * Gives an object like: {httpCode: -1, body: '...'}
   *
   * @param   {Object}    server                     Server object
   * @param   {Object}    args                       API Call Arguments
   * @param   {String}    args.method                HTTP Call method (GET/POST/HEAD)
   * @param   {String}    args.url                   HTTP Call URL
   * @param   {Object}    args.body                  HTTP POST Payload (alias: query)
   * @param   {Number}    args.timeout               Timeout in seconds (default=0)
   * @param   {Boolean}   [args.binary=false]        Return binary (default=false)
   * @param   {String}    [args.mime]                If binary, which MIME
   * @param   {Object}    [args.headers]             Custom HTTP headers ({key:val})
   * @param   {Boolean}   [args.json]                Send request as JSON (autodetected)
   * @param   {String}    [args.contentType]         Specify the content-type (autodetected)
   * @param   {Function}  callback                   Callback function => fn(error, result)
   *
   * @function curl
   * @memberof API
   */
  module.exports.curl = function(server, args, callback) {
    var url = args.url;

    if ( !url ) {
      callback('cURL expects an \'url\'');
      return;
    }

    var curlRequest = (function parseRequestParameters() {
      var query = args.body || args.query || {}; // 'query' was the old name, but kept for compability
      var binary = args.binary === true;
      var method = args.method || 'GET';
      var mime = args.mime || (binary ? 'application/octet-stream' : null);

      var opts = (function() {
        return {
          url: url,
          method: method,
          timeout: (args.timeout || 0) * 1000,
          headers: args.headers || args.requestHeaders || {}
        };
      })();

      (function parseRequestMethod() {
        function _parsePOST() {
          if ( args.contentType === 'application/x-www-form-urlencoded' ) {
            opts.form = query;
          } else if ( args.contentType === 'multipart/form-data' ) {
            opts.formData = query;
          } else {
            if ( query && typeof query !== 'string' ) {
              opts.json = typeof opts.json === 'undefined' ? true : opts.json;
            }
            opts.body = query;
          }
        }

        function _parseOTHER() {
          if ( typeof query === 'object' && url.indexOf('?') === '1' ) {
            try {
              url += '?' + Object.keys(query).map(function(k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent(query[k]);
              }).join('&');
            } catch ( e ) {
              server.logger.log(server.logger.WARNING, 'Failed to transform curl query', e.stack, e);
            }
          }
        }

        if ( method === 'POST' ) {
          _parsePOST();
        } else {
          _parseOTHER();
        }

        if ( binary ) {
          opts.encoding = null;
        }
      })();

      return {
        query: query,
        binary: binary,
        method: method,
        mime: mime,
        opts: opts
      };
    })();

    require('request')(curlRequest.opts, function(error, response, body) {
      if ( error ) {
        callback(error);
        return;
      }

      if ( curlRequest.binary && body ) {
        body = 'data:' + curlRequest.mime + ';base64,' + (body.toString('base64'));
      }

      var data = {
        httpVersion: response.httpVersion,
        httpCode: response.statusCode,
        headers: response.headers,
        body: body
      };

      callback(false, data);
    });
  };

})(
  require('path'),
  require('node-fs-extra')
);
