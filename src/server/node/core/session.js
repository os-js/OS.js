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
const _cookie = require('cookie');
const _parser = require('cookie-parser');
const _session = require('express-session');

const _env = require('./env.js');
const _settings = require('./settings.js');
const _logger = require('./../lib/logger.js');

/**
 * An object with session helpers
 * @property  {String}    id      Session ID
 * @property  {Function}  set     Sets a session variable (can also be an object instead of key/val) => fn(k, v, save)
 * @property  {Function}  get     Gets a sesion variable => fn(k, default)
 * @property  {Function}  all     Gets all session variables
 * @property  {Function}  save    Saves session data => fn(cb)
 * @property  {Function}  destroy Destroys session and its data => fn(cb)
 * @typedef ServerSession
 */

/**
 * @namespace core.session
 */

let session;
let sessionStore;
let MODULE;

/**
 * Loads the Session module
 *
 * @param {Object}  opts  Options
 *
 * @function load
 * @memberof core.session
 * @return {Promise}
 */
module.exports.load = function(opts) {
  return new Promise((resolve, reject) => {
    const ok = () => resolve(opts);

    const dirname = _path.join(_env.get('MODULEDIR'), 'session');
    const config = _settings.get();
    const name = opts.SESSION || (config.http.session.module || 'memory');
    const path = _path.join(dirname, name + '.js');

    _logger.lognt('INFO', 'Loading:', _logger.colored('Session', 'bold'), path.replace(_env.get('ROOTDIR'), ''));

    MODULE = require(path);

    ok();
  });
};

/**
 * Gets the Session module
 *
 * @function get
 * @memberof core.session
 * @return {Object}
 */
module.exports.get = function() {
  return MODULE;
};

/**
 * Initializes session integration
 *
 * @param  {Object}    cfg        Imported configuration
 *
 * @function init
 * @memberof core.session
 * @return {Promise}
 */
module.exports.init = function(cfg) {
  return new Promise((resolve, reject) => {
    if ( session ) {
      resolve(session);
      return;
    }

    const cookie = {};
    Object.keys(cfg.cookie || {}).forEach((k) => {
      if ( cfg.cookie[k] !== null ) {
        cookie[k] = cfg.cookie[k];
      }
    });

    const opts = {
      resave: false,
      saveUninitialized: true, // Important for WS
      secret: cfg.secret || 'OS.js',
      name: cfg.name || 'connect.sid',
      cookie: cookie
    };

    const conf = cfg.options[cfg.module] || {};
    MODULE.register(_session, conf, _env.get(), opts).catch(reject).then(() => {
      sessionStore = opts.store;
      session = _session(opts);
      resolve(session);
    });
  });
};

/**
 * Handles a request with session(s)
 *
 * @param  {http.ClientRequest}    request     HTTP Request object
 * @param  {http.ServerResponse}   response    HTTP Response object
 *
 * @function request
 * @memberof core.session
 * @return {Promise}
 */
module.exports.request = function(request, response) {
  return new Promise((resolve) => {
    session(request, response, resolve);
  });
};

/**
 * Touches a session to keep it alive
 *
 * @param  {http.ClientRequest}    request     HTTP Request object
 * @param  {Object}                session     The session object
 * @param  {Function}              cb          Callback function
 *
 * @function touch
 * @memberof core.session
 */
module.exports.touch = function(request, session, cb) {
  if ( typeof sessionStore.touch === 'function' ) {
    const sid = module.exports.getSessionId(request);
    sessionStore.touch(sid, session, cb);
  } else {
    cb();
  }
};

/**
 * Touches a session to keep it alive
 *
 * @param  {http.ClientRequest}    request     HTTP Request object
 *
 * @function getSessionId
 * @memberof core.session
 * @return String
 */
module.exports.getSessionId = function(request) {
  const cookie = request.headers.cookie;
  if ( !cookie ) {
    return null;
  }

  const cookies = _cookie.parse(cookie);
  const secret = _settings.get('http.session.secret');
  return _parser.signedCookie(cookies['connect.sid'], secret);
};

/**
 * Gets a session from request
 *
 * @param  {http.ClientRequest}    request     HTTP Request object
 *
 * @function getSession
 * @memberof core.session
 * @return {Promise}
 */
module.exports.getSession = function(request) {
  return new Promise((resolve) => {
    session(request, {}, () => {
      resolve(request.session);
    });
  });
};

/**
 * Gets a session interface
 *
 * @param  {http.ClientRequest}    request     HTTP Request object
 *
 * @function getInterface
 * @memberof core.session
 * @return {Object}
 */
module.exports.getInterface = function(request) {
  const obj = {
    id: request.session.id,

    destroy: function(cb) {
      return request.session.destroy(cb);
    },

    all: function() {
      const dict = {};
      Object.keys(request.session).filter((k) => {
        return k !== 'cookie';
      }).forEach((k) => {
        dict[k] = request.session[k];
      });
      return dict;
    },

    set: function(k, v, save) {
      if ( typeof k === 'object' ) {
        Object.keys(k).forEach((kk) => {
          request.session[kk] = String(k[kk]);
        });
      } else {
        request.session[k] = String(v);
      }

      if ( save ) {
        obj.save(save);
      }
    },

    get: function(k, d) {
      let v = request.session[k];
      if ( typeof v === 'undefined' ) {
        return d;
      }
      return v;
    },

    save: function(cb) {
      if ( typeof cb !== 'function' ) {
        cb = function() {};
      }

      if ( request.session ) {
        request.session.save(cb);
      } else {
        cb();
      }
    }
  };

  return Object.freeze(obj);
};
