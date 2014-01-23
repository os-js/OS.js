/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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
(function(_http, _path, _url, _fs, _qs) {

  /*
   * THIS IS NOT READY FOR USE
   */

  var config = {
    port:       8000,
    directory:  '/Users/anders/Projects/OSjsNew',
    vfsdir:     '/opt/OSjs/home',
    tmpdir:     '/opt/OSjs/tmp',
    mimes:      {
      '.bmp'    : 'image/bmp',
      '.css'    : 'text/css',
      '.gif'    : 'image/gif',
      '.htm'    : 'text/html',
      '.html'   : 'text/html',
      '.jpg'    : 'image/jpeg',
      '.jpeg'   : 'image/jpeg',
      '.js'     : 'application/javascript',
      '.json'   : 'application/json',
      '.otf'    : 'font/opentype',
      '.png'    : 'image/png',

      '.aac'    : 'audio/aac',
      '.mp4'    : 'audio/mp4',
      '.m4a'    : 'audio/mp4',
      '.mp1'    : 'audio/mpeg',
      '.mp2'    : 'audio/mpeg',
      '.mp3'    : 'audio/mpeg',
      '.mpg'    : 'audio/mpeg',
      '.mpeg'   : 'audio/mpeg',
      '.oga'    : 'audio/ogg',
      '.ogg'    : 'audio/ogg',
      '.wav'    : 'audio/wav',
      '.webm'   : 'audio/webm',

      '.mp4'    : 'video/mp4',
      '.m4v'    : 'video/mp4',
      '.ogv'    : 'video/ogg',
      '.webm'   : 'video/webm',
      '.avi'    : 'video/x-ms-video',
      '.flv'    : 'video/x-flv',
      '.mkv'    : 'video/x-matroska',

      '.py'     : 'application/x-python',
      '.html'   : 'text/html',
      '.xml'    : 'text/xml',
      '.js'     : 'application/javascript',
      '.css'    : 'text/css',

      '.txt'    : 'text/plain',
      '.doc'    : 'text/plain',

      '.odoc'   : 'osjs/document',

      'default' : 'application/octet-stream'
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get MIME
   */
  var getMime = function(file) {
    var i = file.lastIndexOf("."),
        ext = (i === -1) ? "default" : file.substr(i),
        mimeTypes = config.mimes;
    return mimeTypes[ext.toLowerCase()] || mimeTypes.default;
  };

  /**
   * HTTP Output
   */
  var respond = function(data, mime, response, headers) {
    data    = data    || '';
    headers = headers || [];
    mime    = mime    || "text/html";

    console.log('>>>', mime, data.length);

    for ( var i = 0; i < headers.length; i++ ) {
      response.writeHead.apply(response, headers[i]);
    }

    response.writeHead(200, {"Content-Type": mime});
    response.write(data);
    response.end();
  };

  var respondJSON = function(data, response, headers) {
    console.log('>>>', 'application/json', data.length);

    respond(JSON.stringify(data), 'application/json', response, headers);
  };

  /**
   * File Output
   */
  var respondFile = function(path, request, response, jpath) {
    console.log('>>>', path);

    var fullPath = jpath ? _path.join(config.directory, path) : path;
    _fs.exists(fullPath, function(exists) {
      if ( exists ) {
        _fs.readFile(fullPath, function(error, data) {
          if ( error ) {
            respond("500 Internal Server Error", null, response);
          } else {
            respond(data, getMime(fullPath), response);
          }
        });
      } else {
        respond("404 Not Found", null, response, [[404, {}]]);
      }
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * OS.js API
   */
  var api = {
    application : function(path, name, method, args, request, response) {
      respondJSON({result: null, error: 'Not implemented yet!'}, response);
    },

    bugreport : function() {
      respondJSON({result: null, error: 'Not implemented!'}, response);
    }
  };

  /**
   * OS.js VFS
   */
  var vfs = {
    file_get_contents : function(args, request, response) {
      var path = args[0];
      var opts = typeof args[1] === 'undefined' ? {} : (args[1] || {});

      var fullPath = path;//_path.join(config.vfsdir, path);
      _fs.exists(fullPath, function(exists) {
        if ( exists ) {
          _fs.readFile(fullPath, function(error, data) {
            if ( error ) {
              respondJSON({result: null, error: 'Error reading file: ' + error}, response);
            } else {
              if ( opts.dataSource ) {
                data = "data:" + getMime(fullPath) + ";base64," + (new Buffer(data).toString('base64'));
              }

              respondJSON({result: data.toString(), error: null}, response);
            }
          });
        } else {
          respondJSON({result: null, error: 'File not found!'}, response);
        }
      });
    },

    file_put_contents : function(args, request, response) {
      var path = args[0];
      var data = args[1] || '';
      var opts = typeof args[2] === 'undefined' ? {} : (args[2] || {});

      var fullPath = path;//_path.join(config.vfsdir, path);

      if ( opts.dataSource ) {
        data = data.replace(/^data\:(.*);base64\,/, "") || '';
        data = new Buffer(data, 'base64').toString('ascii')
      }

      _fs.writeFile(fullPath, data, function(error, data) {
        if ( error ) {
          respondJSON({result: null, error: 'Error writing file: ' + error}, response);
        } else {
          respondJSON({result: true, error: null}, response);
        }
      });
    },

    'delete' : function(args, request, response) {
      // TODO
      respondJSON({result: null, error: 'Not implemented yet!'}, response);
    },

    copy : function(args, request, response) {
      // TODO
      respondJSON({result: null, error: 'Not implemented yet!'}, response);
    },

    move : function(args, request, response) {
      // TODO
      respondJSON({result: null, error: 'Not implemented yet!'}, response);
    },

    mkdir : function(args, request, response) {
      // TODO
      respondJSON({result: null, error: 'Not implemented yet!'}, response);
    },

    fileinfo : function(args, request, response) {
      // TODO
      respondJSON({result: null, error: 'Not implemented yet!'}, response);
    },

    scandir : function(args, request, response) {
      var path = args[0];
      var opts = typeof args[1] === 'undefined' ? {} : (args[1] || {});

      var fullPath = path;//_path.join(config.vfsdir, path);

      _fs.readdir(fullPath, function(error, files) {
        if ( error ) {
          respondJSON({result: null, error: 'Error reading directory: ' + error}, response);
        } else {
          var result = [];
          var fpath, ftype, fsize;
          for ( var i = 0; i < files.length; i++ ) {
            fpath = _path.join(path, files[i]);
            ftype = _fs.statSync(fpath).isFile() ? 'file' : 'dir'; // FIXME
            fsize = 0; // FIXME

            result.push({
              filename: files[i],
              path:     fpath,
              size:     fsize,
              mime:     ftype === 'file' ? getMime(files[i]) : '',
              type:     ftype
            });
          }
          respondJSON({result: result, error: null}, response);
        }
      });
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // MAIN
  /////////////////////////////////////////////////////////////////////////////

  console.log('>>>', 'Configured port', config.port);

  /**
   * Server instance
   */
  _http.createServer(function(request, response) {

    var url     = _url.parse(request.url, true),
        path    = decodeURIComponent(url.pathname);

      if ( path === "/" ) path += "index.html";
      console.log('<<<', path);

      if ( request.method == 'POST' ) {
        var body = '';
        request.on('data', function (data) {
          body += data;
        });

        request.on('end', function () {
          var POST = body;//_qs.parse(body);

          if ( path.match(/^\/API/) ) {
            var data = {};
            try {
              data = JSON.parse(POST);

              var method = data.method;
              var args   = data['arguments'] || {}

              console.log('---', 'API', method, args);

              switch ( method ) {
                case 'application' :
                  // TODO
                  var apath = args.path || null;
                  var aname = args.application || null;
                  var ameth = args.method || null;
                  var aargs = args['arguments'] || [];

                  api.application(apath, aname, ameth, aargs, request, response);
                break;

                case 'fs' :
                  var m = args.method;
                  var a = args['arguments'] || [];

                  if ( vfs[m] ) {
                    vfs[m](a, request, response);
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
          } else {
            respond("404 Not Found", null, response, [[404, {}]]);
          }
        });
      } else {
        if ( path.match(/^\/FS/) ) {
          respondFile(path.replace(/^\/FS/, ''), request, response);
        } else {
          respondFile(path, request, response, true);
        }
      }
  }).listen(config.port);

})(
  require("http"),
  require("path"),
  require("url"),
  require("fs"),
  require("querystring")
);
