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
import * as Events from 'utils/events';
import GUIElement from 'gui/element';

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

function createVisualElement(el, nodeType, applyArgs) {
  applyArgs = applyArgs || {};
  if ( typeof applyArgs !== 'object' ) {
    console.error('Derp', 'applyArgs was not an object ?!');
    applyArgs = {};
  }

  const img = document.createElement(nodeType);
  const src = el.getAttribute('data-src');
  const controls = el.getAttribute('data-controls');
  if ( controls ) {
    img.setAttribute('controls', 'controls');
  }
  const autoplay = el.getAttribute('data-autoplay');
  if ( autoplay ) {
    img.setAttribute('autoplay', 'autoplay');
  }

  Object.keys(applyArgs).forEach(function(k) {
    let val = applyArgs[k];
    if ( typeof val === 'function' ) {
      k = k.replace(/^on/, '');
      if ( (nodeType === 'video' || nodeType === 'audio') && k === 'load' ) {
        k = 'loadedmetadata';
      }
      Events.$bind(img, k, val.bind(img), false);
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
 */
class GUIAudio extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-audio'
    }, this);
  }

  on(evName, callback, params) {
    const target = this.$element.querySelector('audio');
    Events.$bind(target, evName, callback.bind(this), params);
    return this;
  }

  build(applyArgs) {
    createVisualElement(this.$element, 'audio', applyArgs);

    return this;
  }
}

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
 */
class GUIVideo extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-video'
    }, this);
  }

  on(evName, callback, params) {
    const target = this.$element.querySelector('video');
    Events.$bind(target, evName, callback.bind(this), params);
    return this;
  }

  build(applyArgs) {
    createVisualElement(this.$element, 'video', applyArgs);

    return this;
  }
}

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
 */
class GUIImage extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-image'
    }, this);
  }

  on(evName, callback, params) {
    const target = this.$element.querySelector('img');
    Events.$bind(target, evName, callback.bind(this), params);
    return this;
  }

  build(applyArgs) {
    createVisualElement(this.$element, 'img', applyArgs);

    return this;
  }
}

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
 */
class GUICanvas extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-canvas'
    }, this);
  }

  on(evName, callback, params) {
    const target = this.$element.querySelector('canvas');
    Events.$bind(target, evName, callback.bind(this), params);
    return this;
  }

  build() {
    const canvas = document.createElement('canvas');
    this.$element.appendChild(canvas);

    return this;
  }
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default {
  GUIAudio: GUIAudio,
  GUIVideo: GUIVideo,
  GUIImage: GUIImage,
  GUICanvas: GUICanvas
};
