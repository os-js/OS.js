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

(function(Application, Window, Utils, VFS, GUI, API) {
  'use strict';

  /**
   * @namespace Broadway
   * @memberof OSjs
   */

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Broadway Window
   *
   * @param {Number}  id      Window ID
   * @param {Number}  x       X Position
   * @param {Number}  y       Y Position
   * @param {Number}  w       Width
   * @param {Number}  h       Height
   * @param {Node}    canvas  Canvas DOM Node
   *
   * @abstract
   * @constructor
   * @memberof OSjs.Broadway
   * @extends OSjs.Core.Window
   */
  function BroadwayWindow(id, x, y, w, h, canvas) {
    Window.apply(this, ['BroadwayWindow' + String(id), {
      width: w,
      height: h,
      title: 'Broadway Window ' + String(id),
      min_width: 100,
      min_height: 100,
      allow_resize: false,
      allow_minimize: false,
      allow_maximize: false,
      allow_session: false,
      //allow_close: false,
      key_capture: true // IMPORTANT
    }]);

    this._broadwayId = id;
    this._canvas = canvas;
  }

  BroadwayWindow.prototype = Object.create(Window.prototype);

  BroadwayWindow.prototype.init = function() {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    this._canvas.width = this._dimension.w;
    this._canvas.height = this._dimension.h;

    function getMousePos(ev) {
      var wm = OSjs.Core.getWindowManager();
      var theme = wm ? wm.getStyleTheme(true) : null;
      var topMargin = theme ? (theme.style.window.margin) : 26;

      return {
        x: ev.pageX - self._position.x,
        y: ev.pageY - self._position.y - topMargin
      };
    }

    function inject(type, ev) {
      var pos = getMousePos(ev);
      return OSjs.Broadway.GTK.inject(self._broadwayId, type, ev, {
        wx: self._position.x,
        wy: self._position.y,
        mx: parseInt(pos.x, 0),
        my: parseInt(pos.y, 0)
      });
    }

    Utils.$bind(root, 'mouseover', function(ev) {
      return inject('mouseover', ev);
    });
    Utils.$bind(root, 'mouseout', function(ev) {
      return inject('mouseout', ev);
    });
    Utils.$bind(root, 'mousemove', function(ev) {
      return inject('mousemove', ev);
    });
    Utils.$bind(root, 'mousedown', function(ev) {
      return inject('mousedown', ev);
    });
    Utils.$bind(root, 'mouseup', function(ev) {
      return inject('mouseup', ev);
    });
    Utils.$bind(root, 'DOMMouseScroll', function(ev) {
      return inject('mousewheel', ev);
    });
    Utils.$bind(root, 'mousewheel', function(ev) {
      return inject('mousewheel', ev);
    });

    root.appendChild(this._canvas);
    return root;
  };

  BroadwayWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
    this._canvas = null;
  };

  BroadwayWindow.prototype._inited = function() {
    Window.prototype._inited.apply(this, arguments);

    this._onChange('move', true);
  };

  BroadwayWindow.prototype._close = function() {
    if ( !Window.prototype._close.apply(this, arguments) ) {
      return false;
    }

    OSjs.Broadway.GTK.close(this._broadwayId);

    return true;
  };

  BroadwayWindow.prototype._resize = function(w, h) {
    if ( !Window.prototype._resize.apply(this, [w, h, true]) ) {
      return false;
    }

    function resizeCanvas(canvas, w, h) {
      var tmpCanvas = canvas.ownerDocument.createElement('canvas');
      tmpCanvas.width = canvas.width;
      tmpCanvas.height = canvas.height;
      var tmpContext = tmpCanvas.getContext('2d');
      tmpContext.globalCompositeOperation = 'copy';
      tmpContext.drawImage(canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);

      canvas.width = w;
      canvas.height = h;

      var context = canvas.getContext('2d');

      context.globalCompositeOperation = 'copy';
      context.drawImage(tmpCanvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
    }

    if ( this._canvas ) {
      resizeCanvas(this._canvas, w, h);
    }

    return true;
  };

  BroadwayWindow.prototype._onKeyEvent = function(ev, type) {
    OSjs.Broadway.GTK.inject(this._broadwayId, type, ev);
  };

  BroadwayWindow.prototype._onChange = function(ev, byUser) {
    if ( !byUser ) {
      return;
    }

    if ( ev === 'move' ) {
      OSjs.Broadway.GTK.move(this._broadwayId, this._position.x, this._position.y);
    } else if ( ev === 'resize' ) {
      OSjs.Broadway.GTK.resize(this._broadwayId, this._dimension.w, this._dimension.h);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Broadway.Window = BroadwayWindow;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.GUI, OSjs.API);
