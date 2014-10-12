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

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  function GoogleDrive() {
  }

  GoogleDrive.prototype.scandir = function(item, callback) {
    var dir = item.type === 'dir' ? item.path : (Utils.dirname(item.path) + '/'); // FIXME
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
      try {
        var initialRequest = gapi.client.drive.files.list();
        retrievePageOfFiles(initialRequest, []);
      } catch ( e ) {
        console.warn('GoogleDrive::scandir() exception', e, e.stack);
        console.warn('THIS ERROR OCCURS WHEN MULTIPLE REQUESTS FIRE AT ONCE ?!'); // FIXME
        cb([]);
      }
    }

    retrieveAllFiles(function(list) {
      var result = [];
      if ( list ) {
        list.forEach(function(iter, i) {
          var path = dir;
          if ( !path.match(/\/$/) ) {
            path += '/';
          }
          path += iter.title;
          result.push(new OSjs.VFS.File({
            filename: iter.title,
            path: path,
            id:   iter.id,
            size: iter.quotaBytesUsed,
            mime: iter.mimeType,
            type: iter.kind === 'drive#file' ? 'file' : 'dir'
          }));
        });
        result = OSjs.VFS.filterScandir(result, item._opts);
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
      console.info('GoogleDrive::read()', '=>', file);

      if ( file && file.id ) {
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
      } else {
        callback('Failed to fetch file');
      }
    });
  };

  GoogleDrive.prototype.write = function(file, data, callback) {
    console.info('GoogleDrive::write()', file);

    this.exists(file, function(error, exists) {
      var uri = '/upload/drive/v2/files';
      var method = 'POST';
      if ( !error && exists ) {
        uri = '/upload/drive/v2/files/' + exists.id;
        method = 'PUT';
      }
      var fileData = createBoundary(file, data, function(error, fileData) {
        var request = gapi.client.request({
          path: uri,
          method: method,
          params: {uploadType: 'multipart'},
          headers: {'Content-Type': fileData.contentType},
          body: fileData.body
        });

        request.execute(function(resp) {
          console.info('GoogleDrive::write()', '=>', resp);
          if ( resp && resp.id ) {
            callback(false, true);
          } else {
            callback('Failed to write file');
          }
        });
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
      if ( resp && (typeof resp.result === 'object') ) {
        callback(false, true);
      } else {
        callback('Failed to unlink file');
      }
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
    this.scandir(item, function(error, result) {
      if ( error ) {
        callback('Failed to check existence: ' + error);
        return;
      }
      var found = false;

      if ( result ) {
        result.forEach(function(iter) {
          if ( iter.path === item.path ) {
            found = new OSjs.VFS.File(item.path, iter.mimeType);
            found.id = iter.id;
            fount.title = iter.title;
            return false;
          }
          return true;
        });
      }

      callback(false, found);
    });
  };

  // TODO
  GoogleDrive.prototype.fileinfo = function(item, callback) {
    console.info('GoogleDrive::fileinfo()', item);
    callback('GoogleDrive::fileinfo() not implemented yet');
  };

  GoogleDrive.prototype.url = function(item, callback) {
    console.info('GoogleDrive::url()', item);
    if ( !item || !item.id ) {
      throw new Error('url() expects a File ref with Id');
    }

    var request = gapi.client.drive.files.get({
      fileId: item.id
    });

    request.execute(function(file) {
      console.info('GoogleDrive::url()', file);
      if ( file && file.webContentLink ) {
        callback(false, file.webContentLink);
      } else {
        callback('Failed to get URL or file not found!');
      }
    });
  };

  GoogleDrive.prototype.mkdir = function(dir, callback) {
    console.info('GoogleDrive::mkdir()', dir);
    var request = gapi.client.request({
      'path': '/drive/v2/files',
      'method': 'POST',
      'body': JSON.stringify({
        title: dir.filename,
        parents: null, // TODO
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    request.execute(function(resp) {
      console.info('GoogleDrive::mkdir()', '=>', resp);
      if ( resp && resp.id ) {
        callback(false, true);
      } else {
        callback('Failed to create directory');
      }
    });
  };

  GoogleDrive.prototype.upload = function(file, dest, callback) {
    dest = dest.replace(OSjs.VFS.Modules.GoogleDrive.match, '');
    if ( !dest.match(/\/$/) ) {
      dest += '/';
    }

    var item = new OSjs.VFS.File({
      filename: file.name,
      path: dest + file.name,
      mime: file.type,
      size: file.size
    });

    this.write(item, file, callback);
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  var getGoogleDrive = (function() {
    var _gd;
    return function(callback, onerror) {
      callback = callback || function() {};
      onerror  = onerror  || function() {};

      if ( !_gd ) {
        _gd = new GoogleDrive();
        OSjs.Handlers.getGoogleAPI(['drive-realtime', 'drive-share'],
                                   ['https://www.googleapis.com/auth/drive.install', 'https://www.googleapis.com/auth/drive.file', 'openid'],
                                    'drive', 'v2', function(error, result) {
                                      if ( error ) {
                                        return onerror(error);
                                      }
                                      callback(_gd);
                                    });
        return;
      }

      callback(_gd);
    };
  })();

  function makeRequest(name, args, callback) {
    args = args || [];
    callback = callback || function() {};

    getGoogleDrive(function(instance) {
      if ( !instance ) {
        throw new Error('No GoogleDrive instance was created. Load error ?');
      } else if ( !instance[name] ) {
        throw new Error('Invalid GoogleDrive API call name');
      }

      var fargs = args;
      fargs.push(callback);
      instance[name].apply(instance, fargs);
    }, function(error) {
      callback(error);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.Modules.GoogleDrive = OSjs.VFS.Modules.GoogleDrive || {
    description: 'Google Drive',
    visible: true,
    enabled: function() {
      var handler = API.getHandlerInstance();
      if ( handler ) {
        try {
          if ( handler.getConfig('Core').VFS.GoogleDrive.Enabled ) {
            return true;
          }
        } catch ( e ) {
          console.warn("OSjs.VFS.Modules.GoogleDrive::enabled()", e, e.stack);
        }
      }
      return false;
    },
    root: 'google-drive:///',
    icon: 'places/google-drive.png',
    match: /^google-drive\:\/\//,
    request: makeRequest
  };

})(OSjs.Utils, OSjs.API);
