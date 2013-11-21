/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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

  window.OSjs = window.OSjs || {};
  OSjs.Utils = OSjs.Utils || {};

  OSjs.Utils.getCompability = (function() {
    var canvas_supported  = !!document.createElement('canvas').getContext   ? document.createElement('canvas')  : null;
    var video_supported   = !!document.createElement('video').canPlayType   ? document.createElement('video')   : null;
    var audio_supported   = !!document.createElement('audio').canPlayType   ? document.createElement('audio')   : null;

    var compability = {
      upload         : false,
      fileSystem     : (('requestFileSystem' in window) || ('webkitRequestFileSystem' in window)),
      localStorage   : (('localStorage'    in window) && window['localStorage']   !== null),
      sessionStorage : (('sessionStorage'  in window) && window['sessionStorage'] !== null),
      globalStorage  : (('globalStorage'   in window) && window['globalStorage']  !== null),
      openDatabase   : (('openDatabase'    in window) && window['openDatabase']   !== null),

      socket         : (('WebSocket'       in window) && window['WebSocket']      !== null),
      worker         : (('Worker'          in window) && window['Worker']         !== null),
      dnd            : ('draggable' in document.createElement('span')),
      touch          : ('ontouchstart' in window),
      orientation    : ('onorientationchange' in window),

      canvas         : (!!canvas_supported),
      canvasContext  : [],
      webgl          : false,
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
      var test = ["2d", "webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
      for ( var i = 0; i < test.length; i++ ) {
        try {
          if ( !!canvas_supported.getContext(test[i]) ) {
            compability.canvasContext.push(test[i]);
          }
        } catch ( eee ) {}
      }

      compability.webgl = (compability.canvasContext.length > 1);
    }

    try {
      var xhr = new XMLHttpRequest();
      compability.upload = (!! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload)));
    } finally {
      delete xhr;
    }

    return function() {
      return compability;
    };

  })();

  OSjs.Utils.dirname = function(f) {
    var tmp = f.split("/");
    tmp.pop();
    return tmp.join("/");
  };

  OSjs.Utils.filename = function(p) {
    return (p||'').split("/").pop();
  };

  OSjs.Utils.hexToRGB = function(hex) {
    var rgb = parseInt(hex.replace("#", ""), 16);
    return {
      r : (rgb & (255 << 16)) >> 16,
      g : (rgb & (255 << 8)) >> 8,
      b : (rgb & 255)
    };
  };


  OSjs.Utils.RGBtoHex = function(r, g, b) {
    if ( typeof r === 'object' ) {
      g = r.g;
      b = r.b;
      r = r.r;
    }

    var hex = [
      (r).toString( 16 ),
      (g).toString( 16 ),
      (b).toString( 16 )
    ];

    for ( var i in hex ) {
      if ( hex.hasOwnProperty(i) ) {
        if ( hex[i].length === 1 ) {
          hex[i] = "0" + hex[i];
        }
      }
    }

    return '#' + hex.join("").toUpperCase();
  };

  OSjs.Utils.$ = function(id) {
    return document.getElementById(id);
  };

  OSjs.Utils.$empty = function(myNode) {
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }
  };

  OSjs.Utils.$position = function(el) {
    return el.getBoundingClientRect();
  };

  OSjs.Utils.$index = function(el, parentEl) {
    var nodeList = Array.prototype.slice.call(parentEl.children);
    var nodeIndex = nodeList.indexOf(el, parentEl);
    return nodeIndex;
  }

  OSjs.Utils.Ajax = function(url, onSuccess, onError, opts) {
    if ( !url ) throw "No URL given";

    onSuccess = onSuccess || function() {};
    onError = onError || function() {};

    if ( !opts ) opts = {};
    if ( !opts.method ) opts.method = 'GET';
    if ( !opts.post ) opts.post = {};
    if ( !opts.parse ) opts.parse = true;

    var httpRequest;
    if (window.XMLHttpRequest) {
      httpRequest = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // IE
      try {
        httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
      }
      catch (e) {
        try {
          httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
        }
        catch (e) {}
      }
    }

    if ( !httpRequest ) {
      alert('Giving up :( Cannot create an XMLHTTP instance');
      return false;
    }

    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === 4) {
        var response = httpRequest.responseText;
        var error = "An error occured";

        if ( opts.parse ) {
          try {
            response = JSON.parse(httpRequest.responseText);
          } catch ( e ) {
            response = null;
            error = "An error occured while parsing: " + e;
          }
        }

        if ( httpRequest.status === 200 ) {
          onSuccess(response, httpRequest, url);
        } else {
          onError(error, response, httpRequest, url);
        }
      }
    };

    httpRequest.open(opts.method, url);

    if ( opts.method === 'GET' ) {
      httpRequest.send();
    } else {
      /*
      console.group("Ajax::POST()");
      console.log("Args", opts.post);
      console.groupEnd();
      */

      var args = opts.post;
      if ( !(typeof opts.post === 'String') ) {
        args = (JSON.stringify(opts.post));
        //args = encodeURIComponent(JSON.stringify(opts.post));
      }

      httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      httpRequest.send(args);
    }

    return true;
  };

})();
