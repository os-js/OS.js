/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
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

(function(OSJS, _vfs, _http, _path, _url, _fs, _qs, _multipart, _cookies, _request) {
  /**
   * Globals and default settings etc.
   */
  var _NOLOG = false;
  var HTTP = {};
  var CONFIG = OSJS.CONFIG;
  var API = OSJS.API;
  var HANDLER = OSJS.HANDLER;
  var ISWIN = OSJS.ISWIN;
  var ROOTDIR = OSJS.ROOTDIR;
  var DISTDIR = OSJS.DISTDIR;

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * HTTP Output
   */
  var respond = function(data, mime, response, headers, code, pipeFile) {
    data    = data    || '';
    headers = headers || [];
    mime    = mime    || "text/html; charset=utf-8";
    code    = code    || 200;

    //console.log(">>>", 'respond()', mime, data.length);

    function _end() {
      if ( HANDLER && HANDLER.onRequestEnd ) {
        HANDLER.onRequestEnd(null, response);
      }

      response.end();
    }

    for ( var i = 0; i < headers.length; i++ ) {
      response.writeHead.apply(response, headers[i]);
    }

    response.writeHead(code, {"Content-Type": mime});

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

  };

  var respondJSON = function(data, response, headers) {
    data = JSON.stringify(data);
    console.log(">>>", 'application/json', data.length || 0);
    respond(data, 'application/json', response, headers);
  };

  /**
   * File Output
   */
  var respondFile = function(path, request, response, jpath) {
    var fullPath = jpath ? _path.join(CONFIG.directory, path) : _vfs.getRealPath(path, CONFIG, request).root;
    _fs.exists(fullPath, function(exists) {
      if ( exists ) {

        var mime = _vfs.getMime(fullPath, CONFIG);
        respond(null, mime, response, null, null, fullPath);
        /*


        _fs.readFile(fullPath, function(error, data) {
          if ( error ) {
            console.log(">>>", '500', fullPath);
            console.warn(error);
            respond("500 Internal Server Error", null, response, null, 500);
          } else {
            var mime = _vfs.getMime(fullPath, CONFIG);
            console.log(">>>", '200', mime, fullPath, data.length);
            respond(data, mime, response);
          }
        });
        */
      } else {
        console.log('!!!', '404', fullPath);
        respond("404 Not Found", null, response, null, 404);
      }
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // HTTP WRAPPER METHODS
  /////////////////////////////////////////////////////////////////////////////

  HTTP.FileGET = function(path, request, response, arg) {
    if ( !arg ) {
      console.log('---', 'FileGET', path);
      if ( !HANDLER.checkPrivilege(request, response, 'vfs') ) {
        return;
      }
    }

    respondFile(unescape(path), request, response, arg);
  };

  HTTP.FilePOST = function(fields, files, request, response) {
    if ( !HANDLER.checkPrivilege(request, response, 'upload') ) {
      return;
    }

    var srcPath = files.upload.path;
    var tmpPath = (fields.path + '/' + files.upload.name).replace('////', '///'); // FIXME
    var dstPath = _vfs.getRealPath(tmpPath, CONFIG, request).root;

    _fs.exists(srcPath, function(exists) {
      if ( exists ) {
        _fs.exists(dstPath, function(exists) {
          if ( exists ) {
            respond('Target already exist!', "text/plain", response, null, 500);
          } else {
            _fs.rename(srcPath, dstPath, function(error, data) {
              if ( error ) {
                respond('Error renaming/moving: ' + error, "text/plain", response, null, 500);
              } else {
                respond("1", "text/plain", response);
              }
            });
          }
        });
      } else {
        respond('Source does not exist!', "text/plain", response, null, 500);
      }
    });
  };

  HTTP.CoreAPI = function(url, path, POST, request, response) {
              /*
    if ( !HANDLER.checkPrivilege(request, response, 'upload') ) {
      return;
    }
    */

    if ( path.match(/^\/API/) ) {
      try {
        var data   = JSON.parse(POST);
        var method = data.method;
        var args   = data['arguments'] || {}

        console.log('---', 'CoreAPI', method, args);
        if ( API[method] ) {
          API[method](args, function(error, result) {
            respondJSON({result: result, error: error}, response);
          }, request, response, POST);
        } else {
          throw "Invalid method: " + method;
        }
      } catch ( e ) {
        console.error("!!! Caught exception", e);
        console.warn(e.stack);

        respondJSON({result: null, error: "500 Internal Server Error: " + e}, response);
      }
      return true;
    }
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT API METHODS
  /////////////////////////////////////////////////////////////////////////////

  API.application = function(args, callback, request, response) {
    if ( !HANDLER.checkPrivilege(request, response, 'application') ) {
      return;
    }

    var apath = args.path || null;
    var ameth = args.method || null;
    var aargs = args['arguments'] || [];

    var aroot = _path.join(CONFIG.repodir, apath);
    var fpath = _path.join(aroot, "api.js");

    try {
      require(fpath)[ameth](aargs, function(error, result) {
        callback(error, result);
      }, request, response);
    } catch ( e ) {
      callback("Application API error or missing: " + e.toString(), null);

      if ( !_NOLOG ) {
        console.warn(e.stack, e.trace);
      }
    }
  };

  API.fs = function(args, callback, request, response) {
    if ( !HANDLER.checkPrivilege(request, response, 'vfs') ) {
      return;
    }

    var m = args.method;
    var a = args['arguments'] || [];

    if ( _vfs[m] ) {
      _vfs[m](a, request, function(json) {
        if ( !json ) json = { error: 'No data from response' };
        callback(json.error, json.result);
      }, CONFIG);
    } else {
      throw "Invalid VFS method: " + m;
    }
  };

  API.curl = function(args, callback, request, response) {
    if ( !HANDLER.checkPrivilege(request, response, 'curl') ) {
      return;
    }

    var url = args.url;
    var method = args.method || 'GET';
    var query = args.query || {};
    var timeout = args.timeout || 0;
    var binary = args.binary === true;
    var mime = args.mime || null;

    if ( !mime && binary ) {
      mime = 'application/octet-stream';
    }

    if ( !url ) {
      callback('cURL expects an "url"');
      return;
    }

    var opts = {
      url: url,
      method: method,
      timeout: timeout * 1000
    };

    if ( method === 'POST' ) {
      opts.json = true;
      opts.body = query;
    }

    _request(opts, function(error, response, body) {
      if ( error ) {
        callback(error);
        return;
      }

      if ( binary && body ) {
        body = "data:" + mime + ";base64," + (new Buffer(body).toString('base64'));
      }

      var data = {
        httpCode: response.statusCode,
        body: body
      };

      callback(false, data);
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // MAIN
  /////////////////////////////////////////////////////////////////////////////

  var server = _http.createServer(function(request, response) {

      var url     = _url.parse(request.url, true),
          path    = decodeURIComponent(url.pathname),
          cookies = new _cookies(request, response);

      request.cookies = cookies;

      if ( path === "/" ) path += "index.html";
      console.log('<<<', path);

      if ( HANDLER && HANDLER.onRequestStart ) {
        HANDLER.onRequestStart(request, response);
      }

      if ( request.method == 'POST' ) 
      {
        // File Uploads
        if ( path.match(/^\/FS$/) ) {
          var form = new _multipart.IncomingForm({
            uploadDir: CONFIG.tmpdir
          });
          form.parse(request, function(err, fields, files) {
            HTTP.FilePOST(fields, files, request, response);
          });
        }

        // API Calls
        else {
          var body = '';
          request.on('data', function (data) {
            body += data;
          });

          request.on('end', function () {
            if ( !HTTP.CoreAPI(url, path, body, request, response) ) {
              console.log(">>>", '404', path);
              respond("404 Not Found", null, response, [[404, {}]]);
            }
          });
        }
      }

      // File Gets
      else {
        if ( path.match(/^\/FS/) ) {
          HTTP.FileGET(path.replace(/^\/FS/, ''), request, response, false);
        } else {
          HTTP.FileGET(_path.join(DISTDIR, path), request, response, true);
        }
      }
  });

  module.exports = {
    API: API,
    CONFIG: CONFIG,
    HANDLER: HANDLER,

    logging: function(l) {
      _NOLOG = !l;
    },

    listen: function() {
      return server.listen(CONFIG.port);
    },

    close: function(cb) {
      return server.close(cb);
    }
  };

})(
  require("./osjs.js"),
  require("./vfs.js"),
  require("http"),
  require("path"),
  require("url"),
  require("node-fs-extra"),
  require("querystring"),
  require("formidable"),
  require("cookies"),
  require("request")
);
