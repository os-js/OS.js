/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Utils, API, VFS, Core) {
  'use strict';

  /**
   * @namespace VFS
   * @memberof OSjs
   */

  /**
   * @namespace Helpers
   * @memberof OSjs.VFS
   */

  /**
   * @namespace Transports
   * @memberof OSjs.VFS
   */

  /**
   * @namespace Modules
   * @memberof OSjs.VFS
   */

  /**
   * A supported file data type
   * @typedef {(window.File|window.Blob|OSjs.VFS.File|OSjs.VFS.FileDataURL)} File
   */

  /*@
   *
   *  This is a wrapper for handling all VFS functions
   *  read() write() scandir() and so on.
   *
   *  See 'src/client/javascript/vfs/' for the specific modules.
   *
   *  You should read the information below!
   *
   *  ---------------------------------------------------------------------------
   *
   *  Functions that take 'metadata' (File Metadata) as an argument (like all of them)
   *  it expects you to use an instance of VFS.File()
   *
   *     VFS.read(new VFS.File('/path/to/file', 'text/plain'), callback);
   *
   *  or anonymous file paths:
   *     VFS.read('/path/to/file', callback)
   *
   *  ---------------------------------------------------------------------------
   *
   *  By default all functions that read data will return ArrayBuffer, but you can also return:
   *     String
   *     dataSource
   *     ArrayBuffer
   *     Blob
   *
   *  ---------------------------------------------------------------------------
   *
   *  Functions that take 'data' (File Data) as an argument supports these types:
   *
   *     File                      Browser internal
   *     Blob                      Browser internal
   *     ArrayBuffer               Browser internal
   *     String                    Just a normal string
   *     VFS.FileDataURL           Wrapper for dataSource URL strings
   *     JSON                      JSON Data defined as: {filename: foo, data: bar}
   *
   *  ---------------------------------------------------------------------------
   *
   *  This a list of modules and their paths
   *
   *     User         home:///            OS.js User Storage
   *     OS.js        osjs:///            OS.js Dist (Read-only)
   *     GoogleDrive  google-drive:///    Google Drive Storage
   *     OneDrive     onedrive:///        Microsoft OneDrive (SkyDrive)
   *     Dropbox      dropbox:///         Dropbox Storage
   *
   */

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Filters a scandir() request
   *
   * @function filterScandir
   * @memberof OSjs.VFS.Helpers
   *
   * @param     {Array}     list                      List of results from scandir()
   * @param     {Object}    options                   Filter options
   * @param     {String}    options.typeFilter        `type` filter
   * @param     {Array}     options.mimeFilter        `mime` filter
   * @param     {Boolean}   options.showHiddenFiles   Show dotfiles
   * @param     {String}    [options.sortBy=null]     Sort by this key
   * @param     {String}    [options.sortDir='asc']   Sort in this direction
   *
   * @return  {Boolean}
   */
  VFS.Helpers.filterScandir = function filterScandir(list, options) {
    var defaultOptions = Utils.cloneObject(Core.getSettingsManager().get('VFS') || {});
    var ioptions = Utils.cloneObject(options, true);
    var ooptions = Utils.argumentDefaults(ioptions, defaultOptions.scandir || {});
    ooptions = Utils.argumentDefaults(ooptions, {
      sortBy: null,
      sortDir: 'asc',
      typeFilter: null,
      mimeFilter: [],
      showHiddenFiles: true
    }, true);

    function filterFile(iter) {
      if ( (ooptions.typeFilter && iter.type !== ooptions.typeFilter) || (!ooptions.showHiddenFiles && iter.filename.match(/^\.\w/)) ) {
        return false;
      }
      return true;
    }

    function validMime(iter) {
      if ( ooptions.mimeFilter && ooptions.mimeFilter.length && iter.mime ) {
        return ooptions.mimeFilter.some(function(miter) {
          if ( iter.mime.match(miter) ) {
            return true;
          }
          return false;
        });
      }
      return true;
    }

    var result = list.filter(function(iter) {
      if ( iter.filename === '..' || !filterFile(iter) ) {
        return false;
      }

      if ( iter.type === 'file' && !validMime(iter) ) {
        return false;
      }

      return true;
    }).map(function(iter) {
      if ( iter.mime === 'application/vnd.google-apps.folder' ) {
        iter.type = 'dir';
      }
      return iter;
    });

    var sb = ooptions.sortBy;
    var types = {
      mtime: 'date',
      ctime: 'date'
    };

    if ( ['filename', 'size', 'mime', 'ctime', 'mtime'].indexOf(sb) !== -1  ) {
      if ( types[sb] === 'date' ) {
        result.sort(function(a, b) {
          a = new Date(a[sb]);
          b = new Date(b[sb]);
          return (a > b) ? 1 : ((b > a) ? -1 : 0);
        });
      } else {
        if ( sb === 'size' || !String.prototype.localeCompare ) {
          result.sort(function(a, b) {
            return (a[sb] > b[sb]) ? 1 : ((b[sb] > a[sb]) ? -1 : 0);
          });
        } else {
          result.sort(function(a, b) {
            return String(a[sb]).localeCompare(String(b[sb]));
          });
        }
      }

      if ( ooptions.sortDir === 'desc' ) {
        result.reverse();
      }
    }

    return result.filter(function(iter) {
      return iter.type === 'dir';
    }).concat(result.filter(function(iter) {
      return iter.type !== 'dir';
    }));
  };

  /*
   * Wrapper for converting data
   */
  function _abToSomething(m, arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';

    try {
      var blob    = new Blob([arrayBuffer], {type: mime});
      var r       = new FileReader();
      r.onerror   = function(e) {
        callback(e);
      };
      r.onloadend = function()  {
        callback(false, r.result);
      };
      r[m](blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // CONVERSION HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is a helper to add a File to FormData
   *
   * @function addFormFile
   * @memberof OSjs.VFS.Helpers
   *
   * @param   {FormData}                        fd      FormData instance
   * @param   {String}                          key     FormData entry name
   * @param   {(window.File|window.Blob)}       data    File Data (see supported types)
   * @param   {OSjs.VFS.File}                   file    File Metadata
   */
  VFS.Helpers.addFormFile = function addFormFile(fd, key, data, file) {
    file = file || {mime: 'application/octet-stream', filename: 'filename'};

    if ( data instanceof window.File ) {
      fd.append(key, data);
    } else if ( data instanceof window.ArrayBuffer ) {
      try {
        data = new Blob([data], {type: file.mime});
      } catch ( e ) {
        data = null;
        console.warn(e, e.stack);
      }

      fd.append(key, data, file.filename);
    } else {
      if ( data.data && data.filename ) { // In case user defines custom
        fd.append(key, data.data, data.filename);
      }
    }
  };

  /**
   * Convert DataSourceURL to ArrayBuffer
   *
   * @function dataSourceToAb
   * @memberof OSjs.VFS.Helpers
   *
   * @param   {String}        data        The datasource string
   * @param   {String}        mime        The mime type
   * @param   {Function}      callback    Callback function => fn(error, result)
   */
  VFS.Helpers.dataSourceToAb = function dataSourceToAb(data, mime, callback) {
    var byteString = atob(data.split(',')[1]);
    //var mimeString = data.split(',')[0].split(':')[1].split(';')[0];

    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    callback(false, ab);
  };

  /**
   * Convert PlainText to ArrayBuffer
   *
   * @function textToAb
   * @memberof OSjs.VFS.Helpers
   *
   * @param   {String}        data        The plaintext string
   * @param   {String}        mime        The mime type
   * @param   {Function}      callback    Callback function => fn(error, result)
   */
  VFS.Helpers.textToAb = function textToAb(data, mime, callback) {
    _abToSomething('readAsArrayBuffer', data, mime, callback);
  };

  /**
   * Convert ArrayBuffer to DataSourceURL
   *
   * @function abToDataSource
   * @memberof OSjs.VFS.Helpers
   *
   * @param   {ArrayBuffer}   arrayBuffer The ArrayBuffer
   * @param   {String}        mime        The mime type
   * @param   {Function}      callback    Callback function => fn(error, result)
   */
  VFS.Helpers.abToDataSource = function abToDataSource(arrayBuffer, mime, callback) {
    _abToSomething('readAsDataURL', arrayBuffer, mime, callback);
  };

  /**
   * Convert ArrayBuffer to PlainText
   *
   * @function abToText
   * @memberof OSjs.VFS.Helpers
   *
   * @param   {ArrayBuffer}   arrayBuffer The ArrayBuffer
   * @param   {String}        mime        The mime type
   * @param   {Function}      callback    Callback function => fn(error, result)
   */
  VFS.Helpers.abToText = function abToText(arrayBuffer, mime, callback) {
    _abToSomething('readAsText', arrayBuffer, mime, callback);
  };

  /**
   * Convert ArrayBuffer to BinaryString
   *
   * @function abToBinaryString
   * @memberof OSjs.VFS.Helpers
   *
   * @param   {ArrayBuffer}   arrayBuffer The ArrayBuffer
   * @param   {String}        mime        The mime type
   * @param   {Function}      callback    Callback function => fn(error, result)
   */
  VFS.Helpers.abToBinaryString = function abToBinaryString(arrayBuffer, mime, callback) {
    _abToSomething('readAsBinaryString', arrayBuffer, mime, callback);
  };

  /**
   * Convert ArrayBuffer to Blob
   *
   * @function abToBlob
   * @memberof OSjs.VFS.Helpers
   *
   * @param   {ArrayBuffer}   arrayBuffer The ArrayBuffer
   * @param   {String}        mime        The mime type
   * @param   {Function}      callback    Callback function => fn(error, result)
   */
  VFS.Helpers.abToBlob = function abToBlob(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';

    try {
      var blob = new Blob([arrayBuffer], {type: mime});
      callback(false, blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  };

  /**
   * Convert Blob to ArrayBuffer
   *
   * @function blobToAb
   * @memberof OSjs.VFS.Helpers
   *
   * @param   {Blob}          data        The blob
   * @param   {Function}      callback    Callback function => fn(error, result)
   */
  VFS.Helpers.blobToAb = function blobToAb(data, callback) {
    try {
      var r       = new FileReader();
      r.onerror   = function(e) {
        callback(e);
      };
      r.onloadend = function() {
        callback(false, r.result);
      };
      r.readAsArrayBuffer(data);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // OTHER HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a new VFS.File from an upload
   *
   * @function createFileFromUpload
   * @memberof OSjs.VFS.Helpers
   *
   * @param     {String}      destination         Destination path
   * @param     {File}        f                   File
   *
   * @return {OSjs.VFS.File}
   */
  VFS.Helpers.createFileFromUpload = function(destination, f) {
    return new VFS.File({
      filename: f.name,
      path: (destination + '/' + f.name).replace(/\/\/\/\/+/, '///'),
      mime: f.mime || 'application/octet-stream',
      size: f.size
    });
  };

  /**
   * Create a new Upload dialog
   *
   * @function createUploadDialog
   * @memberof OSjs.VFS.Helpers
   *
   * @param   {Object}                                     opts                 Options
   * @param   {String}                                     opts.destination     Destination for upload
   * @param   {File}                                       [opts.file]          Uploads this file immediately
   * @param   {Function}                                   cb                   Callback function => fn(error, file, event)
   * @param   {OSjs.Core.Window|OSjs.Core.Application}     [ref]                Set reference in new window
   */
  VFS.Helpers.createUploadDialog = function(opts, cb, ref) {
    var destination = opts.destination;
    var upload = opts.file;

    API.createDialog('FileUpload', {
      dest: destination,
      file: upload
    }, function(ev, btn, ufile) {
      if ( btn !== 'ok' && btn !== 'complete' ) {
        cb(false, false);
      } else {
        var file = VFS.Helpers.createFileFromUpload(destination, ufile);
        cb(false, file);
      }
    }, ref);
  };

})(OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.Core);
