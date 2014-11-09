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
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      'Pointer' : 'Peker',
      'Move active layer' : 'Flytt aktivt lag',
      'Picket' : 'Fargevelger',
      'LMB: set fg color, RMB: set bg color' : 'LMB: sett fg farge, RMB: sett bg farge',
      'Bucket' : 'Bøtte',
      'LMB: fill with fg color, RMB: fill with bg color' : 'LMB: fyll med fg farge, RMB: fyll med bg farge',
      'Pencil' : 'Penn',
      'LMB/RMB: Draw with fg/bg color' : 'LMB/RMB: Tegn med fg/bg farge',
      'Path' : 'Sti',
      'Square/Rectangle' : 'Firkant/Rektangel',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw rectangle' : 'LMB/RMB: Tegn med fb/bg farge, SHIFT: Tegn rektangel',
      'Circle/Ellipse' : 'Sirkel/Oval',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw ellipse' : 'LMB/RMB: Tegn med fb/bg farge, SHIFT: Tegn oval',
      'Radius' : 'Radius',
      'Iterations' : 'Itereringer',

      'Blur' : 'Klatte (Blur)',
      'Noise' : 'Støy',
      'Invert colors' : 'Inverter farger',
      'Grayscale' : 'Gråskala',
      'Sharpen' : 'Skarpgjør',
      'Simple Blur' : 'Simpel Klatte (Blur)'
    },
    de_DE : {
    },
    fr_FR : {
    },
    ru_RU : {
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return API.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // TOOLS
  /////////////////////////////////////////////////////////////////////////////

  var Tool = function(name, title, icon, txt, tmp) {
    this.name = name;
    this.title = title;
    this.icon = icon;
    this.style = null;
    this.drawAlt = false;
    this.statusText = txt;
    this.tmpEnable = tmp ? true : false;
    this.tmpCanvas = null;
    this.tmpContext = null;
  };

  Tool.prototype.applyStyle = function(styles, context) {
    if ( !context ) { return; }

    if ( styles ) {
      this.style = styles;
    } else {
      styles = this.style;
    }

    if ( styles ) {
      for ( var s in styles ) {
        if ( styles.hasOwnProperty(s) ) {
          if ( s != "enableStroke" ) {
            context[s] = styles[s];
          }
        }
      }
    }
  };

  Tool.prototype.onclick = function(ev, win, image, layer, currentPos, startPos) {
  };

  Tool.prototype.onmousedown = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;

    this.drawAlt = ev.shiftKey ? true : false;

    if ( this.tmpEnable ) {
      var canvas = document.createElement("canvas");
      canvas.style.position = "absolute";
      canvas.style.top = "0px";
      canvas.style.left = "0px";
      canvas.style.zIndex = 9999;
      canvas.width  = context.canvas.width;
      canvas.height = context.canvas.height;

      var ccontext = canvas.getContext("2d");
      this.applyStyle(null, ccontext);

      this.tmpCanvas  = canvas;
      this.tmpContext = ccontext;
      context.canvas.parentNode.appendChild(this.tmpCanvas);
    }
  };

  Tool.prototype.onmouseup = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;

    if ( this.tmpCanvas ) {
      if ( context ) {
        context.drawImage(this.tmpCanvas, 0, 0);
      }
      if ( this.tmpCanvas.parentNode ) {
        this.tmpCanvas.parentNode.removeChild(this.tmpCanvas);
      }
    }
    this.tmpContext = null;
  };

  Tool.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
  };

  /**
   * Tool: Pointer
   */
  var ToolPointer = function() {
    Tool.call(this, "pointer", _("Pointer"), "stock-cursor", _("Move active layer"));

    this.layerStartLeft   = 0;
    this.layerStartTop    = 0;
    this.layerCurrentLeft = 0;
    this.layerCurrentTop  = 0;
  };
  ToolPointer.prototype = Object.create(Tool.prototype);

  ToolPointer.prototype.onmousedown = function(ev, win, image, layer, currentPos, startPos) {
    Tool.prototype.onmousedown.apply(this, arguments);

    this.layerStartLeft = layer.left;
    this.layerStartTop  = layer.top;

    Utils.$addClass(image.$container, "moving");
  };

  ToolPointer.prototype.onmouseup = function(ev, win, image, layer, currentPos, startPos) {
    Tool.prototype.onmouseup.apply(this, arguments);

    layer.left = this.layerCurrentLeft;
    layer.top  = this.layerCurrentTop;

    Utils.$removeClass(image.$container, "moving");
  };

  ToolPointer.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
    Tool.prototype.ondraw.apply(this, arguments);

    this.layerCurrentLeft = layer.left + (currentPos[0] - startPos[0]);
    this.layerCurrentTop  = layer.top  + (currentPos[1] - startPos[1]);

    layer.canvas.style.left = (this.layerCurrentLeft) + "px";
    layer.canvas.style.top  = (this.layerCurrentTop)  + "px";
  };

  /**
   * Tool: Picker
   */
  var ToolPicker = function() {
    Tool.call(this, "picker", _("Picker"), "stock-color-pick-from-screen", "LMB: set fg color, RMB: set bg color");
  };
  ToolPicker.prototype = Object.create(Tool.prototype);

  ToolPicker.prototype.onclick = (function() {
    var imageData;
    var timeout;

    return function(ev, win, image, layer, currentPos, startPos) {
      var context = layer.context;
      if ( !imageData ) {
        imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height).data;
        if ( timeout ) {
          clearTimeout(timeout);
          timeout = null;
        }
        timeout = setTimeout(function() {
          imageData = null;
        }, 150);
      }

      var index = ((currentPos[0] + currentPos[1] * context.canvas.width) * 4);
      var rgb = {r:imageData[index + 0], g:imageData[index + 1], b:imageData[index + 2], a:imageData[index + 3]};
      var hex = "#000000";

      try {
        hex = Utils.convertToHEX(rgb);
      } catch ( e ) {
        console.warn("Failed to convert to hex", rgb, e);
      }

      if ( Utils.mouseButton(ev) == "left" ) {
        win.setColor("fg", hex);
      } else {
        win.setColor("bg", hex);
      }
    };
  })();
  ToolPicker.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
    this.onclick.apply(this, arguments);
  };
  ToolPicker.prototype.onmousedown = function(ev, win, image, layer, currentPos, startPos) {
    Tool.prototype.onmousedown.apply(this, arguments);
    this.onclick.apply(this, arguments);
  };

  /**
   * Tool: Bucket
   */
  var ToolBucket = function() {
    Tool.call(this, "bucket", _("Bucket"), "stock-tool-bucket-fill", "LMB: fill with fg color, RMB: fill with bg color");
  };
  ToolBucket.prototype = Object.create(Tool.prototype);

  ToolBucket.prototype.onclick = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  };
  ToolBucket.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
    this.onclick.apply(this, arguments);
  };

  /**
   * Tool: Pencil
   */
  var ToolPencil = function() {
    Tool.call(this, "pencil", _("Pencil"), "stock-tool-pencil", _("LMB/RMB: Draw with fg/bg color"));
  };
  ToolPencil.prototype = Object.create(Tool.prototype);

  ToolPencil.prototype.onmousedown = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;
    Tool.prototype.onmousedown.apply(this, arguments);

    // Invert color
    var bg = this.style.strokeStyle;
    var fg = this.style.fillStyle;
    context.strokeStyle = fg;
    context.fillStyle   = bg;

    this.ondraw.apply(this, arguments);
  };

  ToolPencil.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;
    context.beginPath();
    context.moveTo(currentPos[0]-1, currentPos[1]);
    context.lineTo(currentPos[0], currentPos[1]);
    context.closePath();

    context.stroke();
  };

  /**
   * Tool: Path
   */
  var ToolPath = function() {
    Tool.call(this, "path", _("Path"), "stock-tool-path", _("LMB/RMB: Draw with fg/bg color"), true);
  };
  ToolPath.prototype = Object.create(Tool.prototype);

  ToolPath.prototype.onmousedown = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;
    Tool.prototype.onmousedown.apply(this, arguments);

    // Invert color
    if ( !this.tmpContext ) { return; }

    var bg = this.style.strokeStyle;
    var fg = this.style.fillStyle;
    this.tmpContext.strokeStyle = fg;
    this.tmpContext.fillStyle   = bg;
  };

  ToolPath.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;
    if ( !this.tmpContext ) { return; }

    this.tmpContext.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);
    this.tmpContext.beginPath();
    this.tmpContext.moveTo(startPos[0], startPos[1]);
    this.tmpContext.lineTo(currentPos[0], currentPos[1]);
    this.tmpContext.closePath();

    this.tmpContext.stroke();
  };

  /**
   * Tool: Square
   */
  var ToolSquare = function() {
    Tool.call(this, "square", _("Square/Rectangle"), "stock-shape-square", _("LMB/RMB: Draw with fg/bg color, SHIFT: Draw rectangle"), true);
  };
  ToolSquare.prototype = Object.create(Tool.prototype);

  ToolSquare.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;
    if ( !this.tmpContext ) { return; }

    var x, y, w, h;
    if ( this.drawAlt ) {
      x = Math.min(currentPos[0], startPos[0]);
      y = Math.min(currentPos[1], startPos[1]);
      w = Math.abs(currentPos[0] - startPos[0]);
      h = Math.abs(currentPos[1] - startPos[1]);
    } else {
      x = startPos[0]; //Math.min(currentPos[0], startPos[0]);
      y = startPos[1]; //Math.min(currentPos[1], startPos[1]);
      w = Math.abs(currentPos[0] - startPos[0]) * (currentPos[0] < startPos[0] ? -1 : 1);
      h = Math.abs(w) * (currentPos[1] < startPos[1] ? -1 : 1);
    }

    this.tmpContext.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);
    if ( w && h ) {
      if ( this.style.enableStroke ) {
        this.tmpContext.strokeRect(x, y, w, h);
      }
      this.tmpContext.fillRect(x, y, w, h);
    }
  };

  /**
   * Tool: Circle
   */
  var ToolCircle = function() {
    Tool.call(this, "circle", _("Circle/Ellipse"), "stock-shape-circle", _("LMB/RMB: Draw with fg/bg color, SHIFT: Draw ellipse"), true);
  };
  ToolCircle.prototype = Object.create(Tool.prototype);

  ToolCircle.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;
    if ( !this.tmpContext ) { return; }

    if ( this.drawAlt ) {
      var width = Math.abs(startPos[0] - currentPos[0]);
      var height = Math.abs(startPos[1] - currentPos[1]);

      this.tmpContext.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);
      if ( width > 0 && height > 0 ) {
        this.tmpContext.beginPath();
        this.tmpContext.moveTo(startPos[0], startPos[1] - height*2); // A1
        this.tmpContext.bezierCurveTo(
          startPos[0] + width*2, startPos[1] - height*2, // C1
          startPos[0] + width*2, startPos[1] + height*2, // C2
          startPos[0], startPos[1] + height*2); // A2
        this.tmpContext.bezierCurveTo(
          startPos[0] - width*2, startPos[1] + height*2, // C3
          startPos[0] - width*2, startPos[1] - height*2, // C4
          startPos[0], startPos[1] - height*2); // A1

        this.tmpContext.closePath();
        if ( this.style.enableStroke ) {
          this.tmpContext.stroke();
        }
        this.tmpContext.fill();
      }
    } else {
      var x = Math.abs(startPos[0] - currentPos[0]);
      var y = Math.abs(startPos[1] - currentPos[1]);
      var r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

      this.tmpContext.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);
      if ( r > 0 ) {
        this.tmpContext.beginPath();
        this.tmpContext.arc(startPos[0], startPos[1], r, 0, Math.PI*2, true);
        this.tmpContext.closePath();
        if ( this.style.enableStroke ) {
          this.tmpContext.stroke();
        }
        this.tmpContext.fill();
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // IMAGE
  /////////////////////////////////////////////////////////////////////////////

  var Image = function(name, sx, sy) {
    this.$container = null;
    this.layers = [];
    this.activeLayer = null;
    this.filename = name;
    this.filetype = null;
    this.size = [sx, sy];

    this.init();
  };

  Image.prototype.init = function() {
    var self = this;
    this.$container = document.createElement("div");
    this.$container.className = "ApplicationDrawCanvas";
    this.$container.style.width = this.size[0] + "px";
    this.$container.style.height = this.size[1] + "px";

    this.createLayer("Default");

    return this.$container;
  };

  Image.prototype.destroy = function() {
    var self = this;

    this.clear();
    if ( this.$container ) {
      if ( this.$container.parentNode ) {
        this.$container.parentNode.removeChild(this.$container);
      }
      this.$container = null;
    }
  };

  Image.prototype.createLayer = function(name, sx, sy, setActive, x, y) {
    sx = sx || this.size[0];
    sy = sy || this.size[1];
    x  = x  || 0;
    y  = y  || 0;

    var layer = new Layer(name, sx, sy, this.layers.length + 1, x, y);
    this.addLayer(layer, setActive);
    return layer;
  };

  Image.prototype.addLayer = function(layer, setActive) {
    this.layers.push(layer);

    if ( !this.activeLayer || setActive ) {
      this.setActiveLayer(layer);
    }

    this.$container.appendChild(layer.canvas);
  };

  Image.prototype.removeLayer = function(layer) {
    if ( layer instanceof Layer ) {
      for ( var i = 0; i < this.layers.length; i++ ) {
        if ( this.layers[i] === layer ) {
          if ( this.activeLayer === this.layers[i] ) {
            this.setActiveLayer(null);
          }

          this.layers[i].destroy();
          this.layers.splice(i, 1);
          break;
        }
      }
    } else {
      if ( this.layers[layer] ) {
        if ( this.activeLayer === this.layers[layer] ) {
          this.setActiveLayer(null);
        }

        this.layers[layer].destroy();
        this.layers.splice(layer, 1);
      }
    }
  };

  Image.prototype.refreshZindex = function() {
    for ( var i = 0; i < this.layers.length; i++ ) {
      if ( this.layers[i].canvas ) {
        this.layers[i].zindex = (i+1);
        this.layers[i].canvas.style.zIndex = (i+1);
      }
    }
  };

  Image.prototype.clear = function() {
    for ( var i = 0; i < this.layers.length; i++ ) {
      if ( this.layers[i] ) {
        this.layers[i].destroy();
      }
    }
    this.layers = [];
    this.activeLayer = null;
  };

  Image.prototype.setActiveLayer = function(layer) {
    this.activeLayer = null;

    if ( typeof layer === "number" ) {
      if ( this.layers[layer] ) {
        this.activeLayer = this.layers[layer];
      }
    } else {
      if ( layer instanceof Layer ) {
        this.activeLayer = layer;
      }
    }
  };

  Image.prototype.getActiveLayer = function() {
    return this.activeLayer;
  };

  Image.prototype.setName = function(name) {
    this.name = name;
  };

  Image.prototype.setData = function(img) {
    var layer;
    if ( (window.Uint8Array && (img instanceof Uint8Array)) ) {
      this.clear();

      layer = this.createLayer("Default", 0, 0, true);
      layer.setRawData(img);
      return true;
    } else if ( (img instanceof Image) || (img instanceof HTMLImageElement) ) {
      this.clear();

      layer = this.createLayer("Default", 0, 0, true);
      layer.setData(img);
      return true;
    } else if ( (img instanceof Array) ) {
      this.clear();

      for ( var i = 0; i < img.length; i++ ) {
        layer = this.createLayer(img[i].name,
                                 img[i].width << 0,
                                 img[i].height << 0,
                                 true,
                                 img[i].left,
                                 img[i].top);

        layer.load(img[i].data);
      }
    }

    return false;
  };

  Image.prototype.getData = function(filetype) {
    filetype = filetype || this.filetype;

    var canvas = document.createElement("canvas");
    canvas.width = this.size[0];
    canvas.height = this.size[1];
    var context = canvas.getContext("2d");

    var layer;
    for ( var i = 0; i < this.layers.length; i++ ) {
      layer = this.layers[i];
      if ( layer ) {
        context.drawImage(layer.canvas, layer.left, layer.top);
      }
    }

    return canvas.toDataURL(filetype);
  };

  Image.prototype.getContainer = function() {
    return this.$container;
  };

  Image.prototype.getSaveData = function() {
    var layers = [];
    for ( var i = 0; i < this.layers.length; i++ ) {
      layers.push({
        name: this.layers[i].name,
        width: this.layers[i].width,
        height: this.layers[i].height,
        left: this.layers[i].left,
        top: this.layers[i].top,
        data: this.layers[i].canvas.toDataURL("image/png")
      });
    }

    var data = {
      filename: this.name,
      filetype: this.filetype,
      size: this.size,
      layers: layers
    };

    return JSON.stringify(data);
  };

  /////////////////////////////////////////////////////////////////////////////
  // LAYER
  /////////////////////////////////////////////////////////////////////////////

  var Layer = function(name, w, h, z, x, y) {
    this.name   = name;
    this.width  = w || 0;
    this.height = h || 0;
    this.left   = x || 0;
    this.top    = y || 0;
    this.zindex = z || 1;

    this.canvas               = document.createElement("canvas");
    this.canvas.width         = this.width;
    this.canvas.height        = this.height;
    this.canvas.style.zIndex  = this.zindex;

    this.context = this.canvas.getContext("2d");
  };

  Layer.prototype.destroy = function() {
    if ( this.canvas ) {
      if ( this.canvas.parentNode ) {
        this.canvas.parentNode.removeChild(this.canvas);
      }

      this.canvas = null;
    }
    this.context = null;
  };

  Layer.prototype.clear = function() {
    if ( this.context && (this.width + this.height) ) {
      this.context.clearRect(0, 0, this.width, this.height);
    }
  };

  Layer.prototype.load = function(dataurl) {
    var self = this;

    var im = document.createElement("img");
    im.onerror = function() {
      console.warn("FAILED TO LOAD LAYER DATA");
    };
    im.onload = function() {
      self.setData(this);
    };
    im.src = dataurl;
  };

  Layer.prototype.setRawData = function(bytes) {
    if ( this.context ) {
      var ctx   = this.context.canvas;
      console.warn(ctx.width, ctx.height);
      var image = this.context.createImageData(ctx.width, ctx.height);
      for (var i=0; i<bytes.length; i++) {
        image.data[i] = bytes[i];
      }
      this.context.drawImage(image, 0, 0);
    }
  };

  Layer.prototype.setData = function(img, x, y) {
    if ( this.context ) {
      this.clear();

      if ( (img instanceof Image) || (img instanceof HTMLImageElement) ) {
        this.context.drawImage(img, x||0, y||0);
        return true;
      }
    }
    return false;
  };

  Layer.prototype.flipX = function() {
    if ( !this.context ) { return; }
    var copy = document.createElement("canvas");
    copy.width = this.canvas.width;
    copy.height = this.canvas.height;
    copy.getContext("2d").drawImage(this.canvas, 0, 0);

    this.clear();
    this.context.save();
    this.context.scale(1, -1);
    this.context.drawImage(copy, 0, (copy.height * -1), copy.width, copy.height);
    this.context.restore();

    copy = null;
  };

  Layer.prototype.flipY = function() {
    if ( !this.context ) { return; }
    var copy = document.createElement("canvas");
    copy.width = this.canvas.width;
    copy.height = this.canvas.height;
    copy.getContext("2d").drawImage(this.canvas, 0, 0);

    this.clear();
    this.context.save();
    this.context.scale(-1, 1);
    this.context.drawImage(copy, (copy.width * -1), 0, copy.width, copy.height);
    this.context.restore();

    copy = null;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EFFECTS
  /////////////////////////////////////////////////////////////////////////////

  var Effect = function(name, title) {
    this.name = name;
    this.title = title;
  };
  Effect.prototype.run = function(context, canvas) {
    return false;
  };
  Effect.prototype.showDialog = function(win, context, canvas) {
    this.run.call(this, context, canvas);
  };
  Effect.prototype.convolute = function(context, weights, opaque) {
    context = context || this.context;

    var pixels = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    var tmpCanvas = document.createElement("canvas");
    var tmpCtx = tmpCanvas.getContext("2d");

    var side = Math.round(Math.sqrt(weights.length));
    var halfSide = Math.floor(side/2);
    var src = pixels.data;
    var sw = pixels.width;
    var sh = pixels.height;
    // pad output by the convolution matrix
    var w = sw;
    var h = sh;

    var output = tmpCtx.createImageData(w, h);
    var dst = output.data;
    // go through the destination image pixels
    var alphaFac = opaque ? 1 : 0;
    for (var y=0; y<h; y++) {
      for (var x=0; x<w; x++) {
        var sy = y;
        var sx = x;
        var dstOff = (y*w+x)*4;
        // calculate the weighed sum of the source image pixels that
        // fall under the convolution matrix
        var r=0, g=0, b=0, a=0;
        for (var cy=0; cy<side; cy++) {
          for (var cx=0; cx<side; cx++) {
            var scy = sy + cy - halfSide;
            var scx = sx + cx - halfSide;
            if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
              var srcOff = (scy*sw+scx)*4;
              var wt = weights[cy*side+cx];
              r += src[srcOff] * wt;
              g += src[srcOff+1] * wt;
              b += src[srcOff+2] * wt;
              a += src[srcOff+3] * wt;
            }
          }
        }
        dst[dstOff] = r;
        dst[dstOff+1] = g;
        dst[dstOff+2] = b;
        dst[dstOff+3] = a + alphaFac*(255-a);
      }
    }

    context.putImageData(output, 0, 0);
  };

  /**
   * Effect: Blur
   */
  var EffectBlurWindow = function(win, callback) {
    var app = win._appRef;

    Window.apply(this, ['ApplicationDrawEffectBlurWindow', {width: 400, height: 150}, app]);

    this._title = "Effect: Blur";
    this._properties.allow_resize = false,
    this._properties.allow_minimize = false,
    this._properties.allow_maximize = false,
    this._properties.allow_close = false,
    this.radius = 4;
    this.iterations = 1;
    this.callback = callback;
  };

  EffectBlurWindow.prototype = Object.create(Window.prototype);

  EffectBlurWindow.prototype.init = function(wmRef, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    var buttonContainer = document.createElement("div");
    buttonContainer.className = "ButtonContainer";

    var labelRadius = this._addGUIElement(new GUI.Label("EffectBlurWindowLabel1", {label: "Radius: " + this.radius}), root);
    var sliderRadius = this._addGUIElement(new GUI.Slider("EffectBlurWindowSlider1", {min:1, max:20, val: this.radius, onUpdate: function(val) {
      labelRadius.setLabel(_("Radius") + ": " + val);
      self.radius = val;
    }}), root);

    var labelIterations = this._addGUIElement(new GUI.Label("EffectBlurWindowLabel1", {label: "Iterations: " + this.iterations}), root);
    var sliderIterations = this._addGUIElement(new GUI.Slider("EffectBlurWindowSlider1", {min:1, max:4, val: this.iterations, onUpdate: function(val) {
      labelIterations.setLabel(_("Iterations") + ": " + val);
      self.iterations = val;
    }}), root);

    this._addGUIElement(new GUI.Button("EffectBlurButtonOK", {label: "Apply", onClick: function() {
      self.callback.call(self, "apply", self.radius, self.iterations);
    }}), buttonContainer);
    this._addGUIElement(new GUI.Button("EffectBlurButtonCancel", {label: "Cancel", onClick: function() {
      self.callback.call(self, "cancel");
    }}), buttonContainer);

    root.appendChild(buttonContainer);

    return root;
  };

  var EffectBlur = function() {
    Effect.call(this, "blur", _("Blur"));
  };

  EffectBlur.prototype = Object.create(Effect.prototype);

  EffectBlur.prototype.run = function(win, context, canvas, callback) {
    callback = callback || function() {};

    var self = this;
    var dialog = new EffectBlurWindow(win, function(response, radius, iterations) {
      win._toggleLoading(true);

      if ( response == "apply" ) {
        self._run(win, context, canvas, radius, iterations);
      }
      this._close();

      callback();
    });
    win._addChild(dialog, true);
    dialog._focus();
  };

  EffectBlur.prototype._run = function(win, context, canvas, radius, iterations) {
    OSjs.Applications.ApplicationDraw.Effects.Blur(canvas, context);
  };

  /**
   * Effect: Noise
   */
  var EffectNoise = function() {
    Effect.call(this, "noise", _("Noise"));
  };

  EffectNoise.prototype = Object.create(Effect.prototype);

  EffectNoise.prototype.run = function(win, context, canvas, callback) {
    callback = callback || function() {};

    win._toggleLoading(true);

    setTimeout(function() {
      var x, y, n;
      var opacity = 1;
      var width =  canvas.width;
      var height = canvas.height;
      for ( x = 0; x < width; x++ ) {
        for ( y = 0; y < height; y++ ) {
          n = Math.floor( Math.random() * 60 );
          context.fillStyle = "rgba(" + n + "," + n + "," + n + "," + opacity + ")";
          context.fillRect(x, y, 1, 1);
        }
      }

      callback();
    }, 10);
  };

  /**
   * Effect: Invert
   */
  var EffectInvert = function() {
    Effect.call(this, "invert", _("Invert colors"));
  };

  EffectInvert.prototype = Object.create(Effect.prototype);

  EffectInvert.prototype.run = function(win, context, canvas, callback) {
    callback = callback || function() {};

    win._toggleLoading(true);

    setTimeout(function() {
      var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      var data = imageData.data;
      for (var i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      context.putImageData(imageData, 0, 0);

      callback();
    }, 10);
  };

  /**
   * Effect: Grayscale
   */
  var EffectGrayscale = function() {
    Effect.call(this, "grayscale", _("Grayscale"));
  };

  EffectGrayscale.prototype = Object.create(Effect.prototype);

  EffectGrayscale.prototype.run = function(win, context, canvas, callback) {
    callback = callback || function() {};

    win._toggleLoading(true);

    setTimeout(function() {
      var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      var data = imageData.data;
      var r, g, b, v;
      for (var i = 0; i < data.length; i += 4) {
        r = data[i];
        g = data[i+1];
        b = data[i+2];
        v = 0.2126*r + 0.7152*g + 0.0722*b;
        data[i] = data[i+1] = data[i+2] = v
      }
      context.putImageData(imageData, 0, 0);

      callback();
    }, 10);
  };

  /**
   * Effect: Sharpen
   */
  var EffectSharpen = function() {
    Effect.call(this, "sharpen", _("Sharpen"));
  };

  EffectSharpen.prototype = Object.create(Effect.prototype);

  EffectSharpen.prototype.run = function(win, context, canvas, callback) {
    callback = callback || function() {};

    win._toggleLoading(true);

    var self = this;
    setTimeout(function() {
      self.convolute(context, [  0, -1,  0,
                                -1,  5, -1,
                                 0, -1,  0 ]);

      callback();
    }, 10);
  };

  /**
   * Effect: SimpleBlur
   */
  var EffectSimpleBlur = function() {
    Effect.call(this, "simpleblur", _("Simple Blur"));
  };

  EffectSimpleBlur.prototype = Object.create(Effect.prototype);

  EffectSimpleBlur.prototype.run = function(win, context, canvas, callback) {
    callback = callback || function() {};

    win._toggleLoading(true);

    var self = this;
    setTimeout(function() {
      self.convolute(context, [ 1/9, 1/9, 1/9,
                                1/9, 1/9, 1/9,
                                1/9, 1/9, 1/9 ]);

      callback();
    }, 10);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationDraw = OSjs.Applications.ApplicationDraw || {};
  OSjs.Applications.ApplicationDraw.Image = Image;
  OSjs.Applications.ApplicationDraw.Layer = Layer;
  OSjs.Applications.ApplicationDraw.ToolList = [
    new ToolPointer(),
    new ToolPicker(),
    new ToolBucket(),
    new ToolPencil(),
    new ToolPath(),
    new ToolSquare(),
    new ToolCircle()
  ];
  OSjs.Applications.ApplicationDraw.EffectList = [
    new EffectBlur(),
    new EffectNoise(),
    new EffectInvert(),
    new EffectGrayscale(),
    new EffectSharpen(),
    new EffectSimpleBlur()
  ];

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
