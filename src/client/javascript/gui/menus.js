/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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

  var lastMenu;

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function blurMenu(ev) {
    if ( lastMenu ) {
      lastMenu(ev);
    }
    lastMenu = null;
  }

  function bindSelectionEvent(child, span, idx, expand, dispatcher) {
    dispatcher = dispatcher || span;

    var id = child.getAttribute('data-id');
    var hasInput = child.querySelector('input');

    Utils.$bind(child, 'mousedown', function(ev) {
      var target = ev.target || ev.srcElement;
      var isExpander = (target.tagName.toLowerCase() === 'gui-menu-entry' && Utils.$hasClass(target, 'gui-menu-expand'));
      var stopProp = hasInput || isExpander;

      if ( hasInput ) {
        ev.preventDefault();
        hasInput.dispatchEvent(new MouseEvent('click'));
      }
      dispatcher.dispatchEvent(new CustomEvent('_select', {detail: {index: idx, id: id}}));

      if ( stopProp ) {
        ev.stopPropagation();
      }

      if ( !isExpander ) {
        blurMenu(ev);
      }
    }, false);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-menu'
   *
   * A normal menu (also contextmenu)
   *
   * Events:
   *  select        When an entry was selected (click) => fn(ev)
   *
   * Setters:
   *  checked       Set checkbox/option checked value
   *
   * @api OSjs.GUI.Elements.gui-menu
   * @class
   */
  GUI.Elements['gui-menu'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'select' ) {
        evName = '_select';
      }
      el.querySelectorAll('gui-menu-entry > label').forEach(function(target) {
        Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
      });
    },
    show: function(ev) {
      ev.stopPropagation();
      ev.preventDefault();

      // This is to use a menu-bar > menu as a contextmenu
      var newNode = this.$element.cloneNode(true);
      var el = this.$element;
      newNode.querySelectorAll('gui-menu-entry > label').forEach(function(label) {
        var expand = label.children.length > 0;
        var i = Utils.$index(label.parentNode);
        bindSelectionEvent(label.parentNode, label, i, expand, el.querySelector('label'));
      });
      OSjs.API.createMenu(null, ev, newNode);
    },
    set: function(el, param, value, arg) {
      if ( param === 'checked' ) {
        var found = el.querySelector('gui-menu-entry[data-id="' + value + '"]');
        if ( found ) {
          var input = found.querySelector('input');
          if ( input ) {
            if ( arg ) {
              input.setAttribute('checked', 'checked');
            } else {
              input.removeAttribute('checked');
            }
          }
        }
        return true;
      }
      return false;
    },
    build: function(el, customMenu, winRef) {

      var isMenuBarChild =  el.parentNode ? el.parentNode.tagName === 'GUI-MENU-BAR-ENTRY' : false;

      function createTyped(child, par) {
        var type = child.getAttribute('data-type');
        var value = child.getAttribute('data-checked') === 'true';
        var input = null;
        if ( type ) {
          var group = child.getAttribute('data-group');
          input = document.createElement('input');
          input.type = type;
          input.name = group ? group + '[]' : '';
          if ( value ) {
            input.setAttribute('checked', 'checked');
          }
          input.addEventListener('click', function(ev) {
            blurMenu();
          }, true);

          par.setAttribute('role', 'menuitem' + type);
          par.appendChild(input);
        }
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

              child.setAttribute('aria-haspopup', 'true');
            } else {
              child.setAttribute('aria-haspopup', 'false');
            }

            var vlevel = level + 1;
            if ( isMenuBarChild ) {
              vlevel++;
            }

            child.setAttribute('aria-level', String(vlevel));
            child.setAttribute('role', 'menuitem' + (child.getAttribute('data-type') || ''));

            label = GUI.Helpers.getLabel(child);
            icon = GUI.Helpers.getIcon(child, winRef);
            child.setAttribute('aria-label', label);

            span = document.createElement('label');
            if ( icon ) {
              child.style.backgroundImage = 'url(' + icon + ')';
              Utils.$addClass(span, 'gui-has-image');
            }
            child.appendChild(span);

            createTyped(child, span);

            if ( child.getAttribute('data-labelhtml') === 'true' ) {
              span.innerHTML = label;
            } else {
              span.appendChild(document.createTextNode(label));
            }

            bindSelectionEvent(child, span, i, expand);

            if ( customMenu ) {
              var sub = child.querySelector('gui-menu');
              if ( sub ) {
                runChildren(sub, level + 1);
              }
            }
          }
        }
      }

      el.setAttribute('role', 'menu');

      runChildren(el, 0);
    }
  };

  /**
   * Element: 'gui-menu-bar'
   *
   * A menubar with sub-menus
   *
   * Events:
   *  select        When an entry was selected (click) => fn(ev)
   *
   * @api OSjs.GUI.Elements.gui-menu-bar
   * @class
   */
  GUI.Elements['gui-menu-bar'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'select' ) {
        evName = '_select';
      }
      el.querySelectorAll('gui-menu-bar-entry').forEach(function(target) {
        Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
      });
    },
    build: function(el) {
      el.setAttribute('role', 'menubar');

      function updateChildren(sm, level) {
        if ( !sm ) {
          return;
        }

        var children = sm.children;
        var child;

        for ( var i = 0; i < children.length; i++ ) {
          child = children[i];
          if ( child.tagName === 'GUI-MENU-ENTRY' ) {

            child.setAttribute('aria-haspopup', String(!!child.firstChild));
            child.setAttribute('aria-level', String(level));
            updateChildren(child.firstChild, level + 1);
          }
        }
      }

      el.querySelectorAll('gui-menu-bar-entry').forEach(function(mel, idx) {
        var label = GUI.Helpers.getLabel(mel);
        var id = mel.getAttribute('data-id');

        var span = document.createElement('span');
        span.appendChild(document.createTextNode(label));

        mel.setAttribute('role', 'menuitem');
        mel.setAttribute('aria-level', '1');

        mel.insertBefore(span, mel.firstChild);

        var submenu = mel.querySelector('gui-menu');
        mel.setAttribute('aria-haspopup', String(!!submenu));
        updateChildren(submenu, 2);

        Utils.$bind(mel, 'mousedown', function(ev) {
          blurMenu();

          ev.preventDefault();
          ev.stopPropagation();

          if ( submenu ) {
            lastMenu = function(ev) {
              if ( ev ) {
                ev.stopPropagation();
              }
              Utils.$removeClass(mel, 'gui-active');
            };
          }

          if ( Utils.$hasClass(mel, 'gui-active') ) {
            if ( submenu ) {
              Utils.$removeClass(mel, 'gui-active');
            }
          } else {
            if ( submenu ) {
              Utils.$addClass(mel, 'gui-active');
            }

            mel.dispatchEvent(new CustomEvent('_select', {detail: {index: idx, id: id}}));
          }
        }, false);

      });
    }
  };

  /**
   * Blur the currently open menu (aka hiding)
   *
   * @return void
   * @api OSjs.API.blurMenu()
   */
  OSjs.API.blurMenu = blurMenu;

  /**
   * Create and show a new menu
   *
   * Format:
   * [
   *  {
   *    title: "Title",
   *    icon: "Icon",
   *    onClick: function() {}, // Callback
   *    items: [] // Recurse :)
   *  }
   *  ...
   * ]
   *
   * @param   Array       items             Array of items
   * @param   Event       ev                DOM Event or dict with x/y
   * @param   Mixed       customInstance    Show a custom created menu
   *
   * @return void
   * @api OSjs.API.createMenu()
   */
  OSjs.API.createMenu = function(items, ev, customInstance) {
    items = items || [];
    blurMenu();

    var root = customInstance;

    function resolveItems(arr, par) {
      arr.forEach(function(iter) {
        var props = {label: iter.title, icon: iter.icon, disabled: iter.disabled, labelHTML: iter.titleHTML, type: iter.type, checked: iter.checked};
        var entry = GUI.Helpers.createElement('gui-menu-entry', props);
        if ( iter.menu ) {
          var nroot = GUI.Helpers.createElement('gui-menu', {});
          resolveItems(iter.menu, nroot);
          entry.appendChild(nroot);
        }
        if ( iter.onClick ) {
          Utils.$bind(entry, 'mousedown', function(ev) {
            ev.stopPropagation();
            iter.onClick.apply(this, arguments);
          }, false);
        }
        par.appendChild(entry);
      });
    }

    function getPosition() {
      var x = typeof ev.clientX === 'undefined' ? ev.x : ev.clientX;
      var y = typeof ev.clientY === 'undefined' ? ev.y : ev.clientY;
      if ( typeof x === 'undefined' && typeof y === 'undefined' ) {
        if ( ev.detail && typeof ev.detail.x !== 'undefined' ) {
          x = ev.detail.x;
          y = ev.detail.y;
        } else {
          var tpos = Utils.$position(ev.target);
          x = tpos.left;
          y = tpos.top;
        }
      }
      return {x: x, y: y};
    }

    if ( !root ) {
      root = GUI.Helpers.createElement('gui-menu', {});
      resolveItems(items || [], root);
      GUI.Elements['gui-menu'].build(root, true);
    }

    //if ( root instanceof GUI.Element ) {
    if ( root.$element ) {
      root = root.$element;
    }

    var wm = OSjs.Core.getWindowManager();
    var space = wm.getWindowSpace();
    var pos = getPosition();

    Utils.$addClass(root, 'gui-root-menu');
    root.style.left = pos.x + 'px';
    root.style.top  = pos.y + 'px';
    document.body.appendChild(root);

    // Make sure it stays within viewport
    setTimeout(function() {
      var pos = Utils.$position(root);
      if ( pos.right > space.width ) {
        var newLeft = Math.round(space.width - pos.width);
        root.style.left = Math.max(0, newLeft) + 'px';
      }
      if ( pos.bottom > space.height ) {
        var newTop = Math.round(space.height - pos.height);
        root.style.top = Math.max(0, newTop) + 'px';
      }
    }, 1);

    lastMenu = function() {
      Utils.$remove(root);
    };
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
