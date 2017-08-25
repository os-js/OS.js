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
import * as DOM from 'utils/dom';
import * as Utils from 'utils/misc';
import * as Events from 'utils/events';
import GUIElement from 'gui/element';

/////////////////////////////////////////////////////////////////////////////
// CLASSES
/////////////////////////////////////////////////////////////////////////////

/**
 * Element: 'gui-color-box'
 *
 * A box that displays a color.
 *
 * <pre><code>
 *   getter    value   String        The value (color)
 *   setter    value   String        The value (color)
 * </code></pre>
 */
class GUIColorBox extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-color-box'
    }, this);
  }

  on(evName, callback, params) {
    const el = this.$element;
    const target = el.querySelector('div');
    Events.$bind(target, evName, callback.bind(this), params);
    return this;
  }

  set(param, value) {
    if ( param === 'value' ) {
      this.$element.firstChild.style.backgroundColor = value;
      return this;
    }
    return super.set(...arguments);
  }

  build() {
    const inner = document.createElement('div');
    this.$element.appendChild(inner);

    return this;
  }
}

/**
 * Element: 'gui-color-swatch'
 *
 * A box for selecting color(s) in the rainbow.
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value   String        The value (color)
 *   setter    value   String        The value (color)
 *   event     change                When input has changed => fn(ev)
 * </code></pre>
 */
class GUIColorSwatch extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-color-swatch'
    }, this);
  }

  on(evName, callback, params) {
    const el = this.$element;
    const target = el.querySelector('canvas');
    if ( evName === 'select' || evName === 'change' ) {
      evName = '_change';
    }
    Events.$bind(target, evName, callback.bind(this), params);
    return this;
  }

  build() {
    const el = this.$element;
    const cv = document.createElement('canvas');
    cv.width = 100;
    cv.height = 100;

    const ctx = cv.getContext('2d');

    let gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);

    function getColor(ev) {
      const pos = DOM.$position(cv);
      const cx = typeof ev.offsetX === 'undefined' ? (ev.clientX - pos.left) : ev.offsetX;
      const cy = typeof ev.offsetY === 'undefined' ? (ev.clientY - pos.top) : ev.offsetY;

      if ( isNaN(cx) || isNaN(cy) ) {
        return null;
      }

      const data = ctx.getImageData(cx, cy, 1, 1).data;
      return {
        r: data[0],
        g: data[1],
        b: data[2],
        hex: Utils.convertToHEX(data[0], data[1], data[2])
      };
    }

    gradient.addColorStop(0,    'rgb(255,   0,   0)');
    gradient.addColorStop(0.15, 'rgb(255,   0, 255)');
    gradient.addColorStop(0.33, 'rgb(0,     0, 255)');
    gradient.addColorStop(0.49, 'rgb(0,   255, 255)');
    gradient.addColorStop(0.67, 'rgb(0,   255,   0)');
    gradient.addColorStop(0.84, 'rgb(255, 255,   0)');
    gradient.addColorStop(1,    'rgb(255,   0,   0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0,   'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(0,     0,   0, 0)');
    gradient.addColorStop(1,   'rgba(0,     0,   0, 1)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    Events.$bind(cv, 'pointerdown', (ev) => {
      const c = getColor(ev);
      if ( c ) {
        cv.dispatchEvent(new CustomEvent('_change', {detail: c}));
      }
    }, false);

    el.appendChild(cv);

    return this;
  }
}

/**
 * Element: 'gui-iframe'
 *
 * IFrame container. On NW/Electron/X11 this is a "webview"
 *
 * <pre><code>
 *   property  src     String        The source (src)
 * </code></pre>
 */
class GUIIframe extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-iframe'
    }, this);
  }

  static get _tagName() {
    let isStandalone = false;

    try {
      isStandalone = (window.navigator.standalone) || window.matchMedia('(display-mode: standalone)').matches;
    } catch ( e ) {}

    return isStandalone ? 'webview' : 'iframe';
  }

  set(key, val) {
    if ( key === 'src' ) {
      this.$element.querySelector(GUIIframe._tagName).src = val;
      return this;
    }
    return super.set(...arguments);
  }

  build() {
    const el = this.$element;
    const src = el.getAttribute('data-src') || 'about:blank';
    const iframe = document.createElement(GUIIframe._tagName);
    iframe.src = src;
    iframe.setAttribute('border', 0);
    el.appendChild(iframe);

    return this;
  }
}

/**
 * Element: 'gui-progress-bar'
 *
 * Progress bar element.
 *
 * <pre><code>
 *   setter    progress    integer     Progress value (percentage)
 *   property  progress    integer     Progress value (percentage)
 * </code></pre>
 */
class GUIProgressBar extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-progress-bar'
    }, this);
  }

  set(param, value) {
    const el = this.$element;
    el.setAttribute('data-' + param, value);
    if ( param === 'progress' || param === 'value' ) {
      value = parseInt(value, 10);
      value = Math.max(0, Math.min(100, value));

      el.setAttribute('aria-label', String(value));
      el.setAttribute('aria-valuenow', String(value));

      el.querySelector('div').style.width = value.toString() + '%';
      el.querySelector('span').innerHTML = value + '%';
      return this;
    }

    return super.set(...arguments);
  }

  build() {
    const el = this.$element;

    let p = (el.getAttribute('data-progress') || 0);
    p = Math.max(0, Math.min(100, p));

    const percentage = p.toString() + '%';

    const progress = document.createElement('div');
    progress.style.width = percentage;

    const span = document.createElement('span');
    span.appendChild(document.createTextNode(percentage));

    el.setAttribute('role', 'progressbar');
    el.setAttribute('aria-valuemin', 0);
    el.setAttribute('aria-valuemax', 100);
    el.setAttribute('aria-label', 0);
    el.setAttribute('aria-valuenow', 0);

    el.appendChild(progress);
    el.appendChild(span);

    return this;
  }
}

/**
 * Element: 'gui-statusbar'
 *
 * Status bar element.
 *
 * <pre><code>
 *   setter    value       String      Content to set
 *   setter    label       String      Alias of 'value'
 * </code></pre>
 */
class GUIStatusBar extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-statusbar'
    }, this);
  }

  set(param, value) {
    if ( param === 'label' || param === 'value' ) {
      const span = this.$element.getElementsByTagName('gui-statusbar-label')[0];
      if ( span ) {
        DOM.$empty(span);
        span.innerHTML = value;
      }
      return this;
    }
    return super.set(...arguments);
  }

  build(args, win) {
    const el = this.$element;
    const span = document.createElement('gui-statusbar-label');

    let lbl = el.getAttribute('data-label') || el.getAttribute('data-value');
    if ( !lbl ) {
      lbl = (() => {
        let textNodes = [];
        let node, value;
        for ( let i = 0; i < el.childNodes.length; i++ ) {
          node = el.childNodes[i];
          if ( node.nodeType === Node.TEXT_NODE ) {
            value = node.nodeValue.replace(/\s+/g, '').replace(/^\s+/g, '');
            if ( value.length > 0 ) {
              textNodes.push(value);
            }

            el.removeChild(node);
            i++;
          }
        }

        return textNodes.join(' ');
      })();
    }

    span.innerHTML = lbl;
    el.setAttribute('role', 'log');
    el.appendChild(span);

    return this;
  }
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default {
  GUIColorBox: GUIColorBox,
  GUIColorSwatch: GUIColorSwatch,
  GUIIframe: GUIIframe,
  GUIProgressBar: GUIProgressBar,
  GUIStatusBar: GUIStatusBar
};
