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

  OSjs.VFS = OSjs.VFS || {};

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
   * @api     OSjs.VFS.FileDataURL
   * @class
   */
  function FileDataURL(dataURL) {
    this.dataURL = dataURL;
  }
  FileDataURL.prototype.toBase64 = function() {
    return this.data.split(',')[1];
  };
  FileDataURL.prototype.toString = function() {
    return this.dataURL;
  };

  /**
   * This is the Metadata object you have to use when passing files around
   * in the VFS API.
   *
   * This object has the same properties as in the option list below
   *
   * @param   Mixed       arg       Either a 'path' or 'object' (filled with properties)
   * @param   String      mime      MIME type of File Type (ex: 'application/json' or 'dir')
   *
   * @option  opts     String          icon              Window Icon
   *
   * @option  arg   String      path      Full path
   * @option  arg   String      filename  Filename (automatically detected)
   * @option  arg   String      type      File type (file/dir)
   * @option  arg   int         size      File size (in bytes)
   * @option  arg   String      mime      File MIME (ex: application/json)
   * @option  arg   Mixed       id        Unique identifier (not required)
   *
   * @api     OSjs.VFS.File
   * @class
   */
  function FileMetadata(arg, mime) {
    if ( !arg ) {
      throw new Error(API._('ERR_VFS_FILE_ARGS'));
    }

    this.path     = null;
    this.filename = null;
    this.type     = null;
    this.size     = null;
    this.mime     = null;
    this.id       = null;

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
  }

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

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.VFS.File        = FileMetadata;
  OSjs.VFS.FileDataURL = FileDataURL;

})(OSjs.Utils, OSjs.API);
