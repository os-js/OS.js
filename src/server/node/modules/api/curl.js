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
/*eslint strict:["error", "global"]*/
'use strict';

/**
 * @namespace modules.api
 */

const _instance = require('./../../core/instance.js');

/**
 * Do a HTTP request
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Object}           args          Request args
 *
 * @param   {String}    args.method                HTTP Call method (GET/POST/HEAD)
 * @param   {String}    args.url                   HTTP Call URL
 * @param   {Object}    args.body                  HTTP POST Payload (alias: query)
 * @param   {Number}    args.timeout               Timeout in seconds (default=0)
 * @param   {Boolean}   [args.binary=false]        Return binary (default=false)
 * @param   {String}    [args.mime]                If binary, which MIME
 * @param   {Object}    [args.headers]             Custom HTTP headers ({key:val})
 * @param   {Boolean}   [args.json]                Send request as JSON (autodetected)
 * @param   {String}    [args.contentType]         Specify the content-type (autodetected)
 *
 * @function curl
 * @memberof modules.api
 */
module.exports.curl = function(http, args) {
  const logger = _instance.getLogger();
  const url = args.url;

  var curlRequest = (function parseRequestParameters() {
    const query = args.body || args.query || {}; // 'query' was the old name, but kept for compability
    const binary = args.binary === true;
    const method = args.method || 'GET';
    const mime = args.mime || (binary ? 'application/octet-stream' : null);

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
            logger.log(logger.WARNING, 'Failed to transform curl query', e.stack, e);
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

  return new Promise(function(resolve, reject) {
    if ( !url ) {
      return reject('cURL expects an \'url\'');
    }

    require('request')(curlRequest.opts, function(error, response, body) {
      if ( error ) {
        return reject(error);
      }

      if ( curlRequest.binary && body ) {
        body = 'data:' + curlRequest.mime + ';base64,' + (body.toString('base64'));
      }

      resolve({
        httpVersion: response.httpVersion,
        httpCode: response.statusCode,
        headers: response.headers,
        body: body
      });
    });
  });
};
