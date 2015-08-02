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
(function(API, Utils, VFS) {
  'use strict';

  OSjs.GUI = OSjs.GUI || {};
  OSjs.GUI.Elements = OSjs.GUI.Elements || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////


  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Elements['gui-color-box'] = {
    set: function(el, param, value) {
      if ( param === 'value' ) {
        el.firstChild.style.backgroundColor = value;
      }
    },
    build: function(el) {
      var inner = document.createElement('div');
      el.appendChild(inner);
    }
  };

  OSjs.GUI.Elements['gui-color-swatch'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('canvas');
      if ( evName === 'select' || evName === 'change' ) {
        evName = '_change';
      }
      Utils.$bind(target, evName, callback.bind(new OSjs.GUI.Element(el)), params);
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
        cv.dispatchEvent(new CustomEvent('_change', {detail: getColor(ev)}));
      }, false);

      el.appendChild(cv);
    }
  };

  OSjs.GUI.Elements['gui-iframe'] = {
    build: function(el) {
      var src = el.getAttribute('data-src') || 'about:blank';
      var iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.setAttribute('border', 0);
      el.appendChild(iframe);
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS);
