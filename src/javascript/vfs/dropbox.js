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
(function(Utils, API) {
  'use strict';

  // https://github.com/bcherry/dropbox-js
  // https://github.com/apily/dropbox/blob/master/index.js
  // https://www.dropbox.com/developers/core/start/python
  // https://www.dropbox.com/developers/reference/devguide

  window.OSjs       = window.OSjs       || {};
  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  var _cachedClient;
  var _isMounted = false;

  function _getConfig(cfg) {
    try {
      var handler = API.getHandlerInstance();
      if ( handler ) {
        return handler.getConfig('Core').VFS.Dropbox[cfg];
      }
    } catch ( e ) {
      console.warn('OSjs.VFS.Modules.Dropbox::enabled()', e, e.stack);
    }
    return null;
  }

  function destroyNotificationIcon() {
    var wm = API.getWMInstance();
    if ( wm ) {
      wm.removeNotificationIcon('DropboxVFSService');
    }
  }

  function createNotificationIcon() {
    var wm = API.getWMInstance();

    function displayMenu(ev) {
      var pos = {x: ev.clientX, y: ev.clientY};
      OSjs.GUI.createMenu([{
        title: API._('DROPBOX_SIGN_OUT'),
        onClick: function() {
          signoutDropbox();
        }
      }], pos);
    }

    if ( wm ) {
      wm.createNotificationIcon('DropboxVFSService', {
        onContextMenu: function(ev) {
          displayMenu(ev);
          return false;
        },
        onClick: function(ev) {
          displayMenu(ev);
          return false;
        },
        onInited: function(el) {
          if ( el.firstChild ) {
            var img = document.createElement('img');
            img.title = API._('DROPBOX_NOTIFICATION_TITLE');
            img.alt = img.title;
            img.src = API.getThemeResource('status/gtk-dialog-authentication.png', 'icon', '16x16');
            el.firstChild.appendChild(img);
          }
        }
      });
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function DropboxVFS() {
    var clientKey = _getConfig('ClientKey');
    this.client = new window.Dropbox.Client({ key: clientKey });

    /*
    if ( this.client ) {
      var authDriver = new window.Dropbox.AuthDriver.Popup({
      });
      this.client.authDriver(authDriver);
    }
    */
  }

  DropboxVFS.prototype.init = function(callback) {
    this.client.authenticate(function(error, client) {
      console.warn('DropboxVFS::construct()', error, client);
      callback(error);
    });
  };

  DropboxVFS.prototype.scandir = function(item, callback) {
    console.info('DropboxVFS::scandir()', item);

    var path = OSjs.VFS.getRelativeURL(item.path);
    var isOnRoot = path === '/';

    function _finish(entries) {
      var result = [];
      if ( !isOnRoot ) {
        result.push(new OSjs.VFS.File({
          filename: '..',
          path: Utils.dirname(item.path),
          mime: null,
          type: 'dir'
        }));
      }
      entries.forEach(function(iter) {
        console.info(iter);
        result.push(new OSjs.VFS.File({
          filename: iter.name,
          path: OSjs.VFS.Modules.Dropbox.root.replace(/\/$/, '') + iter.path,
          size: iter.size,
          mime: iter.isFolder ? null : iter.mimeType,
          type: iter.isFolder ? 'dir' : 'file'
        }));
      });
      console.info('DropboxVFS::scandir()', item, '=>', result);

      var list = OSjs.VFS.filterScandir(result, item._opts);
      callback(false, list);
    }

    this.client.readdir(path, {}, function(error, entries, stat, entry_stats) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_SCANDIR_FMT', error);
        callback(error);
        return;
      }
      _finish(entry_stats);
    });
  };

  DropboxVFS.prototype.write = function(item, data, callback) {
    console.info('DropboxVFS::write()', item);

    var path = OSjs.VFS.getRelativeURL(item.path);
    var bytes = data;
    /*
    if ( typeof data === 'string' ) {
      bytes = new Uint8Array(data.length);
      for (var i=0; i<data.length; i++) {
        bytes[i] = data.charCodeAt(i);
      }
    }
    */

    this.client.writeFile(path, bytes, function(error, stat) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_WRITE_FMT', error);
      }
      callback(error, true);
    });
  };

  DropboxVFS.prototype.read = function(item, callback, options) {
    options = options || {};

    console.info('DropboxVFS::read()', item, options);
    var path = OSjs.VFS.getRelativeURL(item.path);
    this.client.readFile(path, options, function(error, entries) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_READ_FMT', error);
      }
      callback(error, (error ? false : (entries instanceof Array ? entries.join('\n') : entries)));
    });
  };

  DropboxVFS.prototype.copy = function(src, dest, callback) {
    console.info('DropboxVFS::copy()', src, dest);
    var spath = OSjs.VFS.getRelativeURL(src.path);
    var dpath = OSjs.VFS.getRelativeURL(dest.path);
    this.client.copy(spath, dpath, function(error) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_COPY_FMT', error);
      }
      callback(error, !error);
    });
  };

  DropboxVFS.prototype.move = function(src, dest, callback) {
    console.info('DropboxVFS::move()', src, dest);
    var spath = OSjs.VFS.getRelativeURL(src.path);
    var dpath = OSjs.VFS.getRelativeURL(dest.path);
    this.client.move(spath, dpath, function(error) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_MOVE_FMT', error);
      }
      callback(error, !error);
    });
  };

  DropboxVFS.prototype.unlink = function(item, callback) {
    console.info('DropboxVFS::unlink()', item);
    var path = OSjs.VFS.getRelativeURL(item.path);
    this.client.unlink(path, function(error, stat) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_UNLINK_FMT', error);
      }
      callback(error, !error);
    });
  };

  DropboxVFS.prototype.mkdir = function(item, callback) {
    console.info('DropboxVFS::mkdir()', item);
    var path = OSjs.VFS.getRelativeURL(item.path);
    this.client.mkdir(path, function(error, stat) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_MKDIR_FMT', error);
      }
      callback(error, !error);
    });
  };

  // FIXME: Is there a better way to do this ?!
  DropboxVFS.prototype.exists = function(item, callback) {
    console.info('DropboxVFS::exists()', item);
    this.read(item, function(error, data) {
      callback(error, !error);
    });
  };

  DropboxVFS.prototype.fileinfo = function(item, callback) {
    console.info('DropboxVFS::fileinfo()', item);

    var path = OSjs.VFS.getRelativeURL(item.path);
    this.client.stat(path, path, function(error, response) {
      var fileinfo = null;
      if ( error ) {
        error = API._('ERR_VFSMODULE_FILEINFO_FMT', error);
      } else {
        if ( response ) {
          fileinfo = {};

          var useKeys = ['clientModifiedAt', 'humanSize', 'mimeType', 'modifiedAt', 'name', 'path', 'size', 'versionTag'];
          useKeys.forEach(function(k) {
            fileinfo[k] = response[k];
          });
        }
      }

      callback(error, fileinfo);
    });
  };

  DropboxVFS.prototype.url = function(item, callback) {
    console.info('DropboxVFS::url()', item);
    var path = (typeof item === 'string') ? OSjs.VFS.getRelativeURL(item) : OSjs.VFS.getRelativeURL(item.path);
    this.client.makeUrl(path, {downloadHack: true}, function(error, url) {
      callback(error, url ? url.url : false);
    });
  };

  DropboxVFS.prototype.upload = function(file, dest, callback) {
    var ndest = dest.replace(OSjs.VFS.Modules.Dropbox.match, '');
    if ( !ndest.match(/\/$/) ) {
      ndest += '/';
    }

    console.info('DropboxVFS::upload()', file, dest, ndest);

    var item = new OSjs.VFS.File({
      filename: file.name,
      path: ndest + file.name,
      mime: file.type,
      size: file.size
    });

    this.write(item, file, callback);
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function getDropbox(callback) {
    if ( !_cachedClient ) {
      _cachedClient = new DropboxVFS();
      _cachedClient.init(function(error) {
        if ( error ) {
          console.error('Failed to initialize dropbox VFS', error);
          callback(null);
          return;
        }

        _isMounted = true;
        createNotificationIcon();
        API.message('vfs', {type: 'mount', module: 'Dropbox', source: null});

        callback(_cachedClient);
      });
      return;
    }
    callback(_cachedClient);
  }

  function signoutDropbox(cb, options) {
    cb = cb || function() {};
    options = options || null;

    function finished(client) {
      if ( client ) {
        client.reset();
      }
      _isMounted = false;
      _cachedClient = null;

      API.message('vfs', {type: 'unmount', module: 'Dropbox', source: null});

      destroyNotificationIcon();

      cb();
    }

    getDropbox(function(client) {
      client = client ? client.client : null;
      if ( client ) {
        try {
          client.signOut(options, function() {
            finished(client);
          });
        } catch ( ex ) {
          console.warn('DROPBOX SIGNOUT EXCEPTION', ex);
          finished(client);
        }
      }
    });
  }

  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || function() {};

    getDropbox(function(instance) {
      if ( !instance ) {
        callback('No Dropbox VFS API Instance was ever created. Possible intialization error');
        return;
      }
      var fargs = args;
      fargs.push(callback);
      fargs.push(options);
      instance[name].apply(instance, fargs);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Modules.Dropbox = OSjs.VFS.Modules.Dropbox || {
    readOnly: false,
    description: 'Dropbox',
    visible: true,
    unmount: function() {
      return false; // TODO
    },
    mounted: function() {
      return _isMounted;
    },
    enabled: function() {
      if ( !window.Dropbox ) {
        return false;
      }
      return _getConfig('Enabled') || false;
    },
    root: 'dropbox:///',
    icon: 'places/dropbox.png',
    match: /^dropbox\:\/\//,
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);

