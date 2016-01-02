/*!
 * OS.js - JavaScript Operating System
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
(function() {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.Utils  = OSjs.Utils  || {};

  /////////////////////////////////////////////////////////////////////////////
  // FS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Check the directory and rewrite it if running on file://
   *
   * @param   String    path      Input path
   *
   * @return  String              Output path
   */
  OSjs.Utils.checkdir = function(path) {
    if ( path && window.location.href.match(/^file\:\/\//) ) {
      path = path.replace(/^\//, '');
    }
    return path;
  };

  /**
   * Get file extension of filename/path
   *
   * @param   String    d       filename/path
   *
   * @return  String            The file extension
   *
   * @api     OSjs.Utils.filext()
   */
  OSjs.Utils.filext = function(d) {
    var ext = OSjs.Utils.filename(d).split('.').pop();
    return ext ? ext.toLowerCase() : null;
  };

  /**
   * Get directory from path
   *
   * If you use this on a directory path, you will
   * get the parent
   *
   * @param   String    f       filename/path
   *
   * @return  String            The resulted path
   *
   * @api     OSjs.Utils.dirname()
   */
  OSjs.Utils.dirname = function(f) {
    f = f.replace(/\/$/, '');

    var pstr   = f.split(/^(.*)\:\/\/(.*)/).filter(function(n) { return n !== ''; });
    var args   = pstr.pop();
    var prot   = pstr.pop();
    var result = '';

    var tmp = args.split('/').filter(function(n) { return n !== ''; });
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
  };

  /**
   * Get filename from path
   *
   * @param   String    p     Path
   *
   * @return  String          The filename
   *
   * @api     OSjs.Utils.filename()
   */
  OSjs.Utils.filename = function(p) {
    return (p || '').replace(/\/$/, '').split('/').pop();
  };

  /**
   * Get human-readable size from integer
   *
   * Example return: '128 MB'
   *
   * @param   int     bytes     Size in bytes
   * @param   String  si        Use SI units ?
   *
   * @return  String            Size
   *
   * @link    http://stackoverflow.com/users/65387/mark
   * @api     OSjs.Utils.humanFileSize()
   */
  OSjs.Utils.humanFileSize = function(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (bytes < thresh) { return bytes + ' B'; }
    var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
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
   * @param   String    n     Filename
   *
   * @return  String          Escaped filename
   *
   * @api     OSjs.Utils.escapeFilename()
   */
  OSjs.Utils.escapeFilename = function(n) {
    return (n || '').replace(/[\|&;\$%@"<>\(\)\+,\*\/]/g, '').trim();
  };

  /**
   * Replace file extension of filename
   *
   * @param   String    filename      The filename
   * @param   String    rep           New file extension (without dot)
   *
   * @return  String                  New filename
   *
   * @api     OSjs.Utils.replaceFileExtension()
   */
  OSjs.Utils.replaceFileExtension = function(filename, rep) {
    var spl = filename.split('.');
    spl.pop();
    spl.push(rep);
    return spl.join('.');
  };

  /**
   * Replace the filename of a path
   *
   * @param   String    orig      The full path to file
   * @param   String    newname   Replace with this filename
   *
   * @return  String              The new path
   *
   * @api     OSjs.Utils.replaceFilename()
   */
  OSjs.Utils.replaceFilename = function(orig, newname) {
    var spl = orig.split('/');
    spl.pop();
    spl.push(newname);
    return spl.join('/');
  };

  /**
   * Joins arguments to a path (path.join)
   *
   * @return  String
   *
   * @api OSjs.Utils.pathJoin()
   */
  OSjs.Utils.pathJoin = function() {
    var parts = [];
    var prefix = '';
    var i, s;
    for ( i = 0; i < arguments.length; i++ ) {
      s = String(arguments[i]);
      if ( s.match(/^([A-z0-9\-_]+)\:\//) ) {
        prefix = s.replace(/\/+$/, '//');
        continue;
      }

      s = s.replace(/^\/+/, '').replace(/\/+$/, '');
      parts.push(s);
    }

    return prefix + '/' + parts.join('/');
  };

  /**
   * Gets the range of filename in a path (without extension)
   *
   * This is used for example in text boxes to highlight the filename
   *
   * @param   String    val     The path
   *
   * @return  Object            Range in form of {min: 0, max: 1}
   *
   * @api     OSjs.Utils.getFilenameRange()
   */
  OSjs.Utils.getFilenameRange = function(val) {
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
   * @param   String      str     String
   *
   * @return  String              Base64 String
   *
   * @api     OSjs.Utils.btoaUrlsafe()
   */
  OSjs.Utils.btoaUrlsafe = function(str) {
    return (!str || !str.length) ? '' : btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  /**
   * (Decode) Convert Base64 to URL-safe String
   *
   * @param   String      str     Base64 String
   *
   * @return  String              String
   *
   * @api     OSjs.Utils.atobUrlsafe()
   */
  OSjs.Utils.atobUrlsafe = function(str) {
    if ( str && str.length ) {
      str = (str + '===').slice(0, str.length + (str.length % 4));
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    }
    return '';
  };

  /**
   * (Encode) Convert String to Base64 with UTF-8
   *
   * @param   String      str     String
   *
   * @return  String              Base64 String
   *
   * @api     OSjs.Utils.btoaUtf()
   */
  OSjs.Utils.btoaUtf = function(str) { // Encode
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
   * @param   String      str     Base64 String
   *
   * @return  String              String
   *
   * @api     OSjs.Utils.atobUtf()
   */
  OSjs.Utils.atobUtf = function(str) { // Decode
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
   * @param   String      mime      The mime string
   * @param   Array       list      Array of regex matches
   *
   * @return  boolean               If found
   *
   * @api     OSjs.Utils.checkAcceptMime()
   */
  OSjs.Utils.checkAcceptMime = function(mime, list) {
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
