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
(function() {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // FS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Gets the path from a location
   *
   * @function getPathFromVirtual
   * @memberof OSjs.Utils
   *
   * @param   {String}    str         Path name
   *
   * @return  {String}
   */
  OSjs.Utils.getPathFromVirtual = function Utils_getPathFromVirtual(str) {
    str = str || '';
    var res = str.split(/([A-z0-9\-_]+)\:\/\/(.*)/)[2] || '';
    return res.replace(/^\/?/, '/');
  };

  /**
   * Gets the protocol from a location
   *
   * @function getPathProtocol
   * @memberof OSjs.Utils
   *
   * @param   {String}    orig        Path name
   *
   * @return  {String}
   */
  OSjs.Utils.getPathProtocol = function Utils_getPathProtocol(orig) {
    //return orig.replace(/^([A-z0-9\-_]+)\:\/\//, '');
    var tmp = document.createElement('a');
    tmp.href = orig;
    return tmp.protocol.replace(/:$/, '');
  };

  /**
   * Get file extension of filename/path
   *
   * @function filext
   * @memberof OSjs.Utils
   *
   * @param   {String}    d       filename/path
   *
   * @return  {String}            The file extension
   */
  OSjs.Utils.filext = function Utils_filext(d) {
    var ext = OSjs.Utils.filename(d).split('.').pop();
    return ext ? ext.toLowerCase() : null;
  };

  /**
   * Get directory from path
   *
   * If you use this on a directory path, you will
   * get the parent
   *
   * @function dirname
   * @memberof OSjs.Utils
   *
   * @param   {String}    f       filename/path
   *
   * @return  {String}            The resulted path
   */
  OSjs.Utils.dirname = function Utils_dirname(f) {

    function _parentDir(p) {
      var pstr = p.split(/^(.*)\:\/\/(.*)/).filter(function(n) {
        return n !== '';
      });

      var args   = pstr.pop();
      var prot   = pstr.pop();
      var result = '';

      var tmp = args.split('/').filter(function(n) {
        return n !== '';
      });

      if ( tmp.length ) {
        tmp.pop();
      }
      result = tmp.join('/');

      if ( !result.match(/^\//) ) {
        result = '/' + result;
      }

      if ( prot ) {
        result = prot + '://' + result;
      }

      return result;
    }

    return f.match(/^((.*)\:\/\/)?\/$/) ? f : _parentDir(f.replace(/\/$/, ''));
  };

  /**
   * Get filename from path
   *
   * @function filename
   * @memberof OSjs.Utils
   *
   * @param   {String}    p     Path
   *
   * @return  {String}          The filename
   */
  OSjs.Utils.filename = function Utils_filename(p) {
    return (p || '').replace(/\/$/, '').split('/').pop();
  };

  /**
   * Get human-readable size from integer
   *
   * Example return: '128 MB'
   *
   * @function humanFileSize
   * @memberof OSjs.Utils
   * @link http://stackoverflow.com/users/65387/mark
   *
   * @param   {Number}  bytes     Size in bytes
   * @param   {String}  si        Use SI units ?
   *
   * @return  {String}            Size
   */
  OSjs.Utils.humanFileSize = function Utils_humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (bytes < thresh) {
      return bytes + ' B';
    }

    var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (bytes >= thresh);
    return bytes.toFixed(1) + ' ' + units[u];
  };

  /**
   * Escape filename (removes invalid characters)
   *
   * @function escapeFilename
   * @memberof OSjs.Utils
   *
   * @param   {String}    n     Filename
   *
   * @return  {String}          Escaped filename
   */
  OSjs.Utils.escapeFilename = function Utils_escapeFilename(n) {
    return (n || '').replace(/[\|&;\$%@"<>\(\)\+,\*\/]/g, '').trim();
  };

  /**
   * Replace file extension of filename
   *
   * @function replaceFileExtension
   * @memberof OSjs.Utils
   *
   * @param   {String}    filename      The filename
   * @param   {String}    rep           New file extension (without dot)
   *
   * @return  {String}                  New filename
   */
  OSjs.Utils.replaceFileExtension = function Utils_replaceFileExtension(filename, rep) {
    var spl = filename.split('.');
    spl.pop();
    spl.push(rep);
    return spl.join('.');
  };

  /**
   * Replace the filename of a path
   *
   * @function replaceFilename
   * @memberof OSjs.Utils
   *
   * @param   {String}    orig      The full path to file
   * @param   {String}    newname   Replace with this filename
   *
   * @return  {String}              The new path
   */
  OSjs.Utils.replaceFilename = function Utils_replaceFilename(orig, newname) {
    var spl = orig.split('/');
    spl.pop();
    spl.push(newname);
    return spl.join('/');
  };

  /**
   * Joins arguments to a path (path.join)
   *
   * @function pathJoin
   * @memberof OSjs.Utils
   *
   * @param   {...String}   s   Input
   * @return  {String}
   */
  OSjs.Utils.pathJoin = function Utils_pathJoin() {
    var parts = [];
    var prefix = '';

    function getPart(s) {
      if ( s.match(/^([A-z0-9\-_]+)\:\//) ) {
        var spl = s.split(':/');
        if ( !prefix ) {
          prefix = spl[0] + '://';
        }
        s = spl[1] || '';
      }

      s = s.replace(/^\/+/, '').replace(/\/+$/, '');

      return s.split('/').filter(function(i) {
        return ['', '.', '..'].indexOf(i) === -1;
      }).join('/');
    }

    for ( var i = 0; i < arguments.length; i++ ) {
      var str = getPart(String(arguments[i]));
      if ( str ) {
        parts.push(str);
      }
    }

    return prefix + parts.join('/').replace(/^\/?/, '/');
  };

  /**
   * Gets the range of filename in a path (without extension)
   *
   * This is used for example in text boxes to highlight the filename
   *
   * @function getFilenameRange
   * @memberof OSjs.Utils
   *
   * @param   {String}    val     The path
   *
   * @return  {Object}            Range in form of min/max
   */
  OSjs.Utils.getFilenameRange = function Utils_getFileNameRange(val) {
    val = val || '';

    var range = {min: 0, max: val.length};
    if ( val.match(/^\./) ) {
      if ( val.length >= 2 ) {
        range.min = 1;
      }
    } else {
      if ( val.match(/\.(\w+)$/) ) {
        var m = val.split(/\.(\w+)$/);
        for ( var i = m.length - 1; i >= 0; i-- ) {
          if ( m[i].length ) {
            range.max = val.length - m[i].length - 1;
            break;
          }
        }
      }
    }
    return range;
  };

  /**
   * (Encode) Convert URL-safe String to Base64
   *
   * @function btoaUrlsafe
   * @memberof OSjs.Utils
   *
   * @param   {String}      str     String
   *
   * @return  {String}              Base64 String
   */
  OSjs.Utils.btoaUrlsafe = function Utils_btoaUrlsafe(str) {
    return (!str || !str.length) ? '' : btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  /**
   * (Decode) Convert Base64 to URL-safe String
   *
   * @function atobUrlsafe
   * @memberof OSjs.Utils
   *
   * @param   {String}      str     Base64 String
   *
   * @return  {String}              String
   */
  OSjs.Utils.atobUrlsafe = function Utils_atobUrlsafe(str) {
    if ( str && str.length ) {
      str = (str + '===').slice(0, str.length + (str.length % 4));
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    }
    return '';
  };

  /**
   * (Encode) Convert String to Base64 with UTF-8
   *
   * @function btoaUtf
   * @memberof OSjs.Utils
   *
   * @param   {String}      str     String
   *
   * @return  {String}              Base64 String
   */
  OSjs.Utils.btoaUtf = function Utils_btoaUtfh(str) { // Encode
    var _unescape = window.unescape || function(s) {
      function d(x, n) {
        return String.fromCharCode(parseInt(n, 16));
      }
      return s.replace(/%([0-9A-F]{2})/i, d);
    };
    str = _unescape(encodeURIComponent(str));
    return btoa(str);
  };

  /**
   * (Decode) Convert Base64 with UTF-8 to String
   *
   * @function atobUtf
   * @memberof OSjs.Utils
   *
   * @param   {String}      str     Base64 String
   *
   * @return  {String}              String
   */
  OSjs.Utils.atobUtf = function Utils_atobUtf(str) { // Decode
    var _escape = window.escape || function(s) {
      function q(c) {
        c = c.charCodeAt();
        return '%' + (c < 16 ? '0' : '') + c.toString(16).toUpperCase();
      }
      return s.replace(/[\x00-),:-?[-^`{-\xFF]/g, q);
    };

    var trans = _escape(atob(str));
    return decodeURIComponent(trans);
  };

  /**
   * Check if this MIME type is inside list
   * This matches by regex
   *
   * @function checkAcceptMime
   * @memberof OSjs.Utils
   *
   * @param   {String}      mime      The mime string
   * @param   {Array}       list      Array of regex matches
   *
   * @return  {Boolean}               If found
   */
  OSjs.Utils.checkAcceptMime = function Utils_checkAcceptMime(mime, list) {
    if ( mime && list.length ) {
      var re;
      for ( var i = 0; i < list.length; i++ ) {
        re = new RegExp(list[i]);
        if ( re.test(mime) === true ) {
          return true;
        }
      }
    }
    return false;
  };

})();
