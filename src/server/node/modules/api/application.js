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

const _path = require('path');
const _instance = require('./../../core/instance.js');

/**
 * Sends a request to an application
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Object}           data          Request data
 *
 * @param   {String}        data.path      Application path
 * @param   {String}        data.method    Application method name
 * @param   {Object}        data.args      Application method arguments
 *
 * @function application
 * @memberof modules.api
 */
module.exports.application = function(http, data) {
  const env = _instance.getEnvironment();
  const logger = _instance.getLogger();

  /*eslint dot-notation: "off"*/
  const apath = data.path || null;
  const ameth = data.method || null;
  const aargs = data.args || {};

  const manifest = _instance.getMetadata(apath) || {};
  const filename = manifest && manifest._indexFile ? manifest._indexFile : 'api.js';

  const aroot = _path.join(env.PKGDIR, apath);
  const fpath = _path.join(aroot, filename);

  return new Promise(function(resolve, reject) {
    var found = null;

    try {
      const module = require(fpath);
      if ( typeof module.api === 'object' ) {
        if ( typeof module.api[ameth] === 'function' ) {
          found = function applicationApiCall() {
            module.api[ameth](env, http, resolve, reject, aargs);
          };
        }
      } else {
        // Backward compatible with old API
        var imported = {};
        module.register(imported, {}, {});

        if ( typeof imported[ameth] === 'function' ) {
          found = function backwardCompatibleApplicationApiCall() {
            imported[ameth](aargs, function(error, result) {
              if ( error ) {
                reject(error);
              } else {
                resolve(result);
              }
            }, http.request, http.response, _instance.getConfig());
          };
        }
      }
    } catch ( e ) {
      logger.log(logger.WARNING, e.stack, e.trace);
      return reject('Application API error or missing: ' + e.toString(), null);
    }

    if ( found ) {
      found();
    } else {
      reject('No such Application API method.')
    }
  });
};
