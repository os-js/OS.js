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
  // EXPORTS
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
   *
   * @constructor ColorBox
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIColorBox = {
    on: function(evName, callback, params) {
      var el = this.$element;
      var target = el.querySelector('div');
      Utils.$bind(target, evName, callback.bind(this), params);
      return this;
    },

    set: function(param, value) {
      if ( param === 'value' ) {
        this.$element.firstChild.style.backgroundColor = value;
        return this;
      }
      return GUI.Element.prototype.set.apply(this, arguments);
    },

    build: function() {
      var inner = document.createElement('div');
      this.$element.appendChild(inner);

      return this;
    }
  };

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
   *
   * @constructor ColorSwatch
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIColorSwatch = {
    on: function(evName, callback, params) {
      var el = this.$element;
      var target = el.querySelector('canvas');
      if ( evName === 'select' || evName === 'change' ) {
        evName = '_change';
      }
      Utils.$bind(target, evName, callback.bind(this), params);
      return this;
    },

    build: function() {
      var el = this.$element;
      var cv = document.createElement('canvas');
      cv.width = 100;
      cv.height = 100;

      var ctx = cv.getContext('2d');
      var gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);

      function getColor(ev) {
        var pos = OSjs.Utils.$position(cv);
        var cx = typeof ev.offsetX === 'undefined' ? (ev.clientX - pos.left) : ev.offsetX;
        var cy = typeof ev.offsetY === 'undefined' ? (ev.clientY - pos.top) : ev.offsetY;

        if ( isNaN(cx) || isNaN(cy) ) {
          return null;
        }

        var data = ctx.getImageData(cx, cy, 1, 1).data;
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

      Utils.$bind(cv, 'click', function(ev) {
        var c = getColor(ev);
        if ( c ) {
          cv.dispatchEvent(new CustomEvent('_change', {detail: c}));
        }
      }, false);

      el.appendChild(cv);

      return this;
    }
  };

  /**
   * Element: 'gui-iframe'
   *
   * IFrame container. On NW/Electron/X11 this is a "webview"
   *
   * <pre><code>
   *   property  src     String        The source (src)
   * </code></pre>
   *
   * @constructor Iframe
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIIframe = (function() {
    var tagName = 'iframe';
    if ( (['nw', 'electron', 'x11']).indexOf(API.getConfig('Connection.Type')) >= 0 ) {
      tagName = 'webview';
    }

    return {

      set: function(key, val) {
        if ( key === 'src' ) {
          this.$element.querySelector(tagName).src = val;
          return this;
        }
        return GUI.Element.prototype.set.apply(this, arguments);
      },

      build: function() {
        var el = this.$element;
        var src = el.getAttribute('data-src') || 'about:blank';
        var iframe = document.createElement(tagName);
        iframe.src = src;
        iframe.setAttribute('border', 0);
        el.appendChild(iframe);

        return this;
      }
    };

  })();

  /**
   * Element: 'gui-progress-bar'
   *
   * Progress bar element.
   *
   * <pre><code>
   *   setter    progress    integer     Progress value (percentage)
   *   property  progress    integer     Progress value (percentage)
   * </code></pre>
   *
   * @constructor ProgressBar
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIProgressBar = {
    set: function(param, value) {
      var el = this.$element;
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

      return GUI.Element.prototype.set.apply(this, arguments);
    },

    build: function() {
      var el = this.$element;

      var p = (el.getAttribute('data-progress') || 0);
      p = Math.max(0, Math.min(100, p));

      var percentage = p.toString() + '%';

      var progress = document.createElement('div');
      progress.style.width = percentage;

      var span = document.createElement('span');
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
  };

  /**
   * Element: 'gui-statusbar'
   *
   * Status bar element.
   *
   * <pre><code>
   *   setter    value       String      Content to set
   *   setter    label       String      Alias of 'value'
   * </code></pre>
   *
   * @constructor StatusBar
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIStatusBar = {
    set: function(param, value) {
      if ( param === 'label' || param === 'value' ) {
        var span = this.$element.getElementsByTagName('gui-statusbar-label')[0];
        if ( span ) {
          Utils.$empty(span);
          span.innerHTML = value;
        }
        return this;
      }
      return GUI.Element.prototype.set.apply(this, arguments);
    },

    build: function(args, win) {
      var el = this.$element;
      var span = document.createElement('gui-statusbar-label');

      var lbl = el.getAttribute('data-label') || el.getAttribute('data-value');
      if ( !lbl ) {
        lbl = (function() {
          var textNodes = [];
          var node, value;
          for ( var i = 0; i < el.childNodes.length; i++ ) {
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
  };

  /////////////////////////////////////////////////////////////////////////////
  // REGISTRATION
  /////////////////////////////////////////////////////////////////////////////

  GUI.Element.register({
    tagName: 'gui-color-box'
  }, GUIColorBox);

  GUI.Element.register({
    tagName: 'gui-color-swatch'
  }, GUIColorSwatch);

  GUI.Element.register({
    tagName: 'gui-iframe'
  }, GUIIframe);

  GUI.Element.register({
    tagName: 'gui-progress-bar'
  }, GUIProgressBar);

  GUI.Element.register({
    tagName: 'gui-statusbar'
  }, GUIStatusBar);

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
