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
import * as GUI from 'utils/gui';
import * as DOM from 'utils/dom';
import * as Events from 'utils/events';
import GUIElement from 'gui/element';
import WindowManager from 'core/window-manager';
import {triggerHook} from 'helpers/hooks';

let lastMenu;

export function clickWrapper(ev, pos, onclick, original) {
  ev.stopPropagation();

  let t = ev.target;
  if ( t && t.tagName === 'LABEL' ) {
    t = t.parentNode;
  }

  let isExpander = false;
  if ( t && t.tagName === 'GUI-MENU-ENTRY' ) {
    let subMenu = t.querySelector('gui-menu');
    isExpander = !!subMenu;

    try {
      // Only do this on non-mouse devices
      if ( isExpander && !ev.isTrusted ) {
        t.parentNode.querySelectorAll('gui-menu-entry').forEach((pn) => {
          DOM.$removeClass(pn, 'active');
        });

        DOM.$addClass(t, 'active');
      }
    } catch ( e ) {
      console.warn(e);
    }

    onclick(ev, pos, t, original, isExpander);
  }
}

export function clamp(r) {
  function _clamp(rm) {
    rm.querySelectorAll('gui-menu-entry').forEach(function(srm) {
      const sm = srm.querySelector('gui-menu');
      if ( sm ) {
        sm.style.left = String(-parseInt(sm.offsetWidth, 10)) + 'px';
        _clamp(sm);
      }
    });
  }

  const pos = DOM.$position(r);
  if ( pos && (window.innerWidth - pos.right) < r.offsetWidth ) {
    DOM.$addClass(r, 'gui-overflowing');
    _clamp(r);
  }

  // this class is used in caclulations (DOM needs to be visible for that)
  DOM.$addClass(r, 'gui-showing');
}

/**
 * Blur the currently open menu (aka hiding)
 *
 * @param {Event} [ev] Browser event
 */
export function blur(ev) {
  if ( lastMenu ) {
    lastMenu(ev);
  }
  lastMenu = null;

  triggerHook('menuBlur');
}

/**
 * Create and show a new menu
 *
 * @example
 * create([
 *    {
 *      title: "Title",
 *      icon: "Icon",
 *      onClick: function() {}, // Callback
 *      menu: [] // Recurse :)
 *    }
 * ])
 *
 * @param   {Array}                items             Array of items
 * @param   {(Event|Object)}       ev                DOM Event or dict with x/y
 * @param   {Object}               [customInstance]  Show a custom created menu
 */
export function create(items, ev, customInstance) {
  items = items || [];

  blur(ev);

  let root = customInstance;
  let callbackMap = [];

  function resolveItems(arr, par) {
    arr.forEach(function(iter) {
      const props = {label: iter.title, icon: iter.icon, disabled: iter.disabled, labelHTML: iter.titleHTML, type: iter.type, checked: iter.checked};
      const entry = GUI.createElement('gui-menu-entry', props);
      if ( iter.menu ) {
        const nroot = GUI.createElement('gui-menu', {});
        resolveItems(iter.menu, nroot);
        entry.appendChild(nroot);
      }
      if ( iter.onClick ) {
        const index = callbackMap.push(iter.onClick);
        entry.setAttribute('data-callback-id', String(index - 1));
      }
      par.appendChild(entry);
    });
  }

  if ( !root ) {
    root = GUI.createElement('gui-menu', {});
    resolveItems(items || [], root);

    GUIElement.createFromNode(root, null, 'gui-menu').build(true);

    Events.$bind(root, 'click', function(ev, pos) {
      clickWrapper(ev, pos, function(ev, pos, t, orig, isExpander) {
        const index = parseInt(t.getAttribute('data-callback-id'), 10);
        if ( callbackMap[index] ) {
          callbackMap[index](ev, pos);
        }

        if ( !isExpander ) {
          blur(ev);
        }
      });
    }, true);
  }

  if ( root.$element ) {
    root = root.$element;
  }

  const wm = WindowManager.instance;
  const space = wm.getWindowSpace(true);
  const pos = Events.mousePosition(ev);

  DOM.$addClass(root, 'gui-root-menu');
  root.style.left = pos.x + 'px';
  root.style.top  = pos.y + 'px';
  document.body.appendChild(root);

  // Make sure it stays within viewport
  setTimeout(function() {
    const pos = DOM.$position(root);
    if ( pos ) {
      if ( pos.right > space.width ) {
        const newLeft = Math.round(space.width - pos.width);
        root.style.left = Math.max(0, newLeft) + 'px';
      }
      if ( pos.bottom > space.height ) {
        const newTop = Math.round(space.height - pos.height);
        root.style.top = Math.max(0, newTop) + 'px';
      }
    }

    clamp(root);
  }, 1);

  lastMenu = function() {
    callbackMap = null;
    if ( root ) {
      root.querySelectorAll('gui-menu-entry').forEach(function(el) {
        Events.$unbind(el);
      });
      Events.$unbind(root);
    }
    root = DOM.$remove(root);
  };
}

export function setActive(menu) {
  blur();

  lastMenu = menu;
}
