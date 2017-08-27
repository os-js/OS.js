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
import * as Clipboard from 'utils/clipboard';
import Keycodes from 'utils/keycodes';
import FileMetadata from 'vfs/file';
import GUIElement from 'gui/element';

/////////////////////////////////////////////////////////////////////////////
// ABSTRACTION HELPERS
/////////////////////////////////////////////////////////////////////////////

const _classMap = { // Defaults to (foo-bar)-entry
  'gui-list-view': 'gui-list-view-row'
};

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

function getEntryTagName(type) {
  if ( typeof type !== 'string' ) {
    type = type.tagName.toLowerCase();
  }

  let className = _classMap[type];
  if ( !className ) {
    className = type + '-entry';
  }

  return className;
}

function getEntryFromEvent(ev, header) {
  const t = ev.target;
  const tn = t.tagName.toLowerCase();

  if ( tn.match(/(view|textarea|body)$/) ) {
    return null;
  } else if ( tn === 'gui-list-view-column' && !header ) {
    return t.parentNode;
  }

  return t;
}

function isHeader(ev, row) {
  row = row || getEntryFromEvent(ev);
  return row && row.parentNode.tagName === 'GUI-LIST-VIEW-HEAD';
}

function handleItemSelection(ev, item, idx, className, selected, root, multipleSelect) {
  root = root || item.parentNode;
  if ( isHeader(null, item) ) {
    return multipleSelect ? [] : null;
  }

  if ( idx === -1 ) {
    root.querySelectorAll(getEntryTagName(root)).forEach(function(e) {
      DOM.$removeClass(e, 'gui-active');
    });
    selected = [];
  } else {
    if ( !multipleSelect || !ev.shiftKey ) {
      root.querySelectorAll(className).forEach(function(i) {
        DOM.$removeClass(i, 'gui-active');
      });
      selected = [];
    }

    const findex = selected.indexOf(idx);
    if ( findex >= 0 ) {
      selected.splice(findex, 1);
      DOM.$removeClass(item, 'gui-active');
    } else {
      selected.push(idx);
      DOM.$addClass(item, 'gui-active');
    }
  }

  selected.sort(function(a, b) {
    return a - b;
  });

  return selected;
}

function handleKeyPress(cls, el, ev) {
  const map = {};
  const key = ev.keyCode;
  const type = el.tagName.toLowerCase();
  const className = getEntryTagName(type);
  const root = el.querySelector(type + '-body');
  const entries = root.querySelectorAll(className);
  const count = entries.length;

  if ( !count ) {
    return;
  }

  if ( key === Keycodes.ENTER ) {
    el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: cls.values()}}));
    return;
  }

  map[Keycodes.C] = function(ev) {
    if ( ev.ctrlKey ) {
      const selected = cls.values();
      if ( selected && selected.length ) {
        const data = [];

        selected.forEach(function(s) {
          if ( s && s.data ) {
            data.push(new FileMetadata(s.data.path, s.data.mime));
          }
        });

        Clipboard.setClipboard(data);
      }
    }
  };

  const selected = el._selected.concat() || [];
  const first = selected.length ? selected[0] : 0;
  const last = selected.length > 1 ? selected[selected.length - 1] : first;

  let current = 0;

  function select() {
    const item = entries[current];
    if ( item ) {
      el._selected = handleItemSelection(ev, item, current, className, selected, root, ev.shiftKey);
      cls.scrollIntoView(item);
    }
  }

  function getRowSize() {
    /* NOT ACCURATE!
    var ew = entries[0].offsetWidth;
    var tw = root.offsetWidth;
    var d = Math.floor(tw/ew);
    */
    let d = 0;
    let lastTop = -1;

    entries.forEach(function(e) {
      if ( lastTop === -1 ) {
        lastTop = e.offsetTop;
      }

      if ( lastTop !== e.offsetTop ) {
        return false;
      }

      lastTop = e.offsetTop;
      d++;

      return true;
    });

    return d;
  }

  function handleKey() {
    function next() {
      current = Math.min(last + 1, count);
      select();
    }
    function prev() {
      current = Math.max(0, first - 1);
      select();
    }

    if ( type === 'gui-tree-view' || type === 'gui-list-view' ) {
      map[Keycodes.UP] = prev;
      map[Keycodes.DOWN] = next;
    } else {
      map[Keycodes.UP] = function() {
        current = Math.max(0, first - getRowSize());
        select();
      };
      map[Keycodes.DOWN] = function() {
        current = Math.max(last, last + getRowSize());
        select();
      };
      map[Keycodes.LEFT] = prev;
      map[Keycodes.RIGHT] = next;
    }

    if ( map[key] ) {
      map[key](ev);
    }
  }

  handleKey();
}

function getValueParameter(r) {
  const value = r.getAttribute('data-value');
  try {
    return JSON.parse(value);
  } catch ( e ) {}

  return value;
}

function matchValueByKey(r, val, key, idx) {
  const value = r.getAttribute('data-value');
  if ( !key && (val === idx || val === value) ) {
    return r;
  } else {
    try {
      const json = JSON.parse(value);
      if ( typeof json[key] === 'object' ? json[key] === val : String(json[key]) === String(val) ) {
        return r;
      }
    } catch ( e ) {}
  }
  return false;
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

/**
 * Element: '_dataview'
 *
 * @desc
 * This is an abstraction layer for Icon, Tree and List views.
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value     Mixed         The value/currently selected
 *   getter    selected  Mixed         Alias of 'value'
 *   getter    entry     Mixed         Gets an etnry by value, key
 *   setter    value     Mixed         The value/currently selected
 *   property  multiple  boolean       If multiple elements are selectable
 *   event     select                  When entry was selected => fn(ev)
 *   event     activate                When entry was activated => fn(ev)
 *   action    add                     Add elements(s) => fn(entries)
 *   action    patch                   Patch/Update elements => fn(entries)
 *   action    remove                  Removes element => fn(arg)
 *   action    clear                   Clear elements => fn()
 * </code></pre>
 *
 * @abstract
 * @extends GUIElement
 */
export default class UIDataView extends GUIElement {

  /**
   * Clears the view
   *
   * @param {Node} [body] The body to clear
   *
   * @return {GUIElement} this
   */
  clear(body) {
    const el = this.$element;
    if ( !arguments.length ) {
      body = el;
    }

    el.querySelectorAll(getEntryTagName(el)).forEach((row) => {
      Events.$unbind(row);
    });

    DOM.$empty(body);
    body.scrollTop = 0;
    el._selected = [];

    return this;
  }

  /**
   * Adds one or more elements
   *
   * @param {Array|Object}  entries       Entry list, or a single entry
   * @param {Function}      [oncreate]    Callback on creation => fn(this, node)
   *
   * @return {GUIElement} this
   */
  add(entries, oncreate) {
    oncreate = oncreate || function() {};

    if ( !(entries instanceof Array) ) {
      entries = [entries];
    }

    entries.forEach((el) => {
      oncreate(this, el);
    });

    return this;
  }

  /**
   * Do a diffed render
   *
   * @param {Array|Object}  entries       Entry list, or a single entry
   * @param {String}        className     Classname of entry
   * @param {Node}          body          The body container
   * @param {Function}      [oncreate]    Callback on creation => fn(this, node)
   * @param {Function}      [oninit]      Callback on init => fn(this, node)
   *
   * @return {GUIElement} this
   */
  patch(entries, className, body, oncreate, oninit) {
    let single = false;

    if ( !(entries instanceof Array) ) {
      entries = [entries];
      single = true;
    }

    let inView = {};
    body.querySelectorAll(className).forEach((row) => {
      const id = row.getAttribute('data-id');
      if ( id !== null ) {
        inView[id] = row;
      }
    });

    entries.forEach((entry) => {
      let insertBefore;
      if ( typeof entry.id !== 'undefined' && entry.id !== null ) {
        if ( inView[entry.id] ) {
          insertBefore = inView[entry.id];
          delete inView[entry.id];
        }

        const row = oncreate(this, entry);
        if ( row ) {
          if ( insertBefore ) {
            if ( DOM.$hasClass(insertBefore, 'gui-active') ) {
              DOM.$addClass(row, 'gui-active');
            }

            body.insertBefore(row, insertBefore);
            //this.remove(null, className, insertBefore, body);
            UIDataView.prototype.remove.call(this, null, className, insertBefore, body);
          } else {
            body.appendChild(row);
          }
          oninit(this, row);
        }
      }
    });

    if ( !single ) {
      Object.keys(inView).forEach((k) => {
        //this.remove(null, className, inView[k]);
        UIDataView.prototype.remove.call(this, null, className, inView[k]);
      });
    }

    inView = {};
    this.updateActiveSelection(className);

    return this;
  }

  /**
   * Remove element
   *
   * @param {Array}     [args]      id, key pair
   * @param {String}    [className] Classname of entry
   * @param {Node}      [target]    Remove this target instead of using args
   * @param {Node}      [parentEl]  Entry parent node
   *
   * @return {GUIElement} this
   */
  remove(args, className, target, parentEl) {

    args = args || [];
    parentEl = parentEl || this.$element;

    if ( target ) {
      DOM.$remove(target);
    } else if ( typeof args[1] === 'undefined' && typeof args[0] === 'number' ) {
      DOM.$remove(parentEl.querySelectorAll(className)[args[0]]);
    } else {
      const findId = args[0];
      const findKey = args[1] || 'id';
      const q = 'data-' + findKey + '="' + findId + '"';
      parentEl.querySelectorAll(className + '[' + q + ']').forEach(DOM.$remove);
    }

    this.updateActiveSelection(className);

    return this;
  }

  /*
   * Update active selection
   */
  updateActiveSelection(className) {
    const active = [];
    this.$element.querySelectorAll(className + '.gui-active').forEach((cel) => {
      active.push(DOM.$index(cel));
    });
    this.$element._active = active;
  }

  /*
   * Scroll given element into view
   */
  scrollIntoView(element) {
    const el = this.$element;
    const pos = DOM.$position(element, el);

    let marginTop = 0;
    if ( el.tagName.toLowerCase() === 'gui-list-view' ) {
      const header = el.querySelector('gui-list-view-head');
      if ( header ) {
        marginTop = header.offsetHeight;
      }
    }

    const scrollSpace = (el.scrollTop + el.offsetHeight) - marginTop;
    const scrollTop = el.scrollTop + marginTop;
    const elTop = pos.top - marginTop;

    if ( pos !== null && (elTop > scrollSpace || elTop < scrollTop) ) {
      el.scrollTop = elTop;
      return true;
    }

    return false;
  }

  /*
   * Binds events and such for an entry
   */
  bindEntryEvents(row, className) {
    const el = this.$element;

    function createDraggable() {
      let value = row.getAttribute('data-value');
      if ( value !== null ) {
        try {
          value = JSON.parse(value);
        } catch ( e ) {}
      }

      let source = row.getAttribute('data-draggable-source');
      if ( source === null ) {
        source = GUI.getWindowId(el);
        if ( source !== null ) {
          source = {wid: source};
        }
      }

      GUI.createDraggable(row, {
        type: el.getAttribute('data-draggable-type') || row.getAttribute('data-draggable-type'),
        source: source,
        data: value
      });

      let tooltip = row.getAttribute('data-tooltip');
      if ( tooltip && !row.getAttribute('title') ) {
        row.setAttribute('title', tooltip);
      }
    }

    el.dispatchEvent(new CustomEvent('_render', {detail: {
      element: row,
      data: GUI.getViewNodeValue(row)
    }}));

    if ( el.getAttribute('data-draggable') === 'true' ) {
      createDraggable();
    }
  }

  /*
   * Get selected from array of nodes
   */
  getSelected(entries) {
    const selected = [];
    entries.forEach((iter, idx) => {
      if ( DOM.$hasClass(iter, 'gui-active') ) {
        selected.push({
          index: idx,
          data: GUI.getViewNodeValue(iter)
        });
      }
    });
    return selected;
  }

  /*
   * Get entry from an array of nodes
   */
  getEntry(entries, val, key, asValue) {
    if ( val ) {
      let result = null;
      entries.forEach((r, idx) => {
        if ( !result && matchValueByKey(r, val, key, idx) ) {
          result = r;
        }
      });

      return (asValue && result) ? getValueParameter(result) : result;
    }

    return !asValue ? entries : (entries || []).map((iter) => {
      return getValueParameter(iter);
    });
  }

  /*
   * Set selected from array of nodes
   */
  setSelected(body, entries, val, key, opts) {
    const select = [];
    const el = this.$element;

    let scrollIntoView = false;
    if ( typeof opts === 'object' ) {
      scrollIntoView = opts.scroll === true;
    }

    const sel = (r, idx) => {
      select.push(idx);
      DOM.$addClass(r, 'gui-active');
      if ( scrollIntoView ) {
        this.scrollIntoView(r);
      }
    };

    entries.forEach((r, idx) => {
      DOM.$removeClass(r, 'gui-active');
      if ( matchValueByKey(r, val, key, idx) ) {
        sel(r, idx);
      }
    });

    el._selected = select;
  }

  /*
   * Builds element
   */
  build(applyArgs) {
    const el = this.$element;
    el._selected = [];
    el.scrollTop = 0;

    DOM.$addClass(el, 'gui-data-view');

    const singleClick = el.getAttribute('data-single-click') === 'true';

    let moved;
    let wasResized = false;
    let multipleSelect = el.getAttribute('data-multiple');
    multipleSelect = multipleSelect === null || multipleSelect === 'true';

    const select = (ev) => {
      if ( moved || wasResized ) {
        return false;
      }

      const row = getEntryFromEvent(ev);
      if ( !row ) {
        return false;
      }

      const className = row.tagName.toLowerCase();
      if ( isHeader(null, row) ) {
        const col = getEntryFromEvent(ev, true);
        if ( col ) {
          let sortBy = col.getAttribute('data-sortby');
          if ( sortBy ) {
            let sortDir = col.getAttribute('data-sortdir');
            let resetDir = sortDir === 'desc';
            sortDir = sortDir === 'asc' ? 'desc' : (resetDir ? null : 'asc');
            sortBy = resetDir ? null : sortBy;

            col.setAttribute('data-sortdir', sortDir);

            el.setAttribute('data-sortby', sortBy || '');
            el.setAttribute('data-sortdir', sortDir || '');

            el.dispatchEvent(new CustomEvent('_sort', {detail: {
              sortDir: sortDir,
              sortBy: sortBy
            }}));
          }
        }
        return false;
      }

      if ( className === 'gui-tree-view-expander' ) {
        this.expand({
          ev: ev,
          entry: row.parentNode
        });
        return true;
      }

      const idx = DOM.$index(row);
      el._selected = handleItemSelection(ev, row, idx, className, el._selected, el, multipleSelect);
      el.dispatchEvent(new CustomEvent('_select', {detail: {entries: this.values()}}));

      return true;
    };

    const activate = (ev) => {
      if ( moved || isHeader(ev) ) {
        return;
      }

      if ( singleClick ) {
        if ( select(ev) === false ) {
          return;
        }
      } else {
        if ( !getEntryFromEvent(ev) ) {
          return;
        }
      }

      el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: this.values()}}));
    };

    const context = (ev) => {
      if ( isHeader(ev) ) {
        return;
      }

      select(ev);
      el.dispatchEvent(new CustomEvent('_contextmenu', {detail: {entries: this.values(), x: ev.clientX, y: ev.clientY}}));
    };

    if ( !el.querySelector('textarea.gui-focus-element') && !el.getAttribute('no-selection') ) {
      const underlay = document.createElement('textarea');
      underlay.setAttribute('aria-label', '');
      underlay.setAttribute('aria-hidden', 'true');
      underlay.setAttribute('readonly', 'true');
      underlay.className = 'gui-focus-element';
      Events.$bind(underlay, 'focus', (ev) => {
        ev.preventDefault();
        DOM.$addClass(el, 'gui-element-focused');
      });
      Events.$bind(underlay, 'blur', (ev) => {
        ev.preventDefault();
        DOM.$removeClass(el, 'gui-element-focused');
      });
      Events.$bind(underlay, 'keydown', (ev) => {
        ev.preventDefault();
        handleKeyPress(this, el, ev);
      });
      Events.$bind(underlay, 'keypress', (ev) => {
        ev.preventDefault();
      });

      Events.$bind(el, 'pointerdown,touchstart', (ev) => {
        moved = false;
        const target = ev.target;
        wasResized = target && target.tagName === 'GUI-LIST-VIEW-COLUMN-RESIZER';
      }, true);
      Events.$bind(el, 'touchmove', (ev) => {
        moved = true;
      }, true);

      if ( singleClick ) {
        Events.$bind(el, 'click', activate, true);
      } else {
        Events.$bind(el, 'click', select, true);
        Events.$bind(el, 'dblclick', activate, true);
      }

      Events.$bind(el, 'contextmenu', (ev) => {
        ev.preventDefault();
        context(ev);
        return false;
      }, true);

      this.on('select', (ev) => {
        if ( DOM.$hasClass(el, 'gui-element-focused') ) {
          return;
        }
        // NOTE: This is a fix for Firefox stupid behaviour when focusing/blurring textboxes
        // (which is used to have a focusable area in this case, called underlay)
        const oldTop = el.scrollTop;
        underlay.focus();
        el.scrollTop = oldTop;
        setTimeout(() => {
          el.scrollTop = oldTop;
        }, 2);
      }, true);

      el.appendChild(underlay);
    }
  }

  /*
   * Focuses element
   */
  focus() {
    try {
      const underlay = this.$element.querySelector('.gui-focus-element');
      underlay.focus();
    } catch ( e ) {
      console.warn(e, e.stack);
    }
  }

  /*
   * Blurs element
   */
  blur() {
    try {
      const underlay = this.$element.querySelector('.gui-focus-element');
      underlay.blur();
    } catch ( e ) {
      console.warn(e, e.stack);
    }
  }

  /*
   * Gets values from selected entries
   */
  values() {
    return [];
  }

  /*
   * Binds an event
   */
  on(evName, callback, params) {
    if ( (['activate', 'select', 'expand', 'contextmenu', 'render', 'drop', 'sort']).indexOf(evName) !== -1 ) {
      evName = '_' + evName;
    }
    Events.$bind(this.$element, evName, callback.bind(this), params);
    return this;
  }

}

