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
   * @namespace LocalStorage
   * @memberof OSjs.VFS.Modules
   */

  /*
   * This storage works like this:
   *
   * A map of folders with arrays of metadata
   *  namespace/tree  = {'/': [{id: -1, size: -1, mime: 'str', filename: 'str'}, ...], ...}
   *
   * A flat map of data
   *  namespace/data = {'path': %base64%}
   *
   */

  /////////////////////////////////////////////////////////////////////////////
  // GLOBALS
  /////////////////////////////////////////////////////////////////////////////

  var NAMESPACE = 'OSjs/VFS/LocalStorage';

  var _isMounted = false;
  var _cache = {};
  var _fileCache = {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get's the "real" path of a object (which is basically a path without protocol)
   */
  function getRealPath(p, par) {
    if ( typeof p !== 'string' || !p ) {
      throw new TypeError('Expected p as String');
    }

    p = Utils.getRelativeURL(p).replace(/\/+/g, '/');

    var path = par ? (Utils.dirname(p) || '/') : p;
    if ( path !== '/' ) {
      path = path.replace(/\/$/, '');
    }

    return path;
  }

  /**
   * This methods creates a VFS.File from cache and fills in the gaps
   */
  function createMetadata(i, path, p) {
    i = Utils.cloneObject(i);
    if ( !p.match(/(\/\/)?\/$/) ) {
      p += '/';
    }
    i.path = p + i.filename;

    return new OSjs.VFS.File(i);
  }

  /////////////////////////////////////////////////////////////////////////////
  // LOCALSTORAGE ABSTRACTION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Initialize and restore data from localStorage
   */
  function initStorage() {
    if ( !_isMounted ) {
      try {
        _cache = JSON.parse(localStorage.getItem(NAMESPACE + '/tree')) || {};
      } catch ( e ) {}

      try {
        _fileCache = JSON.parse(localStorage.getItem(NAMESPACE + '/data')) || {};
      } catch ( e ) {}

      if ( typeof _cache['/'] === 'undefined' ) {
        _cache['/'] = [];
      }

      _isMounted = true;

      API.message('vfs:mount', 'LocalStorage', {source: null});
    }
  }

  /**
   * Store tree and data to localStorage
   */
  function commitStorage() {
    try {
      localStorage.setItem(NAMESPACE + '/tree', JSON.stringify(_cache));
      localStorage.setItem(NAMESPACE + '/data', JSON.stringify(_fileCache));

      return true;
    } catch ( e ) {}

    return false;
  }

  /////////////////////////////////////////////////////////////////////////////
  // CACHE
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Adds an entry to the cache
   */
  function addToCache(iter, data, dab) {
    var path = getRealPath(iter.path);
    var dirname = Utils.dirname(path);

    var type = typeof data === 'undefined' || data === null ? 'dir' : 'file';
    var mimeConfig = API.getConfig('MIME.mapping');

    var mime = (function(type) {
      if ( type !== 'dir' ) {
        if ( iter.mime ) {
          return iter.mime;
        } else {
          var ext = Utils.filext(iter.filename);
          return mimeConfig['.' + ext] || 'application/octet-stream';
        }
      }
      return null;
    })(iter.type);

    var file = {
      size: iter.size || (type === 'file' ? (dab.byteLength || dab.length || 0) : 0),
      mime: mime,
      type: type,
      filename: iter.filename
    };

    if ( typeof _cache[dirname] === 'undefined' ) {
      _cache[dirname] = [];
    }

    (function(found) {
      if ( found !== false) {
        _cache[dirname][found] = file;
      } else {
        _cache[dirname].push(file);
      }
    })(findInCache(iter));

    if ( file.type === 'dir' ) {
      if ( _fileCache[path] ) {
        delete _fileCache[path];
      }
      _cache[path] = [];
    } else {
      var iof = data.indexOf(',');
      _fileCache[path] = data.substr(iof + 1);
    }

    return true;
  }

  /**
   * Removes an entry from cache (recursively)
   */
  function removeFromCache(iter) {
    function _removef(i) {
      var path = getRealPath(i.path);
      //console.warn('-->', '_removef', i, path);

      // Remove data
      if ( _fileCache[path] ) {
        delete _fileCache[path];
      }

      // Remove from parent tree
      _removefromp(i);
    }

    function _removed(i) {
      var path = getRealPath(i.path);

      //console.warn('-->', '_removed', i, path);

      if ( path !== '/' ) {
        // Remove from parent node
        _removefromp(i);

        // Remove base node if a root directory
        if ( _cache[path] ) {
          delete _cache[path];
        }
      }
    }

    function _removefromp(i) {
      var path = getRealPath(i.path);
      var dirname = Utils.dirname(path);

      //console.warn('-->', '_removefromp', i, path, dirname);

      if ( _cache[dirname] ) {
        var found = -1;
        _cache[dirname].forEach(function(ii, idx) {
          if ( found === -1 && ii ) {
            if ( ii.type === i.type && i.filename === i.filename ) {
              found = idx;
            }
          }
        });

        if ( found >= 0 ) {
          _cache[dirname].splice(found, 1);
        }
      }
    }

    function _op(i) {
      //console.warn('-->', '_op', i);

      if ( i ) {
        if ( i.type === 'dir' ) {
          // First go up in the tree
          scanStorage(i, false).forEach(function(ii) {
            _op(ii);
          });

          // Then go down
          _removed(i);
        } else {
          _removef(i);
        }
      }
    }

    _op(iter);

    return true;
  }

  /**
   * Looks up a file from the cache and returns index
   */
  function findInCache(iter) {
    var path = getRealPath(iter.path);
    var dirname = Utils.dirname(path);
    var found = false;

    _cache[dirname].forEach(function(chk, idx) {
      if ( found === false && chk.filename === iter.filename ) {
        found = idx;
      }
    });

    return found;
  }

  /**
   * Fetches a VFS.File object from cache from path
   */
  function getFromCache(pp) {
    var path = Utils.dirname(pp);
    var fname = Utils.filename(pp);
    var result = null;

    var tpath = path.replace(/^(.*)\:\/\//, '');
    (_cache[tpath] || []).forEach(function(v) {
      if ( !result && v.filename === fname ) {
        result = createMetadata(v, null, path);
      }
    });

    return result;
  }

  /**
   * Scans a directory and returns file list
   */
  function scanStorage(item, ui) {
    var path = getRealPath(item.path);
    var data = _cache[path] || false;

    var list = (data === false) ? false : data.filter(function(i) {
      return !!i;
    }).map(function(i) {
      return createMetadata(i, path, item.path);
    });

    if ( ui && Utils.dirname(path) !== path ) {
      list.unshift({
        size: 0,
        mime: null,
        type: 'dir',
        filename: '..',
        path: Utils.dirname(item.path)
      });
    }

    return list;
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var LocalStorageStorage = {

    scandir: function(item, callback, options) {
      var list = scanStorage(item, true);
      callback(list === false ? API._('ERR_VFSMODULE_NOSUCH') : false, list);
    },

    read: function(item, callback, options) {
      options = options || {};

      var path = getRealPath(item.path);

      function readStorage(cb) {
        var metadata = getFromCache(path);

        if ( metadata ) {
          var data = _fileCache[path];

          if ( data ) {

            var ds  = 'data:' + metadata.mime + ',' + data;
            OSjs.VFS.Helpers.dataSourceToAb(ds, metadata.mime, function(err, res) {
              if ( err ) {
                cb(err);
              } else {
                if ( options.url ) {
                  OSjs.VFS.Helpers.abToBlob(res, metadata.mime, function(err, blob) {
                    cb(err, URL.createObjectURL(blob));
                  });
                } else {
                  cb(err, res);
                }
              }
            });

            return true;
          }
        }

        return false;
      }

      if ( readStorage(callback) === false ) {
        callback(API._('ERR_VFS_FATAL'), false);
      }
    },

    write: function(file, data, callback, options) {
      options = options || {};

      var mime = file.mime || 'application/octet-stream';

      function writeStorage(cb) {
        if ( options.isds ) {
          cb(false, data);
        } else {
          OSjs.VFS.Helpers.abToDataSource(data, mime, function(err, res) {
            if ( err ) {
              callback(err, false);
            } else {
              cb(false, res);
            }
          });
        }
      }

      writeStorage(function(err, res) {
        try {
          if ( addToCache(file, res, data) && commitStorage() ) {
            callback(err, true);
          } else {
            callback(API._('ERR_VFS_FATAL'), false);
          }
        } catch ( e ) {
          callback(e);
        }
      });
    },

    unlink: function(src, callback) {
      try {
        src = getFromCache(src.path) || src;

        if ( removeFromCache(src) && commitStorage() ) {
          callback(false, true);
        } else {
          callback(API._('ERR_VFS_FATAL'), false);
        }
      } catch ( e ) {
        callback(e);
      }
    },

    copy: function(src, dest, callback) {

      function _write(s, d, cb) {
        OSjs.VFS.read(s, function(err, data) {
          if ( err ) {
            cb(err);
          } else {
            OSjs.VFS.write(d, data, cb);
          }
        });
      }

      function _op(s, d, cb) {
        if ( s.type === 'file' ) {
          d.mime = s.mime;
        }

        d.size = s.size;
        d.type = s.type;

        if ( d.type === 'dir' ) {
          OSjs.VFS.mkdir(d, function(err, res) {
            if ( err ) {
              cb(err);
            } else {
              var list = scanStorage(s, false);

              if ( list && list.length ) {
                Utils.asyncs(list, function(entry, idx, next) {
                  var rp = entry.path.substr(src.path.length);
                  var nd = new OSjs.VFS.File(dest.path + rp);

                  //console.warn('----->', 'source root', s);
                  //console.warn('----->', 'dest root', d);
                  //console.warn('----->', 'files', list.length, idx);
                  //console.warn('----->', 'relative', rp);
                  //console.warn('----->', 'new file', nd);

                  _op(entry, nd, next);
                }, function() {
                  cb(false, true);
                });
              } else {
                cb(false, true);
              }
            }
          });
        } else {
          _write(s, d, cb);
        }
      }

      // Force retrieval of real data so MIME is correctly synced etc
      src = getFromCache(src.path) || src;

      // Check if destination exists
      var droot = getRealPath(Utils.dirname(dest.path));
      if ( droot !== '/' && !getFromCache(droot) ) {
        callback(API._('ERR_VFS_TARGET_NOT_EXISTS'));
        return;
      }

      if ( src.type === 'dir' && src.path === Utils.dirname(dest.path) ) {
        callback('You cannot copy a directory into itself'); // FIXME
        return;
      }

      _op(src, dest, callback);
    },

    move: function(src, dest, callback) {
      var spath = getRealPath(src.path);
      var dpath = getRealPath(dest.path);

      var sdirname = Utils.dirname(spath);
      var ddirname = Utils.dirname(dpath);

      if ( _fileCache[dpath] ) {
        callback(API._('ERR_VFS_FILE_EXISTS'));
        return;
      }

      // Rename
      if ( sdirname === ddirname ) {
        if ( _fileCache[spath] ) {
          var tmp = _fileCache[spath];
          delete _fileCache[spath];
          _fileCache[dpath] = tmp;
        }

        if ( _cache[sdirname] ) {
          var found = -1;
          _cache[sdirname].forEach(function(i, idx) {
            if ( i && found === -1 ) {
              if ( i.filename === src.filename && i.type === src.type ) {
                found = idx;
              }
            }
          });

          if ( found >= 0 ) {
            _cache[sdirname][found].filename = dest.filename;
          }
        }

        callback(false, commitStorage());
      } else {
        OSjs.VSF.copy(src, dest, function(err) {
          if ( err ) {
            callback(err);
          } else {
            OSjs.VFS.unlink(src, callback);
          }
        });
      }
    },

    exists: function(item, callback) {
      var data = getFromCache(getRealPath(item.path));
      callback(false, !!data);
    },

    fileinfo: function(item, callback) {
      var data = getFromCache(item.path);
      callback(data ? false : API._('ERR_VFSMODULE_NOSUCH'), data);
    },

    mkdir: function(dir, callback) {
      var dpath = getRealPath(dir.path);
      if ( dpath !== '/' && getFromCache(dpath) ) {
        callback(API._('ERR_VFS_FILE_EXISTS'));
        return;
      }

      dir.mime = null;
      dir.size = 0;
      dir.type = 'dir';

      try {
        if ( addToCache(dir) && commitStorage() ) {
          callback(false, true);
        } else {
          callback(API._('ERR_VFS_FATAL'));
        }
      } catch ( e ) {
        callback(e);
      }
    },

    upload: function(file, dest, callback) {
      var check = new OSjs.VFS.File(Utils.pathJoin(dest, file.name), file.type);
      check.size = file.size;
      check.type = 'file';

      OSjs.VFS.exists(check, function(err, exists) {
        if ( err || exists ) {
          callback(err || API._('ERR_VFS_FILE_EXISTS'));
        } else {
          var reader = new FileReader();
          reader.onerror = function(e) {
            callback(e);
          };
          reader.onloadend = function() {
            OSjs.VFS.write(check, reader.result, callback, {isds: true});
          };
          reader.readAsDataURL(file);
        }
      });
    },

    url: function(item, callback) {
      OSjs.VFS.exists(item, function(err, exists) {
        if ( err || !exists ) {
          callback(err || API._('ERR_VFS_FILE_EXISTS'));
        } else {
          OSjs.VFS.read(item, callback, {url: true});
        }
      });
    },

    find: function(file, callback) {
      callback(API._('ERR_VFS_UNAVAILABLE'));
    },

    trash: function(file, callback) {
      callback(API._('ERR_VFS_UNAVAILABLE'));
    },

    untrash: function(file, callback) {
      callback(API._('ERR_VFS_UNAVAILABLE'));
    },

    emptyTrash: function(callback) {
      callback(API._('ERR_VFS_UNAVAILABLE'));
    },

    freeSpace: function(root, callback) {
      var total = 5 * 1024 * 1024;
      var used = JSON.stringify(_cache).length + JSON.stringify(_fileCache).length;

      callback(false, total - used);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function makeRequest(name, args, callback, options) {
    initStorage();

    var ref = LocalStorageStorage[name];
    var fargs = (args || []).slice(0);
    fargs.push(callback || function() {});
    fargs.push(options || {});

    return ref.apply(ref, fargs);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Browser LocalStorage VFS Module
   *
   * This is *experimental* at best. It involves making a real-ish filesystemwhich
   * I don't have much experience in :P This is why it is disabled by default!
   */
  OSjs.Core.getMountManager()._add({
    readOnly: false,
    name: 'LocalStorage',
    transport: 'LocalStorage',
    description: API.getConfig('VFS.LocalStorage.Options.description', 'LocalStorage'),
    visible: true,
    searchable: false,
    unmount: function(cb) {
      cb = cb || function() {};
      _isMounted = false;
      API.message('vfs:unmount', 'LocalStorage', {source: null});
      cb(false, true);
    },
    mounted: function() {
      return _isMounted;
    },
    enabled: function() {
      try {
        if ( API.getConfig('VFS.LocalStorage.Enabled') ) {
          return true;
        }
      } catch ( e ) {
        console.warn('OSjs.VFS.Modules.LocalStorage::enabled()', e, e.stack);
      }
      return false;
    },
    root: 'localstorage:///',
    icon: API.getConfig('VFS.LocalStorage.Options.icon', 'apps/web-browser.png'),
    match: /^localstorage\:\/\//,
    request: makeRequest
  });

})(OSjs.Utils, OSjs.API);
