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

const _fs = require('fs');
const _path = require('path');
const _sjc = require('simplejsonconf');

const _env = require('./env.js');

/**
 * @namespace core.settings
 */

let CACHE;

function read(opts) {
  opts = opts || {};
  const env = _env.get();
  const path = _path.join(env.SERVERDIR, 'settings.json');
  const data = _fs.readFileSync(path, 'utf-8');

  const safeWords = [
    '%VERSION%',
    '%DROOT%',
    '%UID%',
    '%USERNAME%'
  ];

  // Allow environmental variables to override certain internals in config
  data.match(/%([A-Z0-9_\-]+)%/g).filter((() => {
    let seen = {};
    return function(element, index, array) {
      return !(element in seen) && (seen[element] = 1);
    };
  })()).filter((w) => {
    return safeWords.indexOf(w) === -1;
  }).forEach((w) => {
    const p = w.replace(/%/g, '');
    const u = /^[A-Z]*$/.test(p);
    const v = u ? process.env[p] : null;
    if ( typeof v !== 'undefined' && v !== null ) {
      const re = w.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '$1');
      data = data.replace(new RegExp(re, 'g'), String(v));
    }
  });

  const config = Object.assign({
    api: {},
    vfs: {},
    http: {},
    mimes: {},
    proxies: {},
    modules: {}
  }, JSON.parse(data));

  config.modules = Object.assign({
    auth: {},
    storage: {}
  }, config.modules);

  if ( process.env.SECRET ) {
    config.http.session.secret = process.env.SECRET;
  }

  if ( opts.CONNECTION || process.env.CONNECTION ) {
    config.http.connection = opts.CONNECTION || process.env.CONNECTION;
  }

  CACHE = Object.freeze(config);
}

/**
 * Initializes the settings configuration tree with given
 * environmental variables and options.
 *
 * @param {Object} [opts] Opther option variables
 *
 * @memberof core.settings
 * @function init
 *
 * @return {Mixed}
 */
module.exports.init = function(opts) {
  read(opts);

  return CACHE;
};

/**
 * Gets the entire configuration tree for server settings
 *
 * @param {String}   [path]     Resolve this path and return entry
 *
 * @memberof core.settings
 * @function get
 *
 * @return {Mixed}
 */
module.exports.get = function(path) {
  if ( !CACHE ) {
    read();
  }
  return path ? _sjc.getJSON(CACHE, path) : CACHE;
};
