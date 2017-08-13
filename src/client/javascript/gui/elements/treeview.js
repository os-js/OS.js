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
import GUIDataView from 'gui/dataview';

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

function createEntry(cls, e) {
  const entry = GUI.createElement('gui-tree-view-entry', e, ['entries']);
  return entry;
}

function handleItemExpand(ev, el, root, expanded) {
  if ( typeof expanded === 'undefined' ) {
    expanded = !DOM.$hasClass(root, 'gui-expanded');
  }

  DOM.$removeClass(root, 'gui-expanded');
  if ( expanded ) {
    DOM.$addClass(root, 'gui-expanded');
  }

  const children = root.children;
  for ( let i = 0; i < children.length; i++ ) {
    if ( children[i].tagName.toLowerCase() === 'gui-tree-view-entry' ) {
      children[i].style.display = expanded ? 'block' : 'none';
    }
  }

  const selected = {
    index: DOM.$index(root),
    data: GUI.getViewNodeValue(root)
  };

  root.setAttribute('data-expanded', String(expanded));
  root.setAttribute('aria-expanded', String(expanded));

  el.dispatchEvent(new CustomEvent('_expand', {detail: {entries: [selected], expanded: expanded, element: root}}));
} // handleItemExpand()

function initEntry(cls, sel) {
  const el = cls.$element;
  if ( sel._rendered ) {
    return;
  }
  sel._rendered = true;

  const icon = sel.getAttribute('data-icon');
  const label = GUI.getLabel(sel);
  const expanded = el.getAttribute('data-expanded') === 'true';
  const next = sel.querySelector('gui-tree-view-entry');
  const container = document.createElement('div');
  const dspan = document.createElement('span');

  function onDndEnter(ev) {
    ev.stopPropagation();
    DOM.$addClass(sel, 'dnd-over');
  }

  function onDndLeave(ev) {
    DOM.$removeClass(sel, 'dnd-over');
  }

  if ( icon ) {
    dspan.style.backgroundImage = 'url(' + icon + ')';
    DOM.$addClass(dspan, 'gui-has-image');
  }
  dspan.appendChild(document.createTextNode(label));

  container.appendChild(dspan);

  if ( next ) {
    DOM.$addClass(sel, 'gui-expandable');
    const expander = document.createElement('gui-tree-view-expander');
    sel.insertBefore(container, next);
    sel.insertBefore(expander, container);
  } else {
    sel.appendChild(container);
  }

  if ( String(sel.getAttribute('data-draggable')) === 'true' ) {
    GUI.createDraggable(container, (() => {
      let data = {};
      try {
        data = JSON.parse(sel.getAttribute('data-value'));
      } catch ( e ) {}

      return {data: data};
    })());
  }

  if ( String(sel.getAttribute('data-droppable')) === 'true' ) {
    let timeout;
    GUI.createDroppable(container, {
      onEnter: onDndEnter,
      onOver: onDndEnter,
      onLeave: onDndLeave,
      onDrop: onDndLeave,
      onItemDropped: (ev, eel, item) => {
        ev.stopPropagation();
        ev.preventDefault();

        timeout = clearTimeout(timeout);
        timeout = setTimeout(() => {
          DOM.$removeClass(sel, 'dnd-over');
        }, 10);

        let dval = {};
        try {
          dval = JSON.parse(eel.parentNode.getAttribute('data-value'));
        } catch ( e ) {}

        el.dispatchEvent(new CustomEvent('_drop', {detail: {
          src: item.data,
          dest: dval
        }}));
      }
    });
  }

  handleItemExpand(null, el, sel, expanded);

  cls.bindEntryEvents(sel, 'gui-tree-view-entry');
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

/**
 * Element: 'gui-tree-view'
 *
 * A tree view for nested content
 *
 * For more properties and events etc, see 'dataview'
 *
 * @example
 *
 *   .add({
 *      label: "Label",
 *      icon: "Optional icon path",
 *      value: "something or JSON or whatever",
 *      entries: [] // Recurse :)
 *   })
 */
class GUITreeView extends GUIDataView {
  static register() {
    return super.register({
      parent: GUIDataView,
      tagName: 'gui-tree-view'
    }, this);
  }

  values() {
    const el = this.$element;
    return this.getSelected(el.querySelectorAll('gui-tree-view-entry'));
  }

  build(applyArgs) {
    const el = this.$element;

    let body = el.querySelector('gui-tree-view-body');
    let found = !!body;

    if ( !body ) {
      body = document.createElement('gui-tree-view-body');
      el.appendChild(body);
    }

    body.setAttribute('role', 'group');
    el.setAttribute('role', 'tree');
    el.setAttribute('aria-multiselectable', body.getAttribute('data-multiselect') || 'false');

    el.querySelectorAll('gui-tree-view-entry').forEach((sel, idx) => {
      sel.setAttribute('aria-expanded', 'false');

      if ( !found ) {
        body.appendChild(sel);
      }

      sel.setAttribute('role', 'treeitem');
      initEntry(this, sel);
    });

    return super.build(...arguments);
  }

  get(param, value, arg) {
    if ( param === 'entry' ) {
      const body = this.$element.querySelector('gui-tree-view-body');
      return this.getEntry(body.querySelectorAll('gui-tree-view-entry'), value, arg);
    }
    return super.get(...arguments);
  }

  set(param, value, arg, arg2) {
    const el = this.$element;
    const body = el.querySelector('gui-tree-view-body');
    if ( param === 'selected' || param === 'value' ) {
      this.setSelected(body, body.querySelectorAll('gui-tree-view-entry'), value, arg, arg2);
      return this;
    }
    return super.set(...arguments);
  }

  clear() {
    const body = this.$element.querySelector('gui-tree-view-body');
    return super.clear(body);
  }

  add(entries) {
    const body = this.$element.querySelector('gui-tree-view-body');

    let parentNode = body;

    const recurse = (a, root, level) => {
      super.add(a, (cls, e) => {
        if ( e ) {
          if ( e.parentNode ) {
            delete e.parentNode;
          }

          const entry = createEntry(this, e);
          root.appendChild(entry);

          if ( e.entries ) {
            recurse(e.entries, entry, level + 1);
          }

          initEntry(this, entry);
        }
      });
    };

    if ( typeof entries === 'object' && !(entries instanceof Array) && Object.keys(entries).length ) {
      parentNode = entries.parentNode || body;
      entries = entries.entries || [];
    }

    recurse(entries, parentNode, 0);

    return this;
  }

  remove(entries) {
    return super.remove(entries, 'gui-tree-view-entry');
  }

  patch(entries) {
    const body = this.$element.querySelector('gui-tree-view-body');
    return super.patch(entries, 'gui-list-view-entry', body, createEntry, initEntry);
  }

  expand(entry) {
    handleItemExpand(entry.ev, this.$element, entry.entry);
    return this;
  }
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default {
  GUITreeView: GUITreeView
};
