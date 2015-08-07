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

  GUI = OSjs.GUI || {};
  GUI.Elements = OSjs.GUI.Elements || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function handleItemSelection(ev, item, idx, className, selected, root, multipleSelect) {
    root = root || item.parentNode;

    if ( !multipleSelect || !ev.shiftKey ) {
      root.querySelectorAll(className).forEach(function(i) {
        Utils.$removeClass(i, 'gui-active');
      });
      selected = [];
    }

    var findex = selected.indexOf(idx);
    if ( findex >= 0 ) {
      selected.splice(findex, 1);
      Utils.$removeClass(item, 'gui-active');
    } else {
      selected.push(idx);
      Utils.$addClass(item, 'gui-active');
    }

    selected.sort(function(a, b) {
      return a - b;
    });

    return selected;
  }

  function getSelected(el) {
    return GUI.Elements[el.tagName.toLowerCase()].values(el);
  }

  function handleKeyPress(el, ev) {
    var type = el.tagName.toLowerCase();
    var className = 'gui-list-view-row';
    if ( type === 'gui-tree-view' || type === 'gui-icon-view' ) {
      className = type + '-entry';
    }

    var root = el.querySelector(type + '-body');
    var entries = root.querySelectorAll(className);
    var count = entries.length;

    if ( !count ) { return; }

    var map = {}
    var key = ev.keyCode || ev.which;

    if ( key === Utils.Keys.ENTER ) {
      el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected(el)}}));
      return;
    }

    var selected = el._selected.concat() || [];
    var first = selected.length ? selected[0] : 0;
    var last = selected.length > 1 ? selected[selected.length - 1] : first;
    var current = 0;

    function select() {
      var item = entries[current];
      if ( item ) {
        el._selected = handleItemSelection(ev, item, current, className, selected, root, ev.shiftKey);
        GUI.Elements._dataview.scrollIntoView(el, item);
      }
    }

    function getRowSize() {
      var ew = entries[0].offsetWidth;
      var tw = root.offsetWidth;
      var d = Math.floor(tw/ew);
      return d;
    }

    function next() {
      current = Math.min(last + 1, count);
      select();
    }
    function prev() {
      current = Math.max(0, first - 1);
      select();
    }
    function jumpUp() {
      current = Math.max(0, first - getRowSize());
      select();
    }
    function jumpDown() {
      current = Math.max(last, last + getRowSize());
      select();
    }

    if ( type === 'gui-tree-view' || type === 'gui-list-view' ) {
      map[Utils.Keys.UP] = prev;
      map[Utils.Keys.DOWN] = next;
    } else {
      map[Utils.Keys.UP] = jumpUp;
      map[Utils.Keys.DOWN] = jumpDown;
      map[Utils.Keys.LEFT] = prev;
      map[Utils.Keys.RIGHT] = next;
    }

    if ( map[key] ) { map[key](ev); }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: '_dataview'
   *
   * This is an abstraction layer for Icon, Tree and List views.
   *
   * Events:
   *  select        When an entry was selected (click) => fn(ev)
   *  activate      When an entry was activated (doubleclick) => fn(ev)
   *
   * Parameters:
   *  multiple  boolean     Multiple selection (default=true)
   *
   * Setters:
   *  value         Sets the selected entry(es)
   *  selected      Alias for 'value'
   *
   * Getters:
   *  value         Gets the selected entry(es)
   *  selected      Alias for 'value'
   *
   * Actions:
   *  add(arg)      Adds en entry (or from array)
   *  remove(arg)   Removes an entry
   *  patch(arg)    Patch/Update entries from array
   *  clear()
   *
   * @api OSjs.GUI.Elements._dataview
   * @class
   */
  GUI.Elements._dataview = {
    clear: function(el, body) {
      body = body || el;

      Utils.$empty(body);
      el.scrollTop = 0;
      el._selected = [];
    },

    add: function(el, args, oncreate) {
      var entries = args[0];
      if ( !(entries instanceof Array) ) {
        entries = [entries];
      }
      entries.forEach(oncreate);
    },

    patch: function(el, args, className, body, oncreate, oninit) {
      var self = this;
      var entries = args[0];
      var single = false;

      if ( !(entries instanceof Array) ) {
        entries = [entries];
        single = true;
      }

      var inView = {};
      body.querySelectorAll(className).forEach(function(row) {
        var id = row.getAttribute('data-id');
        if ( id !== null ) {
          inView[id] = row;
        }
      });

      entries.forEach(function(entry) {
        var insertBefore;
        if ( typeof entry.id !== 'undefined' && entry.id !== null ) {
          if ( inView[entry.id] ) {
            insertBefore = inView[entry.id];
            delete inView[entry.id];
          }

          var row = oncreate(entry);
          if ( row ) {
            if ( insertBefore ) {
              if ( Utils.$hasClass(insertBefore, 'gui-active') ) {
                Utils.$addClass(row, 'gui-active');
              }

              body.insertBefore(row, insertBefore);
              self.remove(el, null, className, insertBefore);
            } else {
              body.appendChild(row);
            }
            oninit(el, row);
          }
        }
      });

      if ( !single ) {
        Object.keys(inView).forEach(function(k) {
          self.remove(el, null, className, inView[k]);
        });
      }

      inView = {};
      this.updateActiveSelection(el, className);
    },

    remove: function(el, args, className, target) {
      function remove(cel) {
        Utils.$remove(cel);
      }

      if ( target ) {
        remove(target);
        return;
      }

      var findId = args[0];
      var findKey = args[1] || 'id';
      var q = 'data-' + findKey + '="' + findId + '"';
      el.querySelectorAll(className + '[' + q + ']').forEach(remove);
      this.updateActiveSelection(el, className);
    },

    updateActiveSelection: function(el, className) {
      var active = [];
      el.querySelectorAll(className + '.gui-active').forEach(function(cel) {
        active.push(Utils.$index(cel));
      });
      el._active = active;
    },

    scrollIntoView: function(el, element) {
      var pos = Utils.$position(element, el);
      var marginTop = 0;
      if ( el.tagName.toLowerCase() === 'gui-list-view' ) {
        var header = el.querySelector('gui-list-view-head');
        if ( header ) {
          marginTop = header.offsetHeight;
        }
      }

      var scrollSpace = (el.scrollTop + el.offsetHeight) - marginTop;
      var scrollTop = el.scrollTop + marginTop;
      var elTop = pos.top - marginTop;

      if ( pos !== null && (elTop > scrollSpace || elTop < scrollTop) ) {
        el.scrollTop = elTop;
        return true;
      }

      return false;
    },

    bindEntryEvents: function(el, row, className) {

      var singleClick = el.getAttribute('data-single-click') === 'true';

      function select(ev) {
        var multipleSelect = el.getAttribute('data-multiple');
        multipleSelect = multipleSelect === null || multipleSelect === 'true';
        var idx = Utils.$index(row);
        el._selected = handleItemSelection(ev, row, idx, className, el._selected, null, multipleSelect);
        el.dispatchEvent(new CustomEvent('_select', {detail: {entries: getSelected(el)}}));
      }

      function activate(ev) {
        el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected(el)}}));
      }

      function context(ev) {
        select(ev);
        el.dispatchEvent(new CustomEvent('_contextmenu', {detail: {entries: getSelected(el)}}));
      }

      if ( singleClick ) {
        Utils.$bind(row, 'click', function(ev) {
          select(ev);
          activate(ev);
        });
      } else {
        Utils.$bind(row, 'click', select, false);
        Utils.$bind(row, 'dblclick', activate, false);
      }

      Utils.$bind(row, 'contextmenu', function(ev) {
        ev.preventDefault();
        context(ev);
        return false;
      }, false);

      if ( el.getAttribute('data-draggable') === 'true' ) {
        var value = row.getAttribute('data-value');
        if ( value !== null ) {
          try {
            value = JSON.parse(value);
          } catch ( e ) {}
        }

        var source = row.getAttribute('data-draggable-source');
        if ( source === null ) {
          source = GUI.Helpers.getWindowId(el);
          if ( source !== null ) {
            source = {wid: source};
          }
        }

        API.createDraggable(row, {
          type   : el.getAttribute('data-draggable-type') || row.getAttribute('data-draggable-type'),
          source : source,
          data   : value
        });

        var tooltip = row.getAttribute('data-tooltip');
        if ( tooltip && !row.getAttribute('title') ) {
          row.setAttribute('title', tooltip);
        }

      }
    },

    getSelected: function(el, entries) {
      var selected = [];
      var active = (el._selected || []);

      active.forEach(function(iter) {
        var found = entries[iter];
        if ( found ) {
          selected.push({
            index: iter,
            data: GUI.Helpers.getViewNodeValue(found)
          });
        }
      });
      return selected;
    },

    setSelected: function(el, body, entries, val, key) {
      var self = this;
      var select = [];

      function sel(r, idx) {
        select.push(idx);
        Utils.$addClass(r, 'gui-active');
        self.scrollIntoView(el, r);
      }

      entries.forEach(function(r, idx) {
        Utils.$removeClass(r, 'gui-active');

        var value = r.getAttribute('data-value');
        if ( !key && val === idx ) {
          sel(r, idx);
        } else {
          try {
            var json = JSON.parse(value);
            if ( json[key] == val ) {
              sel(r, idx);
            }
          } catch ( e ) {}
        }
      });
      el._selected = select;
    },

    build: function(el, applyArgs) {
      el._selected = [];

      //Utils.$addClass(el, 'gui-disable-events');
      var underlay = document.createElement('textarea');
      underlay.setAttribute('readonly', 'true');
      underlay.className = 'gui-focus-element';
      Utils.$bind(underlay, 'focus', function() {
        Utils.$addClass(el, 'gui-element-focused');
      });
      Utils.$bind(underlay, 'blur', function() {
        Utils.$removeClass(el, 'gui-element-focused');
      });
      Utils.$bind(underlay, 'keydown', function(ev) {
        ev.preventDefault();
        handleKeyPress(el, ev);
      });
      Utils.$bind(underlay, 'keypress', function(ev) {
        ev.preventDefault();
      });

      this.bind(el, 'select', function() {
        underlay.focus();
      });

      el.appendChild(underlay);
    },

    bind: function(el, evName, callback, params) {
      if ( (['activate', 'select', 'expand', 'contextmenu']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    }

  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
