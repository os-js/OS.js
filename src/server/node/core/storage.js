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

const _settings = require('./../core/settings.js');
const _logger = require('./../core/logger.js');

let MODULE;

/**
 * @namespace core.storage
 */

/**
 * Loads the Storage module
 *
 * @param {String}  path  Path to module
 * @param {String}  name  Name of module
 *
 * @function load
 * @memberof core.storage
 * @return {Promise}
 */
module.exports.load = function(path, name) {
  return new Promise((resolve, reject) => {

    try {
      const a = require(path);
      const c = _settings.get().modules.storage[name] || {};
      const r = a.register(c);
      MODULE = a;

      if ( r instanceof Promise ) {
        r.then(resolve).catch(reject);
      } else {
        resolve();
      }
    } catch ( e ) {
      _logger.lognt('WARN', _logger.colored('Warning:', 'yellow'), e);
      console.warn(e.stack);
      reject(e);
    }
  });
};

/**
 * Gets the Storage module
 *
 * @function get
 * @memberof core.storage
 * @return {Object}
 */
module.exports.get = function() {
  return MODULE;
};
