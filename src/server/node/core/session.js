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
 * @namespace core.session
 */

const _session = require('express-session');
const _cookie = require('cookie');
const _parser = require('cookie-parser');
const _instance = require('./../core/instance.js');

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

var session;
var sessionStore;

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
  return new Promise(function(resolve, reject) {
    if ( session ) {
      resolve(session);
      return;
    }

    const cookie = {};
    Object.keys(cfg.cookie || {}).forEach(function(k) {
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

    _instance.getSession().register(_session, _instance.getEnvironment(), opts).catch(reject).then(function() {
      sessionStore = opts.store;
      session = _session(opts);
      resolve(session);
    });
  })
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
  return new Promise(function(resolve) {
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
  const sid = module.exports.getSessionId(request);
  sessionStore.touch(sid, session, cb);
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
  const cookies = _cookie.parse(request.headers.cookie);
  return _parser.signedCookie(cookies['connect.sid'], 'PNxiA3YGUVLwqeOtrubI7pIKW9ZQPPmq');
}

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
  return new Promise(function(resolve) {
    session(request, {}, function() {
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
      Object.keys(request.session).filter(function(k) {
        return k !== 'cookie';
      }).forEach(function(k) {
        dict[k] = request.session[k];
      });
      return dict;
    },

    set: function(k, v, save) {
      if ( typeof k === 'object' ) {
        Object.keys(k).forEach(function(kk) {
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
      var v = request.session[k];
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
