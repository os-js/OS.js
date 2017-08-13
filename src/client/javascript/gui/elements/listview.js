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
import GUIDataView from 'gui/dataview';

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

/*
 * This is the function that applies a "fake" header to the table
 * floating on top, containing the resizers.
 *
 * There's no other way to do this perfectly using tables.
 * First attempt was using flexboxes, but it has a severe performance penalty
 * when resizing because you have to repaint ALL the rows manually
 */
function createFakeHeader(el) {

  function createResizers() {
    const fhead = el.querySelector('gui-list-view-fake-head');
    const head = el.querySelector('gui-list-view-head');
    const fcols = fhead.querySelectorAll('gui-list-view-column');
    const cols = head.querySelectorAll('gui-list-view-column');

    fhead.querySelectorAll('gui-list-view-column-resizer').forEach((rel) => {
      DOM.$remove(rel);
    });

    cols.forEach((col, idx) => {
      const attr = col.getAttribute('data-resizable');
      if ( attr === 'true' ) {
        const fcol = fcols[idx];

        const resizer = document.createElement('gui-list-view-column-resizer');
        fcol.appendChild(resizer);

        let startWidth   = 0;
        let maxWidth     = 0;
        let widthOffset  = 16;
        let minWidth     = widthOffset;
        let tmpEl        = null;

        GUI.createDrag(resizer, (ev) => {
          startWidth = col.offsetWidth;
          minWidth = widthOffset;//calculateWidth();
          maxWidth = el.offsetWidth - (el.children.length * widthOffset);
        }, (ev, diff) => {
          const newWidth = startWidth - diff.x;

          if ( !isNaN(newWidth) && newWidth > minWidth && newWidth < maxWidth ) {
            col.style.width = String(newWidth) + 'px';
            fcol.style.width = String(newWidth) + 'px';
          }

          tmpEl = DOM.$remove(tmpEl);
        });
      }
    });
  }

  const fh = el.querySelector('gui-list-view-fake-head gui-list-view-head');
  DOM.$empty(fh);

  const row = el.querySelector('gui-list-view-head gui-list-view-row');
  if ( row ) {
    fh.appendChild(row.cloneNode(true));
    createResizers();
  }
}

/*
 * Applies DOM changes for a row to be rendered properly
 */
function initRow(cls, row) {
  const el = cls.$element;

  row.querySelectorAll('gui-list-view-column').forEach((cel, idx) => {
    const icon = cel.getAttribute('data-icon');
    if ( icon && icon !== 'null' ) {
      DOM.$addClass(cel, 'gui-has-image');
      cel.style.backgroundImage = 'url(' + icon + ')';
    }

    const text = cel.firstChild;
    if ( text && text.nodeType === 3 ) {
      const span = document.createElement('span');
      span.appendChild(document.createTextNode(text.nodeValue));
      cel.insertBefore(span, text);
      cel.removeChild(text);
    }

    if ( el._columns[idx] && !el._columns[idx].visible ) {
      cel.style.display = 'none';
    }

    cel.setAttribute('role', 'listitem');
  });

  cls.bindEntryEvents(row, 'gui-list-view-row');
}

/*
 * Creates a new `gui-list-view-column`
 */
function createEntry(cls, v, head) {
  const label = v.label || '';

  if ( v.label ) {
    delete v.label;
  }

  let setSize = null;
  if ( v.size ) {
    setSize = v.size;
    delete v.size;
  }

  const nel = GUI.createElement('gui-list-view-column', v);
  if ( setSize ) {
    nel.style.width = setSize;
  }

  if ( typeof label === 'function' ) {
    nel.appendChild(label.call(nel, nel, v));
  } else {
    const span = document.createElement('span');
    span.appendChild(document.createTextNode(label));
    nel.appendChild(span);
  }

  return nel;
}

/*
 * Creates a new `gui-list-view-row` from iter
 */
function createRow(cls, e) {
  e = e || {};
  if ( e.columns ) {
    const row = GUI.createElement('gui-list-view-row', e, ['columns']);

    e.columns.forEach((se) => {
      row.appendChild(createEntry(cls, se));
    });

    return row;
  }
  return null;
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

/**
 * Element: 'gui-list-view'
 *
 * A list view with columns.
 *
 * <pre><code>
 *   Parameters:
 *    zebra     boolean       Enable zebra stripes
 *
 *   Setters:
 *    columns(arr)  Sets the columns
 * </code></pre>
 *
 * @example
 *
 * .set('columns', [
 *      {label: "Column 1", size: "100px"},
 *      {label: "Column 2", size: "100px", visible: false},
 *      {label: "Column 3", size: "100px", textalign: "right"},
 *      {label: "Column 4", size: "100px", textalign: "right"}
 * ])
 *
 * @example
 *
 * .add([
 *   {
 *      value: "something or JSON or whatever",
 *      columns: [
 *        {label: "Value for column 1", icon: "Optional icon"},
 *        {label: "Value for column 2", icon: "Optional icon"},
 *        {label: "Value for column 3", icon: "Optional icon"},
 *        {label: "Value for column 4", icon: "Optional icon"},
 *      ]
 *   }
 * ])
 */
class GUIListView extends GUIDataView {
  static register() {
    return super.register({
      parent: GUIDataView,
      tagName: 'gui-list-view'
    }, this);
  }

  values() {
    const body = this.$element.querySelector('gui-list-view-body');
    const values = this.getSelected(body.querySelectorAll('gui-list-view-row'));
    return values;
  }

  get(param, value, arg, asValue) {
    if ( param === 'entry' ) {
      const body = this.$element.querySelector('gui-list-view-body');
      const rows = body.querySelectorAll('gui-list-view-row');
      return this.getEntry(rows, value, arg, asValue);
    }
    return super.get(...arguments);
  }

  set(param, value, arg, arg2) {
    const el = this.$element;

    if ( param === 'columns' ) {
      const head = el.querySelector('gui-list-view-head');
      const row = document.createElement('gui-list-view-row');
      DOM.$empty(head);

      el._columns = [];

      value.forEach((v) => {
        v.visible = (typeof v.visible === 'undefined') || v.visible === true;

        const nel = createEntry(this, v, true);

        el._columns.push(v);

        if ( !v.visible ) {
          nel.style.display = 'none';
        }
        row.appendChild(nel);
      });

      head.appendChild(row);

      createFakeHeader(el);
      return this;
    } else if ( param === 'selected' || param === 'value' ) {
      const body = el.querySelector('gui-list-view-body');
      this.setSelected(body, body.querySelectorAll('gui-list-view-row'), value, arg, arg2);
      return this;
    }

    return super.set(...arguments);
  }

  add(entries) {
    const body = this.$element.querySelector('gui-list-view-body');

    return super.add(entries, (cls, e) => {
      const cbCreated = e.onCreated || function() {};
      const row = createRow(this, e);
      if ( row ) {
        body.appendChild(row);
        initRow(this, row);
      }

      cbCreated(row);
    });
  }

  clear() {
    const body = this.$element.querySelector('gui-list-view-body');
    return super.clear(body);
  }

  remove(entries) {
    const body = this.$element.querySelector('gui-list-view-body');
    return super.remove(entries, 'gui-list-view-row', null, body);
  }

  patch(entries) {
    const body = this.$element.querySelector('gui-list-view-body');
    return super.patch(entries, 'gui-list-view-row', body, createRow, initRow);
  }

  build() {
    const el = this.$element;
    el._columns  = [];

    // Make sure base elements are in the dom
    let inner = el.querySelector('gui-list-view-inner');
    let head = el.querySelector('gui-list-view-head');
    let body = el.querySelector('gui-list-view-body');

    function moveIntoInner(cel) {
      // So user can forget adding the inner
      if ( cel.parentNode.tagName !== 'GUI-LIST-VIEW-INNER' ) {
        inner.appendChild(cel);
      }
    }

    let fakeHead = el.querySelector('gui-list-view-fake-head');
    if ( !fakeHead ) {
      fakeHead = document.createElement('gui-list-view-fake-head');
      const fakeHeadInner = document.createElement('gui-list-view-inner');
      fakeHeadInner.appendChild(document.createElement('gui-list-view-head'));
      fakeHead.appendChild(fakeHeadInner);
    }

    if ( !inner ) {
      inner = document.createElement('gui-list-view-inner');
      el.appendChild(inner);
    }

    (function _createBody() {
      if ( body ) {
        moveIntoInner(body);
      } else {
        body = document.createElement('gui-list-view-body');
        inner.appendChild(body);
      }
      body.setAttribute('role', 'group');
    })();

    (function _createHead() {
      if ( head ) {
        moveIntoInner(head);
      } else {
        head = document.createElement('gui-list-view-head');
        inner.insertBefore(head, body);
      }
      head.setAttribute('role', 'group');
    })();

    el.setAttribute('role', 'list');
    el.appendChild(fakeHead);

    Events.$bind(el, 'scroll', (ev) => {
      fakeHead.style.top = el.scrollTop + 'px';
    }, false);

    // Create scheme defined header
    const hcols = el.querySelectorAll('gui-list-view-head gui-list-view-column');
    hcols.forEach((cel, idx) => {
      const vis = cel.getAttribute('data-visible');
      const iter = {
        visible: vis === null || vis === 'true',
        size: cel.getAttribute('data-size')
      };

      if ( iter.size ) {
        cel.style.width = iter.size;
      }

      el._columns.push(iter);

      if ( !iter.visible ) {
        cel.style.display = 'none';
      }
    });

    createFakeHeader(el);

    // Create scheme defined rows
    el.querySelectorAll('gui-list-view-body gui-list-view-row').forEach((row) => {
      initRow(this, row);
    });

    return super.build(...arguments);
  }
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default {
  GUIListView: GUIListView
};
