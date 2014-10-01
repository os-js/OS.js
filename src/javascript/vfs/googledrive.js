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

  // http://stackoverflow.com/questions/10330992/authorization-of-google-drive-using-javascript/10331393#10331393
  // https://developers.google.com/drive/web/quickstart/quickstart-js
  // https://developers.google.com/+/web/signin/javascript-flow
  // https://developers.google.com/drive/realtime/realtime-quickstart
  // https://developers.google.com/drive/v2/reference/files/list

  window.OSjs       = window.OSjs       || {};
  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function createBoundary(file, data, callback) {
    var boundary = '-------314159265358979323846';
    var delimiter = "\r\n--" + boundary + "\r\n";
    var close_delim = "\r\n--" + boundary + "--";
    var contentType = file.mime || 'text/plain'; //fileData.type || 'application/octet-stream';

    function createBody(result) {
      var metadata = {
        title: file.filename,
        mimeType: contentType
      };
      var base64Data = btoa(result);
      var multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: ' + contentType + '\r\n' +
          'Content-Transfer-Encoding: base64\r\n' +
          '\r\n' +
          base64Data +
          close_delim;

      return multipartRequestBody;
    }

    var reqContentType = 'multipart/mixed; boundary="' + boundary + '"';
    if ( typeof data === 'string' ) {
      var body = createBody(data);
      callback(false, {
        contentType: reqContentType,
        body: body
      });
    } else {
      var reader = new FileReader();
      reader.readAsBinaryString(data);
      reader.onload = function(e) {
        var body = createBody(reader.result);
        callback(false, {
          contentType: reqContentType,
          body: body
        });
      };
      reader.onerror = function() {
        callback(e);
      };
    }
  }

  var getGoogleDrive = (function() {
    var _gd;
    return function(callback) {
      callback = callback || function() {};
      var clientId = null;
      var handler = API.getHandlerInstance();
      if ( handler ) {
        try {
          clientId = handler.getConfig('Core').VFS.GoogleDrive.ClientId;
        } catch ( e ) {
          console.warn("getGoogleDrive()", e, e.stack);
        }
      }
      if ( !_gd ) {
        _gd = new GoogleDrive(clientId);
        _gd.init(function() {
          callback(_gd);
        });
      } else {
        callback(_gd);
      }
    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

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

    Utils.Preload(this.preloads, function(total, errors) {
      if ( errors ) {
        preloaded(error);
        return;
      }

      preloaded(false);
    });
  };

  GoogleDrive.prototype.doInit = function(callback) {
    console.info('GoogleDrive::doInit()');

    callback = callback || function() {};

    gapi.load('auth:client,drive-realtime,drive-share', function() {
      callback(true); // FIXME
    });
  };

  GoogleDrive.prototype.doAuthentication = function(callback) {
    console.info('GoogleDrive::doAuthentication()');

    callback = callback || function() {};

    var self = this;

    function getUserId(cb) {
      cb = cb || function() {};
      gapi.client.load('oauth2', 'v2', function() {
        gapi.client.oauth2.userinfo.get().execute(function(resp) {
          console.info('GoogleDrive::doAuthentication() => getUserId()', resp);
          cb(resp.id);
        });
      });
    }

    function login(immediate, cb) {
      console.info('GoogleDrive::doAuthentication() => login()', immediate);

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
      console.info('GoogleDrive::doAuthentication() => handleAuthResult()', authResult);

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
    gapi.client.load('drive', 'v2', function(resp) {
      callback(true); // FIXME
    });
  };

  // TODO: _opts
  GoogleDrive.prototype.scandir = function(item, callback) {
    var dir = item.path;
    console.info('GoogleDrive::scandir()', dir);

    function retrieveAllFiles(cb) {
      var retrievePageOfFiles = function(request, result) {
        request.execute(function(resp) {
          console.info('GoogleDrive::scandir()', '=>', resp);

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
          result.push(new OSjs.VFS.File({
            filename: iter.title,
            path: dir + '/' + iter.title,
            id:   iter.id,
            size: iter.quotaBytesUsed,
            mime: iter.mimeType,
            type: iter.kind === 'drive#file' ? 'file' : 'dir'
          }));
        });
      }
      callback(false, result, list);
    });
  };

  GoogleDrive.prototype.read = function(item, callback) {
    console.info('GoogleDrive::read()', item);

    var request = gapi.client.drive.files.get({
      fileId: item.id
    });

    request.execute(function(file) {
      console.info('GoogleDrive::read()', file);

      // FIXME: Check for error

      var accessToken = gapi.auth.getToken().access_token;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', file.downloadUrl);
      xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      xhr.onload = function() {
        callback(false, xhr.responseText);
      };
      xhr.onerror = function() {
        callback('XHR Error');
      };
      xhr.send();
    });
  };

  GoogleDrive.prototype.write = function(file, data, callback) {
    console.info('GoogleDrive::write()', file);

    var fileData = createBoundary(file, data, function(error, fileData) {
      var request = gapi.client.request({
        path: '/upload/drive/v2/files',
        method: 'POST',
        params: {uploadType: 'multipart'},
        headers: {'Content-Type': fileData.contentType},
        body: fileData.body
      });

      request.execute(function(resp) {
        console.info('GoogleDrive::write()', '=>', resp);
        callback(false, true); // FIXME
      });
    });
  };

  GoogleDrive.prototype.copy = function(src, dest, callback) {
    console.info('GoogleDrive::copy()', src, dest);
    var request = gapi.client.drive.files.copy({
      fileId: Utils.filename(src),
      resource: {title: Utils.filename(dest)}
    });
    request.execute(function(resp) {
      console.info('GoogleDrive::copy()', '=>', resp);
      if ( resp.id ) {
        callback(false, true);
        return;
      }
      callback('Failed to copy');
    });
  };

  GoogleDrive.prototype.unlink = function(src, callback) {
    console.info('GoogleDrive::unlink()', src);
    var request = gapi.client.drive.files.delete({
      fileId: src.id
    });
    request.execute(function(resp) {
      console.info('GoogleDrive::unlink()', '=>', resp);
      callback(false, true); // FIXME
    });
  };

  // TODO
  GoogleDrive.prototype.move = function(src, dest, callback) {
    console.info('GoogleDrive::move()', src, dest);
    callback('GoogleDrive::move() not implemented yet');
  };

  GoogleDrive.prototype.exists = function(item, callback) {
    console.info('GoogleDrive::exists()', item);

    // FIXME Is there a better way to do this ?
    this.scandir(Utils.dirname(item.path), function(error, result) {
      if ( error ) {
        callback('Failed to check existence: ' + error);
        return;
      }
      var found = false;

      if ( result ) {
        result.forEach(function(iter) {
          if ( iter.path === item.path ) {
            found = true;
            return false;
          }
          return true;
        });
      }

      callback(false, !found);
    });
  };

  // TODO
  GoogleDrive.prototype.fileinfo = function(item, callback) {
    console.info('GoogleDrive::fileinfo()', item);
    callback('GoogleDrive::fileinfo() not implemented yet');
  };

  // TODO
  GoogleDrive.prototype.url = function(item, callback) {
    console.info('GoogleDrive::url()', item);
    callback('GoogleDrive::url() not implemented yet');
  };

  GoogleDrive.prototype.mkdir = function(dir, callback) {
    console.info('GoogleDrive::mkdir()', dir);
    var request = gapi.client.request({
      'path': '/drive/v2/files',
      'method': 'POST',
      'body': JSON.stringify({
        title: Utils.filename(dir),
        parents: null,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    request.execute(function(resp) {
      console.info('GoogleDrive::mkdir()', '=>', resp);
      callback(false, true); // FIXME
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function makeRequest(name, args, callback) {
    console.error("XXX", name, args);
    args = args || [];
    callback = callback || {};

    getGoogleDrive(function(instance) {
      if ( !instance ) {
        throw 'No GoogleDrive instance was created. Load error ?';
      }
      if ( !instance[name] ) {
        throw 'Invalid GoogleDrive API call name';
      }
      var fargs = args;
      fargs.push(callback);

      instance[name].apply(instance, fargs);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Modules.GoogleDrive = OSjs.VFS.Modules.GoogleDrive || {
    enabled: false,
    match: /google-drive\:\/\//,
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);
