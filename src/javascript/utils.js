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
    H: 72,
    M: 77,
    R: 82,

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

    return function() {
      return compability;
    };

  })();

  OSjs.Utils.isIE = function() {
    var myNav = navigator.userAgent.toLowerCase();
    return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1], 10) : false;
  };

  OSjs.Utils.urlsafe_b64encode = function(str) {
    return (!str || !str.length) ? '' : btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  OSjs.Utils.urlsafe_b64decode = function(str) {
    if ( str && str.length ) {
      str = (str + '===').slice(0, str.length + (str.length % 4));
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    }
    return '';
  };

  /////////////////////////////////////////////////////////////////////////////
  // FS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Utils.filext = function(d) {
    var ext = OSjs.Utils.filename(d).split('.').pop();
    return ext ? ext.toLowerCase() : null;
  };

  OSjs.Utils.dirname = function(f) {
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

  OSjs.Utils.HEXtoRGB = function(hex) {
    var rgb = parseInt(hex.replace('#', ''), 16);
    var val = {};
    val.r = (rgb & (255 << 16)) >> 16;
    val.g = (rgb & (255 << 8)) >> 8;
    val.b = (rgb & 255);
    return val;
  };


  OSjs.Utils.RGBtoHEX = function(r, g, b) {
    if ( typeof r === 'object' ) {
      g = r.g;
      b = r.b;
      r = r.r;
    }

    if ( typeof r === 'undefined' || typeof g === 'undefined' || typeof b === 'undefined' ) {
      throw new Error('Invalid RGB supplied to RGBtoHEX()');
    }

    var hex = [
      (r).toString( 16 ),
      (g).toString( 16 ),
      (b).toString( 16 )
    ];

    Object.keys(hex).forEach(function(i) {
      if ( hex[i].length === 1 ) {
        hex[i] = '0' + hex[i];
      }
    });

    return '#' + hex.join('').toUpperCase();
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
    if ( el && name ) {
      var re = new RegExp('\\s?' + name);
      if ( re.test(el.className) === false ) {
        el.className += (el.className ? ' ' : '') + name;
      }
    }
  };

  OSjs.Utils.$removeClass = function(el, name) {
    if ( el && name ) {
      var re = new RegExp('\\s?' + name);
      if ( re.test(el.className) !== false ) {
        el.className = el.className.replace(re, '');
      }
    }
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

  OSjs.Utils.AjaxUpload = function(file, size, dest, callbacks) {
    if ( !OSjs.Utils.getCompability().upload ) {
      throw new Error('File upload is not supported on your platform');
    }

    callbacks           = callbacks           || {};
    callbacks.progress  = callbacks.progress  || function() {};
    callbacks.complete  = callbacks.complete  || function() {};
    callbacks.failed    = callbacks.failed    || function() {};
    callbacks.canceled  = callbacks.canceled  || function() {};

    var xhr = new XMLHttpRequest();
    var fd  = new FormData();
    fd.append('upload', 1);
    fd.append('path',   dest);
    if ( file instanceof window.File ) {
      fd.append('upload', file);
    } else {
      fd.append('upload', file.data, file.filename);
    }

    xhr.upload.addEventListener('progress', function(evt) { callbacks.progress(evt); }, false);
    xhr.addEventListener('load', function(evt) {
      if ( evt.target && evt.target.responseText !== '1' ) {
        return callbacks.failed(evt, evt.target.responseText);
      }
      return callbacks.complete(evt);
    }, false);
    xhr.addEventListener('error', function(evt) { callbacks.failed(evt); }, false);
    xhr.addEventListener('abort', function(evt) { callbacks.canceled(evt); }, false);
    xhr.onreadystatechange = function(evt) {
      if ( xhr.readyState === 4 ) {
        if ( xhr.status !== 200 ) {
          var err = 'Unknown error';
          try {
            var tmp = JSON.parse(xhr.responseText);
            if ( tmp.error ) {
              err = tmp.error;
            }
          } catch ( e ) {
            if ( xhr.responseText ) {
              err = xhr.responseText;
            } else {
              err = e;
            }
          }
          callbacks.failed(evt, err);
        }
      }
    };

    var handler = OSjs.API.getHandlerInstance();
    var fsuri   = '/';
    if ( handler ) {
      fsuri = handler.getConfig('Core').FSURI;
    }
    xhr.open('POST', fsuri);
    xhr.send(fd);

    return xhr;
  };

  OSjs.Utils.AjaxDownload = function(url, onSuccess, onError) {
    onSuccess = onSuccess || function() {};
    onError   = onError   || function() {};

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onerror = function(err) {
      onError(err);
    };

    request.onload = function() {
      onSuccess(request.response);
    };

    request.send();
  };

  OSjs.Utils.Ajax = function(url, onSuccess, onError, opts) {
    if ( !url ) { throw new Error('No URL given'); }

    onSuccess = onSuccess || function() {};
    onError = onError || function() {};

    if ( !opts )        { opts = {}; }
    if ( !opts.method ) { opts.method = 'GET'; }
    if ( !opts.post )   { opts.post = {}; }
    if ( !opts.parse )  { opts.parse = true; }

    if ( opts.jsonp ) {
      var loaded  = false;
      OSjs.Utils.$createJS(url, function() {
        if ( (this.readyState === 'complete' || this.readyState === 'loaded') && !loaded) {
          loaded = true;
          onSuccess();
        }
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        onSuccess();
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        onError();
      });
      return;
    }

    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === 4) {
        var response = httpRequest.responseText;
        var error = '';
        var ctype = this.getResponseHeader('content-type');

        if ( ctype === 'application/json' ) {
          if ( opts.parse ) {
            try {
              response = JSON.parse(httpRequest.responseText);
            } catch ( e ) {
              response = null;
              error = 'An error occured while parsing: ' + e;
            }
          }
        }

        if ( httpRequest.status === 200 ) {
          onSuccess(response, httpRequest, url);
        } else {
          if ( !error && (ctype !== 'application/json') ) {
            error = 'Backend error: ' + (httpRequest.responseText || 'Fatal Error');
          }
          onError(error, response, httpRequest, url);
        }
      }
    };

    httpRequest.open(opts.method, url);

    if ( opts.method === 'GET' ) {
      httpRequest.send();
    } else {
      var args = opts.post;
      if ( typeof opts.post !== 'string' ) {
        args = (JSON.stringify(opts.post));
        //args = encodeURIComponent(JSON.stringify(opts.post));
      }

      httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      httpRequest.send(args);
    }

    return true;
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
