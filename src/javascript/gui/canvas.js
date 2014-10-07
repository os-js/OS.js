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
(function(GUIElement) {
  'use strict';

  /**
   * Canvas Element
   *
   * options: (See GUIElement for more)
   *  width   int       Canvas width
   *  height  int       Canvas height
   *  type    String    Image type (Default = image/png)
   */
  var Canvas = function(name, opts) {
    opts = opts || {};
    if ( !OSjs.Compability.canvas ) {
      throw new Error('Your platform does not support canvas :/');
    }

    this.$canvas    = null;
    this.$context   = null;
    this.width      = opts.width  || null;
    this.height     = opts.height || null;
    this.type       = opts.type   || 'image/png';

    GUIElement.apply(this, [name, {}]);
  };

  Canvas.prototype = Object.create(GUIElement.prototype);

  Canvas.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUICanvas']);

    this.$canvas = document.createElement('canvas');
    if ( this.width !== null ) {
      this.$canvas.width = this.width;
      this.$element.style.width = this.width + 'px';
    }
    if ( this.height !== null ) {
      this.$canvas.height = this.height;
      this.$element.style.height = this.height + 'px';
    }
    this.$context = this.$canvas.getContext('2d');

    el.appendChild(this.$canvas);
    return el;
  };

  Canvas.prototype.clear = function() {
    if ( this.$context ) {
      this.$context.clearRect(0, 0, this.width, this.height);
      return true;
    }
    return false;
  };

  Canvas.prototype.fillColor = function(color) {
    this.$context.fillStyle = color;
    this.$context.fillRect(0, 0, this.width, this.height);
  };

  Canvas.prototype.resize = function(w, h) {
    this.width  = w;
    this.height = h;

    this.$canvas.width  = w;
    this.$canvas.height = h;

    this.$element.style.width   = w + 'px';
    this.$element.style.height  = h + 'px';
  };

  Canvas.prototype.func = function(f, args) {
    if ( !f || !args ) {
      throw new Error('Canvas::func() expects a function name and arguments');
    }
    if ( this.$canvas && this.$context ) {
      return this.$context[f].apply(this.$context, args);
    }
    return null;
  };

  Canvas.prototype.setImageData = function(src, onDone, onError) {
    if ( !this.$context ) { return; }

    onDone = onDone || function() {};
    onError = onError || function() {};
    var self  = this;
    var img   = new Image();
    var can   = this.$canvas;
    var ctx   = this.$context;
    var mime  = null;

    try {
      mime = src.split(/;/)[0].replace(/^data\:/, '');
    } catch ( e ) {
      throw new Error('Cannot setImageData() invalid or no mime');
      //return;
    }

    this.type = mime;

    img.onload = function() {
      self.resize(this.width, this.height);
      ctx.drawImage(img, 0, 0);
      onDone.apply(self, arguments);
    };
    img.onerror = function() {
      onError.apply(self, arguments);
    };
    img.src = src;
  };

  Canvas.prototype.getCanvas = function() {
    return this.$canvas;
  };

  Canvas.prototype.getContext = function() {
    return this.$context;
  };

  Canvas.prototype.getColorAt = function(x, y) {
    var imageData = this.$context.getImageData(0, 0, this.$canvas.width, this.$canvas.height).data;
    var index = ((x + y * this.$canvas.width) * 4);

    var rgb = {r:imageData[index + 0], g:imageData[index + 1], b:imageData[index + 2], a:imageData[index + 3]};
    var hex = OSjs.Utils.RGBtoHEX(rgb);
    return {rgb: rgb, hex:  hex};
  };

  Canvas.prototype.getImageData = function(type) {
    if ( this.$context && this.$canvas ) {
      type = type || this.type;
      return this.$canvas.toDataURL(type);
    }
    return null;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Canvas       = Canvas;

})(OSjs.GUI.GUIElement);
