/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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
(function(API, Utils, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-color-box'
   *
   * A box that displays a color.
   *
   * @getter    value   String        The value (color)
   * @setter    value   String        The value (color)
   *
   * @api OSjs.GUI.Elements.gui-color-box
   * @class
   */
  GUI.Elements['gui-color-box'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('div');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    set: function(el, param, value) {
      if ( param === 'value' ) {
        el.firstChild.style.backgroundColor = value;
        return true;
      }
      return false;
    },
    build: function(el) {
      var inner = document.createElement('div');
      el.appendChild(inner);
    }
  };

  /**
   * Element: 'gui-color-swatch'
   *
   * A box for selecting color(s) in the rainbow.
   *
   * See `ev.detail` for more information on events.
   *
   * @getter    value   String        The value (color)
   * @setter    value   String        The value (color)
   * @event     change                When input has changed => fn(ev)
   *
   * @api OSjs.GUI.Elements.gui-color-swatch
   * @class
   */
  GUI.Elements['gui-color-swatch'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('canvas');
      if ( evName === 'select' || evName === 'change' ) {
        evName = '_change';
      }
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var cv        = document.createElement('canvas');
      cv.width      = 100;
      cv.height     = 100;

      var ctx       = cv.getContext('2d');
      var gradient  = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);

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
    }
  };

  /**
   * Element: 'gui-iframe'
   *
   * IFrame container.
   *
   * @property  src     String        The source (src)
   *
   * @api OSjs.GUI.Elements.gui-iframe
   * @class
   */
  GUI.Elements['gui-iframe'] = {
    build: function(el) {
      var src = el.getAttribute('data-src') || 'about:blank';
      var iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.setAttribute('border', 0);
      el.appendChild(iframe);
    }
  };

  /**
   * Element: 'gui-progress-bar'
   *
   * Progress bar element.
   *
   * @setter    progress    integer     Progress value (percentage)
   * @property  progress    integer     Progress value (percentage)
   *
   * @api OSjs.GUI.Elements.gui-progress-bar
   * @class
   */
  GUI.Elements['gui-progress-bar'] = {
    set: function(el, param, value) {
      el.setAttribute('data-' + param, value);
      if ( param === 'progress' || param === 'value' ) {
        value = parseInt(value, 10);
        value = Math.max(0, Math.min(100, value));

        el.setAttribute('aria-label', String(value));
        el.setAttribute('aria-valuenow', String(value));

        el.querySelector('div').style.width = value.toString() + '%';
        el.querySelector('span').innerHTML = value + '%';
        return true;
      }
      return false;
    },
    build: function(el) {
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
    }
  };

  /**
   * Element: 'gui-statusbar'
   *
   * Status bar element.
   *
   * @setter    value       String      Content to set
   * @setter    label       String      Alias of 'value'
   *
   * @api OSjs.GUI.Elements.gui-statusbar
   * @class
   */
  GUI.Elements['gui-statusbar'] = {
    set: function(el, param, value) {
      if ( param === 'label' || param === 'value' ) {
        var span = el.getElementsByTagName('gui-statusbar-label')[0];
        if ( span ) {
          Utils.$empty(span);
          span.innerHTML = value;
        }
        return true;
      }
      return false;
    },
    build: function(el) {
      var lbl = el.getAttribute('data-label') || el.getAttribute('data-value') || el.innerHTML || '';
      var span = document.createElement('gui-statusbar-label');
      span.innerHTML = lbl;
      el.setAttribute('role', 'log');
      el.appendChild(span);
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
