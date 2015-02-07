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
(function(GUIElement, Utils) {
  'use strict';

  /**
   * PanedView
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @option  opts    String  orientation     The Orientation (Default=horizontal)
   *
   * @api OSjs.GUI.PanedView
   * @see OSjs.Core.GUIElement
   *
   * @extends GUIElement
   * @class
   */
  var PanedView = function(name, opts) {
    opts            = opts            || {};
    opts.direction  = (opts.direction || opts.orientation)  || 'horizontal';

    this.viewcount   = 0;
    this.views       = {};
    this.$container  = null;

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
    if ( this.inited ) { return; }
    GUIElement.prototype.update.apply(this, arguments);

    var self  = this;
    var views = this.views;
    var count = this.viewcount;
    var dir   = this.opts.direction;

    function setCSS(el, flex, width, height) {
      var par = width || height || 'auto';
      var css = Utils.format('{0} {1} {2}', flex, flex, par);
      el.style['webkitFlex'] = css;
      el.style['mozFlex'] = css;
      el.style['msFlex'] = css;
      el.style['oFlex'] = css;
      el.style['flex'] = css;
    }

    function createResizer(v, idx, sep) {
      var startSize = 0;
      var startMPos = 0;
      var el        = self.$container.childNodes[idx-2];

      function onResizeMove(ev) {
        if ( dir === 'horizontal' ) {
          var newW = startSize + (ev.clientX - startMPos);
          setCSS(el, 0, newW + 'px', null);
        } else {
          var newH = startSize + (ev.clientY - startMPos);
          setCSS(el, 0, null, newH + 'px');
        }
      }

      function onResizeEnd(ev) {
        document.removeEventListener('mouseup',   onResizeEnd,  false);
        document.removeEventListener('mousemove', onResizeMove, false);
      }

      function onResizeStart(ev) {
        startMPos = dir === 'horizontal' ? ev.clientX : ev.clientY;
        startSize = dir === 'horizontal' ? el.offsetWidth : el.offsetHeight;

        document.addEventListener('mouseup',    onResizeEnd,  false);
        document.addEventListener('mousemove',  onResizeMove, false);
      }

      if ( el && sep ) {
        self._addEventListener(sep, 'mousedown', function(ev) {
          ev.preventDefault();
          return onResizeStart(ev);
        });
      }
    }

    var viewk = Object.keys(views);
    viewk.forEach(function(name) {
      var v = views[name];
      var el = v._element;
      var sep = v._separator;
      var idx = Utils.$index(el);

      var initialWidth = typeof v.width === 'undefined' ? ((100 / viewk.length).toString() + '%') : (v.width.toString() + 'px');
      var flex = idx === 0 ? 0 : 1;
      if ( count > 2 ) {
        flex = 1;
      }

      setCSS(el, flex, initialWidth);

      createResizer(v, idx, sep);
    });
  };

  PanedView.prototype.destroy = function() {
    this.$container = null;
    this.views      = {};
    return GUIElement.prototype.destroy.apply(this, arguments);
  };

  /**
   * Create a view inside the Pane
   *
   * @param   String      name      View Name (unique)
   * @param   Object      otps      View Options
   *
   * @option  opts    int   width     View width
   *
   * @return  DOMElement    The container
   *
   * @method  PanedView::createView()
   */
  PanedView.prototype.createView = function(name, opts) {
    opts = opts || {};

    var separator = null;
    var container = document.createElement('li');
    container.className = 'View ' + name;

    if ( this.$container.childNodes.length % 2 ) {
      separator = document.createElement('li');
      separator.className = 'Separator';
      this.$container.appendChild(separator);
    }

    this.$container.appendChild(container);
    this.views[name] = opts;
    this.views[name]._element = container;
    this.views[name]._separator = separator;
    this.viewcount++;
    return container;
  };

  /**
   * Adds a GUIElement or DOMElement to the given Pane
   *
   * This also creates the pane
   *
   * @param   Mixed     el      The element
   * @param   String    name    View name
   *
   * @return  void
   *
   * @method  PanedView::addItem()
   */
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

})(OSjs.Core.GUIElement, OSjs.Utils);
