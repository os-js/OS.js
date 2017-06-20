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

const _fs = require('fs-extra');
const _path = require('path');
const _util = require('util');

const _vfs = require('./vfs.js');
const _env = require('./env.js');
const _settings = require('./settings.js');
const _evhandler = require('../lib/evhandler.js');

/**
 * @namespace core.responder
 */

/**
 * Sends a response directly to the connection
 *
 * @property  {http.Server}     _http   Node HTTP server
 * @property  {ws.Server}       _ws     Node WebSocket server
 * @property  {ProxyServer}     _proxy  Node Proxy server
 * @property  {Function}        raw     Respond with raw data
 * @property  {Function}        error   Respond with a error
 * @property  {Function}        file    Respond with a file
 * @property  {Function}        stream  Respond with a stream
 * @property  {Function}        json    Respond with JSON
 * @typedef ServerResponder
 */

function endResponse(response) {
  response.end(null, () => {
    _evhandler.emit('http:end', []);
  });
}

function getLastModifiedTimestamp(mtime) {

  function pad(n) {
    return n < 10 ? '0' + n : n;
  }

  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var now = new Date(mtime);
  var utc = new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes()
  ));

  return _util.format('%s, %s %s %s %s:%s:%s GMT',
                      days[utc.getDay()],
                      pad(utc.getDate()),
                      months[utc.getMonth()],
                      utc.getFullYear(),
                      pad(utc.getHours()),
                      pad(utc.getMinutes()),
                      pad(utc.getSeconds())
  );
}

/*
 * Creates a `ServerResponder` object for HTTP connections.
 * This allows you to respond with data in a certain format.
 *
 * @param  {Object}                servers     Server map
 * @param  {http.ClientRequest}    request     HTTP Request object
 * @param  {http.ServerResponse}   response    HTTP Response object
 *
 * @function createFromHttp
 * @memberof core.responder
 * @return {ServerResponder}
 */
module.exports.createFromHttp = function(servers, request, response) {
  const config = _settings.get();

  function _raw(data, code, headers) {
    code = code || 200;
    headers = headers || {};

    response.writeHead(code, headers);
    response.write(data);
    endResponse(response);
  }

  function _error(message, code) {
    code = code || 500;

    _raw(String(message), code);
  }

  function _stream(path, stream, code, mime, options) {
    options = options || {};
    code = code || 200;

    return new Promise((resolve, reject) => {
      _fs.stat(path, (err, stats) => {
        if ( err ) {
          if ( options.reject ) {
            reject();
          } else {
            _error('File not found', 404);
          }
          return;
        }

        const range = options.download ? false : request.headers.range;
        const headers = {
          'Content-Type': mime || _vfs.getMime(path) || 'text/plain',
          'Content-Length': stats.size
        };

        if ( options.download ) {
          headers['Content-Disposition'] = 'attachment; filename=' + _path.basename(path);
        }

        if ( stream === true ) {
          const opts = {
            bufferSize: 64 * 1024
          };

          if ( range ) {
            code = 206;

            const positions = range.replace(/bytes=/, '').split('-');
            const start = parseInt(positions[0], 10);
            const total = stats.size;
            const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

            opts.start = start;
            opts.end = end;

            headers['Content-Length'] = (end - start) + 1;
            headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + total;
            headers['Accept-Ranges'] = 'bytes';
          } else {
            try {
              const cacheEnabled = !_env.get('DEBUG');
              if ( cacheEnabled && options.cache ) {
                const cacheConfig = config.http.cache[options.cache];
                if ( typeof cacheConfig === 'object' ) {
                  Object.keys(cacheConfig).forEach((k) => {
                    headers[k] = cacheConfig[k];
                  });
                }
                if ( stats.mtime ) {
                  try {
                    // Last-Modified: <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
                    headers['Last-Modified'] = getLastModifiedTimestamp(stats.mtime);
                  } catch ( e ) {
                    headers['Last-Modified'] = stats.mtime;
                  }
                }
              }
            } catch ( e ) {
              // We can safely supress this. Errors due to configuration problems
            }
          }

          stream = _fs.createReadStream(path, opts);
        }

        stream.on('error', (err) => {
          console.error('An error occured while streaming', path, err);
          endResponse(response);
        });

        stream.on('end', () => {
          endResponse(response);
        });

        stream.on('open', () => {
          response.writeHead(code, headers);
          stream.pipe(response);
        });

        resolve();
      });
    });
  }

  return Object.freeze({
    _http: servers.httpServer,
    _proxy: servers.proxyServer,
    _ws: servers.websocketServer,

    error: _error,
    raw: _raw,

    json: function(data, code) {
      if ( typeof data !== 'string' ) {
        data = JSON.stringify(data);
      }

      _raw(data, 200, {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'Pragma': 'no-cache',
        'Expires': 0
      });
    },

    stream: _stream,

    file: function(path, options, code) {
      options = options || {};
      return _stream(path, true, code, null, options);
    }
  });
};

/**
 * Creates a `ServerResponder` object for WebSocket connections.
 * This allows you to respond with data in a certain format.
 *
 * @param   {Object}           servers       Server map
 * @param   {Websocket}        ws            Websocket connection
 * @param   {Number}           index         Request index
 *
 * @function createFromWebsocket
 * @memberof core.responder
 * @return {ServerResponder}
 */
module.exports.createFromWebsocket = function(servers, ws, index) {
  function _send(msg) {
    ws.send(msg);
  }

  function _json(message) {
    if ( typeof message === 'object' ) {
      message._index = index;
    }
    _send(JSON.stringify(message));
  }

  return Object.freeze({
    _http: servers.httpServer,
    _proxy: servers.proxyServer,
    _ws: servers.websocketServer,

    raw: function(data) {
      _send(data);
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
};
