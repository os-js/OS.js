"use strict";
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
(function() {
  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};

  /**
   * Icon View Element
   *
   * reserved item (data) keys:
   *  label = What to show as title
   *  icon = Path to icon
   *
   * options: (See _DataView for more)
   *  iconSize          String          Icon Size (default = 32x32)
   *  singleClick       bool            Single click to Activate (dblclick) forced on touch devices
   */
  var IconView = function(name, opts) {
    opts = opts || {};

    this.$ul          = null;
    this.iconSize     = opts.size || '32x32';
    this.singleClick  = typeof opts.singleClick === 'undefined' ? false : (opts.singleClick === true);

    if ( OSjs.Utils.getCompability().touch ) {
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
    this._addEvent(view, 'onclick', function(ev) {
      var t = ev.target || ev.srcElement;
      if ( t && t == view ) {
        self.setSelected(null, null);
      }
    });

    view.appendChild(this.$ul);

    el.appendChild(view);

    return el;
  };

  IconView.prototype._onRender = function() {
    OSjs.Utils.$empty(this.$ul);
  };

  IconView.prototype._render = function() {
    var _createImage = function(i) {
      return OSjs.API.getThemeResource(i, 'icon');
    };

    var i, l, iter, li, imgContainer, img, lblContainer, lbl;
    var k, j;
    var self = this;
    for ( i = 0, l = this.data.length; i < l; i++ ) {
      iter = this.data[i];
      imgContainer = null;

      li = document.createElement('li');
      li.setAttribute("data-index", i);

      for ( var k in iter ) {
        if ( iter.hasOwnProperty(k) ) {
          if ( !OSjs.Utils.inArray(['title', 'icon'], k) ) {
            li.setAttribute('data-' + k, iter[k]);
          }
        }
      }

      if ( iter.icon ) {
        imgContainer = document.createElement('div');
        img = document.createElement('img');
        img.alt = ''; //iter.label || '';
        img.title = ''; //iter.label || '';
        img.src = _createImage(iter.icon);
        imgContainer.appendChild(img);
      }

      lblContainer = document.createElement('div');
      lbl = document.createElement('span');
      lbl.appendChild(document.createTextNode(iter.label));
      lblContainer.appendChild(lbl);

      // FIXME: IconView - Use local event listener adding
      li.oncontextmenu = (function(it) {
        return function(ev) {
          ev.stopPropagation(); // Or else eventual ContextMenu is blurred
          ev.preventDefault();

          self._onContextMenu(ev, it);
        };
      })(iter);

      if ( this.singleClick ) {
        li.onclick = (function(it) {
          return function(ev) {
            self._onSelect(ev, it);

            self._onActivate(ev, it);
          };
        })(iter);
      } else {
        li.onclick = (function(it) {
          return function(ev) {
            self._onSelect(ev, it);
          };
        })(iter);

        li.ondblclick = (function(it) {
          return function(ev) {
            self._onActivate(ev, it);
          };
        })(iter);
      }

      if ( imgContainer ) {
        li.appendChild(imgContainer);
      }
      li.appendChild(lblContainer);

      this.$ul.appendChild(li);

      this.onCreateItem(li, iter);

      this.data[i]._element = li;
      this.data[i]._index   = i;
    }
  };

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

})();
