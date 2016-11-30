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
(function(Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // FILE ABSTRACTION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is a object you can pass around in VFS when
   * handling DataURL()s (strings). Normally you would
   * use a File, Blob or ArrayBuffer, but this is an alternative.
   *
   * Useful for canvas data etc.
   *
   * @constructor
   * @memberof OSjs.VFS
   */
  function FileDataURL(dataURL) {
    /**
     * File URI data (base64 encoded)
     * @name dataURL
     * @memberof OSjs.VFS.FileDataURL#
     * @type {String}
     */
    this.dataURL = dataURL;
  }

  /**
   * Get base64 data
   * @function toBase64
   * @memberof OSjs.VFS.FileDataURL#
   * @return {String}
   */
  FileDataURL.prototype.toBase64 = function() {
    return this.data.split(',')[1];
  };

  /**
   * Get raw data URI
   * @override
   * @function toString
   * @memberof OSjs.VFS.FileDataURL#
   * @return {String}
   */
  FileDataURL.prototype.toString = function() {
    return this.dataURL;
  };

  /**
   * This is the Metadata object you have to use when passing files around
   * in the VFS API.
   *
   * This object has the same properties as in the option list below
   *
   * If you construct without a MIME type, OS.js will try to guess what it is.
   *
   * @param   {(String|Object)} arg           Either a 'path' or 'object' (filled with properties)
   * @param   {String}          arg.path      Full path
   * @param   {String}          arg.filename  Filename (automatically detected)
   * @param   {String}          arg.type      File type (file/dir)
   * @param   {Number}          arg.size      File size (in bytes)
   * @param   {String}          arg.mime      File MIME (ex: application/json)
   * @param   {Mixed}           arg.id        Unique identifier (not required)
   * @param   {String}          [mime]        MIME type of File Type (ex: 'application/json' or 'dir')
   *
   * @constructor File
   * @memberof OSjs.VFS
   * @see OSjs.VFS.file
   */
  function FileMetadata(arg, mime) {
    if ( !arg ) {
      throw new Error(API._('ERR_VFS_FILE_ARGS'));
    }

    /**
     * Full path
     * @name path
     * @memberof OSjs.VFS.File#
     * @type {String}
     * @example home:///foo/bar.baz
     */
    this.path     = null;

    /**
     * Filename
     * @name filename
     * @memberof OSjs.VFS.File#
     * @type {String}
     * @example foo.baz
     */
    this.filename = null;

    /**
     * Type (dir or file)
     * @name type
     * @memberof OSjs.VFS.File#
     * @type {String}
     * @example file
     */
    this.type     = null;

    /**
     * Size in bytes
     * @name size
     * @memberof OSjs.VFS.File#
     * @type {Number}
     * @example 1234
     */
    this.size     = null;

    /**
     * MIME type
     * @name mime
     * @memberof OSjs.VFS.File#
     * @type {String}
     * @example application/octet-stream
     */
    this.mime     = null;

    /**
     * Unique identifier (Only used for external services requring it)
     * @name id
     * @memberof OSjs.VFS.File#
     * @type {String}
     */
    this.id       = null;

    /**
     * Internal boolean for a shortcut type file
     * @name shortcut
     * @memberof OSjs.VFS.File#
     * @type {Boolean}
     */
    this.shortcut = false;

    if ( typeof arg === 'object' ) {
      this.setData(arg);
    } else if ( typeof arg === 'string' ) {
      this.path = arg;
      this.setData();
    }

    if ( typeof mime === 'string' ) {
      if ( mime.match(/\//) ) {
        this.mime = mime;
      } else {
        this.type = mime;
      }
    }

    this._guessMime();
  }

  /**
   * Set data from Object (key/value pair)
   *
   * @function setData
   * @memberof OSjs.VFS.File#
   *
   * @param {Object}    o     Object
   */
  FileMetadata.prototype.setData = function(o) {
    var self = this;
    if ( o ) {
      Object.keys(o).forEach(function(k) {
        if ( k !== '_element' ) {
          self[k] = o[k];
        }
      });
    }

    if ( !this.filename ) {
      this.filename = Utils.filename(this.path);
    }
  };

  /**
   * Get object data as key/value pair.
   *
   * @function getData
   * @memberof OSjs.VFS.File#
   *
   * @return {Object}
   */
  FileMetadata.prototype.getData = function() {
    return {
      path: this.path,
      filename: this.filename,
      type: this.type,
      size: this.size,
      mime: this.mime,
      id: this.id
    };
  };

  /**
   * Copies the file to given destination.
   *
   * @function copy
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.copy
   * @see OSjs.VFS.copy
   */
  FileMetadata.prototype.copy = function(dest, callback, options, appRef) {
    return VFS.copy(this, dest, callback, options, appRef);
  };

  /**
   * Downloads the file to computer
   *
   * @function download
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.download
   * @see OSjs.VFS.download
   */
  FileMetadata.prototype.download = function(callback) {
    return VFS.download(this, callback);
  };

  /**
   * Deletes the file
   *
   * @function delete
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.File#unlink
   * @see OSjs.VFS.File#unlink
   */
  FileMetadata.prototype.delete = function() {
    return this.unlink.apply(this, arguments);
  };

  /**
   * Removes the file
   *
   * @function unlink
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.unlink
   * @see OSjs.VFS.unlink
   */
  FileMetadata.prototype.unlink = function(callback, options, appRef) {
    return VFS.unlink(this, callback, options, appRef);
  };

  /**
   * Checks if file exists
   *
   * @function exists
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.exists
   * @see OSjs.VFS.exists
   */
  FileMetadata.prototype.exists = function(callback) {
    return VFS.exists(this, callback);
  };

  /**
   * Creates a directory
   *
   * @function mkdir
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.mkdir
   * @see OSjs.VFS.mkdir
   */
  FileMetadata.prototype.mkdir = function(callback, options, appRef) {
    return VFS.mkdir(this, callback, options, appRef);
  };

  /**
   * Moves the file to given destination
   *
   * @function move
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.move
   * @see OSjs.VFS.move
   */
  FileMetadata.prototype.move = function(dest, callback, options, appRef) {
    var self = this;
    return VFS.move(this, dest, function(err, res, newDest) {
      if ( !err && newDest ) {
        self.setData(newDest);
      }
      callback.apply(this, arguments);
    }, options, appRef);
  };

  /**
   * Reads the file contents
   *
   * @function read
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.read
   * @see OSjs.VFS.read
   */
  FileMetadata.prototype.read = function(callback, options) {
    return VFS.read(this, callback, options);
  };

  /**
   * Renames the file
   *
   * @function rename
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.File#move
   * @see OSjs.VFS.File#move
   */
  FileMetadata.prototype.rename = function() {
    return this.move.apply(this, arguments);
  };

  /**
   * Scans the folder contents
   *
   * @function scandir
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.scandir
   * @see OSjs.VFS.scandir
   */
  FileMetadata.prototype.scandir = function(callback, options) {
    return VFS.scandir(this, callback, options);
  };

  /**
   * Sends the file to the trash
   *
   * @function trash
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.trash
   * @see OSjs.VFS.trash
   */
  FileMetadata.prototype.trash = function(callback) {
    return VFS.trash(this, callback);
  };

  /**
   * Restores the file from trash
   *
   * @function untrash
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.untrash
   * @see OSjs.VFS.untrash
   */
  FileMetadata.prototype.untrash = function(callback) {
    return VFS.untrash(this, callback);
  };

  /**
   * Gets the URL for physical file
   *
   * @function url
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.url
   * @see OSjs.VFS.url
   */
  FileMetadata.prototype.url = function(callback) {
    return VFS.url(this, callback);
  };

  /**
   * Writes data to the file
   *
   * @function write
   * @memberof OSjs.VFS.File#
   * @alias OSjs.VFS.write
   * @see OSjs.VFS.write
   */
  FileMetadata.prototype.write = function(data, callback, options, appRef) {
    return VFS.write(this, data, callback, options, appRef);
  };

  FileMetadata.prototype._guessMime = function() {
    if ( this.mime || this.type === 'dir' || (!this.path || this.path.match(/\/$/)) ) {
      return;
    }

    var ext = Utils.filext(this.path);
    this.mime = API.getConfig('MIME.mapping')['.' + ext] || 'application/octet-stream';
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a new VFS.File instance
   *
   * @function file
   * @memberof OSjs.VFS
   * @see OSjs.VFS.File
   *
   * @example
   * OSjs.VFS.file('home:///foo').read(<fn>);
   */
  VFS.file = function createFileInstance(arg, mime) {
    return new FileMetadata(arg, mime);
  };

  VFS.File = FileMetadata;
  VFS.FileDataURL = FileDataURL;

})(OSjs.Utils, OSjs.API, OSjs.VFS);
