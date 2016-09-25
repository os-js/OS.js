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

  /**
   * @namespace WebDAV
   * @memberof OSjs.VFS.Transports
   */

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function getModule(item) {
    var mm = OSjs.Core.getMountManager();
    var module = mm.getModuleFromPath(item.path, false, true);
    if ( !module ) {
      throw new Error(API._('ERR_VFSMODULE_INVALID_FMT', item.path));
    }
    return module;
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

    function getUrl(p, f) {
      var url = getURL(p);
      url += resolvePath(f).replace(/^\//, '');
      return url;
    }

    var mime = args.mime || 'application/octet-stream';
    var headers = {};
    var sourceFile = new OSjs.VFS.File(args.path, mime);
    var sourceUrl = getUrl(args.path, sourceFile);
    var destUrl = null;

    if ( args.dest ) {
      destUrl = getUrl(args.dest, new OSjs.VFS.File(args.dest, mime));
      headers.Destination = destUrl;
    }

    function externalCall() {
      var opts = {
        url: sourceUrl,
        method: method,
        requestHeaders: headers
      };

      if ( raw ) {
        opts.binary = true;
        opts.mime = mime;
      }

      if ( typeof args.data !== 'undefined' ) {
        opts.query = args.data;
      }

      API.call('curl', opts, function(error, result) {
        if ( error ) {
          callback(error);
          return;
        }

        if ( !result ) {
          callback(API._('ERR_VFS_REMOTEREAD_EMPTY'));
          return;
        }

        if ( ([200, 201, 203, 204, 205, 207]).indexOf(result.httpCode) < 0 ) {
          callback(API._('ERR_VFSMODULE_XHR_ERROR') + ': ' + result.httpCode);
          return;
        }

        if ( opts.binary ) {
          OSjs.VFS.Helpers.dataSourceToAb(result.body, mime, callback);
        } else {
          var doc = parseDocument(result.body);
          callback(false, doc);
        }
      });
    }

    if ( getCORSAllowed(sourceFile) ) {
      OSjs.VFS.Transports.Internal.request('get', {url: sourceUrl, method: method}, callback);
    } else {
      externalCall();
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * WebDAV (OwnCloud) VFS Transport Module
   */
  var Transport = {
    scandir: function(item, callback, options) {
      var mm = OSjs.Core.getMountManager();

      function parse(doc) {
        var ns = getNamespace(item);
        var list = [];
        var reqpath = resolvePath(item);
        var root = mm.getRootFromPath(item.path);

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

          try {
            var path = getPath();
            if ( path.match(/\/$/) ) {
              type = 'dir';
              path = path.replace(/\/$/, '') || '/';
            }

            if ( path !== reqpath ) {
              list.push({
                id: getId(),
                path: root + path.replace(/^\//, ''),
                filename: Utils.filename(path),
                size: getSize(),
                mime: getMime(),
                type: type
              });
            }
          } catch ( e ) {
            console.warn('scandir() exception', e, e.stack);
          }
        });

        return OSjs.VFS.Helpers.filterScandir(list, options);
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
    },

    write: function(item, data, callback, options) {
      davCall('PUT', {path: item.path, mime: item.mime, data: data}, callback);
    },

    read: function(item, callback, options) {
      davCall('GET', {path: item.path, mime: item.mime}, callback, true);
    },

    copy: function(src, dest, callback) {
      davCall('COPY', {path: src.path, dest: dest.path}, callback);
    },

    move: function(src, dest, callback) {
      davCall('MOVE', {path: src.path, dest: dest.path}, callback);
    },

    unlink: function(item, callback) {
      davCall('DELETE', {path: item.path}, callback);
    },

    mkdir: function(item, callback) {
      davCall('MKCOL', {path: item.path}, callback);
    },

    exists: function(item, callback) {
      davCall('PROPFIND', {path: item.path}, function(error, doc) {
        callback(false, !error);
      });
    },

    url: function(item, callback, options) {
      callback(false, OSjs.VFS.Transports.WebDAV.path(item));
    },

    freeSpace: function(root, callback) {
      callback(false, -1);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Make a WebDAV HTTP URL for VFS
   *
   * @param   {(String|OSjs.VFS.File)}    item        VFS File
   *
   * @retun   {String}                  URL based on input
   *
   * @function path
   * @memberof OSjs.VFS.Transports.WebDAV
   */
  function makePath(item) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    }

    var url      = getURL(item);
    var reqpath  = resolvePath(item).replace(/^\//, '');
    var fullpath = url + reqpath;

    if ( !getCORSAllowed(item) ) {
      fullpath = API.getConfig('Connection.FSURI') + '/get/' + fullpath;
    }

    return fullpath;
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Transports.WebDAV = {
    module: Transport,
    path: makePath
  };

})(OSjs.Utils, OSjs.API);
