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
(function(_osjs, _http, _path, _url, _fs, _qs, _multipart, _cookies) {

  var instance;

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function respond(data, mime, response, headers, code, pipeFile) {
    data    = data    || '';
    headers = headers || [];
    mime    = mime    || 'text/html; charset=utf-8';
    code    = code    || 200;

    function _end() {
      if ( instance.handler && instance.handler.onRequestEnd ) {
        instance.handler.onRequestEnd(null, response);
      }

      response.end();
    }

    for ( var i = 0; i < headers.length; i++ ) {
      response.writeHead.apply(response, headers[i]);
    }

    response.writeHead(code, {'Content-Type': mime});

    if ( pipeFile ) {
      var stream = _fs.createReadStream(pipeFile, {bufferSize: 64 * 1024});
      stream.on('end', function() {
        _end();
      });
      stream.pipe(response);
    } else {
      response.write(data);
      _end();
    }
  }

  function respondJSON(data, response, headers) {
    data = JSON.stringify(data);
    if ( instance.config.logging ) {
      console.log('>>>', 'application/json');
    }
    respond(data, 'application/json', response, headers);
  }

  function respondFile(path, request, response, jpath) {
    var fullPath = jpath ? path : instance.vfs.getRealPath(path, instance.config, request).root;
    _fs.exists(fullPath, function(exists) {
      if ( exists ) {
        var mime = instance.vfs.getMime(fullPath, instance.config);
        if ( instance.config.logging ) {
          console.log('>>>', mime, path);
        }
        respond(null, mime, response, null, null, fullPath);
      } else {
        if ( instance.config.logging ) {
          console.log('!!!', '404', fullPath);
        }
        respond('404 Not Found', null, response, null, 404);
      }
    });
  }

  function fileGET(path, request, response, arg) {
    if ( !arg ) {
      if ( instance.config.logging ) {
        console.log('===', 'FileGET', path);
      }
      try {
        instance.handler.checkPrivilege(request, response, 'vfs');
      } catch ( e ) {
        respond(e, 'text/plain', response, null, 500);
      }
    }

    respondFile(unescape(path), request, response, arg);
  }

  function filePOST(fields, files, request, response) {
    try {
      instance.handler.checkPrivilege(request, response, 'upload');
    } catch ( e ) {
      respond(e, 'text/plain', response, null, 500);
    }

    instance.vfs.upload([
      files.upload.path,
      files.upload.name,
      fields.path,
      String(fields.overwrite) === 'true'
    ], request, function(err, result) {
      if ( err ) {
        respond(err, 'text/plain', response, null, 500);
      } else {
        respond(result, 'text/plain', response);
      }
    }, instance.config);
  }

  function coreAPI(url, path, POST, request, response) {
    if ( path.match(/^\/API/) ) {
      try {
        var data         = JSON.parse(POST);
        var method       = data.method;
        var args         = data['arguments'] || {}

        if ( instance.config.logging ) {
          console.log('===', 'CoreAPI', method, args);
        }

        instance.request(method, args, function(error, result) {
          respondJSON({result: result, error: error}, response);
        }, request, response);
      } catch ( e ) {
        console.error('!!! Caught exception', e);
        console.warn(e.stack);

        respondJSON({result: null, error: '500 Internal Server Error: ' + e}, response);
      }
      return true;
    }
    return false;
  }

  function httpCall(request, response) {
    var url     = _url.parse(request.url, true),
        path    = decodeURIComponent(url.pathname),
        cookies = new _cookies(request, response);

    request.cookies = cookies;

    if ( path === '/' ) {
      path += 'index.html';
    }

    if ( instance.config.logging ) {
      console.log('<<<', path);
    }

    if ( instance.handler && instance.handler.onRequestStart ) {
      instance.handler.onRequestStart(request, response);
    }

    if ( request.method == 'POST' ) {
      if ( path.match(/^\/FS$/) ) { // File upload
        var form = new _multipart.IncomingForm({
          uploadDir: instance.config.tmpdir
        });
        form.parse(request, function(err, fields, files) {
          filePOST(fields, files, request, response);
        });
      } else { // API Calls
        var body = '';
        request.on('data', function(data) {
          body += data;
        });

        request.on('end', function() {
          if ( !coreAPI(url, path, body, request, response) ) {
            if ( instance.config.logging ) {
              console.log('>>>', '404', path);
            }
            respond('404 Not Found', null, response, [[404, {}]]);
          }
        });
      }
    } else { // File reads
      if ( path.match(/^\/FS/) ) {
        fileGET(path.replace(/^\/FS/, ''), request, response, false);
      } else {
        fileGET(_path.join(instance.config.distdir, path.replace(/^\//, '')), request, response, true);
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  var instance, server;
  module.exports = {
    listen: function(setup) {
      instance = _osjs.init(setup);
      server = _http.createServer(httpCall);

      if ( setup.logging !== false ) {
        console.log(JSON.stringify(instance.config, null, 2));
      }

      if ( instance.handler && instance.handler.onServerStart ) {
        instance.handler.onServerStart(instance.config);
      }

      server.listen(setup.port || instance.config.port);
    },

    close: function(cb) {
      cb = cb || function() {};

      if ( instance.handler && instance.handler.onServerEnd ) {
        instance.handler.onServerEnd(instance.config);
      }

      if ( server ) {
        server.close(cb);
      } else {
        cb();
      }
    }
  };
})(
  require('osjs'),
  require('http'),
  require('path'),
  require('url'),
  require('node-fs-extra'),
  require('querystring'),
  require('formidable'),
  require('cookies')
);
