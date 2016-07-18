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

    API.triggerHook('onBlurMenu');
  }

  function bindIngores(el) {
    Utils.$bind(el, 'touchstart', function(ev) {
      ev.preventDefault();
    }, true);
  }

  function clickWrapper(ev, pos, onclick, original) {
    var t = ev.isTrusted ? ev.target : (ev.relatedTarget || ev.target);

    ev.preventDefault();
    if ( t && t.tagName === 'GUI-MENU-ENTRY' ) {
      var isExpander = !!t.querySelector('gui-menu');
      var hasInput = t.querySelector('input');

      if ( hasInput || isExpander ) {
        ev.stopPropagation();
      }

      onclick(ev, pos, t, original);
    }
  }

  function onEntryClick(ev, pos, target, original) {
    var isExpander = !!target.querySelector('gui-menu');

    if ( !isExpander ) {
      blurMenu(ev);

      var hasInput = target.querySelector('input');
      if ( hasInput ) {
        if ( !Utils.isIE() && window.MouseEvent ) {
          hasInput.dispatchEvent(new MouseEvent('click', {
            clientX: pos.x,
            clientY: pos.y
          }));
        } else {
          var nev = document.createEvent('MouseEvent');
          nev.initMouseEvent('click', true, true, window, 0, 0, 0, pos.x, pos.y, ev.ctrlKey, ev.altKey, ev.shiftKey, ev.metaKey, ev.button, hasInput);
        }
      }

      var id = target.getAttribute('data-id');
      var idx = Utils.$index(target);
      var dispatcher = (original || target).querySelector('label');
      dispatcher.dispatchEvent(new CustomEvent('_select', {detail: {index: idx, id: id}}));
    }
  }

  /**
   * This function makes menus pop out to the left instead of right
   *
   * Does not work for gui-menu-bar atm
   */
  function clampSubmenuPositions(r) {
    function _clamp(rm) {
      rm.querySelectorAll('gui-menu-entry').forEach(function(srm) {
        var sm = srm.querySelector('gui-menu');
        if ( sm ) {
          sm.style.left = String(-parseInt(sm.offsetWidth, 10)) + 'px';
          _clamp(sm);
        }
      });
    }

    var pos = Utils.$position(r);
    if ( pos && (window.innerWidth - pos.right) < r.offsetWidth ) {
      Utils.$addClass(r, 'gui-overflowing');
      _clamp(r);
    }

    // this class is used in caclulations (DOM needs to be visible for that)
    Utils.$addClass(r, 'gui-showing');
  }

  function runChildren(pel, level, winRef, cb) {
    level = level || 0;
    cb = cb || function() {};

    (pel.children || []).forEach(function(child, i) {
      if ( child && child.tagName.toLowerCase() === 'gui-menu-entry') {
        GUI.Elements['gui-menu-entry'].build(child, null, winRef);

        cb(child, level);
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-menu-entry'
   *
   * An entry for a menu.
   *
   * <pre><code>
   *   Events:
   *    select        When an entry was selected (click) => fn(ev)
   * <pre><code>
   *
   * @constructs OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   * @var gui-menu-entry
   */
  GUI.Elements['gui-menu-entry'] = (function() {

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

        par.setAttribute('role', 'menuitem' + type);
        par.appendChild(input);
      }
    }

    return {
      bind: function(el, evName, callback, params) {
        if ( evName === 'select' ) {
          evName = '_select';
        }

        var target = el.querySelector('gui-menu-entry > label');
        Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
      },
      build: function(child, arg, winRef) {
        if ( arguments.length < 3 ) {
          return;
        }
        child.setAttribute('role', 'menuitem' + (child.getAttribute('data-type') || ''));

        var label = GUI.Helpers.getLabel(child);
        var icon = GUI.Helpers.getIcon(child, winRef);
        child.setAttribute('aria-label', label);

        var span = document.createElement('label');
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

        if ( child.querySelector('gui-menu') ) {
          Utils.$addClass(child, 'gui-menu-expand');
          child.setAttribute('aria-haspopup', 'true');
        } else {
          child.setAttribute('aria-haspopup', 'false');
        }
      }
    };
  })();

  /**
   * Element: 'gui-menu'
   *
   * A normal menu (also contextmenu)
   *
   * <pre><code>
   *   Events:
   *    select        When an entry was selected (click) => fn(ev)
   *
   *   Setters:
   *    checked       Set checkbox/option checked value
   * </code></pre>
   *
   * @constructs OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   * @var gui-menu
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
      OSjs.GUI.Helpers.createMenu(null, ev, newNode);

      Utils.$bind(newNode, 'click', function(ev, pos) {
        clickWrapper(ev, pos, onEntryClick, el);
      }, true);
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
      el.setAttribute('role', 'menu');

      runChildren(el, 0, winRef, function(child, level) {
        if ( customMenu ) {
          var sub = child.querySelector('gui-menu');
          if ( sub ) {
            runChildren(sub, level + 1, winRef);
          }
        }
      });

      if ( !customMenu ) {
        Utils.$bind(el, 'click', function(ev, pos) {
          clickWrapper(ev, pos, onEntryClick);
        }, true);
      }
    }
  };

  /**
   * Element: 'gui-menu-bar'
   *
   * A menubar with sub-menus
   *
   * <pre><code>
   *   event     select               When an entry was selected (click) => fn(ev)
   * </code></pre>
   *
   * @constructs OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   * @var gui-menu-bar
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
        if ( sm && sm.children ) {
          var children = sm.children;
          var child;
          for ( var i = 0; i < children.length; i++ ) {
            child = children[i];
            if ( child.tagName === 'GUI-MENU-ENTRY' ) {
              child.setAttribute('aria-haspopup', String(!!child.firstChild));
              updateChildren(child.firstChild, level + 1);
            }
          }
        }
      }

      function _onClick(ev, mel) {
        blurMenu();

        ev.preventDefault();
        ev.stopPropagation();

        var submenu = mel.querySelector('gui-menu');
        var id = mel.getAttribute('data-id');
        var idx = parseInt(mel.getAttribute('data-index'), 10);

        mel.querySelectorAll('gui-menu-entry').forEach(function(c) {
          Utils.$removeClass(c, 'gui-hover');
        });

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
      }

      el.querySelectorAll('gui-menu-bar-entry').forEach(function(mel, idx) {
        var label = GUI.Helpers.getLabel(mel);

        var span = document.createElement('span');
        span.appendChild(document.createTextNode(label));

        mel.setAttribute('role', 'menuitem');

        mel.insertBefore(span, mel.firstChild);

        var submenu = mel.querySelector('gui-menu');

        clampSubmenuPositions(submenu);

        mel.setAttribute('aria-haspopup', String(!!submenu));
        mel.setAttribute('data-index', String(idx));

        updateChildren(submenu, 2);
      });

      Utils.$bind(el, 'click', function(ev) {
        var t = ev.isTrusted ? ev.target : (ev.relatedTarget || ev.target);
        if ( t && t.tagName === 'GUI-MENU-BAR-ENTRY' ) {
          _onClick(ev, t);
        }
      }, true);

      bindIngores(el);
    }
  };

  /**
   * Blur the currently open menu (aka hiding)
   *
   * @function blurMenu
   * @memberof OSjs.GUI.Helpers
   */
  OSjs.GUI.Helpers.blurMenu = blurMenu;

  /**
   * Create and show a new menu
   *
   * @example
   * createMenu([
   *    {
   *      title: "Title",
   *      icon: "Icon",
   *      onClick: function() {}, // Callback
   *      items: [] // Recurse :)
   *    }
   * ])
   *
   * @param   {Array}                items             Array of items
   * @param   {(Event|Object)}       ev                DOM Event or dict with x/y
   * @param   {Mixed}                [customInstance]  Show a custom created menu
   *
   * @function createMenu
   * @memberof OSjs.GUI.Helpers
   */
  OSjs.GUI.Helpers.createMenu = function(items, ev, customInstance) {
    items = items || [];
    blurMenu();

    var root = customInstance;
    var callbackMap = [];

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
          var index = callbackMap.push(iter.onClick);
          entry.setAttribute('data-callback-id', String(index - 1));
        }
        par.appendChild(entry);
      });
    }

    if ( !root ) {
      root = GUI.Helpers.createElement('gui-menu', {});
      resolveItems(items || [], root);
      GUI.Elements['gui-menu'].build(root, true);

      Utils.$bind(root, 'click', function(ev, pos) {
        clickWrapper(ev, pos, function(ev, pos, t) {
          var index = parseInt(t.getAttribute('data-callback-id'), 10);
          if ( callbackMap[index] ) {
            callbackMap[index](ev, pos);

            blurMenu(ev); // !last!
          }
        });
      }, true);

      bindIngores(root);
    }

    if ( root.$element ) {
      root = root.$element;
    }

    var wm = OSjs.Core.getWindowManager();
    var space = wm.getWindowSpace(true);
    var pos = Utils.mousePosition(ev);

    Utils.$addClass(root, 'gui-root-menu');
    root.style.left = pos.x + 'px';
    root.style.top  = pos.y + 'px';
    document.body.appendChild(root);

    // Make sure it stays within viewport
    setTimeout(function() {
      var pos = Utils.$position(root);
      if ( pos ) {
        if ( pos.right > space.width ) {
          var newLeft = Math.round(space.width - pos.width);
          root.style.left = Math.max(0, newLeft) + 'px';
        }
        if ( pos.bottom > space.height ) {
          var newTop = Math.round(space.height - pos.height);
          root.style.top = Math.max(0, newTop) + 'px';
        }
      }

      clampSubmenuPositions(root);
    }, 1);

    lastMenu = function() {
      callbackMap = null;
      if ( root ) {
        root.querySelectorAll('gui-menu-entry').forEach(function(el) {
          Utils.$unbind(el);
        });
        Utils.$unbind(root);
      }
      root = Utils.$remove(root);
    };
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
