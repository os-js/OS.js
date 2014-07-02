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
(function(Application, Window, GUI, Dialogs) {

  /////////////////////////////////////////////////////////////////////////////
  // TOOLS
  /////////////////////////////////////////////////////////////////////////////

  var Tool = function(name, title, icon, txt, tmp) {
    this.name = name;
    this.title = title;
    this.icon = icon;
    this.style = null;
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
    Tool.call(this, "pointer", "Pointer", "stock-cursor", "");
  };
  ToolPointer.prototype = Object.create(Tool.prototype);

  /**
   * Tool: Picker
   */
  var ToolPicker = function() {
    Tool.call(this, "picker", "Picker", "stock-color-pick-from-screen", "LMB: set fg color, RMB: set gb color");
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
        hex = OSjs.Utils.RGBtoHEX(rgb);
      } catch ( e ) {
        console.warn("Failed to convert to hex", rgb, e);
      }

      if ( OSjs.Utils.mouseButton(ev) == "left" ) {
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
    Tool.call(this, "bucket", "Bucket", "stock-tool-bucket-fill", "LMB: fill with fg color, RMB: fill with bg color");
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
    Tool.call(this, "pencil", "Pencil", "stock-tool-pencil", "LMB: draw with fg color, RMB: draw with bg color");
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
    Tool.call(this, "path", "Path", "stock-tool-path", "LMB: draw with fg color, RMB: draw with bg color", true);
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
   * Tool: Rectangle
   */
  var ToolRectangle = function() {
    Tool.call(this, "rectangle", "Rectangle", "stock-shape-rectangle", "LMB: draw with fg color, RMB: draw with bg color", true);
  };
  ToolRectangle.prototype = Object.create(Tool.prototype);

  ToolRectangle.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;
    if ( !this.tmpContext ) { return; }

    var x = Math.min(currentPos[0], startPos[0]);
    var y = Math.min(currentPos[1], startPos[1]);
    var w = Math.abs(currentPos[0] - startPos[0]);
    var h = Math.abs(currentPos[1] - startPos[1]);

    this.tmpContext.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);
    if ( w && h ) {
      if ( this.style.enableStroke ) {
        this.tmpContext.strokeRect(x, y, w, h);
      }
      this.tmpContext.fillRect(x, y, w, h);
    }
  };

  /**
   * Tool: Square
   */
  var ToolSquare = function() {
    Tool.call(this, "square", "Square", "stock-shape-square", "LMB: draw with fg color, RMB: draw with bg color", true);
  };
  ToolSquare.prototype = Object.create(Tool.prototype);

  ToolSquare.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;
    if ( !this.tmpContext ) { return; }

    var x = startPos[0]; //Math.min(currentPos[0], startPos[0]);
    var y = startPos[1]; //Math.min(currentPos[1], startPos[1]);
    var w = Math.abs(currentPos[0] - startPos[0]) * (currentPos[0] < startPos[0] ? -1 : 1);
    var h = Math.abs(w) * (currentPos[1] < startPos[1] ? -1 : 1);

    this.tmpContext.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);
    if ( w && h ) {
      if ( this.style.enableStroke ) {
        this.tmpContext.strokeRect(x, y, w, h);
      }
      this.tmpContext.fillRect(x, y, w, h);
    }
  };

  /**
   * Tool: Ellipse
   */
  var ToolEllipse = function() {
    Tool.call(this, "ellipse", "Ellipse", "stock-shape-ellipse", "LMB: draw with fg color, RMB: draw with bg color", true);
  };
  ToolEllipse.prototype = Object.create(Tool.prototype);

  ToolEllipse.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;
    if ( !this.tmpContext ) { return; }

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
  };

  /**
   * Tool: Circle
   */
  var ToolCircle = function() {
    Tool.call(this, "circle", "Circle", "stock-shape-circle", "LMB: draw with fg color, RMB: draw with bg color", true);
  };
  ToolCircle.prototype = Object.create(Tool.prototype);

  ToolCircle.prototype.ondraw = function(ev, win, image, layer, currentPos, startPos) {
    var context = layer.context;
    if ( !this.tmpContext ) { return; }

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

  Image.prototype.createLayer = function(name, sx, sy, setActive) {
    sx = sx || this.size[0];
    sy = sy || this.size[1];

    var layer = new Layer(name, sx, sy);
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
    this.activeLayer = layer;
  };

  Image.prototype.getActiveLayer = function() {
    return this.activeLayer;
  };

  Image.prototype.setName = function(name) {
    this.name = name;
  };

  Image.prototype.setData = function(img) {
    if ( (img instanceof Image) || (img instanceof HTMLImageElement) ) {
      this.clear();

      var layer = this.createLayer("Default", 0, 0, true);
      layer.setData(img);
      return true;
    }
    return false;
  };

  Image.prototype.getData = function() {
    var data;
    // FIXME: Merge layers
    for ( var i = 0; i < this.layers.length; i++ ) {
      if ( this.layers[i] ) {
        data = this.layers[i].getData(this.filetype);
      }
    }
    return data;
  };

  Image.prototype.getContainer = function() {
    return this.$container;
  };

  /////////////////////////////////////////////////////////////////////////////
  // LAYER
  /////////////////////////////////////////////////////////////////////////////

  var Layer = function(name, w, h) {
    this.name = name;
    this.width = w || 0;
    this.height = h || 0;
    this.canvas = document.createElement("canvas");
    this.canvas.width = w;
    this.canvas.height = h;
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

  Layer.prototype.resize = function() {
    // TODO
  };

  Layer.prototype.move = function() {
    // TODO
  };

  Layer.prototype.effect = function() {
    // TODO
  };

  Layer.prototype.clear = function(color) {
    // TODO
  };

  Layer.prototype.getData = function(type) {
    if ( this.canvas ) {
      return this.canvas.toDataURL(type);
    }
    return null;
  };

  Layer.prototype.setData = function(img, x, y) {
    if ( this.context ) {
      this.clear();

      this.context.drawImage(img, x||0, y||0);
      return true;
    }
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationDrawLibs = {
    Tools: [
      new ToolPointer(),
      new ToolPicker(),
      new ToolBucket(),
      new ToolPencil(),
      new ToolPath(),
      new ToolRectangle(),
      new ToolSquare(),
      new ToolEllipse(),
      new ToolCircle()
    ],
    Effects: {
      blur: {
        name: "Blur",
        func: function(canvas, context) {
          OSjs.Applications.ApplicationDrawEffects.Blur(canvas, context);
        }
      }
    },
    Image: Image,
    Layer: Layer
  };

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs);
