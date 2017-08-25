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
import * as DOM from 'utils/dom';
import * as GUI from 'utils/gui';
import * as Events from 'utils/events';
//import * as Compability from 'utils/compability';
import * as Menu from 'gui/menu';
import GUIElement from 'gui/element';

let debounce;

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

function getSelectionEventAttribs(mel, didx) {
  const id = mel.getAttribute('data-id');

  let idx = DOM.$index(mel);
  if ( !didx ) {
    idx = parseInt(mel.getAttribute('data-index'), 10);
  }

  const result = {index: idx, id: id};
  Array.prototype.slice.call(mel.attributes).forEach((item) => {
    if ( item.name.match(/^data\-/) ) {
      const an = item.name.replace(/^data\-/, '');
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

function runChildren(pel, level, winRef, cb) {
  level = level || 0;
  cb = cb || function() {};

  (pel.children || []).forEach((child, i) => {
    if ( child && child.tagName.toLowerCase() === 'gui-menu-entry') {
      GUIElement.createFromNode(child).build(null, winRef);

      cb(child, level);
    }
  });
}

function onEntryClick(ev, pos, target, original) {
  const isExpander = !!target.querySelector('gui-menu');

  if ( !isExpander ) {
    const dispatcher = (original || target).querySelector('label');
    dispatcher.dispatchEvent(new CustomEvent('_select', {detail: getSelectionEventAttribs(target, true)}));
  }
}

function createTyped(child, par) {
  const type = child.getAttribute('data-type');
  const value = child.getAttribute('data-checked') === 'true';

  let input = null;
  if ( type ) {
    const group = child.getAttribute('data-group');
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
 */
class GUIMenuEntry extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-menu-entry'
    }, this);
  }

  on(evName, callback, params) {
    evName = getEventName(evName);
    const target = this.$element.querySelector('gui-menu-entry > label');
    Events.$bind(target, evName, callback.bind(this), params);
    return this;
  }

  build(arg, winRef) {
    const child = this.$element;
    if ( arguments.length < 2 ) {
      return this;
    }
    child.setAttribute('role', 'menuitem' + (child.getAttribute('data-type') || ''));

    const label = GUI.getLabel(child);
    const icon = GUI.getIcon(child, winRef);
    child.setAttribute('aria-label', label);

    const span = document.createElement('label');
    if ( icon ) {
      child.style.backgroundImage = 'url(' + icon + ')';
      DOM.$addClass(span, 'gui-has-image');
    }
    child.appendChild(span);

    createTyped(child, span);

    if ( child.getAttribute('data-labelhtml') === 'true' ) {
      span.innerHTML = label;
    } else {
      span.appendChild(document.createTextNode(label));
    }

    if ( child.querySelector('gui-menu') ) {
      DOM.$addClass(child, 'gui-menu-expand');
      child.setAttribute('aria-haspopup', 'true');
    } else {
      child.setAttribute('aria-haspopup', 'false');
    }

    return this;
  }
}

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
 */
class GUIMenu extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-menu'
    }, this);
  }

  on(evName, callback, params) {
    evName = getEventName(evName);

    Events.$bind(this.$element, evName, function(ev) {
      if ( ev.target.tagName === 'LABEL' ) {
        callback.apply(new GUIElement(ev.target.parentNode), arguments);
      }
    }, true);

    return this;
  }

  show(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    // This is to use a menu-bar > menu as a contextmenu
    const newNode = this.$element.cloneNode(true);
    Menu.create(null, ev, newNode);
  }

  set(param, value, arg) {
    if ( param === 'checked' ) {
      const found = this.$element.querySelector('gui-menu-entry[data-id="' + value + '"]');
      if ( found ) {
        const input = found.querySelector('input');
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
    return super.set(...arguments);
  }

  build(customMenu, winRef) {
    const el = this.$element;
    el.setAttribute('role', 'menu');

    runChildren(el, 0, winRef, (child, level) => {
      if ( customMenu ) {
        if ( child ) {
          const submenus = child.getElementsByTagName('gui-menu');
          submenus.forEach((sub) => {
            if ( sub ) {
              runChildren(sub, level + 1, winRef);
            }
          });
        }
      }
    });

    if ( !customMenu ) {
      Events.$bind(el, 'click', (ev, pos) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          debounce = clearTimeout(debounce);
          Menu.clickWrapper(ev, pos, onEntryClick);
        }, 1);
      }, true);
    }

    return this;
  }
}

/**
 * Element: 'gui-menu-bar'
 *
 * A menubar with sub-menus
 *
 * <pre><code>
 *   event     select               When an entry was selected (click) => fn(ev)
 * </code></pre>
 */
class GUIMenuBar extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-menu-bar'
    }, this);
  }

  on(evName, callback, params) {
    evName = getEventName(evName);

    this.$element.querySelectorAll('gui-menu-bar-entry').forEach((target) => {
      Events.$bind(target, evName, callback.bind(this), params);
    });

    return this;
  }

  build() {
    const el = this.$element;
    el.setAttribute('role', 'menubar');

    function updateChildren(sm, level) {
      if ( sm && sm.children ) {
        const children = sm.children;

        let child;
        for ( let i = 0; i < children.length; i++ ) {
          child = children[i];
          if ( child.tagName === 'GUI-MENU-ENTRY' ) {
            child.setAttribute('aria-haspopup', String(!!child.firstChild));
            updateChildren(child.firstChild, level + 1);
          }
        }
      }
    }

    function _onClick(ev) {
      ev.preventDefault();

      const mel = ev.target;
      const submenu = mel.querySelector('gui-menu');

      if ( mel.getAttribute('data-disabled') === 'true' ) {
        return;
      }

      mel.querySelectorAll('gui-menu-entry').forEach((c) => {
        DOM.$removeClass(c, 'gui-hover');
      });

      if ( submenu ) {
        Menu.setActive((ev) => {
          if ( ev instanceof window.Event  ) {
            ev.stopPropagation();
          }
          DOM.$removeClass(mel, 'gui-active');
        });
      }

      if ( DOM.$hasClass(mel, 'gui-active') ) {
        if ( submenu ) {
          DOM.$removeClass(mel, 'gui-active');
        }
      } else {
        if ( submenu ) {
          DOM.$addClass(mel, 'gui-active');
        }

        mel.dispatchEvent(new CustomEvent('_select', {detail: getSelectionEventAttribs(mel)}));
      }
    }

    el.querySelectorAll('gui-menu-bar-entry').forEach((mel, idx) => {
      const label = GUI.getLabel(mel);

      const span = document.createElement('span');
      span.appendChild(document.createTextNode(label));

      mel.setAttribute('role', 'menuitem');

      mel.insertBefore(span, mel.firstChild);

      const submenu = mel.querySelector('gui-menu');

      Menu.clamp(submenu);

      mel.setAttribute('aria-haspopup', String(!!submenu));
      mel.setAttribute('data-index', String(idx));

      updateChildren(submenu, 2);
    });

    Events.$bind(el, 'click', (ev) => {
      if ( ev.target.tagName === 'GUI-MENU-BAR-ENTRY' ) {
        _onClick(ev);
      }
    }, true);

    return this;
  }
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default {
  GUIMenuEntry: GUIMenuEntry,
  GUIMenuBar: GUIMenuBar,
  GUIMenu: GUIMenu
};
