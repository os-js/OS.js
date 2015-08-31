/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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

  function EventCollection() {
    this.collection = [];
  }

  EventCollection.prototype.add = function(el, iter) {
    el.addEventListener.apply(el, iter);
    this.collection.push([el, iter]);
  };

  EventCollection.prototype.destroy = function(el, iter) {
    this.collection.forEach(function(iter) {
      if ( iter[0] && iter[1] ) {
        iter[0].removeEventListener.apply(iter[0], iter[1]);
      }
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // MISC
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Wrapper for merging function argument dictionaries
   *
   * @api    OSjs.Utils.argumentDefaults()
   *
   * @param  Object   args      Given function Dictionary
   * @param  Object   defaults  Defaults Dictionary
   * @param  boolean  undef     Check with 'undefined'
   * @return Object
   */
  OSjs.Utils.argumentDefaults = function(args, defaults, undef) {
    args = args || {};
    Object.keys(defaults).forEach(function(key) {
      if ( typeof defaults[key] === 'boolean' || typeof defaults[key] === 'number' ) {
        if ( typeof args[key] === 'undefined' || args[key] === null ) {
          args[key] = defaults[key];
        }
      } else {
        args[key] = args[key] || defaults[key];
      }
    });
    return args;
  };

  /**
   * Gets the browser window rect (x, y, width, height)
   *
   * @api OSjs.Utils.getRect()
   * @return Object
   */
  OSjs.Utils.getRect = function() {
    return {
      top    : 0,
      left   : 0,
      width  : window.innerWidth,
      height : window.innerHeight
    };
  };

  /**
   * Prevents default Event (shortcut)
   *
   * @api OSjs.Utils._preventDefault()
   * @return bool
   */
  OSjs.Utils._preventDefault = function(ev) {
    ev.preventDefault();
    return false;
  };

  /**
   * A collection of keycode mappings
   *
   * @api OSjs.Utils.Keys
   * @var
   */
  OSjs.Utils.Keys = {
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F6: 118,
    F7: 119,
    F8: 120,
    F9: 121,
    F10: 122,
    F11: 123,
    F12: 124,

    TILDE:      220,

    CMD:        17,
    LSUPER:     91,
    RSUPER:     92,

    H: 72,
    M: 77,
    R: 82,

    DELETE:     46,
    INSERT:     45,
    HOME:       36,
    END:        35,
    PGDOWN:     34,
    PGUP:       33,
    PAUSE:      19,
    BREAK:      19,
    CAPS_LOCK:  20,
    SCROLL_LOCK:186,

    BACKSPACE:  8,
    SPACE:      32,
    TAB:        9,
    ENTER:      13,
    ESC:        27,
    LEFT:       37,
    RIGHT:      39,
    UP:         38,
    DOWN:       40
  };

  /**
   * Get the mouse button pressed
   *
   * @param   DOMEvent  ev    The DOM Event
   *
   * @return  String          The mouse button (left/middle/right)
   *
   * @api     OSjs.Utils.mouseButton()
   */
  OSjs.Utils.mouseButton = function(ev) {
    if ( typeof ev.button !== 'undefined' ) {
      if ( ev.button === 0 ) {
        return 'left';
      } else if ( ev.button === 1 ) {
        return 'middle';
      }
      return 'right';
    }

    if ( ev.which === 2 || ev.which === 4 ) {
      return 'middle';
    } else if ( ev.which === 1 ) {
      return 'left';
    }
    return 'right';
  };

  /**
   * Format a string (almost like sprintf)
   *
   * @param   String      format        String format
   * @param   String      ...           Insert into format
   *
   * @return  String                    The formatted string
   *
   * @link    http://stackoverflow.com/a/4673436
   * @api     OSjs.Utils.format()
   */
  OSjs.Utils.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    var sprintfRegex = /\{(\d+)\}/g;

    function sprintf(match, number) {
      return number in args ? args[number] : match;
    }

    return format.replace(sprintfRegex, sprintf);
  };

  /**
   * Deep-merge to objects
   *
   * @param   Object      obj1      Object to merge to
   * @param   Object      obj2      Object to merge with
   *
   * @return  Object                The merged object
   *
   * @api     OSjs.Utils.mergeObject()
   */
  OSjs.Utils.mergeObject = function(obj1, obj2, opts) {
    opts = opts || {};

    for ( var p in obj2 ) {
      if ( obj2.hasOwnProperty(p) ) {
        try {
          if (opts.overwrite === false && obj1.hasOwnProperty(p)) {
            continue;
          }

          if ( obj2[p].constructor === Object ) {
            obj1[p] = OSjs.Utils.mergeObject(obj1[p], obj2[p]);
          } else {
            obj1[p] = obj2[p];
          }
        } catch(e) {
          obj1[p] = obj2[p];
        }
      }
    }
    return obj1;
  };

  /**
   * Clone a object
   *
   * @param   Object      o     The object to clone
   *
   * @return  Object            An identical object
   *
   * @api     OSjs.Utils.cloneObject()
   */
  OSjs.Utils.cloneObject = function(o) {
    return JSON.parse(JSON.stringify(o, function(key, value) {
      if ( value && typeof value === 'object' && value.tagName ) {
        return undefined;
      }
      return value;
    }));
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

  /**
   * Gets browser compability flags
   *
   * @return    Object      List of compability
   *
   * @api       OSjs.Utils.getCompability()
   */
  OSjs.Utils.getCompability = (function() {
    function _checkSupport(enabled, check, isSupported) {
      var supported = {};

      Object.keys(check).forEach(function(key) {
        var chk = check[key];
        var value = false;

        if ( chk instanceof Array ) {
          chk.forEach(function(c) {
            value = isSupported(c);
            return !value;
          });
        } else {
          value = isSupported(chk);
        }
        supported[key] = value;
      });

      return supported;
    }

    function getUpload() {
      try {
        var xhr = new XMLHttpRequest();
        return (!! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload)));
      } catch ( e ) {}
      return false;
    }

    function getCanvasSupported() {
      return document.createElement('canvas').getContext ? document.createElement('canvas') : null;
    }

    function getVideoSupported() {
      return document.createElement('video').canPlayType ? document.createElement('video') : null;
    }

    function canPlayCodec(support, check) {
      return _checkSupport(support, check, function(codec) {
        try {
          return !!support.canPlayType(codec);
        } catch ( e ) {
        }
        return false;
      });
    }

    function getVideoTypesSupported() {
      return canPlayCodec(getVideoSupported(), {
        webm     : 'video/webm; codecs="vp8.0, vorbis"',
        ogg      : 'video/ogg; codecs="theora"',
        h264     : [
          'video/mp4; codecs="avc1.42E01E"',
          'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
        ],
        mpeg     : 'video/mp4; codecs="mp4v.20.8"',
        mkv      : 'video/x-matroska; codecs="theora, vorbis"'
      });
    }

    function getAudioSupported() {
      return document.createElement('audio').canPlayType ? document.createElement('audio') : null;
    }

    function getAudioTypesSupported() {
      return canPlayCodec(getAudioSupported(), {
        ogg   : 'audio/ogg; codecs="vorbis',
        mp3   : 'audio/mpeg',
        wav   : 'audio/wav; codecs="1"'
      });
    }

    function getAudioContext() {
      if ( window.hasOwnProperty('AudioContext') || window.hasOwnProperty('webkitAudioContext') ) {
        return true;
      }
      return false;
    }

    var getCanvasContexts = (function() {
      var cache = [];

      return function() {
        if ( !cache.length ) {
          var canvas = getCanvasSupported();
          if ( canvas ) {
            var test = ['2d', 'webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
            test.forEach(function(tst, i) {
              try {
                if ( !!canvas.getContext(tst) ) {
                  cache.push(tst);
                }
              } catch ( eee ) {}
            });
          }
        }

        return cache;
      };
    })();

    function getWebGL() {
      var result = false;
      var contexts = getCanvasContexts();
      try {
        result = (contexts.length > 1);
        if ( !result ) {
          if ( 'WebGLRenderingContext' in window ) {
            result = true;
          }
        }
      } catch ( e ) {}
      return result;
    }

    function detectCSSFeature(featurename) {
      var feature             = false,
          domPrefixes         = 'Webkit Moz ms O'.split(' '),
          elm                 = document.createElement('div'),
          featurenameCapital  = null;

      featurename = featurename.toLowerCase();

      if ( elm.style[featurename] ) { feature = true; }

      if ( feature === false ) {
        featurenameCapital = featurename.charAt(0).toUpperCase() + featurename.substr(1);
        for( var i = 0; i < domPrefixes.length; i++ ) {
          if( elm.style[domPrefixes[i] + featurenameCapital ] !== undefined ) {
            feature = true;
            break;
          }
        }
      }
      return feature;
    }

    function getUserMedia() {
      var getMedia = false;
      if ( window.navigator ) {
        getMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);
      }
      return !!getMedia;
    }

    function getRichText() {
      try {
        return !!document.createElement('textarea').contentEditable;
      } catch ( e ) {}
      return false;
    }

    function getTouch() {
      // False positives in win 8+
      try {
        if ( navigator.userAgent.match(/Windows NT 6\.(2|3)/) ) {
          return false;
        }
      } catch ( e ) {}

      // We only want touch for mobile devices
      try {
        if ( navigator.userAgent.match(/iOS|Android|BlackBerry|IEMobile|iPad|iPhone|iPad/i) ) {
          return true;
        }
      } catch ( e ) {}

      return false;
      // This was the old method
      //return ('ontouchstart' in window) || (window.DocumentTouch && (document instanceof window.DocumentTouch));
      //return (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));
    }

    function getDnD() {
      return !!('draggable' in document.createElement('span'));
    }

    function getSVG() {
      return (!!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect);
    }

    function getFileSystem() {
      return (('requestFileSystem' in window) || ('webkitRequestFileSystem' in window));
    }

    var checkWindow = {
      indexedDB      : 'indexedDB',
      localStorage   : 'localStorage',
      sessionStorage : 'sessionStorage',
      globalStorage  : 'globalStorage',
      openDatabase   : 'openDatabase',
      socket         : 'WebSocket',
      worker         : 'Worker',
      file           : 'File',
      blob           : 'Blob',
      orientation    : 'onorientationchange',
    };

    var compability = {
      touch          : getTouch(),
      upload         : getUpload(),
      getUserMedia   : getUserMedia(),
      fileSystem     : getFileSystem(),
      localStorage   : false,
      sessionStorage : false,
      globalStorage  : false,
      openDatabase   : false,
      socket         : false,
      worker         : false,
      file           : false,
      blob           : false,
      orientation    : false,
      dnd            : getDnD(),
      css            : {
        transition : detectCSSFeature('transition'),
        animation : detectCSSFeature('animation')
      },
      canvas         : !!getCanvasSupported(),
      canvasContext  : getCanvasContexts(),
      webgl          : getWebGL(),
      audioContext   : getAudioContext(),
      svg            : getSVG(),
      video          : !!getVideoSupported(),
      videoTypes     : getVideoTypesSupported(),
      audio          : !!getAudioSupported(),
      audioTypes     : getAudioTypesSupported(),
      richtext       : getRichText()
    };

    Object.keys(checkWindow).forEach(function(key) {
      compability[key] = (checkWindow[key] in window) && window[checkWindow[key]] !== null;
    });

    return function() {
      return compability;
    };
  })();

  /**
   * Check if browser is IE
   *
   * @return    boolean       If IE
   *
   * @api       OSjs.Utils.isIE()
   */
  OSjs.Utils.isIE = function() {
    var myNav = navigator.userAgent.toLowerCase();
    return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1], 10) : false;
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
        return '%' + (c<16 ? '0' : '') + c.toString(16).toUpperCase();
      }
      return s.replace(/[\x00-),:-?[-^`{-\xFF]/g, q);
    };

    var trans = _escape(atob(str));
    return decodeURIComponent(trans);
  };

  /**
   * Gets the browser Locale
   *
   * For example 'en_EN'
   *
   * @return  String          Locale string
   *
   * @api     OSjs.Utils.getUserLocale()
   */
  OSjs.Utils.getUserLocale = function() {
    var loc = ((window.navigator.userLanguage || window.navigator.language) || 'en-EN').replace('-', '_');

    // Restricts to a certain type of language.
    // Example: There are lots of variants of the English language, but currently we only
    // provide locales for one of them, so we force to use the one available.
    var map = {
      'nb'    : 'no_NO',
      'es'    : 'es_ES',
      'ru'    : 'ru_RU',
      'en'    : 'en_EN'
    };

    var major = loc.split('_')[0] || 'en';
    var minor = loc.split('_')[1] || major.toUpperCase();
    if ( map[major] ) {
      return map[major];
    }
    return major + '_' + minor;
  };

  /**
   * Fixes JSON for HTTP requests (in case they were returned as string)
   *
   * @param   Mixed     response      The data
   *
   * @return  Object                  JSON
   *
   * @api     OSjs.Utils.fixJSON()
   */
  OSjs.Utils.fixJSON = function(response) {
    if ( typeof response === 'string' ) {
      if ( response.match(/^\{|\[/) ) {
        try {
          response = JSON.parse(response);
        } catch ( e  ){
          console.warn('FAILED TO FORCE JSON MIME TYPE', e);
        }
      }
    }
    return response;
  };


  /**
   * Remove whitespaces and newlines from HTML document
   *
   * @param   String    html          HTML string input
   *
   * @return  String
   *
   * @api     OSjs.Utils.cleanHTML()
   */
  OSjs.Utils.cleanHTML = function(html) {
    return html.replace(/\n/g, '')
               .replace(/[\t ]+</g, '<')
               .replace(/\>[\t ]+</g, '><')
               .replace(/\>[\t ]+$/g, '>');
  };

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

    var pstr   = f.split(/^(.*)\:\/\/(.*)/).filter(function(n){ return n !== ''; });
    var args   = pstr.pop();
    var prot   = pstr.pop();
    var result = '';

    var tmp = args.split('/').filter(function(n){ return n !== ''; });
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
    return (p||'').replace(/\/$/, '').split('/').pop();
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
    if(bytes < thresh) { return bytes + ' B'; }
    var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while(bytes >= thresh);
    return bytes.toFixed(1)+' '+units[u];
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

  /////////////////////////////////////////////////////////////////////////////
  // COLORS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Convert HEX to RGB
   *
   * @param   String      hex     The hex string (with #)
   *
   * @return  Object              RGB in form of {r:0, g:0, b:0}
   *
   * @api     OSjs.Utils.convertToRGB()
   */
  OSjs.Utils.convertToRGB = function(hex) {
    var rgb = parseInt(hex.replace('#', ''), 16);
    var val = {};
    val.r = (rgb & (255 << 16)) >> 16;
    val.g = (rgb & (255 << 8)) >> 8;
    val.b = (rgb & 255);
    return val;
  };

  /**
   * Convert RGB to HEX
   *
   * @param   Object      rgb       The RGB object in form of {r:0, g:0, b:0}
   *
   * OR
   *
   * @param   int         r         Red value
   * @param   int         g         Green value
   * @param   int         b         Blue value
   *
   * @return  String                Hex string (with #)
   *
   * @api     OSjs.Utils.convertToHEX()
   */
  OSjs.Utils.convertToHEX = function(r, g, b) {
    if ( typeof r === 'object' ) {
      g = r.g;
      b = r.b;
      r = r.r;
    }

    if ( typeof r === 'undefined' || typeof g === 'undefined' || typeof b === 'undefined' ) {
      throw new Error('Invalid RGB supplied to convertToHEX()');
    }

    var hex = [
      parseInt(r, 10).toString( 16 ),
      parseInt(g, 10).toString( 16 ),
      parseInt(b, 10).toString( 16 )
    ];

    Object.keys(hex).forEach(function(i) {
      if ( hex[i].length === 1 ) {
        hex[i] = '0' + hex[i];
      }
    });

    return '#' + hex.join('').toUpperCase();
  };

  /**
   * Ivert HEX color
   *
   * @param   String      hex     Hex string (With #)
   *
   * @return  String              Inverted hex (With #)
   *
   * @link    http://stackoverflow.com/a/9601429/1236086
   * @api     OSjs.Utils.invertHEX()
   */
  OSjs.Utils.invertHEX = function(hex) {
    var color = parseInt(hex.replace('#', ''), 16);
    color = 0xFFFFFF ^ color;
    color = color.toString(16);
    color = ('000000' + color).slice(-6);
    return '#' + color;
  };

  /////////////////////////////////////////////////////////////////////////////
  // DOM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get element by ID
   *
   * @param   String    id      DOM Element ID
   *
   * @return  DOMElement        Found element or null
   *
   * @api     OSjs.Utils.$()
   */
  OSjs.Utils.$ = function(id) {
    return document.getElementById(id);
  };

  /**
   * Remove unwanted characters from ID or className
   *
   * @param   String    str     The name
   *
   * @return  String            The new name
   *
   * @api     OSjs.Utils.$safeName()
   */
  OSjs.Utils.$safeName = function(str) {
    return (str || '').replace(/[^a-zA-Z0-9]/g, '_');
  };

  /**
   * Remove given element from parent
   *
   * @param   DOMElement    node      The DOM Element
   *
   * @return  null
   *
   * @api     OSjs.Utils.$remove()
   */
  OSjs.Utils.$remove = function(node) {
    if ( node && node.parentNode ) {
      node.parentNode.removeChild(node);
    }
    return null;
  };

  /**
   * Empty this element (remove children)
   *
   * @param   DOMElement    myNode      The DOM Element
   *
   * @return  void
   *
   * @api     OSjs.Utils.$empty()
   */
  OSjs.Utils.$empty = function(myNode) {
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }
  };

  /**
   * Get CSS style attribute
   *
   * @param   DOMElement    oElm          The DOM Element
   * @param   String        strCssRule    The CSS rule to get
   *
   * @return  String                      Style attribute
   *
   * @api     OSjs.Utils.$getStyle()
   */
  OSjs.Utils.$getStyle = function(oElm, strCssRule) {
    var strValue = '';
    if ( document.defaultView && document.defaultView.getComputedStyle ) {
      strValue = document.defaultView.getComputedStyle(oElm, '').getPropertyValue(strCssRule);
    } else if ( oElm.currentStyle ) {
      strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1) {
        return p1.toUpperCase();
      });
      strValue = oElm.currentStyle[strCssRule];
    }
    return strValue;
  };

  /**
   * Get element absolute position
   *
   * Modern browsers will return getBoundingClientRect()
   * See DOM documentation
   *
   * @param   DOMElement      el        The Element to find position of
   * @param   DOMElement      parentEl  Optional parent to end loop in
   *
   * @return  Object                    The bounding box
   *
   * @api     OSjs.Utils.$position()
   */
  OSjs.Utils.$position = function(el, parentEl) {
    if ( el ) {
      if ( parentEl ) {
        var result = {left:0, top:0, width: el.offsetWidth, height: el.offsetHeight};
        while ( true ) {
          result.left += el.offsetLeft;
          result.top  += el.offsetTop;
          if ( el.offsetParent ===  parentEl || el.offsetParent === null ) {
            break;
          }
          el = el.offsetParent;
        }
        return result;
      }
      return el.getBoundingClientRect();
    }
    return null;
  };

  /**
   * Get the index of an element within a node
   *
   * @param   DOMElement    el          Element to check
   * @param   DOMElement    parentEl    Optional parent (automatically checked)
   *
   * @return  int                       The index
   *
   * @api     OSjs.Utils.$index()
   */
  OSjs.Utils.$index = function(el, parentEl) {
    parentEl = parentEl || el.parentNode;
    var nodeList = Array.prototype.slice.call(parentEl.children);
    var nodeIndex = nodeList.indexOf(el, parentEl);
    return nodeIndex;
  };

  /**
   * Selects range in a text field
   *
   * @param     DOMElement      field     The DOM Element
   * @param     int             start     Start position
   * @param     int             end       End position
   *
   * @return    void
   *
   * @api       OSjs.Utils.$selectRange()
   */
  OSjs.Utils.$selectRange = function(field, start, end) {
    if ( !field ) { throw new Error('Cannot select range: missing element'); }
    if ( typeof start === 'undefined' || typeof end === 'undefined' ) { throw new Error('Cannot select range: mising start/end'); }

    if ( field.createTextRange ) {
      var selRange = field.createTextRange();
      selRange.collapse(true);
      selRange.moveStart('character', start);
      selRange.moveEnd('character', end);
      selRange.select();
      field.focus();
    } else if ( field.setSelectionRange ) {
      field.focus();
      field.setSelectionRange(start, end);
    } else if ( typeof field.selectionStart !== 'undefined' ) {
      field.selectionStart = start;
      field.selectionEnd = end;
      field.focus();
    }
  };

  /**
   * Add a className to a DOM Element
   *
   * @param   DOMElement      el      The dom Element
   * @param   String          name    The class name
   *
   * @return  void
   *
   * @api     OSjs.Utils.$addClass()
   */
  OSjs.Utils.$addClass = function(el, name) {
    if ( el && name && !this.$hasClass(el, name) ) {
      el.className += (el.className ? ' ' : '') + name;
    }
  };

  /**
   * Remove a className from a DOM Element
   *
   * @param   DOMElement      el      The dom Element
   * @param   String          name    The class name
   *
   * @return  void
   *
   * @api     OSjs.Utils.$removeClass()
   */
  OSjs.Utils.$removeClass = function(el, name) {
    if ( el && name && this.$hasClass(el, name) ) {
      var re = new RegExp('\\s?' + name);
      el.className = el.className.replace(re, '');
    }
  };

  /**
   * Check if a DOM Element has given className
   *
   * @param   DOMElement      el      The dom Element
   * @param   String          name    The class name
   *
   * @return  boolean
   *
   * @api     OSjs.Utils.$hasClass()
   */
  OSjs.Utils.$hasClass = function(el, name) {
    if ( el && name ) {
      var re = new RegExp('\\s?' + name);
      if ( re.test(el.className) !== false ) {
        return true;
      }
    }
    return false;
  };

  /**
   * Create a link stylesheet tag
   *
   * @param   String      src     The URL of resource
   *
   * @return  DOMElement          The tag
   *
   * @api     OSjs.Utils.$createCSS()
   */
  OSjs.Utils.$createCSS = function(src) {
    var res    = document.createElement('link');
    document.getElementsByTagName('head')[0].appendChild(res);

    res.rel    = 'stylesheet';
    res.type   = 'text/css';
    res.href   = src;

    return res;
  };

  /**
   * Create a script tag
   *
   * @param   String      src                   The URL of resource
   * @param   Function    onreadystatechange    readystatechange callback
   * @param   Function    onload                onload callback
   * @param   Function    onerror               onerror callback
   *
   * @return  DOMElement                        The tag
   *
   * @api     OSjs.Utils.$createJS()
   */
  OSjs.Utils.$createJS = function(src, onreadystatechange, onload, onerror) {
    var res                = document.createElement('script');
    res.type               = 'text/javascript';
    res.charset            = 'utf-8';
    res.onreadystatechange = onreadystatechange || function() {};
    res.onload             = onload             || function() {};
    res.onerror            = onerror            || function() {};
    res.src                = src;

    document.getElementsByTagName('head')[0].appendChild(res);

    return res;
  };

  /**
   * Check if event happened on a form element
   *
   * @param   DOMEvent    ev      DOM Event
   * @param   Array       types   Array of types
   *
   * @return  boolean             If is a form element
   *
   * @api     OSjs.Utils.$isFormElement()
   */
  OSjs.Utils.$isFormElement = function(ev, types) {
    types = types || ['TEXTAREA', 'INPUT', 'SELECT'];

    var d = ev.srcElement || ev.target;
    if ( d ) {
      if ( types.indexOf(d.tagName.toUpperCase()) >= 0 ) {
        if ( !(d.readOnly || d.disabled) ) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Alias
   *
   * @see OSjs.Utils.$isFormElement()
   * @api OSjs.Utils.$isInput()
   */
  OSjs.Utils.$isInput = function(ev) {
    return this.$isFormElement(ev); //, ['TEXTAREA', 'INPUT']);
  };

  /**
   * Wrapper for event-binding
   *
   * @param   DOMElement    el          DOM Element to attach event to
   * @param   String        ev          DOM Event Name
   * @param   Function      callback    Callback on event
   *
   * @return  EventCollection           Use this object to unbind generated events
   *
   * @api OSjs.Utils.$bind()
   */
  OSjs.Utils.$bind = (function() {

    var DBLCLICK_THRESHOLD = 200;
    var CONTEXTMENU_THRESHOLD = 600;

    function pos(ev, touchDevice) {
      return {
        x: (touchDevice ? (ev.changedTouches[0] || {}) : ev).clientX,
        y: (touchDevice ? (ev.changedTouches[0] || {}) : ev).clientY
      };
    }

    function _bindTouch(el, param, onStart, onMove, onEnd, collection) {
      var wasMoved = false;
      var startPos = {x: -1, y: -1};
      onStart = onStart || function() {};
      onMove = onMove || function() {};
      onEnd = onEnd || function() {};

      function touchStart(ev) {
        startPos = pos(ev, true);
        onStart(ev, startPos, false);
      }

      function touchMove(ev) {
        var curPos = pos(ev, true);
        if ( curPos.x !== startPos.x || curPos.y !== startPos.y ) {
          wasMoved = true;
        }
        onMove(ev, curPos, wasMoved);
      }

      function touchEnd(ev) {
        onEnd(ev, pos(ev, true), wasMoved);
      }

      collection.add(el, ['touchstart', touchStart, param === true]);
      collection.add(el, ['touchmove', touchMove, param === true]);
      collection.add(el, ['touchend', touchEnd, param === true]);
    }

    function bindTouchDblclick(ev, el, param, callback, collection) {

      var clickCount = 0;
      var timeout;

      function ct() {
        timeout = clearTimeout(timeout);
      }

      _bindTouch(el, param, function(ev, pos) {
        ct();
        clickCount++;
      }, null, function(ev, pos, wasMoved) {
        ct();

        if ( !wasMoved ) {
          if ( clickCount >= 2 ) {
            clickCount = 0;
            callback(ev, pos, true);
            return;
          }
        }

        timeout = setTimeout(function() {
          clickCount = 0;
          ct();
        }, DBLCLICK_THRESHOLD);
      }, collection);
    }

    function bindTouchClick(ev, el, param, callback, collection) {
      _bindTouch(el, param, null, null, function(ev, pos, wasMoved) {
        if ( !wasMoved ) {
          ev.stopPropagation();
          callback(ev, pos, true);
        }
      }, collection);
    }

    function bindTouchContextMenu(ev, el, param, callback, collection) {
      var timeout;

      _bindTouch(el, param, function(ev, pos) {
        timeout = setTimeout(function() {
          ev.preventDefault();
          callback(ev, pos, true);
        }, CONTEXTMENU_THRESHOLD);
      }, null, function(ev, pos, wasMoved) {
        timeout = clearTimeout(timeout);
      }, collection);
    }

    return function(el, ev, callback, param) {
      param = param || false;

      var compability = OSjs.Utils.getCompability();
      var isTouch = compability.touch;
      var touchMap = {
        click: bindTouchClick,
        dblclick: bindTouchDblclick,
        contextmenu: bindTouchContextMenu,
        mouseup: 'touchend',
        mousemove: 'touchmove',
        mousedown: 'touchstart'
      };


      var cbNormal = function(ev) {
        callback.call(el, ev, pos(ev), false);
      };

      var cbTouch = function(ev) {
        callback.call(el, ev, pos(ev, true), true);
      };

      var collection = new EventCollection();
      collection.add(el, [ev, cbNormal, param === true]);

      if ( touchMap[ev] ) {
        if ( typeof touchMap[ev] === 'function' ) {
          touchMap[ev](ev, el, param, callback, collection);
        } else {
          collection.add(el, [touchMap[ev], cbTouch, param === true]);
        }
      }

      return collection;
    };
  })();

  /**
   * Unbinds the given EventCollection
   *
   * @param   EventCollection     collection      The object returned by $bind()
   *
   * @return  null
   *
   * @see OSjs.Utils.$bind()
   * @api OSjs.Utils.$unbind()
   */
  OSjs.Utils.$unbind = function(collection) {
    if ( collection && collection instanceof EventCollection ) {
      collection.destroy();
    }
    return null;
  };

  /////////////////////////////////////////////////////////////////////////////
  // XHR
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Common function for handling all types of XHR calls
   * including download/upload and JSONP
   *
   * @param   Object      args      Aguments (see below)
   *
   * @option args String     url                  The URL
   * @option args String     method               HTTP Call method: (POST/GET, default = GET)
   * @option args Mixed      body                 Optional body to send (for POST)
   * @option args String     responseType         HTTP Response type (default = null)
   * @option args Object     requestHeaders       Tuple with headers (default = null)
   * @option args boolean    json                 Handle as a JSON request/response (default = false)
   * @option args boolean    jsonp                Handle as a JSONP request (default = false)
   * @option args Function   onerror              onerror callback
   * @option args Function   onsuccess            onsuccess callback
   * @option args Function   oncreated            oncreated callback
   * @option args Function   onfailed             onfailed callback
   * @option args Function   oncanceled           oncanceled callback
   *
   * @return  void
   *
   * @api     OSjs.Utils.ajax()
   */
  OSjs.Utils.ajax = function(args) {
    var request;
    args = OSjs.Utils.argumentDefaults(args, {
      onerror          : function() {},
      onsuccess        : function() {},
      onprogress       : function() {},
      oncreated        : function() {},
      onfailed         : function() {},
      oncanceled       : function() {},
      method           : 'GET',
      responseType     : null,
      requestHeaders   : {},
      body             : null,
      json             : false,
      url              : '',
      jsonp            : false
    });

    function getResponse(ctype) {
      var response = request.responseText;
      if ( args.json && ctype.match(/^application\/json/) ) {
        try {
          response = JSON.parse(response);
        } catch(ex) {
          console.warn('Utils::ajax()', 'handleResponse()', ex);
        }
      }

      return response;
    }

    function onReadyStateChange() {
      if ( request.readyState === 4 ) {
        var ctype = request.getResponseHeader('content-type');
        var result = getResponse(ctype);

        if ( request.status === 200 || request.status === 201 ) {
          args.onsuccess(result, request, args.url);
        } else {
          var error = OSjs.API._('ERR_UTILS_XHR_FMT', request.status.toString());
          args.onerror(error, result, request, args.url);
        }
      }
    }

    function requestJSONP() {
      var loaded  = false;
      OSjs.Utils.$createJS(args.url, function() {
        if ( (this.readyState === 'complete' || this.readyState === 'loaded') && !loaded) {
          loaded = true;
          args.onsuccess();
        }
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        args.onsuccess();
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        args.onerror();
      });
    }

    function cleanup() {
      if ( request.upload ) {
        request.upload.removeEventListener('progress', args.onprogress, false);
      }
      request.removeEventListener('error', args.onfailed, false);
      request.removeEventListener('abort', args.oncanceled, false);
      request.onerror = null;
      request.onload = null;
      request.onreadystatechange = null;
      request = null;
    }

    function requestJSON() {
      request = new XMLHttpRequest();
      request.open(args.method, args.url, true);
      request.responseType = args.responseType || '';

      Object.keys(args.requestHeaders).forEach(function(h) {
        request.setRequestHeader(h, args.requestHeaders[h]);
      });

      if ( request.upload ) {
        request.upload.addEventListener('progress', args.onprogress, false);
      }

      if ( args.responseType === 'arraybuffer' ) { // Binary
        request.onerror = function(evt) {
          var error = request.response || OSjs.API._('ERR_UTILS_XHR_FATAL');
          args.onerror(error, evt, request, args.url);

          cleanup();
        };
        request.onload = function(evt) {
          if ( request.status === 200 || request.status === 201 || request.status === 304 ) {
            args.onsuccess(request.response, request);
          } else {
            OSjs.VFS.abToText(request.response, 'text/plain', function(err, txt) {
              var error = txt || err || OSjs.API._('ERR_UTILS_XHR_FATAL');
              args.onerror(error, evt, request, args.url);
            });
          }

          cleanup();
        };
      } else {
        request.addEventListener('error', args.onfailed, false);
        request.addEventListener('abort', args.oncanceled, false);
        request.onreadystatechange = onReadyStateChange;
      }

      args.oncreated(request);
      request.send(args.body);
    }

    if ( window.location.href.match(/^file\:\/\//) ) {
      args.onerror('You are currently running locally and cannot perform this operation!');
      return;
    }

    if ( args.json && (typeof args.body !== 'string') && !(args.body instanceof FormData) ) {
      args.body = JSON.stringify(args.body);
    }

    console.debug('Utils::ajax()', args);

    if ( args.jsonp ) {
      requestJSONP();
      return;
    }

    requestJSON();
  };

  /**
   * Preload a list of resources
   *
   * Format of list is:
   * [
   *  {
   *
   *    "type": "javascript" // or "stylesheet",
   *    "src": "url/uri"
   *  }
   * ]
   *
   * @param   Array     list              The list of resources
   * @param   Function  callback          Callback when done
   * @param   Function  callbackProgress  Callback on progress
   *
   * @return  void
   *
   * @api     OSjs.Utils.preload()
   */
  OSjs.Utils.preload = (function() {
    var _LOADED = {};

    function isLoaded(path) {
      var result = false;
      (document.styleSheet || []).forEach(function(iter, i) {
        if ( iter.href.indexOf(path) !== -1 ) {
          result = true;
          return false;
        }
        return true;
      });
      return result;
    }

    function createStyle(src, callback, opts) {
      opts = opts || {};
      opts.check = (typeof opts.check === 'undefined') ? true : (opts.check === true);
      opts.interval = opts.interval || 50;
      opts.maxTries = opts.maxTries || 10;


      function _finished(result) {
        _LOADED[src] = result;
        console.info('Preloader->createStyle()', result ? 'success' : 'error', src);
        callback(result, src);
      }

      /*
      if ( document.createStyleSheet ) {
        document.createStyleSheet(src);
        _finished(true);
        return;
      }
      */

      OSjs.Utils.$createCSS(src);
      if ( opts.check === false || (typeof document.styleSheet === 'undefined') || isLoaded(src) ) {
        _finished(true);
        return;
      }

      var tries = opts.maxTries;
      var ival = setInterval(function() {
        console.debug('Preloader->createStyle()', 'check', src);
        if ( isLoaded(src) || (tries <= 0) ) {
          ival = clearInterval(ival);
          _finished(tries > 0);
          return;
        }
        tries--;
      }, opts.interval);
    }

    var createScript = function(src, callback) {
      var _finished = function(result) {
        _LOADED[src] = result;
        console.info('Preloader->createScript()', result ? 'success' : 'error', src);
        callback(result, src);
      };

      var loaded  = false;
      OSjs.Utils.$createJS(src, function() {
        if ( (this.readyState === 'complete' || this.readyState === 'loaded') && !loaded) {
          loaded = true;
          _finished(true);
        }
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        _finished(true);
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        _finished(false);
      });
    };

    return function(list, callback, callbackProgress) {
      list              = list              || [];
      callback          = callback          || function() {};
      callbackProgress  = callbackProgress  || function() {};

      // Make a copy!
      var newList = [];
      list.forEach(function(iter, i) {
        newList.push(iter);
      });

      var count       = newList.length;
      var successes   = 0;
      var progress    = 0;
      var failed      = [];

      function _finished() {
        callback(count, failed.length, failed);
      }

      function _loaded(success, src) {
        progress++;

        callbackProgress(progress, count);

        if ( success ) {
          successes++;
        } else {
          failed.push(src);
        }


        _next();
      }

      function _next() {
        if ( newList.length ) {
          var item = newList.shift();
          if ( (item.force !== true) && _LOADED[item.src] === true ) {
            _loaded(true);
            return;
          }

          if ( item.type.match(/^style/) ) {
            createStyle(item.src, _loaded);
          } else if ( item.type.match(/script$/) ) {
            createScript(item.src, _loaded);
          }
          return;
        }

        _finished();
      }

      console.log('Preloader', count, 'file(s)', newList);

      _next();
    };
  })();

})();
