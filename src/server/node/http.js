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
(function(_osjs, _path, _url, _fs, _qs, _multipart, _sessions) {
  'use strict';

  var instance, server, proxy, httpProxy;

  var colored = (function() {
    var colors;

    try {
      colors = require('colors');
    } catch ( e ) {}

    return function() {
      var args = Array.prototype.slice.call(arguments);
      var str = args.shift();

      if ( colors ) {
        var ref = colors;
        args.forEach(function(a) {
          ref = ref[a];
        });
        return ref(str);
      } else {
        return str;
      }
    };
  })();

  try {
    httpProxy = require('http-proxy');
    proxy = httpProxy.createProxyServer({});
    proxy.on('error', function(err) {
      console.warn(err);
    });
  } catch ( e ) {}

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Respond to HTTP Call
   */
  function respond(data, mime, response, headers, code, pipeFile) {
    if ( instance.config.logging ) {
      var okCodes = [200, 301, 302, 304];

      log(timestamp(), colored('>>>', 'grey', 'bold'), colored(String(code) + ' ' + mime, okCodes.indexOf(code) >= 0 ? 'green' : 'red'), (pipeFile ? '=> ' + colored(pipeFile.replace(instance.setup.root, '/'), 'magenta') : typeof data));
    }

    function done() {
      if ( instance.handler && instance.handler.onRequestEnd ) {
        instance.handler.onRequestEnd(null, response);
      }
      response.end();
    }

    if ( pipeFile ) {
      var isdir = false;
      try {
        isdir = _fs.lstatSync(pipeFile).isDirectory();
      } catch ( e ) {}

      if ( isdir ) {
        respondError('Invalid request', response);
        return;
      }
    }

    headers.forEach(function(h) {
      response.writeHead.apply(response, h);
    });

    response.writeHead(code, {
      'Content-Type': mime
    });

    if ( pipeFile ) {
      var stream = _fs.createReadStream(pipeFile, {bufferSize: 64 * 1024});
      stream.on('end', done);
      stream.pipe(response);
    } else {
      response.write(data);
      done();
    }
  }

  /**
   * Respond with a file
   */
  function respondFile(path, request, response, realPath) {
    if ( !realPath && path.match(/^(ftp|https?)\:\/\//) ) {
      if ( instance.config.vfs.proxy ) {
        try {
          require('request')(path).pipe(response);
        } catch ( e ) {
          console.error('!!! Caught exception', e);
          console.warn(e.stack);
          respondError(e, response);
        }
      } else {
        respondError('VFS Proxy is disabled', response);
      }
      return;
    }

    try {
      var fullPath = realPath ? path : instance.vfs.getRealPath(path, instance.config, request).root;
      _fs.exists(fullPath, function(exists) {
        if ( exists ) {
          var mime = instance.vfs.getMime(fullPath, instance.config);
          respond(null, mime, response, [], 200, fullPath);
        } else {
          respondNotFound(null, response, fullPath);
        }
      });
    } catch ( e ) {
      console.error('!!! Caught exception', e);
      console.warn(e.stack);
      respondError(e, response, true);
    }
  }

  /**
   * Respond with JSON data
   */
  function respondJSON(data, response, headers, code) {
    respond(JSON.stringify(data), 'application/json', response, headers || [], code || 200);
  }

  /**
   * Respond with an error
   */
  function respondError(message, response, json, code) {
    code = code || 500;

    if ( json ) {
      message = 'Internal Server Error (HTTP 500): ' + message.toString();
      respondJSON({result: null, error: message}, response, [], code);
    } else {
      respond(message.toString(), 'text/plain', response, [], code);
    }
  }

  /**
   * Respond with text
   */
  function respondText(response, message) {
    respond(message, 'text/plain', response, [], 200);
  }

  /**
   * Respond with 404
   */
  function respondNotFound(message, response, fullPath) {
    message = message || '404 Not Found';
    respond(message, null, response, [], 404, false);
  }

  /**
   * Gets timestamp
   */
  function timestamp() {
    var now = new Date();
    return now.toISOString();
  }

  /**
   * Logs a line
   */
  function log() {
    console.log(Array.prototype.slice.call(arguments).join(' '));
  }

  /////////////////////////////////////////////////////////////////////////////
  // HTTP
  /////////////////////////////////////////////////////////////////////////////

  function proxyCall(request, response) {

    function _getMatcher(k) {
      var matcher = k;
      if ( matcher.substr(0, 1) !== '/' ) {
        matcher = '/' + matcher;
      } else {
        var check = k.match(/\/(.*)\/([a-z]+)?/);
        if ( !check || !check[1] ) {
          console.warn('Invalid proxy route', k);
        }
        matcher = new RegExp(check[1], check[2] || '');
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
      var rm = m.replace(/^\//, '').replace(/\/$/, '');
      var um = u.replace(/^\//, '').replace(/\/$/, '');
      return rm === um;
    }

    if ( proxy ) {
      var proxies = instance.config.proxies;
      var stop = false;

      Object.keys(proxies).every(function(k) {
        var matcher = _getMatcher(k);

        if ( typeof matcher === 'string' ? isStringMatch(matcher, request.url) : matcher.test(request.url) ) {
          var pots = _getOptions(request.url, matcher, proxies[k]);

          stop = true;

          log(timestamp(), colored('<<<', 'bold'), request.url);
          log(timestamp(), colored('>>>', 'grey', 'bold'), colored(('PROXY ' + k + ' => ' + pots.target), 'yellow'));

          proxy.web(request, response, pots);
        }
        return !stop;
      });

      if ( stop ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Handles a HTTP Request
   */
  function httpCall(request, response) {

    function handleCall(rp, isVfs) {
      var body = '';

      request.on('data', function(data) {
        body += data;
      });

      request.on('end', function() {
        try {
          var args = JSON.parse(body);
          instance.request(isVfs, rp, args, function(error, result) {
            respondJSON({result: result, error: error}, response);
          }, request, response, instance.handler);
        } catch ( e ) {
          console.error('!!! Caught exception', e);
          console.warn(e.stack);
          respondError(e, response, true, 200);
        }
      });
    }

    function handleUpload() {
      var form = new _multipart.IncomingForm({
        uploadDir: instance.config.tmpdir
      });

      form.parse(request, function(err, fields, files) {
        if ( err ) {
          if ( instance.config.logging ) {
            respondError(err, response);
          }
        } else {
          instance.handler.checkAPIPrivilege(request, response, 'upload', function(err) {
            if ( err ) {
              respondError(err, response);
              return;
            }

            instance.vfs.upload({
              src: files.upload.path,
              name: files.upload.name,
              path: fields.path,
              overwrite: String(fields.overwrite) === 'true'
            }, function(err, result) {
              if ( err ) {
                respondError(err, response);
                return;
              }
              respondText(response, '1');
            }, request, response);
          });
        }
      });
    }

    function handleVFSFile(p) {
      var dpath = p.replace(/^\/(FS|API)(\/get\/)?/, '');
      instance.handler.checkAPIPrivilege(request, response, 'fs', function(err) {
        if ( err ) {
          respondError(err, response);
          return;
        }
        respondFile(unescape(dpath), request, response, false);
      });
    }

    function handleDistFile(p) {
      var rpath = p.replace(/^\/+/, '');
      var dpath = _path.join(instance.config.distdir, rpath);

      // Checks if the request was a package resource
      var pmatch = rpath.match(/^packages\/(.*\/.*)\/(.*)/);
      if ( pmatch && pmatch.length === 3 ) {
        instance.handler.checkPackagePrivilege(request, response, pmatch[1], function(err) {
          if ( err ) {
            respondError(err, response);
            return;
          }
          respondFile(unescape(dpath), request, response, true);
        });
        return;
      }

      // Everything else
      respondFile(unescape(dpath), request, response, true);
    }

    if ( !proxyCall(request, response) ) {
      return;
    }

    var url       = _url.parse(request.url, true);
    var path      = decodeURIComponent(url.pathname);
    var sid       = _sessions.init(request, response);

    request.session = {
      set: function(k, v) {
        return _sessions.set(sid, k, v === null ? null : String(v));
      },
      get: function(k) {
        var v = _sessions.get(sid, k);
        if ( v !== false ) {
          return v[0];
        }
        return false;
      }
    };

    if ( path === '/' ) {
      path += 'index.html';
    }

    if ( instance.config.logging ) {
      log(timestamp(), colored('<<<', 'bold'), path);
    }

    if ( instance.handler && instance.handler.onRequestStart ) {
      instance.handler.onRequestStart(request, response);
    }

    (function() {
      var isVfsCall = path.match(/^\/FS/) !== null;
      var relPath   = path.replace(/^\/(FS|API)\/?/, '');

      if ( request.method === 'POST' ) {
        if ( isVfsCall ) {
          if ( relPath === 'upload') {
            handleUpload();
          } else {
            handleCall(relPath, true);
          }
        } else {
          handleCall(relPath, false);
        }
      } else {
        if ( isVfsCall ) {
          handleVFSFile(path);
        } else { // dist files
          handleDistFile(path);
        }
      }
    })();
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Create HTTP server and listen
   *
   * @param   Object    setup       Configuration (see osjs.js)
   *
   * @option  setup     int       port        Listening port (default=null/auto)
   * @option  setup     String    dirname     Server running dir (ex: /osjs/src/server/node)
   * @option  setup     String    root        Installation root directory (ex: /osjs)
   * @option  setup     String    dist        Build root directory (ex: /osjs/dist)
   * @option  setup     boolean   nw          NW build (default=false)
   * @option  setup     boolean   logging     Enable logging (default=true)
   *
   * @api     http.listen
   */
  module.exports.listen = function(setup) {
    instance = _osjs.init(setup);

    var httpConfig = instance.config.http || {};

    if ( httpConfig.mode === 'http2' || httpConfig.mode === 'https' ) {
      var rdir = httpConfig.cert.path || _path.dirname(setup.dirname);
      var cname = httpConfig.cert.name || 'localhost';
      var copts = httpConfig.cert.options || {};

      copts.key = _fs.readFileSync(_path.join(rdir, cname + '.key'));
      copts.cert = _fs.readFileSync(_path.join(rdir, cname + '.crt'));

      server = require(httpConfig.mode).createServer(copts, httpCall);
    } else {
      server = require('http').createServer(httpCall);
    }

    instance.handler.onServerStart(function() {
      var port = setup.port || instance.config.port;
      if ( instance.config.logging ) {
        console.log('\n\n***');
        console.log('***', 'OS.js is listening on http://localhost:' + port + ' (handler:' + instance.config.handler + ' dir:' + instance.setup.dist + ' mode:' + httpConfig.mode + ')');
        console.log('***\n\n');
      }

      server.listen(port);
    });

  };

  /**
   * Closes the active HTTP server
   *
   * @param   Function  cb          Callback function
   *
   * @api     http.close
   */
  module.exports.close = function(cb) {
    cb = cb || function() {};

    instance.handler.onServerEnd(function() {
      if ( proxy ) {
        proxy.close();
      }

      instance.down();

      if ( server ) {
        server.close(cb);
      } else {
        cb();
      }
    });

  };

})(
  require('osjs'),
  require('path'),
  require('url'),
  require('node-fs-extra'),
  require('querystring'),
  require('formidable'),
  require('simple-session')
);
