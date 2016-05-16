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

  // https://github.com/bcherry/dropbox-js
  // https://github.com/apily/dropbox/blob/master/index.js
  // https://www.dropbox.com/developers/core/start/python
  // https://www.dropbox.com/developers/reference/devguide

  window.OSjs       = window.OSjs       || {};
  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  var _cachedClient;
  var _isMounted = false;

  function _getConfig(cfg, isVFS) {
    var config = OSjs.Core.getConfig();
    try {
      return isVFS ? config.VFS.Dropbox[cfg] : config.DropboxAPI[cfg];
    } catch ( e ) {
      console.warn('OSjs.VFS.Modules.Dropbox::enabled()', e, e.stack);
    }
    return null;
  }

  function destroyRingNotification() {
    var ring = API.getServiceNotificationIcon();
    if ( ring ) {
      ring.remove('Dropbox.js');
    }
  }

  function createRingNotification() {
    var ring = API.getServiceNotificationIcon();
    if ( ring ) {
      ring.add('Dropbox.js', [{
        title: API._('DROPBOX_SIGN_OUT'),
        onClick: function() {
          signoutDropbox();
        }
      }]);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function DropboxVFS() {
    var clientKey = _getConfig('ClientKey');
    this.client = new window.Dropbox.Client({ key: clientKey });

    if ( this.client ) {
      var href = window.location.href;
      if ( !href.match(/\/$/) ) {
        href += '/';
      }
      href += 'vendor/dropboxOauthReceiver.html';

      var authDriver = new window.Dropbox.AuthDriver.Popup({
        receiverUrl: href
      });
      this.client.authDriver(authDriver);
    }
  }

  DropboxVFS.prototype.init = function(callback) {
    var timedOut = false;

    var timeout = setTimeout(function() {
      timedOut = true;
      callback(API._('ERR_OPERATION_TIMEOUT_FMT', '60s'));
    }, 60 * 1000);

    this.client.authenticate(function(error, client) {
      if ( !timedOut ) {
        console.warn('DropboxVFS::construct()', error, client);
        timeout = clearTimeout(timeout);
        callback(error);
      }
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
          size: 0,
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
        callback(error);
        return;
      }
      _finish(entry_stats);
    });
  };

  DropboxVFS.prototype.write = function(item, data, callback) {
    console.info('DropboxVFS::write()', item);

    var path = OSjs.VFS.getRelativeURL(item.path);
    this.client.writeFile(path, data, function(error, stat) {
      callback(error, true);
    });
  };

  DropboxVFS.prototype.read = function(item, callback, options) {
    options = options || {};
    options.arrayBuffer = true;

    console.info('DropboxVFS::read()', item, options);
    var path = OSjs.VFS.getRelativeURL(item.path);

    this.client.readFile(path, options, function(error, entries) {
      callback(error, (error ? false : (entries instanceof Array ? entries.join('\n') : entries)));
    });
  };

  DropboxVFS.prototype.copy = function(src, dest, callback) {
    console.info('DropboxVFS::copy()', src, dest);
    var spath = OSjs.VFS.getRelativeURL(src.path);
    var dpath = OSjs.VFS.getRelativeURL(dest.path);
    this.client.copy(spath, dpath, function(error) {
      callback(error, !error);
    });
  };

  DropboxVFS.prototype.move = function(src, dest, callback) {
    console.info('DropboxVFS::move()', src, dest);
    var spath = OSjs.VFS.getRelativeURL(src.path);
    var dpath = OSjs.VFS.getRelativeURL(dest.path);
    this.client.move(spath, dpath, function(error) {
      callback(error, !error);
    });
  };

  DropboxVFS.prototype.unlink = function(item, callback) {
    console.info('DropboxVFS::unlink()', item);
    var path = OSjs.VFS.getRelativeURL(item.path);
    this.client.unlink(path, function(error, stat) {
      callback(error, !error);
    });
  };

  DropboxVFS.prototype.mkdir = function(item, callback) {
    console.info('DropboxVFS::mkdir()', item);
    var path = OSjs.VFS.getRelativeURL(item.path);
    this.client.mkdir(path, function(error, stat) {
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
      if ( !error && response ) {
        fileinfo = {};

        var useKeys = ['clientModifiedAt', 'humanSize', 'mimeType', 'modifiedAt', 'name', 'path', 'size', 'versionTag'];
        useKeys.forEach(function(k) {
          fileinfo[k] = response[k];
        });
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

  DropboxVFS.prototype.trash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  DropboxVFS.prototype.untrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };

  DropboxVFS.prototype.emtpyTrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
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
          callback(null, error);
          return;
        }

        _isMounted = true;

        createRingNotification();

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

      destroyRingNotification();

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

    getDropbox(function(instance, error) {
      if ( !instance ) {
        callback('No Dropbox VFS API Instance was ever created. Possible intialization error' + (error ? ': ' + error : ''));
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

  /**
   * This is the Dropbox VFS Abstraction for OS.js
   *
   * @api OSjs.VFS.Modules.Dropbox
   */
  OSjs.VFS.Modules.Dropbox = OSjs.VFS.Modules.Dropbox || OSjs.VFS._createMountpoint({
    readOnly: false,
    description: 'Dropbox',
    visible: true,
    searchable: false,
    unmount: function(cb) {
      // FIXME: Should we sign out here too ?
      cb = cb || function() {};
      _isMounted = false;
      API.message('vfs', {type: 'unmount', module: 'Dropbox', source: null});
      cb(false, true);
    },
    mounted: function() {
      return _isMounted;
    },
    enabled: function() {
      if ( !window.Dropbox ) {
        return false;
      }
      return _getConfig('Enabled', true) || false;
    },
    root: 'dropbox:///',
    icon: 'places/dropbox.png',
    match: /^dropbox\:\/\//,
    request: makeRequest
  });

})(OSjs.Utils, OSjs.API);

