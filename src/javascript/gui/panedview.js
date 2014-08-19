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
(function(GUIElement) {
  "use strict";

  /**
   * PanedView
   * FIXME: PanedView - When more than two Views manual CSS is required
   * FIXME: PanedView - Vertical orientation (direction)
   *
   * options: (See GUIElement for more)
   *  orientation     String        Orientation (Default = horizontal)
   */
  var PanedView = function(name, opts) {
    opts            = opts            || {};
    opts.direction  = (opts.direction || opts.orientation)  || 'horizontal';

    this.$container = null;
    this.$separator = null;

    GUIElement.apply(this, [name, opts]);
  };
  PanedView.prototype = Object.create(GUIElement.prototype);

  PanedView.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIPanedView']);
    var type = this.opts.direction === 'horizontal' ? 'Horizontal' : 'Vertical';
    OSjs.Utils.$addClass(el, OSjs.Utils.$safeName(type));

    this.$container = document.createElement('ul');
    el.appendChild(this.$container);
    return el;
  };

  PanedView.prototype.update = function() {
    GUIElement.prototype.update.apply(this, arguments);

  };

  PanedView.prototype.createView = function(name) {
    var startW = 0;
    var startX = 0;
    var idx;
    var column;

    function onResizeMove(ev) {
      var newW = startW + (ev.clientX - startX);
      column.style.width = newW + 'px';
    }

    function onResizeEnd(ev) {
      document.removeEventListener('mouseup',   onResizeEnd,  false);
      document.removeEventListener('mousemove', onResizeMove, false);
    }

    function onResizeStart(ev, col) {
      startX = ev.clientX;
      startW = column.offsetWidth;

      document.addEventListener('mouseup',    onResizeEnd,  false);
      document.addEventListener('mousemove',  onResizeMove, false);
    }

    if ( this.$container.childNodes.length % 2 ) {
      var separator = document.createElement('li');
      separator.className = 'Separator';

      idx    = this.$container.childNodes.length - 1;
      column = this.$container.childNodes[idx];

      this._addEventListener(separator, 'mousedown', function(ev) {
        ev.preventDefault();
        return onResizeStart(ev);
      });

      this.$container.appendChild(separator);
      this.$separator = separator;
    }

    var container = document.createElement('li');
    container.className = 'View ' + name;
    this.$container.appendChild(container);
    return container;
  };

  PanedView.prototype.addItem = function(el, name) {
    var container = this.createView(name);

    if ( el ) {
      if ( el instanceof GUIElement ) {
        container.appendChild(el.getRoot());
      } else {
        container.appendChild(el);
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.PanedView    = PanedView;

})(OSjs.GUI.GUIElement);
