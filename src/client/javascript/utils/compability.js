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

const compability = (function() {
  function _checkSupport(enabled, check, isSupported) {
    const supported = {};

    Object.keys(check).forEach((key) => {
      let chk = check[key];
      let value = false;

      if ( chk instanceof Array ) {
        chk.forEach((c) => {
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
      const xhr = new XMLHttpRequest();
      return (!!(xhr && ('upload' in xhr) && ('onprogress' in xhr.upload)));
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
    return _checkSupport(support, check, (codec) => {
      try {
        return !!support.canPlayType(codec);
      } catch ( e ) {
      }
      return false;
    });
  }

  function getVideoTypesSupported() {
    return canPlayCodec(getVideoSupported(), {
      webm: 'video/webm; codecs="vp8.0, vorbis"',
      ogg: 'video/ogg; codecs="theora"',
      h264: [
        'video/mp4; codecs="avc1.42E01E"',
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
      ],
      mpeg: 'video/mp4; codecs="mp4v.20.8"',
      mkv: 'video/x-matroska; codecs="theora, vorbis"'
    });
  }

  function getAudioSupported() {
    return document.createElement('audio').canPlayType ? document.createElement('audio') : null;
  }

  function getAudioTypesSupported() {
    return canPlayCodec(getAudioSupported(), {
      ogg: 'audio/ogg; codecs="vorbis',
      mp3: 'audio/mpeg',
      wav: 'audio/wav; codecs="1"'
    });
  }

  function getAudioContext() {
    if ( window.hasOwnProperty('AudioContext') || window.hasOwnProperty('webkitAudioContext') ) {
      return true;
    }
    return false;
  }

  const getCanvasContexts = (() => {
    const cache = [];

    return () => {
      if ( !cache.length ) {
        const canvas = getCanvasSupported();
        if ( canvas ) {
          const test = ['2d', 'webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
          test.forEach((tst, i) => {
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
    let result = false;
    let contexts = getCanvasContexts();
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
    let feature = false;
    let domPrefixes = 'Webkit Moz ms O'.split(' ');
    let elm = document.createElement('div');
    let featurenameCapital = null;

    featurename = featurename.toLowerCase();

    if ( elm.style[featurename] ) {
      feature = true;
    }

    if ( feature === false ) {
      featurenameCapital = featurename.charAt(0).toUpperCase() + featurename.substr(1);
      for ( let i = 0; i < domPrefixes.length; i++ ) {
        if ( typeof elm.style[domPrefixes[i] + featurenameCapital ] !== 'undefined' ) {
          feature = true;
          break;
        }
      }
    }
    return feature;
  }

  function getUserMedia() {
    let getMedia = false;
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

  const checkWindow = {
    indexedDB: 'indexedDB',
    localStorage: 'localStorage',
    sessionStorage: 'sessionStorage',
    globalStorage: 'globalStorage',
    openDatabase: 'openDatabase',
    socket: 'WebSocket',
    worker: 'Worker',
    file: 'File',
    blob: 'Blob',
    orientation: 'onorientationchange'
  };

  const compability = {
    touch: getTouch(),
    upload: getUpload(),
    getUserMedia: getUserMedia(),
    fileSystem: getFileSystem(),
    localStorage: false,
    sessionStorage: false,
    globalStorage: false,
    openDatabase: false,
    socket: false,
    worker: false,
    file: false,
    blob: false,
    orientation: false,
    dnd: getDnD(),
    css: {
      transition: detectCSSFeature('transition'),
      animation: detectCSSFeature('animation')
    },
    canvas: !!getCanvasSupported(),
    canvasContext: getCanvasContexts(),
    webgl: getWebGL(),
    audioContext: getAudioContext(),
    svg: getSVG(),
    video: !!getVideoSupported(),
    videoTypes: getVideoTypesSupported(),
    audio: !!getAudioSupported(),
    audioTypes: getAudioTypesSupported(),
    richtext: getRichText()
  };

  Object.keys(checkWindow).forEach((key) => {
    try {
      compability[key] = (checkWindow[key] in window) && window[checkWindow[key]] !== null;
    } catch ( e ) {
      console.warn(e);
    }
  });

  return () => {
    return compability;
  };
})();

/**
 * Gets browser compability flags
 *
 * @return    {Object}      List of compability
 */
export function getCompability() {
  return compability();
}

/**
 * Check if browser is IE
 *
 * @return    {Boolean}       If IE
 */
export function isIE() {
  const dm = parseInt(document.documentMode, 10);
  return dm <= 11 || !!navigator.userAgent.match(/(MSIE|Edge)/);
}
