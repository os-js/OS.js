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
(function(API, Utils, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function getSelectionEventAttribs(mel, didx) {
    var id = mel.getAttribute('data-id');
    var idx = Utils.$index(mel);

    if ( !didx ) {
      idx = parseInt(mel.getAttribute('data-index'), 10);
    }

    var result = {index: idx, id: id};
    Array.prototype.slice.call(mel.attributes).forEach(function(item) {
      if ( item.name.match(/^data\-/) ) {
        var an = item.name.replace(/^data\-/, '');
        if ( typeof result[an] === 'undefined' ) {
          result[an] = item.value;
        }
      }
    });

    return result;
  }

  function getEventName(evName) {
    if ( ['select', 'click'].indexOf(evName) !== -1 ) {
      return '_select';
    }
    return evName;
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
   * @constructor MenuEntry
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  (function() {

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

    GUI.Element.register({
      tagName: 'gui-menu-entry'
    }, {
      on: function(evName, callback, params) {
        evName = getEventName(evName);
        var target = this.$element.querySelector('gui-menu-entry > label');
        Utils.$bind(target, evName, callback.bind(this), params);
        return this;
      },

      build: function(arg, winRef) {
        var child = this.$element;
        if ( arguments.length < 2 ) {
          return this;
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

        return this;
      }
    });
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
   * @constructor Menu
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  (function() {

    function runChildren(pel, level, winRef, cb) {
      level = level || 0;
      cb = cb || function() {};

      (pel.children || []).forEach(function(child, i) {
        if ( child && child.tagName.toLowerCase() === 'gui-menu-entry') {
          GUI.Element.createFromNode(child).build(null, winRef);

          cb(child, level);
        }
      });
    }

    function onEntryClick(ev, pos, target, original) {
      var isExpander = !!target.querySelector('gui-menu');

      if ( !isExpander ) {
        OSjs.GUI.Helpers.blurMenu(ev);

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

        var dispatcher = (original || target).querySelector('label');
        dispatcher.dispatchEvent(new CustomEvent('_select', {detail: getSelectionEventAttribs(target, true)}));
      }
    }

    GUI.Element.register({
      tagName: 'gui-menu'
    }, {
      on: function(evName, callback, params) {
        evName = getEventName(evName);

        Utils.$bind(this.$element, evName, function(ev) {
          var t = ev.isTrusted ? ev.target : (ev.relatedTarget || ev.target);
          if ( t.tagName === 'LABEL' ) {
            callback.apply(new GUI.Element(t.parentNode), arguments);
          }
        }, true);

        return this;
      },

      show: function(ev) {
        ev.stopPropagation();
        ev.preventDefault();

        // This is to use a menu-bar > menu as a contextmenu
        var newNode = this.$element.cloneNode(true);
        var el = this.$element;
        OSjs.GUI.Helpers.createMenu(null, ev, newNode);

        Utils.$bind(newNode, 'click', function(ev, pos) {
          OSjs.GUI.Helpers._menuClickWrapper(ev, pos, onEntryClick, el);
        }, true);
      },

      set: function(param, value, arg) {
        if ( param === 'checked' ) {
          var found = this.$element.querySelector('gui-menu-entry[data-id="' + value + '"]');
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
          return this;
        }
        return GUI.Element.prototype.set.apply(this, arguments);
      },

      build: function(customMenu, winRef) {
        var el = this.$element;
        el.setAttribute('role', 'menu');

        runChildren(el, 0, winRef, function(child, level) {
          if ( customMenu ) {
            if ( child ) {
              var submenus = child.getElementsByTagName('gui-menu');
              submenus.forEach(function(sub) {
                if ( sub ) {
                  runChildren(sub, level + 1, winRef);
                }
              });
            }
          }
        });

        if ( !customMenu ) {
          Utils.$bind(el, 'click', function(ev, pos) {
            OSjs.GUI.Helpers._menuClickWrapper(ev, pos, onEntryClick);
          }, true);
        }

        return this;
      }
    });
  })();

  /**
   * Element: 'gui-menu-bar'
   *
   * A menubar with sub-menus
   *
   * <pre><code>
   *   event     select               When an entry was selected (click) => fn(ev)
   * </code></pre>
   *
   * @constructor MenuBar
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  GUI.Element.register({
    tagName: 'gui-menu-bar'
  }, {
    on: function(evName, callback, params) {
      evName = getEventName(evName);
      var self = this;

      this.$element.querySelectorAll('gui-menu-bar-entry').forEach(function(target) {
        Utils.$bind(target, evName, callback.bind(self), params);
      });

      return this;
    },

    build: function() {
      var el = this.$element;
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
        OSjs.GUI.Helpers.blurMenu(ev);

        ev.preventDefault();
        ev.stopPropagation();

        var submenu = mel.querySelector('gui-menu');

        if ( mel.getAttribute('data-disabled') === 'true' ) {
          return;
        }

        mel.querySelectorAll('gui-menu-entry').forEach(function(c) {
          Utils.$removeClass(c, 'gui-hover');
        });

        if ( submenu ) {
          OSjs.GUI.Helpers._menuSetActive(function(ev) {
            if ( ev ) {
              ev.stopPropagation();
            }
            Utils.$removeClass(mel, 'gui-active');
          });
        }

        if ( Utils.$hasClass(mel, 'gui-active') ) {
          if ( submenu ) {
            Utils.$removeClass(mel, 'gui-active');
          }
        } else {
          if ( submenu ) {
            Utils.$addClass(mel, 'gui-active');
          }

          mel.dispatchEvent(new CustomEvent('_select', {detail: getSelectionEventAttribs(mel)}));
        }
      }

      el.querySelectorAll('gui-menu-bar-entry').forEach(function(mel, idx) {
        var label = GUI.Helpers.getLabel(mel);

        var span = document.createElement('span');
        span.appendChild(document.createTextNode(label));

        mel.setAttribute('role', 'menuitem');

        mel.insertBefore(span, mel.firstChild);

        var submenu = mel.querySelector('gui-menu');

        OSjs.GUI.Helpers._menuClamp(submenu);

        mel.setAttribute('aria-haspopup', String(!!submenu));
        mel.setAttribute('data-index', String(idx));

        updateChildren(submenu, 2);
      });

      Utils.$bind(el, 'mousedown', function(ev) {
        ev.preventDefault();
        var t = ev.isTrusted ? ev.target : (ev.relatedTarget || ev.target);
        if ( t && t.tagName === 'GUI-MENU-BAR-ENTRY' ) {
          _onClick(ev, t);
        }
      }, true);

      return this;
    }
  });

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
