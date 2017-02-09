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

const _path = require('path');
const _glob = require('glob-promise');

const _logger = require('./../core/logger.js');
const _settings = require('./../core/settings.js');

const MODULES = {};

/**
 * @namespace core.api
 */

/**
 * Loads the API modules
 *
 * @param {String}   dirname  Path to modules
 * @param {Function} cb       Callback on iter
 *
 * @function load
 * @memberof core.api
 * @return {Promise}
 */
module.exports.load = function(dirname, cb) {
  cb = cb || function() {};

  return new Promise((resolve, reject) => {
    _glob(_path.join(dirname, '*.js')).then((list) => {
      Promise.all(list.map((path) => {
        cb(path);

        const methods = require(path);
        Object.keys(methods).forEach((k) => {
          MODULES[k] = methods[k];
        });

        return Promise.resolve();
      })).then(resolve).catch(reject);
    }).catch(reject);
  });
};

/**
 * Gets the API modules
 *
 * @function get
 * @memberof core.api
 * @return {Object}
 */
module.exports.get = function() {
  return MODULES;
};

/**
 * Registers API methods
 *
 * @param {Object} module The module to import
 *
 * @function register
 * @memberof core.api
 * @return {Boolean}
 */
module.exports.register = function(module) {
  function _createOldInstance(env) {
    return {
      request: null,
      response: null,
      config: _settings.get(),
      handler: null,
      logger: _logger
    };
  }

  if ( typeof module.api === 'object' ) {
    Object.keys(module.api).forEach((k) => {
      MODULES[k] = module.api[k];
    });

    return false;
  } else if ( typeof module.register === 'function' ) {
    // Backward compatible with old API
    let backAPI = {};
    module.register(backAPI, {}, _createOldInstance());

    Object.keys(backAPI).forEach((k) => {
      MODULES[k] = function(http, resolve, reject, args) {
        backAPI[k](_createOldInstance(), args, (err, res) => {
          if ( err ) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      };
    });
  }
  return true;
};
