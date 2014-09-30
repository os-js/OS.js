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
(function() {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.VFS          = OSjs.VFS          || {};

  var getGoogleDrive = (function() {
    var _gd;
    return function(callback) {
      callback = callback || function() {};
      var CLIENT_ID = '102829789507-17p4beok9ecfsen8n5kvi6h0mckdh9an.apps.googleusercontent.com';
      if ( !_gd ) {
        _gd = new GoogleDrive(CLIENT_ID);
        _gd.init(function() {
          callback(_gd);
        });
      } else {
        callback(_gd);
      }
    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // Google Drive
  /////////////////////////////////////////////////////////////////////////////

  // https://developers.google.com/drive/web/quickstart/quickstart-js
  // https://developers.google.com/+/web/signin/javascript-flow
  // https://developers.google.com/drive/realtime/realtime-quickstart
  // https://developers.google.com/drive/v2/reference/files/list

  function GoogleDrive(clientId) {
    this.clientId = clientId;
    this.userId   = null;
    this.preloads = [
      {
        type: 'javascript',
        src: 'https://apis.google.com/js/api.js'
      }
    ];
  }

  GoogleDrive.prototype.destroy = function() {
    try {
      gapi.auth.signOut();
    } catch ( e ) {
    }
  };

  GoogleDrive.prototype.init = function(callback) {
    callback = callback || function() {};
    var self = this;

    function preloaded(error) {
      if ( !error ) {
        self.doInit(function(success) {
          if ( success ) {
            self.doAuthentication(function(success) {
              if ( success ) {
                self.doDriveLoad(function(success) {
                  if ( success ) {
                    callback(false);
                  }
                });
              }
            });
          }
        });
        return;
      }

      callback(error);
    }

    OSjs.Utils.Preload(this.preloads, function(total, errors) {
      if ( errors ) {
        preloaded(error);
        return;
      }

      preloaded(false);
    });
  };

  GoogleDrive.prototype.doInit = function(callback) {
    console.warn('GoogleDrive::doInit()');

    callback = callback || function() {};

    gapi.load('auth:client,drive-realtime,drive-share', function() {
      callback(true); // FIXME
    });
  };

  GoogleDrive.prototype.doAuthentication = function(callback) {
    console.warn('GoogleDrive::doAuthentication()');

    callback = callback || function() {};

    var self = this;

    function getUserId(cb) {
      cb = cb || function() {};
      gapi.client.load('oauth2', 'v2', function() {
        gapi.client.oauth2.userinfo.get().execute(function(resp) {
          console.warn('GoogleDrive::doAuthentication() => getUserId()', resp);

          console.warn('getUserId()', resp);
          cb(resp.id);
        });
      });
    }

    function login(immediate, cb) {
      console.warn('GoogleDrive::doAuthentication() => login()', immediate);

      cb = cb || function() {};
      gapi.auth.authorize({
        client_id: self.clientId,
        scope: [
          'https://www.googleapis.com/auth/drive.install',
          'https://www.googleapis.com/auth/drive.file',
          'openid'
        ],
        user_id: self.userId,
        immediate: immediate
      }, cb);
    }

    var handleAuthResult = function(authResult) {
      console.warn('GoogleDrive::doAuthentication() => handleAuthResult()', authResult);

      if ( authResult && !authResult.error ) {
        getUserId(function(id) {
          self.userId = id;

          if ( id ) {
            callback(true);
          } else {
            callback(false);
          }
        });
      } else {
        login(false, handleAuthResult);
      }
    };

    login(true, handleAuthResult);
  };

  GoogleDrive.prototype.doDriveLoad = function(callback) {
    callback = callback || function() {};

    console.warn('GoogleDrive::doDriveLoad()');

    gapi.client.load('drive', 'v2', function() {
      callback(true); // FIXME
    });
  };

  GoogleDrive.prototype.scandir = function(dir, opts, callback) {
    console.warn('GoogleDrive::scandir()', dir);

    function retrieveAllFiles(cb) {
      var retrievePageOfFiles = function(request, result) {
        request.execute(function(resp) {
          result = result.concat(resp.items);
          var nextPageToken = resp.nextPageToken;
          if (nextPageToken) {
            request = gapi.client.drive.files.list({
              'pageToken': nextPageToken
            });
            retrievePageOfFiles(request, result);
          } else {
            cb(result);
          }
        });
      }
      var initialRequest = gapi.client.drive.files.list();
      retrievePageOfFiles(initialRequest, []);
    }

    retrieveAllFiles(function(list) {
      var result = [];
      if ( list ) {
        list.forEach(function(iter, i) {
          result.push({
            filename: iter.title,
            path: dir + iter.id,
            size: iter.quotaBytesUsed,
            mime: iter.mimeType,
            type: iter.kind === 'drive#file' ? 'file' : 'dir'
          });
        });
      }
      callback(false, result, list);
    });
  };

  GoogleDrive.prototype.read = function(filename, callback) {
    callback('Not implemented');
  };

  GoogleDrive.prototype.write = function(filename, data, callback) {
    callback('Not implemented');
  };

  GoogleDrive.prototype.copy = function(src, dest, callback) {
    callback('Not implemented');
  };

  GoogleDrive.prototype.move = function(src, dest, callback) {
    callback('Not implemented');
  };

  GoogleDrive.prototype.unlink = function(src, callback) {
    callback('Not implemented');
  };

  GoogleDrive.prototype.exists = function(src, callback) {
    callback('Not implemented');
  };

  GoogleDrive.prototype.fileinfo = function(filename, callback) {
    callback('Not implemented');
  };

  GoogleDrive.prototype.url = function(filename, callback) {
    callback('Not implemented');
  };

  /////////////////////////////////////////////////////////////////////////////
  // VFS METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Scandir
   */
  OSjs.VFS.scandir = function(dir, opts, callback) {
    if ( dir.match(/google-drive\:\/\//) ) {
      this._googledrive('scandir', [dir, opts], callback);
      return;
    }
    opts = opts || {};
    this._internal('scandir', [dir, opts], callback);
  };

  /**
   * Write File
   */
  OSjs.VFS.write = function(filename, data, dataSource, callback) {
    if ( filename.match(/google-drive\:\/\//) ) {
      this._googledrive('write', [filename, data], callback);
      return;
    }

    var wopts = [filename, data];
    if ( (dataSource !== null) && dataSource !== false ) {
      wopts.push({dataSource: dataSource});
    }
    this._internal('write', wopts, callback);
  };

  /**
   * Read File
   */
  OSjs.VFS.read = function(filename, dataSource, callback) {
    if ( filename.match(/google-drive\:\/\//) ) {
      this._googledrive('read', [filename], callback);
      return;
    }

    var ropts = [filename];
    if ( (dataSource !== null) && dataSource !== false ) {
      ropts.push({dataSource: dataSource});
    }
    this._internal('read', ropts, callback);
  };

  /**
   * Copy File
   */
  OSjs.VFS.copy = function(src, dest, callback) {
    if ( src.match(/google-drive\:\/\//) || dst.match(/google-drive\:\/\//) ) {
      callback('Not implemented');
      return;
    }
    this._internal('copy', [src, dest], callback);
  };

  /**
   * Move File
   */
  OSjs.VFS.move = function(src, dest, callback) {
    if ( src.match(/google-drive\:\/\//) || dst.match(/google-drive\:\/\//) ) {
      callback('Not implemented');
      return;
    }
    this._internal('move', [src, dest], callback);
  };
  OSjs.VFS.rename = function(src, dest, callback) {
    OSjs.VFS.move.apply(this, arguments);
  };

  /**
   * Delete File
   */
  OSjs.VFS.unlink = function(src, callback) {
    if ( src.match(/google-drive\:\/\//) ) {
      this._googledrive('delete', [src], callback);
      return;
    }
    this._internal('delete', [src], callback);
  };
  OSjs.VFS['delete'] = function(src, callback) {
    OSjs.VFS.unlink.apply(this, arguments);
  };

  /**
   * Create Directory
   */
  OSjs.VFS.mkdir = function(dirname, callback) {
    if ( dirname.match(/google-drive\:\/\//) ) {
      this._googledrive('mkdir', [dirname], callback);
      return;
    }
    this._internal('mkdir', [dirname], callback);
  };

  /**
   * Check if file exists
   */
  OSjs.VFS.exists = function(filename, callback) {
    if ( filename.match(/google-drive\:\/\//) ) {
      this._googledrive('exists', [filename], callback);
      return;
    }
    this._internal('exists', [filename], callback);
  };

  /**
   * Get file info
   */
  OSjs.VFS.fileinfo = function(filename, callback) {
    if ( filename.match(/google-drive\:\/\//) ) {
      this._googledrive('fileinfo', [filename], callback);
      return;
    }
    this._internal('fileinfo', [filename], callback);
  };

  /**
   * Get file URL
   */
  OSjs.VFS.url = function(path, callback) {
    path = path || '';
    if ( path.match(/^osjs\:\/\//) ) {
      callback(false, path.replace(/^osjs\:\/\//, ''));
      return;
    }
    if ( path.match(/google-drive\:\/\//) ) {
      this._googledrive('url', [path], callback);
      return;
    }

    var handler = OSjs.API.getHandlerInstance();
    var fsuri   = handler.getConfig('Core').FSURI;
    callback(false, path ? (fsuri + path) : fsuri);
  };

  /**
   * Google Drive call
   */
  OSjs.VFS._googledrive = function(name, args, callback) {
    args = args || [];
    callback = callback || {};

    getGoogleDrive(function(instance) {
      var fargs = args;
      fargs.push(callback);

      instance[name].apply(instance, fargs);

      instance.scandir(dir, function(error, result, raw) {
        callback(error, result);
      });
    });
  };

  /**
   * Internal call
   */
  OSjs.VFS._internal = function(name, args, callback) {
    args = args || [];
    callback = callback || {};

    OSjs.API.call('fs', {'method': name, 'arguments': args}, function(res) {
      if ( !res || (typeof res.result === 'undefined') || res.error ) {
        callback(res.error || OSjs._('Fatal error'));
      } else {
        callback(false, res.result);
      }
    }, function(error) {
      callback(error);
    });
  };

})();
