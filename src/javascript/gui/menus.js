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

  var lastMenu;

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function blurMenu() {
    if ( !lastMenu ) { return; }
    lastMenu();
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Elements['gui-menu'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'select' ) {
        evName = '_select';
      }
      el.querySelectorAll('gui-menu-entry > span').forEach(function(target) {
        Utils.$bind(target.parentNode, evName, callback.bind(new OSjs.GUI.Element(el)), params);
      });
    },
    build: function(el, customMenu, winRef) {
      function bindSelectionEvent(child, idx, expand) {
        var id = child.getAttribute('data-id');
        Utils.$bind(child, 'mousedown', function(ev) {
          ev.stopPropagation();
          child.dispatchEvent(new CustomEvent('_select', {detail: {index: idx, id: id}}));
          blurMenu();
        }, false);
      }

      function runChildren(pel, level) {
        var children = pel.children;
        var child, span, label, expand, icon;

        for ( var i = 0; i < children.length; i++ ) {
          child = children[i];
          expand = false;

          if ( child && child.tagName.toLowerCase() === 'gui-menu-entry') {
            if ( child.children && child.children.length ) {
              Utils.$addClass(child, 'gui-menu-expand');
              expand = true;
            }
            label = OSjs.GUI.Helpers.getLabel(child);
            icon = OSjs.GUI.Helpers.getIcon(child, winRef);

            span = document.createElement('span');
            span.appendChild(document.createTextNode(label));
            if ( icon ) {
              child.style.backgroundImage = 'url(' + icon + ')';
              Utils.$addClass(span, 'gui-has-image');
            }
            child.appendChild(span);

            bindSelectionEvent(child, i, expand);

            if ( customMenu ) {
              var sub = child.querySelector('gui-menu');
              if ( sub ) {
                runChildren(sub, level + 1);
              }
            }
          }
        }
      }

      runChildren(el, 0);
    }
  };

  OSjs.GUI.Elements['gui-menu-bar'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'select' ) {
        evName = '_select';
      }
      el.querySelectorAll('gui-menu-bar-entry').forEach(function(target) {
        Utils.$bind(target, evName, callback.bind(new OSjs.GUI.Element(el)), params);
      });
    },
    build: function(el) {
      el.querySelectorAll('gui-menu-bar-entry').forEach(function(mel, idx) {
        var label = OSjs.GUI.Helpers.getLabel(mel);
        var id = mel.getAttribute('data-id');

        var span = document.createElement('span');
        span.appendChild(document.createTextNode(label));

        mel.insertBefore(span, mel.firstChild);

        var submenu = mel.querySelector('gui-menu');
        if ( submenu ) {
          Utils.$bind(mel, 'click', function(ev) {
            lastMenu = function() {
              Utils.$removeClass(mel, 'gui-active');
            };

            if ( Utils.$hasClass(mel, 'gui-active') ) {
              Utils.$removeClass(mel, 'gui-active');
            } else {
              Utils.$addClass(mel, 'gui-active');

              mel.dispatchEvent(new CustomEvent('_select', {detail: {index: idx, id: id}}));
            }
          }, false);
        }

      });
    }
  };

  OSjs.API.blurMenu = blurMenu;
  OSjs.API.createMenu = function(items, ev, customInstance) {
    items = items || [];

    blurMenu();

    var root = OSjs.GUI.Helpers.createElement('gui-menu', {});
    function resolveItems(arr, par) {
      arr.forEach(function(iter) {
        var entry = OSjs.GUI.Helpers.createElement('gui-menu-entry', {label: iter.title, icon: iter.icon});
        if ( iter.menu ) {
          var nroot = OSjs.GUI.Helpers.createElement('gui-menu', {});
          resolveItems(iter.menu, nroot);
          entry.appendChild(nroot);
        }
        if ( iter.onClick ) {
          Utils.$bind(entry, 'mousedown', function(ev) {
            ev.stopPropagation();
            iter.onClick.apply(this, arguments);

            blurMenu();
          }, false);
        }
        par.appendChild(entry);
      });
    }

    resolveItems(items || [], root);
    OSjs.GUI.Elements['gui-menu'].build(root, true);

    var x = typeof ev.clientX === 'undefined' ? ev.x : ev.clientX;
    var y = typeof ev.clientY === 'undefined' ? ev.y : ev.clientY;

    Utils.$addClass(root, 'gui-root-menu');
    root.style.left = x + 'px';
    root.style.top  = y + 'px';
    document.body.appendChild(root);

    // Make sure it stays within viewport
    setTimeout(function() {
      var pos = Utils.$position(root);
      if ( pos.right > window.innerWidth ) {
        var newLeft = Math.round(window.innerWidth - pos.width - 10)
        root.style.left = newLeft + 'px';
      }
      if ( pos.bottom > window.innerHeigth ) {
        var newTop = Math.round(window.innerHeight - pos.height - 10);
        root.style.top = newTop + 'px';
      }
    }, 1);

    lastMenu = function() {
      Utils.$remove(root);
    };
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS);
