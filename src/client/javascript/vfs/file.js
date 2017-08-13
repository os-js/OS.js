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

import * as FS from 'utils/fs';
import {getConfig} from 'core/config';
import {_} from 'core/locales';

/**
 * This is the Metadata object you have to use when passing files around
 * in the VFS API.
 *
 * This object has the same properties as in the option list below
 *
 * If you construct without a MIME type, OS.js will try to guess what it is.
 */
export default class FileMetadata {
  /*eslint valid-jsdoc: "off"*/

  /**
   * @param   {(String|Object)} arg           Either a 'path' or 'object' (filled with properties)
   * @param   {String}          arg.path      Full path
   * @param   {String}          arg.filename  Filename (automatically detected)
   * @param   {String}          arg.type      File type (file/dir)
   * @param   {Number}          arg.size      File size (in bytes)
   * @param   {String}          arg.mime      File MIME (ex: application/json)
   * @param   {*}               arg.id        Unique identifier (not required)
   * @param   {String}          [mime]        MIME type of File Type (ex: 'application/json' or 'dir')
   */
  constructor(arg, mime) {
    if ( !arg ) {
      throw new Error(_('ERR_VFS_FILE_ARGS'));
    }

    /**
     * Full path
     * @type {String}
     * @example home:///foo/bar.baz
     */
    this.path     = null;

    /**
     * Filename
     * @type {String}
     * @example foo.baz
     */
    this.filename = null;

    /**
     * Type (dir or file)
     * @type {String}
     * @example file
     */
    this.type     = null;

    /**
     * Size in bytes
     * @type {Number}
     * @example 1234
     */
    this.size     = null;

    /**
     * MIME type
     * @type {String}
     * @example application/octet-stream
     */
    this.mime     = null;

    /**
     * Unique identifier (Only used for external services requring it)
     * @type {String}
     */
    this.id       = null;

    /**
     * Internal boolean for a shortcut type file
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
   * @param {Object}    o     Object
   */
  setData(o) {
    if ( o ) {
      Object.keys(o).forEach((k) => {
        if ( k !== '_element' ) {
          this[k] = o[k];
        }
      });
    }

    if ( !this.filename ) {
      this.filename = FS.filename(this.path);
    }
  }

  /**
   * Get object data as key/value pair.
   *
   * @return {Object}
   */
  getData() {
    return {
      path: this.path,
      filename: this.filename,
      type: this.type,
      size: this.size,
      mime: this.mime,
      id: this.id
    };
  }

  _guessMime() {
    if ( this.mime || this.type === 'dir' || (!this.path || this.path.match(/\/$/)) ) {
      return;
    }

    const ext = FS.filext(this.path);
    this.mime = getConfig('MIME.mapping')['.' + ext] || 'application/octet-stream';
  }

  /**
   * Creates a new VFS.File from an upload
   *
   * @param     {String}      destination         Destination path
   * @param     {File}        f                   File
   *
   * @return {FileMetadata}
   */
  static fromUpload(destination, f) {
    return new FileMetadata({
      filename: f.name,
      path: (destination + '/' + f.name).replace(/\/\/\/\/+/, '///'),
      mime: f.mime || 'application/octet-stream',
      size: f.size
    });

  }

}
