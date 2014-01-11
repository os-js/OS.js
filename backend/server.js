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
    mimes:      {
      ".bmp":     "image/bmp",
      ".css":     "text/css",
      ".gif":     "image/gif",
      ".htm":     "text/html",
      ".html":    "text/html",
      ".jpg":     "image/jpeg",
      ".jpeg":    "image/jpeg",
      ".js":      "application/javascript",
      ".json":    "application/json",
      ".otf":     "font/opentype",
      ".png":     "image/png",
      ".text":    "text/plain",
      "default":  "application/octet-stream"
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
    return mimeTypes[ext.toLowerCase()];
  };

  /**
   * HTTP Output
   */
  var respond = function(data, mime, response, headers) {
    headers = headers || [];
    mime = mime || "text/html";

    for ( var i = 0; i < headers.length; i++ ) {
      response.writeHead.apply(response, headers[i]);
    }
    response.writeHead(200, {"Content-Type": mime});
    response.write(data);
    response.end();
  };

  var respondJSON = function(data, response, headers) {
    respond(JSON.stringify(data), 'application/json', response, headers);
  };

  /**
   * File Output
   */
  var respondFile = function(path, request, response) {
    var fullPath = _path.join(config.directory, path);
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
      respondJSON({result: null, error: 'Not implemented yet!'}, response);
    },

    file_put_contents : function(args, request, response) {
      respondJSON({result: null, error: 'Not implemented yet!'}, response);
    },

    scandir : function(args, request, response) {
      respondJSON({result: null, error: 'Not implemented yet!'}, response);
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
          var POST = _qs.parse(body);

          if ( path.match(/^\/FS/) ) {
            respond("UPLOAD TODO");
          } else if ( path.match(/^\/API/) ) {
            var data = {};
            try {
              data = JSON.parse(POST);

              var method = data.method;
              var args   = data['arguments'] || {}
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
                    vfs[m](args, request, response);
                  } else {
                    throw "Invalid VFS method: " + m;
                  }
                break;

                default :
                  throw "Invalid method: " + method;
                break;
              }
            } catch ( e ) {
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
          respondFile(path, request, response);
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
