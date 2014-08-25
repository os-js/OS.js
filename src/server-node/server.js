/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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

/**
 * Depends on:
 *  `npm install node-fs-extra`
 *  `npm install formidable`
 */

(function(_http, _path, _url, _fs, _qs, _multipart, _vfs)
{
  /**
   * Globals and default settings etc.
   */
  var ROOTDIR = _path.join(_path.dirname(__filename), '/../../');
  var DISTDIR = (process && process.argv.length > 2) ? process.argv[2] : 'dist';
  var CONFIG  = {
    port:       8000,
    directory:  null, // Automatic
    appdirs:    null, // Automatic, but overrideable
    vfsdir:     _path.join(ROOTDIR, 'vfs/home'),
    tmpdir:     _path.join(ROOTDIR, 'vfs/tmp'),
    repodir:    _path.join(ROOTDIR, 'src/packages'),
    mimes:      {}
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * HTTP Output
   */
  var respond = function(data, mime, response, headers, code) {
    data    = data    || '';
    headers = headers || [];
    mime    = mime    || "text/html";
    code    = code    || 200;

    //console.log(">>>", 'respond()', mime, data.length);

    for ( var i = 0; i < headers.length; i++ ) {
      response.writeHead.apply(response, headers[i]);
    }

    response.writeHead(code, {"Content-Type": mime});
    response.write(data);
    response.end();
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
    var fullPath = jpath ? _path.join(CONFIG.directory, path) : _path.join(CONFIG.vfsdir, path);
    _fs.exists(fullPath, function(exists) {
      if ( exists ) {
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
      } else {
        console.log('!!!', '404', fullPath);
        respond("404 Not Found", null, response, null, 404);
      }
    });
  };

  var readConfig = function(filename) {
    var path = _path.join(ROOTDIR, filename);
    if ( _fs.existsSync(path) ) {
      try {
        console.info('-->', 'Found configuration', filename);
        return JSON.parse(_fs.readFileSync(path).toString());
      } catch ( e ) {
        console.warn('!!!', 'Failed to parse configuration', filename, e);
      }
    } else {
      console.warn('!!!', 'Did not find configuration', path);
    }
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * OS.js API
   */
  var api = {
    FileGET : function(path, request, response, arg) {
      if ( !arg ) {
        console.log('---', 'FileGET', path);
      }
      respondFile(path, request, response, arg);
    },

    FilePOST : function(fields, files, request, response) {
      var srcPath = files.upload.path;
      var dstPath = _path.join(CONFIG.vfsdir, fields.path, files.upload.name);

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
                  respond("", "text/plain", response);
                }
              });
            }
          });
        } else {
          respond('Source does not exist!', "text/plain", response, null, 500);
        }
      });
    },

    CoreAPI : function(url, path, POST, request, response) {
      if ( path.match(/^\/API/) ) {
        try {
          var data   = JSON.parse(POST);
          var method = data.method;
          var args   = data['arguments'] || {}

          console.log('---', 'CoreAPI', method, args);

          switch ( method ) {
            case 'application' :
              var apath = args.path || null;
              var aname = args.application || null;
              var ameth = args.method || null;
              var aargs = args['arguments'] || [];

              var aroot = _path.join(CONFIG.repodir, apath);
              var fpath = _path.join(aroot, "api.js");

              try {
                var api = require(fpath);
                api[aname].call(ameth, aargs, function(result, error) {
                  error = error || null;
                  if ( error !== null ) {
                    result = null;
                  }
                  respondJSON({result: result, error: error}, response);
                });
              } catch ( e ) {
                respondJSON({result: null, error: "Application API error or missing: " + e.toString()}, response);
              }
            break;

            case 'fs' :
              var m = args.method;
              var a = args['arguments'] || [];

              if ( _vfs[m] ) {
                _vfs[m](a, request, function(json) {
                  respondJSON(json, response);
                }, CONFIG);
              } else {
                throw "Invalid VFS method: " + m;
              }
            break;

            default :
              throw "Invalid method: " + method;
            break;
          }
        } catch ( e ) {
          console.error("!!! Caught exception", e);
          console.warn(e.stack);

          respondJSON({result: null, error: "500 Internal Server Error: " + e}, response);
        }
        return true;
      }
      return false;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // MAIN
  /////////////////////////////////////////////////////////////////////////////

  console.log('***');
  console.log('***', 'THIS IS A WORK IN PROGRESS!!!');
  console.log('***');

  /**
   * Initialize config
   */
  (function() {

    var settConfig = readConfig("src/server-node/settings.json");
    if ( settConfig !== false ) {
      for ( var i in settConfig ) {
        if ( settConfig.hasOwnProperty(i) && CONFIG.hasOwnProperty(i) ) {
          CONFIG[i] = settConfig[i];
        }
      }
    }

    var mimeConfig = readConfig("src/mime.json");
    if ( mimeConfig !== false ) {
      CONFIG.mimes = mimeConfig;
    }

    var repoConfig = readConfig("src/packages/repositories.json");
    if ( repoConfig !== false ) {
      CONFIG.appdirs = repoConfig;
    }

    if ( !CONFIG.directory ) {
      CONFIG.directory = _fs.realpathSync('.');
    }

  })();

  console.log(JSON.stringify(CONFIG, null, 2));

  /**
   * Server instance
   */
  _http.createServer(function(request, response) {

    var url     = _url.parse(request.url, true),
        path    = decodeURIComponent(url.pathname);

      if ( path === "/" ) path += "index.html";
      console.log('<<<', path);

      if ( request.method == 'POST' ) 
      {
        // File Uploads
        if ( path.match(/^\/FS$/) ) {
          var form = new _multipart.IncomingForm();
          form.parse(request, function(err, fields, files) {
            api.FilePOST(fields, files, request, response);
          });
        }

        // API Calls
        else {
          var body = '';
          request.on('data', function (data) {
            body += data;
          });

          request.on('end', function () {
            if ( !api.CoreAPI(url, path, body, request, response) ) {
              console.log(">>>", '404', path);
              respond("404 Not Found", null, response, [[404, {}]]);
            }
          });
        }
      }

      // File Gets
      else {
        if ( path.match(/^\/FS/) ) {
          api.FileGET(path.replace(/^\/FS/, ''), request, response, false);
        } else {
          api.FileGET(_path.join(DISTDIR, path), request, response, true);
        }
      }
  }).listen(CONFIG.port);

})(
  require("http"),
  require("path"),
  require("url"),
  require("node-fs-extra"),
  require("querystring"),
  require("formidable"),
  require("./vfs.js")
);
