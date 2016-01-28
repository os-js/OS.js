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
(function(Utils, API) {
  'use strict';

  window.OSjs          = window.OSjs          || {};
  OSjs.VFS             = OSjs.VFS             || {};
  OSjs.VFS.Transports  = OSjs.VFS.Transports  || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function getModule(item) {
    var module = OSjs.VFS.getModuleFromPath(item.path);
    if ( !module || !OSjs.VFS.Modules[module] ) {
      throw new Error(API._('ERR_VFSMODULE_INVALID_FMT', module));
    }
    return OSjs.VFS.Modules[module];
  }

  function getNamespace(item) {
    var module = getModule(item);
    return module.options.ns || 'DAV:';
  }

  function getCORSAllowed(item) {
    var module = getModule(item);
    var val = module.options.cors;
    return typeof val === 'undefined' ? false : val === true;
  }

  function getURL(item) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    }
    var module = getModule(item);
    var opts = module.options;
    return Utils.parseurl(opts.host, {username: opts.username, password: opts.password}).url;
  }

  function getURI(item) {
    var module = getModule(item);
    return Utils.parseurl(module.options.host).path;
  }

  function resolvePath(item) {
    var module = getModule(item);
    return item.path.replace(module.match, '');
  }

  function davCall(method, args, callback, raw) {
    function parseDocument(body) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(body, 'application/xml');
      return doc.firstChild;
    }

    var url = getURL(args.path);
    var file = new OSjs.VFS.File(args.path, args.mime || 'application/octet-stream');
    url += resolvePath(file).replace(/^\//, '');

    function externalCall() {
      var opts = {url: url, method: method};
      if ( raw ) {
        opts.binary = true;
        opts.mime = file.mime;
      }

      if ( method === 'PUT' && typeof args.data !== 'undefined' ) {
        opts.query = args.data;
      }

      API.call('curl', opts, function(response) {
        if ( response.error ) {
          callback(response.error);
          return;
        }

        if ( !response.result ) {
          callback(API._('ERR_VFS_REMOTEREAD_EMPTY'));
          return;
        }

        if ( ([200, 203, 207]).indexOf(response.result.httpCode) < 0 ) {
          callback(API._('ERR_VFSMODULE_XHR_ERROR') + ': ' + response.result.httpCode);
          return;
        }

        if ( opts.binary ) {
          OSjs.VFS.dataSourceToAb(response.result.body, file.mime, callback);
        } else {
          var doc = parseDocument(response.result.body);
          callback(false, doc);
        }
      }, function(err) {
        callback(err);
      });
    }

    if ( getCORSAllowed(file) ) {
      OSjs.VFS.internalCall('xhr', {url: url, method: method}, callback);
    } else {
      externalCall();
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var davTransport = {};

  davTransport.scandir = function(item, callback, options) {
    function parse(doc) {
      var ns = getNamespace(item);
      var list = [];
      var reqpath = resolvePath(item);

      doc.children.forEach(function(c) {
        var type = 'file';

        function getPath() {
          var path = c.getElementsByTagNameNS(ns, 'href')[0].textContent;
          return path.substr(getURI(item).length - 1, path.length);
        }

        function getId() {
          var id = null;
          try {
            id = c.getElementsByTagNameNS(ns, 'getetag')[0].textContent;
          } catch ( e ) {
          }
          return id;
        }

        function getMime() {
          var mime = null;
          if ( type === 'file' ) {
            try {
              mime = c.getElementsByTagNameNS(ns, 'getcontenttype')[0].textContent || 'application/octet-stream';
            } catch ( e ) {
              mime = 'application/octet-stream';
            }
          }
          return mime;
        }

        function getSize() {
          var size = 0;
          if ( type === 'file' ) {
            try {
              size = parseInt(c.getElementsByTagNameNS(ns, 'getcontentlength')[0].textContent, 10) || 0;
            } catch ( e ) {
            }
          }
          return size;
        }

        var path = getPath();
        if ( path.match(/\/$/) ) {
          type = 'dir';
        }

        if ( path !== reqpath ) {
          list.push({
            id: getId(),
            path: item.path.replace(/\/$/, '') + path,
            filename: Utils.filename(path),
            size: getSize(),
            mime: getMime(),
            type: type
          });
        }
      });

      return OSjs.VFS.filterScandir(list, options);
    }

    davCall('PROPFIND', {path: item.path}, function(error, doc) {
      var list = [];
      if ( !error && doc ) {
        var result = parse(doc);
        result.forEach(function(iter) {
          list.push(new OSjs.VFS.File(iter));
        });
      }
      callback(error, list);
    });
  };

  davTransport.write = function(item, data, callback, options) {
    davCall('PUT', {path: item.path, mime: item.mime, data: data}, callback);
  };

  davTransport.read = function(item, callback, options) {
    davCall('GET', {path: item.path, mime: item.mime}, callback, true);
  };

  davTransport.copy = function(src, dest, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  davTransport.move = function(src, dest, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  davTransport.unlink = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  davTransport.mkdir = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  davTransport.exists = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  davTransport.fileinfo = function(item, callback, options) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  davTransport.url = function(item, callback, options) {
    callback(false, OSjs.VFS.Transports.WebDAV.path(item));
  };

  davTransport.trash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  davTransport.untrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  davTransport.emptyTrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Make a WebDAV HTTP request for VFS
   *
   * @param   String      name      Method name
   * @param   Object      args      Method arguments
   * @param   Function    callback  Callback => fn(error, result)
   * @param   Object      option    (Optional) request options
   *
   * @return  void
   * @api OSjs.VFS.Transports.WebDAV.request()
   */
  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};

    if ( !davTransport[name] ) {
      throw new Error(API._('ERR_VFSMODULE_INVALID_METHOD_FMT', name));
    }

    var fargs = args;
    fargs.push(callback);
    fargs.push(options);
    davTransport[name].apply(davTransport, fargs);
  }

  /**
   * Make a WebDAV HTTP URL for VFS
   *
   * @param   Mixed       item        (Optional) Path of VFS.File object
   *
   * @retun   String                  URL based on input
   *
   * @api OSjs.VFS.Transports.WebDAV.path()
   */
  function makePath(item) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    }

    var url      = getURL(item);
    var reqpath  = resolvePath(item).replace(/^\//, '');
    var fullpath = url + reqpath;

    if ( !getCORSAllowed(item) ) {
      fullpath = API.getConfig('Connection.FSURI') + '/get' + fullpath;
    }

    return fullpath;
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Transports.WebDAV = {
    request: makeRequest,
    path: makePath
  };

})(OSjs.Utils, OSjs.API);
