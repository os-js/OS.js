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

  window.OSjs = window.OSjs || {};
  OSjs.Utils  = OSjs.Utils  || {};

  /////////////////////////////////////////////////////////////////////////////
  // MISC
  /////////////////////////////////////////////////////////////////////////////

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

  // Kudos: http://stackoverflow.com/a/4673436
  OSjs.Utils.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    var sprintfRegex = /\{(\d+)\}/g;

    function sprintf(match, number) {
      return number in args ? args[number] : match;
    }

    return format.replace(sprintfRegex, sprintf);
  };

  OSjs.Utils.mergeObject = function(obj1, obj2) {
    for ( var p in obj2 ) {
      if ( obj2.hasOwnProperty(p) ) {
        try {
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

  OSjs.Utils.cloneObject = function(o) {
    return JSON.parse(JSON.stringify(o, function(key, value) {
      if ( value && typeof value === 'object' && value.tagName ) {
        return undefined;
      }
      return value;
    }));
  };

  OSjs.Utils.inArray = function(arr, val) {
    for ( var i = 0, l = arr.length; i < l; i++ ) {
      if ( arr[i] === val ) { return true; }
    }
    return false;
  };

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

  OSjs.Utils.getCompability = (function() {
    var canvas_supported  = !!document.createElement('canvas').getContext   ? document.createElement('canvas')  : null;
    var video_supported   = !!document.createElement('video').canPlayType   ? document.createElement('video')   : null;
    var audio_supported   = !!document.createElement('audio').canPlayType   ? document.createElement('audio')   : null;

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

    var getMedia = false;
    if ( window.navigator ) {
      getMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
    }

    var compability = {
      upload         : false,
      getUserMedia   : !!getMedia,
      fileSystem     : (('requestFileSystem' in window) || ('webkitRequestFileSystem' in window)),
      localStorage   : (('localStorage'    in window) && window['localStorage']   !== null),
      sessionStorage : (('sessionStorage'  in window) && window['sessionStorage'] !== null),
      globalStorage  : (('globalStorage'   in window) && window['globalStorage']  !== null),
      openDatabase   : (('openDatabase'    in window) && window['openDatabase']   !== null),
      socket         : (('WebSocket'       in window) && window['WebSocket']      !== null),
      worker         : (('Worker'          in window) && window['Worker']         !== null),
      file           : (('File'            in window) && window['File']           !== null),
      blob           : (('Blob'            in window) && window['Blob']           !== null),
      dnd            : ('draggable' in document.createElement('span')),
      touch          : ('ontouchstart' in window) || (window.DocumentTouch && (document instanceof window.DocumentTouch)),
      orientation    : ('onorientationchange' in window),
      css            : {
        transition : detectCSSFeature('transition'),
        animation : detectCSSFeature('animation')
      },

      canvas         : (!!canvas_supported),
      canvasContext  : [],
      webgl          : false,
      audioContext   : false,
      svg            : (!!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect),
      video          : (!!video_supported),
      videoTypes     : {
        webm     : (video_supported && !!video_supported.canPlayType('video/webm; codecs="vp8.0, vorbis"')),
        ogg      : (video_supported && !!video_supported.canPlayType('video/ogg; codecs="theora"')),
        h264     : (video_supported && !!(video_supported.canPlayType('video/mp4; codecs="avc1.42E01E"') || video_supported.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'))),
        mpeg     : (video_supported && !!video_supported.canPlayType('video/mp4; codecs="mp4v.20.8"')),
        mkv      : (video_supported && !!video_supported.canPlayType('video/x-matroska; codecs="theora, vorbis"'))
      },
      audio          : (!!audio_supported),
      audioTypes     : {
        ogg      : (audio_supported && !!audio_supported.canPlayType('audio/ogg; codecs="vorbis')),
        mp3      : (audio_supported && !!audio_supported.canPlayType('audio/mpeg')),
        wav      : (audio_supported && !!audio_supported.canPlayType('audio/wav; codecs="1"'))
      },
      richtext       : (!!document.createElement('textarea').contentEditable)
    };

    if ( canvas_supported ) {
      var test = ['2d', 'webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
      test.forEach(function(tst, i) {
        try {
          if ( !!canvas_supported.getContext(tst) ) {
            compability.canvasContext.push(tst);
          }
        } catch ( eee ) {}
      });

      compability.webgl = (compability.canvasContext.length > 1);
      if ( !compability.webgl ) {
        if ( 'WebGLRenderingContext' in window ) {
          compability.webgl = true;
        }
      }
    }

    try {
      var xhr = new XMLHttpRequest();
      compability.upload = (!! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload)));
    } catch ( e ) {}

    if ( window.hasOwnProperty('AudioContext') || window.hasOwnProperty('webkitAudioContext') ) {
      compability.audioContext = true;
    }

    canvas_supported = null;
    video_supported = null;
    audio_supported = null;

    return function() {
      return compability;
    };

  })();

  OSjs.Utils.isIE = function() {
    var myNav = navigator.userAgent.toLowerCase();
    return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1], 10) : false;
  };

  OSjs.Utils.btoaUrlsafe = function(str) { // Encode
    return (!str || !str.length) ? '' : btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  OSjs.Utils.atobUrlsafe = function(str) { // Decode
    if ( str && str.length ) {
      str = (str + '===').slice(0, str.length + (str.length % 4));
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    }
    return '';
  };

  // Encode
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

  // Decode
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

  OSjs.Utils.getUserLocale = function() {
    var loc = (window.navigator.userLanguage || window.navigator.language) || 'en-EN';
    var map = {
      'nb'    : 'no_NO',
      'no'    : 'no_NO',
      'en'    : 'en_EN',
      'es'    : 'es_ES',
      'ru'    : 'ru_RU',
      'fr'    : 'fr_FR'
    };

    if ( loc.match(/\-/) ) {
      var tmp = loc.split('-')[0];
      if ( map[tmp] ) {
        return map[tmp];
      }
      return loc.replace('-', '_');
    }
    return map[loc] || loc;
  };

  /////////////////////////////////////////////////////////////////////////////
  // FS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Utils.filext = function(d) {
    var ext = OSjs.Utils.filename(d).split('.').pop();
    return ext ? ext.toLowerCase() : null;
  };

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

  OSjs.Utils.filename = function(p) {
    return (p||'').replace(/\/$/, '').split('/').pop();
  };

  // Kudos: http://stackoverflow.com/users/65387/mark
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

  OSjs.Utils.escapeFilename = function(n) {
    return (n || '').replace(/[\|&;\$%@"<>\(\)\+,\*\/]/g, '').trim();
  };

  OSjs.Utils.replaceFileExtension = function(filename, rep) {
    var spl = filename.split('.');
    spl.pop();
    spl.push(rep);
    return spl.join('.');
  };

  OSjs.Utils.replaceFilename = function(orig, newname) {
    var spl = orig.split('/');
    spl.pop();
    spl.push(newname);
    return spl.join('/');
  };

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

  OSjs.Utils.convertToRGB = function(hex) {
    var rgb = parseInt(hex.replace('#', ''), 16);
    var val = {};
    val.r = (rgb & (255 << 16)) >> 16;
    val.g = (rgb & (255 << 8)) >> 8;
    val.b = (rgb & 255);
    return val;
  };


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

  // Kudos: http://stackoverflow.com/a/9601429/1236086
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

  OSjs.Utils.$ = function(id) {
    return document.getElementById(id);
  };

  OSjs.Utils.$safeName = function(str) {
    return (str || '').replace(/[^a-zA-Z0-9]/g, '_');
  };

  OSjs.Utils.$empty = function(myNode) {
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }
  };

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

  OSjs.Utils.$index = function(el, parentEl) {
    parentEl = parentEl || el.parentNode;
    var nodeList = Array.prototype.slice.call(parentEl.children);
    var nodeIndex = nodeList.indexOf(el, parentEl);
    return nodeIndex;
  };

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

  OSjs.Utils.$addClass = function(el, name) {
    if ( el && name && !this.$hasClass(el, name) ) {
      el.className += (el.className ? ' ' : '') + name;
    }
  };

  OSjs.Utils.$removeClass = function(el, name) {
    if ( el && name && this.$hasClass(el, name) ) {
      var re = new RegExp('\\s?' + name);
      el.className = el.className.replace(re, '');
    }
  };

  OSjs.Utils.$hasClass = function(el, name) {
    if ( el && name ) {
      var re = new RegExp('\\s?' + name);
      if ( re.test(el.className) !== false ) {
        return true;
      }
    }
    return false;
  };

  OSjs.Utils.$createCSS = function(src) {
    var res    = document.createElement('link');
    document.getElementsByTagName('head')[0].appendChild(res);

    res.rel    = 'stylesheet';
    res.type   = 'text/css';
    res.href   = src;

    return res;
  };

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

  OSjs.Utils.isFormElement = function(ev, types) {
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

  OSjs.Utils.isInputElement = function(ev) {
    return this.isFormElement(ev); //, ['TEXTAREA', 'INPUT']);
  };

  /////////////////////////////////////////////////////////////////////////////
  // XHR
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Common function for handling all types of XHR calls
   * including download/upload and JSONP
   */
  OSjs.Utils.ajax = function(args) {
    args                = args                  || {};
    args.onerror        = args.onerror          || function() {};
    args.onsuccess      = args.onsuccess        || function() {};
    args.onprogress     = args.onprogress       || function() {};
    args.oncreated      = args.oncreated        || function() {};
    args.onfailed       = args.onfailed         || function() {};
    args.oncanceled     = args.oncanceled       || function() {};
    args.method         = args.method           || 'GET';
    args.responseType   = args.responseType     || null;
    args.requestHeaders = args.requestHeaders   || {};
    args.body           = args.body             || null;
    args.json           = args.json             || false;
    args.url            = args.url              || '';
    args.jsonp          = args.jsonp            || false;

    console.debug('Utils::ajax()', args);

    if ( args.jsonp ) {
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
      return;
    }


    var request = new XMLHttpRequest();

    if ( args.json ) {
      if ( typeof args.body !== 'string' ) {
        if ( !(args.body instanceof FormData) ) {
          args.body = JSON.stringify(args.body);
        }
      }
    }

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

    if ( args.responseType ) {
      request.responseType = args.responseType;
    }

    if ( args.responseType === 'arraybuffer' ) {
      request.onerror = function(evt) {
        var error = request.response || 'Fatal Error'; // FIXME: Translation
        args.onerror(error, evt, request, args.url);
      };
      request.onload = function() {
        args.onsuccess(request.response, request);
      };
    } else {
      if ( request.upload ) {
        request.upload.addEventListener('progress', function(evt) { args.onprogress(evt); }, false);
      }
      request.addEventListener('error', function(evt) { args.onfailed(evt); }, false);
      request.addEventListener('abort', function(evt) { args.oncanceled(evt); }, false);

      request.onreadystatechange = function() {
        if ( request.readyState === 4 ) {
          var ctype = request.getResponseHeader('content-type');
          var result = getResponse(ctype);

          if ( request.status === 200 || request.status === 201 ) {
            args.onsuccess(result, request, args.url);
          } else {
            var error = 'AJAX Error: ' + request.status.toString(); // FIXME: Translation
            args.onerror(error, result, request, args.url);
          }
        }
      };
    }

    request.open(args.method, args.url, true);

    Object.keys(args.requestHeaders).forEach(function(h) {
      request.setRequestHeader(h, args.requestHeaders[h]);
    });

    args.oncreated(request);

    request.send(args.body);
  };

  /////////////////////////////////////////////////////////////////////////////
  // MISC
  /////////////////////////////////////////////////////////////////////////////

  var _LOADED = {};

  var checkLoadedStyle = function(path) {
    var result = false;
    (document.styleSheet || []).forEach(function(iter, i) {
      if ( iter.href.indexOf(path) !== -1 ) {
        result = true;
        return false;
      }
      return true;
    });
    return result;
  };

  var createStyle = function(src, callback, opts) {
    opts = opts || {};

    if ( typeof opts.check === 'undefined' ) {
      opts.check = true;
    }

    var interval  = opts.interval || 50;
    var maxTries  = opts.maxTries || 10;

    var _finished = function(result) {
      _LOADED[src] = result;
      console.info('Preloader->createStyle()', result ? 'success' : 'error', src);
      callback(result, src);
    };

    if ( document.createStyleSheet ) {
      document.createStyleSheet(src);
      _finished(true);
    } else {
      OSjs.Utils.$createCSS(src);
      if ( opts.check === false || (typeof document.styleSheet === 'undefined') ) {
        _finished(true);
      } else if ( !checkLoadedStyle(src) ) {
        var ival;

        var _clear = function(result) {
          if ( ival ) {
            clearInterval(ival);
            ival = null;
          }
          _finished(result);
        };

        ival = setInterval(function() {
          console.debug('Preloader->createStyle()', 'check', src);
          if ( checkLoadedStyle(src) ) {
            _clear(true);
            return;
          } else if ( maxTries <= 0 ) {
            _clear(false);
            return;
          }
          maxTries--;
        }, interval);
      }
    }
  };

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

  OSjs.Utils.Preload = function(list, callback, callbackProgress) {
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


      if ( newList.length ) {
        _next();
      } else {
        _finished();
      }
    }

    function _next() {
      if ( newList.length ) {
        //var item = newList.pop();
        var item = newList.shift();
        if ( _LOADED[item.src] === true ) {
          _loaded(true);
          return;
        }

        if ( item.type.match(/^style/) ) {
          createStyle(item.src, _loaded);
        } else if ( item.type.match(/script$/) ) {
          createScript(item.src, _loaded);
        }
      }
    }

    if ( newList.length ) {
      console.log('Preloader', count, 'file(s)', newList);
      _next();
    } else {
      _finished();
    }
  };

})();
