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

const _url = require('url');
const _path = require('path');
const _fs = require('fs-extra');
const _formidable = require('formidable');
const _compression = require('compression');

const _evhandler = require('../lib/evhandler.js');
const _logger = require('../lib/logger.js');

const _middleware = require('./middleware.js');
const _responder = require('./responder.js');
const _settings = require('./settings.js');
const _session = require('./session.js');
const _auth = require('./auth.js');
const _api = require('./api.js');
const _vfs = require('./vfs.js');
const _env = require('./env.js');

/**
 * @namespace core.http
 */

let httpServer = null;
let websocketServer = null;
let proxyServer = null;
let websocketMap = {};
let sidMap = {};

/**
 * An object filled with data regarding the Server request. Also allows you to use a responder to
 * interrupt the normal procedures.
 * @property  {http.ClientRequest}    request     HTTP Request object
 * @property  {http.ServerResponse}   response    HTTP Response object
 * @property  {String}                method      HTTP Method name
 * @property  {String}                path        HTTP Request path name (url)
 * @property  {String}                endpoint    Endpoint parsed from path name (url)
 * @property  {Object}                data        POST data (JSON)
 * @property  {Object}                files       POST files (uploads)
 * @property  {Boolean}               isfs        If this is a filesystem operation
 * @property  {Boolean}               isapi       If this is a api operation
 * @property  {ServerSession}         session     HTTP Session
 * @property  {ServerResponder}       respond     Responder object
 * @typedef ServerRequest
 */

///////////////////////////////////////////////////////////////////////////////
// APIs
///////////////////////////////////////////////////////////////////////////////

/*
 * Checks given request path and figures out if this is a configured proxy
 * address. If it was found, the normal server procedure is interrupted and
 * will perform a proxy request.
 */
function proxyCall(env, proxy, request, response) {

  function _getMatcher(k) {
    let matcher = k;

    const isRegexp = k.match(/\/(.*)\/([a-z]+)?/);
    if ( isRegexp && isRegexp.length === 3 ) {
      matcher = new RegExp(isRegexp[1], isRegexp[2] || '');
    } else {
      matcher = '/' + matcher.replace(/^\//, '');
    }

    return matcher;
  }

  function _getOptions(durl, matcher, pots) {
    if ( typeof pots === 'string' ) {
      if ( typeof matcher === 'string' ) {
        request.url = durl.substr(matcher.length) || '/';
      } else {
        request.url = durl.replace(matcher, '') || '/';
      }
      pots = {target: pots};
    }
    return pots;
  }

  function isStringMatch(m, u) {
    const rm = m.replace(/^\//, '').replace(/\/$/, '');
    const um = u.replace(/^\//, '').replace(/\/$/, '');
    return rm === um;
  }

  const proxies = _settings.get('proxies');
  if ( proxy && proxies ) {
    return !Object.keys(proxies).every((k) => {
      const matcher = _getMatcher(k);
      if ( typeof matcher === 'string' ? isStringMatch(matcher, request.url) : matcher.test(request.url) ) {
        const pots = _getOptions(request.url, matcher, proxies[k]);

        _logger.log('VERBOSE', _logger.colored('PROXY', 'bold'), k, '=>', pots.target);

        proxy.web(request, response, pots);

        return false;
      }

      return true;
    });
  }

  return false;
}

/*
 * Handles a HTTP request
 */
function handleRequest(http, onend) {
  onend = onend || function(h, cb) {
    cb(h, cb);
  };

  function _final() {
    _evhandler.emit('request:end', []);
  }

  // We use JSON as default responses, no matter what
  function _rejectResponse(err) {
    if ( typeof err === 'undefined' ) {
      err = '<undefined error>';
    }

    _logger.log('ERROR', _logger.colored(err, 'red'), err.stack || '<no stack trace>');

    _final();

    if ( !http.isfs && !http.isapi ) {
      http.respond.error(err, 403);
    } else {
      http.respond.json({
        error: String(err),
        result: false
      }, 403);
    }
  }

  function _resolveResponse(result) {
    _final();

    onend(http, () => {
      http.respond.json({
        error: null,
        result: result
      });
    });
  }

  // Wrapper for checking permissions
  function _checkPermission(type, options) {
    const skip = type === 'api' && ['login'].indexOf(options.method) !== -1;

    return new Promise((resolve, reject) => {
      if ( skip ) {
        resolve();
      } else {
        _auth.checkSession(http).then(resolve).catch(_rejectResponse);
      }
    }).then(() => {
      return new Promise((resolve, reject) => {
        if ( skip ) {
          resolve();
        } else {
          _auth.checkPermission(http, type, options).then(resolve).catch(_rejectResponse);
        }
      });
    }).catch(_rejectResponse);
  }

  function _staticResponse(method, finished) {
    const env = _env.get();
    const path = _path.join(env.ROOTDIR, env.DIST, _path.normalize(http.path));

    function _serve() {
      _evhandler.emit('request:end', []);

      http.respond.file(path, {
        cache: 'static'
      }).catch(finished);
    }

    function _deny() {
      _evhandler.emit('request:end', []);

      http.respond.error('Access denied', 403);
    }

    if ( method === 'GET' ) {
      const pmatch = http.path.match(/^\/?packages\/(.*\/.*)\/(.*)/);
      if ( pmatch && pmatch.length === 3 ) {
        _checkPermission('package', {path: pmatch[1]}).then(() => {
          _auth.checkSession(http)
            .then(_serve).catch(_deny);
        }).catch(_deny);
      } else {
        _serve();
      }
    } else {
      finished();
      return false;
    }

    return true;
  }

  // Take on the HTTP request
  _evhandler.emit('request:start', []);

  _auth.initSession(http).then(() => {
    const method = http.request.method;
    const session_id = http.session.id;

    if ( http.isfs ) {
      // VFS Call
      let func = http.endpoint;
      let args = http.data;

      if ( func === 'read' && http.method === 'GET' ) {
        args = {
          path: http.query.path,
          options: {
            download: http.query.download
          }
        };
      }

      _evhandler.emit('api:request', ['vfs', func]);

      _checkPermission('fs', {method: func, args: args}).then(() => {
        _vfs.request(http, func, args, _final).then(_resolveResponse).catch(_rejectResponse);
      }).catch(_rejectResponse);
    } else if ( http.isapi ) {
      // API Call

      _evhandler.emit('api:request', ['api', http.endpoint]);

      _checkPermission('api', {method: http.endpoint}, http.data).then(() => {
        _api.request(http).then((res) => {

          if ( http.endpoint === 'login' ) {
            const username = res.userData.username;
            sidMap[session_id] = username;
          } else if ( http.endpoint === 'logout' ) {
            if ( typeof sidMap[session_id] !== 'undefined' ) {
              delete sidMap[session_id];
            }
          }

          _resolveResponse(res);
        }).catch(_rejectResponse);
      }).catch(_rejectResponse);
    } else {
      // Assets and Middleware
      const isStatic = _staticResponse(method, () => {
        _middleware.request(http).then(_final).catch((error) => {
          _final();

          if ( error ) {
            http.respond.error('Method not allowed', 405);
          }
        });
      });

      _evhandler.emit('api:request', [isStatic ? 'static' : 'middleware', http.endpoint]);
    }
  });
}

/*
 * Creates the `ServerRequest` object passed around.
 */
function createHttpObject(request, response, path, data, responder, files) {
  const url = _url.parse(request.url, true);

  return Object.freeze({
    request: request,
    response: response,
    method: request.method,
    path: path,
    query: url.query || {},
    data: data || {},
    files: files || {},
    isfs: path.match(/^\/FS/) !== null,
    isapi: path.match(/^\/API/) !== null,
    endpoint: path.replace(/^\/(FS|API)\/?/, ''),
    respond: responder,
    session: _session.getInterface(request)
  });
}

/*
 * Creates the HTTP, WebSocket and Proxy servers for OS.js
 */
function createServer(resolve, reject) {
  let servers = {};

  const config = _settings.get();
  const env = _env.get();
  const httpConfig = config.http || {};
  const tmpdir = (() => {
    try {
      return require('os').tmpdir();
    } catch ( e ) {
      return '/tmp';
    }
  })();

  function onRequest(request, response) {

    _evhandler.emit('http:start', []);

    _session.request(request, response).then(() => {
      const rurl = request.url === '/' ? '/index.html' : request.url;
      const url = _url.parse(rurl, true);
      const path = decodeURIComponent(url.pathname);
      const contentType = request.headers['content-type'] || '';

      if ( proxyCall(env, proxyServer, request, response) ) {
        _logger.log('VERBOSE', _logger.colored('PROXY', 'bold'), path);
        return;
      }

      _logger.log('VERBOSE', _logger.colored(request.method, 'bold'), path);

      _compression(config.http.compression || {})(request, response, () => {
        const respond = _responder.createFromHttp(servers, request, response);
        if ( request.method === 'POST' ) {
          if ( contentType.indexOf('application/json') !== -1 ) {
            let body = [];
            request.on('data', (data) => {
              body.push(data);
            });

            request.on('end', () => {
              const data = body.length ? JSON.parse(Buffer.concat(body)) : {};
              handleRequest(createHttpObject(request, response, path, data, respond));
            });
          } else if ( contentType.indexOf('multipart/form-data') !== -1 ) {
            const form = new _formidable.IncomingForm({
              uploadDir: tmpdir
            });

            form.parse(request, (err, fields, files) => {
              handleRequest(createHttpObject(request, response, path, fields, respond, files));
            });
          }
        } else {
          handleRequest(createHttpObject(request, response, path, {}, respond));
        }
      });
    });
  }

  // Proxy servers
  try {
    proxyServer = require('http-proxy').createProxyServer({});
    proxyServer.on('error', (err) => {
      console.warn(err);
    });
  } catch ( e ) {}

  // HTTP servers
  _session.init(httpConfig.session || {}).catch(reject).then(() => {
    if ( httpConfig.mode === 'http2' || httpConfig.mode === 'https' ) {
      const rdir = httpConfig.cert.path || env.SERVERDIR;
      const cname = httpConfig.cert.name || 'localhost';
      const copts = httpConfig.cert.options || {};

      copts.key = _fs.readFileSync(_path.join(rdir, cname + '.key'));
      copts.cert = _fs.readFileSync(_path.join(rdir, cname + '.crt'));

      httpServer = require(httpConfig.mode).createServer(copts, onRequest);
    } else {
      httpServer = require('http').createServer(onRequest);
    }

    // Websocket servers
    if ( httpConfig.connection === 'ws' ) {
      const opts = {
        server: httpServer
      };

      const path = httpConfig.ws ? httpConfig.ws.path : '';
      const port = httpConfig.ws ? httpConfig.ws.port : 'upgrade';
      if ( port !== 'upgrade' ) {
        opts.port = port;
      }
      if ( path ) {
        opts.path = path;
      }

      websocketServer = new (require('ws')).Server(opts);
      websocketServer.on('connection', (ws) => {
        _logger.log('VERBOSE', _logger.colored('WS', 'bold'), 'New connection...');

        const sid = _session.getSessionId(ws.upgradeReq);

        _evhandler.emit('ws:connection', [ws]);

        ws.on('message', (data) => {
          const message = JSON.parse(data);
          const path = message.path;
          const respond = _responder.createFromWebsocket(servers, ws, message._index);

          _session.getSession(ws.upgradeReq).then((ss) => {
            const newReq = Object.assign(ws.upgradeReq, {
              session: ss,
              method: 'POST',
              url: path
            });

            handleRequest(createHttpObject(newReq, {}, path, message.args, respond), (http, cb) => {
              _session.touch(newReq, ss, cb);
            });
          });
        });

        ws.on('close', () => {
          _logger.log('VERBOSE', _logger.colored('WS', 'bold'), 'Connection closed...');

          if ( typeof websocketMap[sid] !== 'undefined' ) {
            delete websocketMap[sid];
          }
        });

        websocketMap[sid] = ws;
      });
    }

    servers.httpServer = httpServer;
    servers.proxyServer = proxyServer;
    servers.websocketServer = websocketServer;

    // Middleware
    _middleware.register(servers);

    resolve(servers);
  });
}

/*
 * Destroys server
 */
function destroyServer(cb) {
  if ( httpServer ) {
    httpServer.close();
  }

  if ( proxyServer ) {
    proxyServer.close();
  }

  if ( websocketServer ) {
    websocketServer.close();
  }

  if ( typeof cb === 'function' ) {
    cb();
  }
}

/*
 * Gets a WebSocket connection from username
 */
function getWebsocketFromUser(username) {
  let foundSid = null;

  Object.keys(sidMap).forEach((sid) => {
    if ( foundSid === null && sidMap[sid] === username ) {
      foundSid = sid;
    }
  });

  if ( websocketMap[foundSid] ) {
    console.warn('FOUND YOUR USER WEBSOCKET', foundSid);
    return websocketMap[foundSid];
  }

  return null;
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

/**
 * Initializes the HTTP server
 *
 * @param {ServerEnvironment} env   Server Environment
 *
 * @function init
 * @memberof core.http
 * @return {Promise}
 */
module.exports.init = function init() {
  return new Promise((resolve, reject) => {
    createServer(resolve, reject);
  });
};

/**
 * Runs the HTTP server
 *
 * @param {Number}    port      Which port number
 *
 * @function run
 * @memberof core.http
 */
module.exports.run = function run(port) {
  httpServer.listen(port);
};

/**
 * Broadcasts a message (only available over WebSocket)
 *
 * @param {String}    [username]      If a username is given, only this user recieves the message
 * @param {String}    action          An action that the client can identify
 * @param {Object}    message         Message data
 *
 * @function broadcastMessage
 * @memberof core.http
 */
module.exports.broadcastMessage = function(username, action, message) {
  const data = JSON.stringify({
    action: action,
    args: message
  });

  if ( username ) {
    const ws = getWebsocketFromUser(username);
    ws.send(data);
  } else {
    websocketServer.clients.forEach(function each(client) {
      client.send(data);
    });
  }
};

/**
 * Destroys the HTTP server
 *
 * @function destroy
 * @memberof core.http
 */
module.exports.destroy = destroyServer;

