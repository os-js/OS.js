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
(function(API, Utils, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-paned-view'
   *
   * A view with resizable content boxes
   *
   * @api OSjs.GUI.Elements.gui-paned-view
   * @class
   */
  GUI.Elements['gui-paned-view'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'resize' ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new UIElement(el)), params);
    },
    build: function(el) {
      function bindResizer(resizer, idx) {
        var resizeEl = resizer.previousElementSibling;
        if ( !resizeEl ) { return; }

        var startWidth = resizeEl.offsetWidth;
        var maxWidth = el.offsetWidth;

        GUI.Helpers.createDrag(resizer, function(ev) {
          startWidth = resizeEl.offsetWidth;
          maxWidth = el.offsetWidth / 2;
        }, function(ev, dx, dy) {
          var newWidth = startWidth + dx;
          if ( !isNaN(newWidth) && newWidth > 0 && newWidth < maxWidth ) {
            var flex = newWidth.toString() + 'px';
            resizeEl.style['webkitFlexBasis'] = flex;
            resizeEl.style['mozFflexBasis'] = flex;
            resizeEl.style['msFflexBasis'] = flex;
            resizeEl.style['oFlexBasis'] = flex;
            resizeEl.style['flexBasis'] = flex;
          }
        }, function(ev) {
          el.dispatchEvent(new CustomEvent('_resize', {detail: {index: idx}}));
        });

      }

      el.querySelectorAll('gui-paned-view-container').forEach(function(cel, idx) {
        if ( idx % 2 ) {
          var resizer = document.createElement('gui-paned-view-handle');
          cel.parentNode.insertBefore(resizer, cel);
          bindResizer(resizer, idx);
        }
      });
    }
  };

  GUI.Elements['gui-paned-view-container'] = {
    build: function(el) {
      GUI.Helpers.setFlexbox(el);
    }
  };

  /**
   * Element: 'gui-vbox'
   *
   * Vertical boxed layout
   *
   * @api OSjs.GUI.Elements.gui-vbox
   * @class
   */
  GUI.Elements['gui-vbox'] = {
    build: function(el) {
    }
  };

  GUI.Elements['gui-vbox-container'] = {
    build: function(el) {
      GUI.Helpers.setFlexbox(el);
    }
  };

  /**
   * Element: 'gui-hbox'
   *
   * Horizontal boxed layout
   *
   * @api OSjs.GUI.Elements.gui-hbox
   * @class
   */
  GUI.Elements['gui-hbox'] = {
    build: function(el) {
    }
  };

  GUI.Elements['gui-hbox-container'] = {
    build: function(el) {
      GUI.Helpers.setFlexbox(el);
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
