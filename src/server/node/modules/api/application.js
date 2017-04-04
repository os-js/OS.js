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

const _fs = require('fs');
const _path = require('path');
const _env = require('./../../core/env.js');
const _metadata = require('./../../core/metadata.js');
const _settings = require('./../../core/settings.js');
const _logger = require('./../../lib/logger.js');
const _utils = require('./../../lib/utils.js');

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
 * @return {Promise}
 */
module.exports.application = function(http, data) {
  const env = _env.get();
  const config = _settings.get();

  /*eslint dot-notation: "off"*/
  const apath = data.path || null;
  const ameth = data.method || null;
  const aargs = data.args || {};

  const manifest = _metadata.get(apath);
  if ( !manifest ) {
    return Promise.reject('No such package');
  }

  const filename = _utils.getPackageMainFile(manifest);
  const rpath = _path.resolve(env.ROOTDIR, manifest._src);
  const fpath = _path.join(rpath, filename);

  return new Promise((resolve, reject) => {
    // NOTE: Deprecated for old node
    //_fs.access(fpath, _fs.constants.R_OK, (err) => {
    _fs.exists(fpath, (exists) => {
      if ( !exists ) {
        return reject('Failed to load Application API for ' + apath);
      }

      let found = null;
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
          let imported = {};
          module.register(imported, {}, {});

          if ( typeof imported[ameth] === 'function' ) {
            found = function backwardCompatibleApplicationApiCall() {
              imported[ameth](aargs, (error, result) => {
                if ( error ) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }, http.request, http.response, config);
            };
          }
        }
      } catch ( e ) {
        _logger.log(_logger.WARNING, e.stack, e.trace);
        return reject('Application API error: ' + e.toString());
      }

      if ( found ) {
        found();
      } else {
        reject('No such Application API method.');
      }
    });
  });
};
