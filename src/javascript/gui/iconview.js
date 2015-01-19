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
(function(GUIElement, _DataView) {
  'use strict';

  /**
   * Icon View Element
   *
   * reserved item (data) keys:
   *  label = What to show as title
   *  icon = Path to icon
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @option opts String    iconSize      Icon Size (default=32x32)
   * @option opts boolean   singleClick   Single click to Activate (dblclick) forced on touch devices
   * @option opts Function  onRenderItem  Callback on item rendered
   *
   * @see OSjs.Core.GUIElement
   * @api OSjs.GUI.IconView
   *
   * @extends _DataView
   * @class
   */
  var IconView = function(name, opts) {
    opts = opts || {};

    this.$ul          = null;
    this.iconSize     = opts.size || '32x32';
    this.singleClick  = typeof opts.singleClick === 'undefined' ? false : (opts.singleClick === true);
    this.onRenderItem = opts.onRenderItem   || function(el, iter) {};

    if ( OSjs.Compability.touch ) {
      this.singleClick = true;
    }

    _DataView.apply(this, ['IconView', name, opts]);
  };

  IconView.prototype = Object.create(_DataView.prototype);

  IconView.prototype.init = function() {
    var self      = this;
    var el        = _DataView.prototype.init.apply(this, ['GUIIconView']);
    var view      = this.$view;
    el.className += ' IconSize' + this.iconSize;

    this.$ul    = document.createElement('ul');
    this._addEventListener(view, 'click', function(ev) {
      var t = ev.target || ev.srcElement;
      if ( t && t === view ) {
        self.setSelected(null, null);
      }
    });

    view.appendChild(this.$ul);

    el.appendChild(view);

    return el;
  };

  IconView.prototype.destroy = function() {
    _DataView.prototype.destroy.apply(this, arguments);
    this.$ul = null;
  };

  IconView.prototype._onRender = function() {
    OSjs.Utils.$empty(this.$ul);
  };

  IconView.prototype._render = function() {
    var self = this;

    function _createImage(i) {
      return OSjs.API.getThemeResource(i, 'icon');
    }

    function _bindEvents(li, iter, singleClick) {
      self._addEventListener(li, 'contextmenu', function(ev) {
        ev.stopPropagation(); // Or else eventual ContextMenu is blurred
        ev.preventDefault();

        self._onContextMenu(ev, iter);
      });

      if ( singleClick ) {
        self._addEventListener(li, 'click', function(ev) {
          self._onSelect(ev, iter);
          self._onActivate(ev, iter);
        });
      } else {
        self._addEventListener(li, 'click', function(ev) {
          self._onSelect(ev, iter);
        });
        self._addEventListener(li, 'dblclick', function(ev) {
          self._onActivate(ev, iter);
        });
      }
    }

    this.data.forEach(function(iter, i) {
      var imgContainer = null;
      var img;

      var li = document.createElement('li');
      li.setAttribute('data-index', i);

      Object.keys(iter).forEach(function(k) {
        if ( !OSjs.Utils.inArray(['title', 'icon'], k) ) {
          li.setAttribute('data-' + k, iter[k]);
        }
      });

      if ( iter.icon ) {
        imgContainer = document.createElement('div');
        img = document.createElement('img');
        img.alt = ''; //iter.label || '';
        img.title = ''; //iter.label || '';
        img.src = _createImage(iter.icon);
        imgContainer.appendChild(img);
      }

      var lblContainer = document.createElement('div');
      var lbl = document.createElement('span');
      lbl.appendChild(document.createTextNode(iter.label));
      lblContainer.appendChild(lbl);

      _bindEvents(li, iter, self.singleClick);

      if ( imgContainer ) {
        li.appendChild(imgContainer);
      }
      li.appendChild(lblContainer);

      self.$ul.appendChild(li);

      self.onCreateItem(li, iter);
      self.onRenderItem(li, iter);

      self.data[i]._element = li;
      self.data[i]._index   = i;
    });

  };

  /**
   * Render the icons inside the view
   *
   * @return void
   * @see _DataView::render()
   * @method IconView::render()
   */
  IconView.prototype.render = function(data, reset) {
    if ( !_DataView.prototype.render.call(this, data, reset) ) {
      return;
    }
    this._render();
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.IconView     = IconView;

})(OSjs.Core.GUIElement, OSjs.GUI._DataView);
