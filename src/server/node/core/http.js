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
 * @namespace core.http
 */

/**
 * An object with session helpers
 * @property  {String}    id      Session ID
 * @property  {Function}  set     Sets a session variable
 * @property  {Function}  get     Gets a sesion variable
 * @typedef ServerSession
 */

/**
 * An object filled with data regarding the Server request. Also allows you to use a responder to
 * interrupt the normal procedures.
 * @property  {http.Server}           _http       Node HTTP server
 * @property  {ws.Server}             _ws         Node WebSocket server
 * @property  {ProxyServer}           _proxy      Node Proxy server
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

/**
 * Sends a response directly to the connection
 *
 * @property  {Function}    raw     Respond with raw data
 * @property  {Function}    error   Respond with a error
 * @property  {Function}    file    Respond with a file
 * @property  {Function}    stream  Respond with a stream
 * @property  {Function}    json    Respond with JSON
 * @typedef ServerResponder
 */

///////////////////////////////////////////////////////////////////////////////
// GLOBALS
///////////////////////////////////////////////////////////////////////////////

const _vfs = require('./vfs.js');
const _instance = require('./instance.js');
const _auth = require('./auth.js');
const _utils = require('./utils.js');

const _url = require('url');
const _fs = require('node-fs-extra');
const _path = require('path');
const _cookie = require('cookie');
const _session = require('simple-session');
const _formidable = require('formidable');

var httpServer = null;
var websocketServer = null;
var proxyServer = null;
var websocketMap = {};
var sidMap = {};

///////////////////////////////////////////////////////////////////////////////
// APIs
///////////////////////////////////////////////////////////////////////////////

/*
 * Checks given request path and figures out if this is a configured proxy
 * address. If it was found, the normal server procedure is interrupted and
 * will perform a proxy request.
 */
function proxyCall(env, proxy, request, response) {
  const logger = _instance.getLogger();

  function _getMatcher(k) {
    var matcher = k;

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

  const proxies = (_instance.getConfig()).proxies;
  if ( proxy && proxies ) {
    return !Object.keys(proxies).every(function(k) {
      const matcher = _getMatcher(k);
      if ( typeof matcher === 'string' ? isStringMatch(matcher, request.url) : matcher.test(request.url) ) {
        const pots = _getOptions(request.url, matcher, proxies[k]);

        logger.log('VERBOSE', logger.colored('PROXY', 'bold'), k, '=>', pots.target);

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
function handleRequest(http) {
  const logger = _instance.getLogger();
  const env = _instance.getEnvironment();
  const api = _instance.getAPI();

  // We use JSON as default responses, no matter what
  function _rejectResponse(err) {
    if ( typeof err === 'undefined' ) {
      err = '<undefined error>';
    }

    logger.log('ERROR', logger.colored(err, 'red'), err.stack || '<no stack trace>');

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
    http.respond.json({
      error: null,
      result: result
    });
  }

  // Wrapper for checking permissions
  function _checkPermission(type, options) {
    const skip = type === 'api' && ['login'].indexOf(options.method) !== -1;

    return new Promise(function(resolve, reject) {
      if ( skip ) {
        resolve();
      } else {
        _auth.checkSession(http).then(resolve).catch(_rejectResponse);
      }
    }).then(function() {
      return new Promise(function(resolve, reject) {
        if ( skip ) {
          resolve();
        } else {
          _auth.checkPermission(http, type, options).then(resolve).catch(_rejectResponse);
        }
      });
    }).catch(_rejectResponse);
  }

  // Wrappers for performing API calls
  function _vfsCall() {
    var method = http.endpoint.replace(/(^get\/)?/, '');
    var args = http.data;

    if ( http.endpoint.match(/^get\//) ) {
      method = 'read';
      args = {path: http.endpoint.replace(/(^get\/)?/, '')};
    }

    _checkPermission('fs', {method: method, args: args}).then(function() {
      _vfs.request(http, method, args).then(_resolveResponse).catch(_rejectResponse);
    }).catch(_rejectResponse);
  }

  function _apiCall() {
    _checkPermission('api', {method: http.endpoint}, http.data).then(function() {
      const session_id = http.session.id;
      api[http.endpoint](http, http.data).then(function(res) {
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
  }

  function _staticResponse() {
    const path = _path.join(env.ROOTDIR, env.DIST, _path.normalize(http.path));

    function _serve() {
      http.respond.file(path);
    }

    function _deny() {
      http.respond.error('Access denied', 403);
    }

    const pmatch = http.path.match(/^\/?packages\/(.*\/.*)\/(.*)/);
    if ( pmatch || _fs.existsSync(path) ) {
      if ( pmatch && pmatch.length === 3 ) {
        _checkPermission('package', {path: pmatch[1]}).then(function() {
          _auth.checkSession(http)
            .then(_serve).catch(_deny);
        }).catch(_deny);
      } else {
        _serve();
      }

      return true;
    }

    return false;
  }

  function _middlewareRequest(method, done) {
    const middleware = _instance.getMiddleware();
    _utils.iterate(middleware, function(iter, idx, next) {
      iter.request(http, function(error) {
        if ( error ) {
          done(error);
        } else {
          next();
        }
      });
    }, function() {
      done(false);
    });
  }

  // Take on the HTTP request
  _auth.initSession(http).then(function() {
    const method = http.request.method;

    if ( http.isfs ) {
      _vfsCall();
    } else if ( http.isapi ) {
      if ( method === 'POST' && typeof api[http.endpoint] === 'function' ) {
        _apiCall();
      } else {
        http.respond.json({
          error: 'No such API method'
        }, 500);
      }
    } else {
      if ( method === 'GET' ) {
        if ( _staticResponse() ) {
          return;
        }
      }

      _middlewareRequest(method, function(error) {
        if ( error ) {
          http.respond.error('Method not allowed', 405);
        }
      });
    }
  });
}

/*
 * Creates a `ServerResponder` object for HTTP connections.
 * This allows you to respond with data in a certain format.
 */
function createHttpResponder(env, response) {
  function _raw(data, code, headers) {
    code = code || 200;
    headers = headers || {};

    response.writeHead(code, headers);
    response.write(data)
    response.end();
  }

  function _error(message, code) {
    code = code || 500;

    _raw(String(message), code);
  }

  function _stream(path, stream, code, mime) {
    if ( !mime && path ) {
      mime = _vfs.getMime(path);
    }

    stream.pipe(response);

    stream.on('error', function() {
      _error('File not found', 404);
    });

    stream.on('end', function() {
      try {
        response.writeHead(code || 200, {
          'Content-Type': mime
        });
      } catch ( e ) {
        // NOTE: For unknown reasons it always sais headers are already sent on first requst ?!
      }

      response.end();
    });
  }

  return Object.freeze({
    _http: httpServer,
    _ws: websocketServer,
    _proxy: proxyServer,

    error: _error,
    raw: _raw,

    json: function(data, code) {
      if ( typeof data !== 'string' ) {
        data = JSON.stringify(data);
      }

      _raw(data, 200, {
        'Content-Type': 'application/json'
      });
    },

    stream: _stream,

    file: function(path, options, code) {
      options = options || {};

      const stream = _fs.createReadStream(path, {
        bufferSize: 64 * 1024
      });

      _stream(path, stream, code);
    }
  });
}

/*
 * Creates a `ServerResponder` object for WebSocket connections.
 * This allows you to respond with data in a certain format.
 */
function createWebsocketResponder(ws, index) {
  function _json(message) {
    if ( typeof message === 'object' ) {
      message._index = index;
    }
    ws.send(JSON.stringify(message))
  }

  return Object.freeze({
    _http: httpServer,
    _ws: websocketServer,
    _proxy: proxyServer,

    raw: function(data) {
      ws.send(data);
    },

    stream: function() {
      _json({error: 'Not available'});
    },

    file: function() {
      _json({error: 'Not available'});
      return false;
    },

    json: function(data) {
      _json(data);
    },

    error: function(error) {
      _json({error: error});
    }
  });
}

/*
 * Creates the `ServerRequest` object passed around.
 */
function createHttpObject(request, response, path, data, responder, session_id, files) {
  return Object.freeze({
    request: request,
    response: request,
    method: request.method,
    path: path,
    data: data || {},
    files: files || {},
    isfs: path.match(/^\/FS/) !== null,
    isapi: path.match(/^\/API/) !== null,
    endpoint: path.replace(/^\/(FS|API)\/?/, ''),
    respond: responder,
    session: {
      id: session_id,
      set: function(k, v) {
        return _session.set(session_id, k, v === null ? null : String(v));
      },
      get: function(k) {
        const v = _session.get(session_id, k);
        return v !== false ? v[0] : false;
      }
    }
  });
}

/*
 * Creates the HTTP, WebSocket and Proxy servers for OS.js
 */
function createServer(env, resolve, reject) {
  const config = _instance.getConfig();
  const httpConfig = config.http || {};
  const logger = _instance.getLogger();

  function onRequest(request, response) {
    const rurl = request.url === '/' ? '/index.html' : request.url;
    const url = _url.parse(rurl, true);
    const path = decodeURIComponent(url.pathname);
    const session_id = _session.init(request, response);
    const contentType = request.headers['content-type'] || '';

    if ( proxyCall(env, proxyServer, request, response) ) {
      logger.log('VERBOSE', logger.colored('PROXY', 'bold'), path);
      return;
    }

    logger.log('VERBOSE', logger.colored(request.method, 'bold'), path);

    const respond = createHttpResponder(env, response);
    if ( request.method === 'POST' ) {
      if ( contentType.indexOf('application/json') !== -1 ) {
        var body = [];
        request.on('data', function(data) {
          body.push(data);
        });

        request.on('end', function() {
          const data = JSON.parse(Buffer.concat(body));
          handleRequest(createHttpObject(request, response, path, data, respond, session_id));
        });
      } else if ( contentType.indexOf('multipart/form-data') !== -1 ) {
        const form = new _formidable.IncomingForm({
          uploadDir: config.tmpdir
        });

        form.parse(request, function(err, fields, files) {
          handleRequest(createHttpObject(request, response, path, fields, respond, session_id, files));
        });
      }
    } else {
      handleRequest(createHttpObject(request, response, path, {}, respond, session_id));
    }
  }

  // Proxy servers
  try {
    proxyServer = require('http-proxy').createProxyServer({});
    proxyServer.on('error', function(err) {
      console.warn(err);
    });
  } catch ( e ) {}

  // HTTP servers
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
    websocketServer = new (require('ws')).Server({server: httpServer});

    websocketServer.on('connection', function(ws) {
      logger.log('VERBOSE', logger.colored('WS', 'bold'), 'New connection...');

      const cookie = _cookie.parse(ws.upgradeReq.headers.cookie);
      const sid = cookie.session;

      ws.on('message', function(data) {
        const message = JSON.parse(data);
        const path = message.path;
        const respond = createWebsocketResponder(ws, message._index);

        handleRequest(createHttpObject({
          method: 'POST',
          url: path
        }, null, path, message.args, respond, sid));
      });

      ws.on('close', function() {
        logger.log('VERBOSE', logger.colored('WS', 'bold'), 'Connection closed...');

        if ( typeof websocketMap[sid] !== 'undefined' ) {
          delete websocketMap[sid];
        }
      });

      websocketMap[sid] = ws;
    });
  }

  resolve({
    httpServer: httpServer,
    websocketServer: websocketServer,
    proxyServer: proxyServer
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
  const foundSid = null;

  Object.keys(sidMap).forEach(function(sid) {
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
 * @function init
 * @memberof core.http
 */
module.exports.init = function init(env) {
  return new Promise(function(resolve, reject) {
    createServer(env, resolve, reject);
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

