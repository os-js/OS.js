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
const session = require('express-session');
const bodyParser = require('body-parser');
const compression = require('compression');
const formidable = require('formidable');
const cookie = require('cookie');
const parser = require('cookie-parser');
const morgan = require('morgan');
const proxy = require('http-proxy');
const jsonTransform = require('express-json-transform');

const Settings = require('./../settings.js');
const Modules = require('./../modules.js');

const tmpdir = (() => {
  try {
    return require('os').tmpdir();
  } catch ( e ) {
    return '/tmp';
  }
})();

/**
 * Base Connection Class
 */
class Connection {

  constructor(app) {
    this.app = app;
    this.server = null;
    this.websocket = null;
    this.proxy = null;
    this.sidMap = {};
  }

  /**
   * Registers the module
   * @return {Promise<Boolean, Error>}
   */
  register() {
    return new Promise((resolve, reject) => {
      if ( Settings.option('LOGLEVEL') ) {
        this.app.use(morgan(Settings.get('logger.format')));
      }

      this.app.use(bodyParser.json());

      this.app.use(jsonTransform((json) => {
        if ( json.error instanceof Error ) {
          console.warn(json.error);
          json.error = json.error.toString();
        }

        return json;
      }));

      this.app.use(compression({
        level: Settings.get('http.compression.level'),
        memLevel: Settings.get('http.compression.memLevel')
      }));

      this.session = session({
        store: Modules.loadSession(session),
        resave: false,
        saveUninitialized: true, // Important for WS
        name: Settings.get('http.session.name') || 'connect.sid',
        secret: Settings.get('http.session.secret'),
        cookie: Settings.get('http.session.cookie')
      });

      this.app.use(this.session);

      this.proxy = proxy.createProxyServer({});
      this.proxy.on('error', (err) => {
        console.warn(err);
      });

      return resolve(true);
    });
  }

  /**
   * Destroys the module
   * @return {Promise<Boolean, Error>}
   */
  destroy() {
    this.sidMap = {};

    if ( this.proxy ) {
      this.proxy.close();
    }

    return Promise.resolve(true);
  }

  /**
   * Broadcast a message
   * @param {String} username User
   * @param {String} action Action
   * @param {*} message Message
   */
  broadcast(username, action, message) {
  }

  /**
   * Get the running server
   * @return {HttpServer}
   */
  getServer() {
    return this.server;
  }

  /**
   * Get the running websocket server
   * @return {WebSocketServer}
   */
  getWebsocket() {
    return this.websocket;
  }

  /**
   * Get the running proxy server
   * @return {ProxyServer}
   */
  getProxy() {
    return this.proxy;
  }

  /**
   * Gets the session ID from reqeuest
   * @param {IncomingMessage} request The http request
   * @return {String}
   */
  getSessionId(request) {
    const header = request.headers.cookie;
    if ( !header ) {
      return null;
    }

    const cookies = cookie.parse(header);
    const secret = Settings.get('http.session.secret');
    const key = Settings.get('http.session.name') || 'connect.sid';
    return parser.signedCookie(cookies[key], secret);
  }

  /**
   * Creates a session wrapper
   * @param {IncomingMessage} request The http request
   * @return {Object}
   */
  getSessionWrapper(request) {
    return {
      set: (k, v) => {
        request.session[k] = v;
      },
      get: (k) => {
        return request.session[k];
      }
    };
  }

  /**
   * Creates a request wrapper
   * @return {Object}
   */
  getWrapper() {
    const methods = ['post', 'get', 'head', 'put', 'delete'];
    const wrapperMethods = {
      broadcastMessage: (u, a, m) => this.broadcast(u, a, m),
      isWebsocket: () => !!this.getWebsocket(),
      getServer: () => this.getServer(),
      getProxy: () => this.getProxy(),
      getWebsocket: () => this.getWebsocket(),
      getApp: () => this.app,
      setActiveUser: (req, add) => {
        const sid = this.getSessionId(req);
        const username = req.session.username;

        if ( add ) {
          this.sidMap[sid] = username;
        } else {
          if ( this.sidMap[sid] ) {
            delete this.sidMap[sid];
          }
        }
      }
    };

    const createHttpObject = (req, res, next, data) => {
      if ( typeof data === 'undefined' ) {
        data = req.method.toUpperCase() === 'POST' ? req.body : req.query;
      }

      return Object.assign({
        request: req,
        response: res,
        next: next,
        data: data,
        session: this.getSessionWrapper(req)
      }, wrapperMethods);
    };

    const result = Object.assign({
      use: (cb) => {
        if ( cb.length > 4 ) { // We have one extra argument in wrapper
          this.app.use(function(err, req, res, next) {
            const nargs = [createHttpObject(req, res, next), err, req, res, next];
            cb(...nargs);
          });
        } else {
          this.app.use(function(req, res, next) {
            const nargs = [createHttpObject(req, res, next), req, res, next];
            cb(...nargs);
          });
        }
      },
      upload: (q, cb) => {
        const form = new formidable.IncomingForm({
          uploadDir: tmpdir
        });

        this.app.post(q, (req, res, next) => {
          form.parse(req, (err, fields, files) => {
            cb(createHttpObject(req, res, next, {fields, files}), req, res, next);
          });
        });
      }
    }, wrapperMethods);

    methods.forEach((method) => {
      result[method] = (q, cb) => {
        return this.app[method](q, (req, res, next) => {
          return cb(createHttpObject(req, res, next), req, res, next);
        });
      };
    });

    return result;
  }

}

module.exports = Connection;
