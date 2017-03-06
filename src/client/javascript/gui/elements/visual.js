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
(function(API, Utils, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function createVisualElement(el, nodeType, applyArgs) {
    applyArgs = applyArgs || {};
    if ( typeof applyArgs !== 'object' ) {
      console.error('Derp', 'applyArgs was not an object ?!');
      applyArgs = {};
    }

    var img = document.createElement(nodeType);
    var src = el.getAttribute('data-src');
    var controls = el.getAttribute('data-controls');
    if ( controls ) {
      img.setAttribute('controls', 'controls');
    }
    var autoplay = el.getAttribute('data-autoplay');
    if ( autoplay ) {
      img.setAttribute('autoplay', 'autoplay');
    }

    Object.keys(applyArgs).forEach(function(k) {
      var val = applyArgs[k];
      if ( typeof val === 'function' ) {
        k = k.replace(/^on/, '');
        if ( (nodeType === 'video' || nodeType === 'audio') && k === 'load' ) {
          k = 'loadedmetadata';
        }
        Utils.$bind(img, k, val.bind(img), false);
      } else {
        if ( typeof applyArgs[k] === 'boolean' ) {
          val = val ? 'true' : 'false';
        }
        img.setAttribute(k, val);
      }
    });

    img.src = src || 'about:blank';
    el.appendChild(img);
  }

  /////////////////////////////////////////////////////////////////////////////
  // CLASSES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-audio'
   *
   * HTML5 Audio Element.
   *
   * <pre><code>
   *   getter    src   String        The source (src)
   *   setter    src   String        The source (src)
   *   property  src   String        The source (src)
   * </code></pre>
   *
   * @constructor Audio
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIAudio = {
    on: function(evName, callback, params) {
      var target = this.$element.querySelector('audio');
      Utils.$bind(target, evName, callback.bind(this), params);
      return this;
    },

    build: function(applyArgs) {
      createVisualElement(this.$element, 'audio', applyArgs);

      return this;
    }
  };

  /**
   * Element: 'gui-video'
   *
   * HTML5 Video Element.
   *
   * <pre><code>
   *   getter    src   String        The source (src)
   *   setter    src   String        The source (src)
   *   property  src   String        The source (src)
   * </code></pre>
   *
   * @constructor Video
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIVideo = {
    on: function(evName, callback, params) {
      var target = this.$element.querySelector('video');
      Utils.$bind(target, evName, callback.bind(this), params);
      return this;
    },

    build: function(applyArgs) {
      createVisualElement(this.$element, 'video', applyArgs);

      return this;
    }
  };

  /**
   * Element: 'gui-image'
   *
   * Normal Image Element.
   *
   * <pre><code>
   *   getter    src   String        The source (src)
   *   setter    src   String        The source (src)
   *   property  src   String        The source (src)
   * </code></pre>
   *
   * @constructor Image
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIImage = {
    on: function(evName, callback, params) {
      var target = this.$element.querySelector('img');
      Utils.$bind(target, evName, callback.bind(this), params);
      return this;
    },

    build: function(applyArgs) {
      createVisualElement(this.$element, 'img', applyArgs);

      return this;
    }
  };

  /**
   * Element: 'gui-canvas'
   *
   * Canvas Element.
   *
   * <pre><code>
   *   getter    src   String        The source (src)
   *   setter    src   String        The source (src)
   *   property  src   String        The source (src)
   * </code></pre>
   *
   * @constructor Canvas
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUICanvas = {
    on: function(evName, callback, params) {
      var target = this.$element.querySelector('canvas');
      Utils.$bind(target, evName, callback.bind(this), params);
      return this;
    },

    build: function() {
      var canvas = document.createElement('canvas');
      this.$element.appendChild(canvas);

      return this;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // REGISTRATION
  /////////////////////////////////////////////////////////////////////////////

  GUI.Element.register({
    tagName: 'gui-audio'
  }, GUIAudio);

  GUI.Element.register({
    tagName: 'gui-video'
  }, GUIVideo);

  GUI.Element.register({
    tagName: 'gui-image'
  }, GUIImage);

  GUI.Element.register({
    tagName: 'gui-canvas'
  }, GUICanvas);

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
