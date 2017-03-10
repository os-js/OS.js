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
  // ABSTRACTION HELPERS
  /////////////////////////////////////////////////////////////////////////////

  var _classMap = { // Defaults to (foo-bar)-entry
    'gui-list-view': 'gui-list-view-row'
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function getEntryTagName(type) {
    if ( typeof type !== 'string' ) {
      type = type.tagName.toLowerCase();
    }

    var className = _classMap[type];
    if ( !className ) {
      className = type + '-entry';
    }

    return className;
  }

  function getEntryFromEvent(ev, header) {
    var t = ev.isTrusted ? ev.target : (ev.relatedTarget || ev.target);
    var tn = t.tagName.toLowerCase();

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
      return;
    }

    if ( idx === -1 ) {
      root.querySelectorAll(getEntryTagName(root)).forEach(function(e) {
        Utils.$removeClass(e, 'gui-active');
      });
      selected = [];
    } else {
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
    }

    selected.sort(function(a, b) {
      return a - b;
    });

    return selected;
  }

  function handleKeyPress(cls, el, ev) {
    var map = {};
    var key = ev.keyCode;
    var type = el.tagName.toLowerCase();
    var className = getEntryTagName(type);
    var root = el.querySelector(type + '-body');
    var entries = root.querySelectorAll(className);
    var count = entries.length;

    if ( !count ) {
      return;
    }

    if ( key === Utils.Keys.ENTER ) {
      el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: cls.values()}}));
      return;
    }

    map[Utils.Keys.C] = function(ev) {
      if ( ev.ctrlKey ) {
        var selected = cls.values();
        if ( selected && selected.length ) {
          var data = [];

          selected.forEach(function(s) {
            if ( s && s.data ) {
              data.push(new VFS.File(s.data.path, s.data.mime));
            }
          });

          API.setClipboard(data);
        }
      }
    };

    var selected = el._selected.concat() || [];
    var first = selected.length ? selected[0] : 0;
    var last = selected.length > 1 ? selected[selected.length - 1] : first;
    var current = 0;

    function select() {
      var item = entries[current];
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
      var d = 0;

      var lastTop = -1;
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
        map[Utils.Keys.UP] = prev;
        map[Utils.Keys.DOWN] = next;
      } else {
        map[Utils.Keys.UP] = function() {
          current = Math.max(0, first - getRowSize());
          select();
        };
        map[Utils.Keys.DOWN] = function() {
          current = Math.max(last, last + getRowSize());
          select();
        };
        map[Utils.Keys.LEFT] = prev;
        map[Utils.Keys.RIGHT] = next;
      }

      if ( map[key] ) {
        map[key](ev);
      }
    }

    handleKey();
  }

  function getValueParameter(r) {
    var value = r.getAttribute('data-value');
    try {
      return JSON.parse(value);
    } catch ( e ) {}

    return value;
  }

  function matchValueByKey(r, val, key, idx) {
    var value = r.getAttribute('data-value');
    if ( !key && (val === idx || val === value) ) {
      return r;
    } else {
      try {
        var json = JSON.parse(value);
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
   * @constructor DataView
   * @memberof OSjs.GUI
   * @extends OSjs.GUI.Element
   * @abstract
   */
  var UIDataView = Utils.inherit(GUI.Element, null, {
    /**
     * Clears the view
     *
     * @param {Node} [body] The body to clear
     *
     * @function clear
     * @memberof OSjs.GUI.DataView#
     * @return {OSjs.GUI.Element} this
     */
    clear: function(body) {
      var el = this.$element;
      if ( !arguments.length ) {
        body = el;
      }

      el.querySelectorAll(getEntryTagName(el)).forEach(function(row) {
        Utils.$unbind(row);
      });

      Utils.$empty(body);
      body.scrollTop = 0;
      el._selected = [];

      return this;
    },

    /**
     * Adds one or more elements
     *
     * @param {Array|Object}  entries       Entry list, or a single entry
     * @param {Function}      [oncreate]    Callback on creation => fn(this, node)
     *
     * @function add
     * @memberof OSjs.GUI.DataView#
     * @return {OSjs.GUI.Element} this
     */
    add: function(entries, oncreate) {
      oncreate = oncreate || function() {};

      if ( !(entries instanceof Array) ) {
        entries = [entries];
      }

      var self = this;
      entries.forEach(function(el) {
        oncreate(self, el);
      });

      return this;
    },

    /**
     * Do a diffed render
     *
     * @param {Array|Object}  entries       Entry list, or a single entry
     * @param {String}        className     Classname of entry
     * @param {Node}          body          The body container
     * @param {Function}      [oncreate]    Callback on creation => fn(this, node)
     * @param {Function}      [oninit]      Callback on init => fn(this, node)
     *
     * @function patch
     * @memberof OSjs.GUI.DataView#
     * @return {OSjs.GUI.Element} this
     */
    patch: function(entries, className, body, oncreate, oninit) {
      var self = this;
      var single = false;
      var remove = GUI.DataView.prototype.remove;

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

          var row = oncreate(self, entry);
          if ( row ) {
            if ( insertBefore ) {
              if ( Utils.$hasClass(insertBefore, 'gui-active') ) {
                Utils.$addClass(row, 'gui-active');
              }

              body.insertBefore(row, insertBefore);
              remove.call(self, null, className, insertBefore, body);
            } else {
              body.appendChild(row);
            }
            oninit(self, row);
          }
        }
      });

      if ( !single ) {
        Object.keys(inView).forEach(function(k) {
          remove.call(self, null, className, inView[k]);
        });
      }

      inView = {};
      this.updateActiveSelection(className);

      return this;
    },

    /**
     * Remove element
     *
     * @param {Array}     [args]      id, key pair
     * @param {String}    [className] Classname of entry
     * @param {Node}      [target]    Remove this target instead of using args
     * @param {Node}      [parentEl]  Entry parent node
     *
     * @function remove
     * @memberof OSjs.GUI.DataView#
     * @return {OSjs.GUI.Element} this
     */
    remove: function(args, className, target, parentEl) {

      args = args || [];
      parentEl = parentEl || this.$element;

      if ( target ) {
        Utils.$remove(target);
      } else if ( typeof args[1] === 'undefined' && typeof args[0] === 'number' ) {
        Utils.$remove(parentEl.querySelectorAll(className)[args[0]]);
      } else {
        var findId = args[0];
        var findKey = args[1] || 'id';
        var q = 'data-' + findKey + '="' + findId + '"';
        parentEl.querySelectorAll(className + '[' + q + ']').forEach(Utils.$remove);
      }

      this.updateActiveSelection(className);

      return this;
    },

    /*
     * Update active selection
     */
    updateActiveSelection: function(className) {
      var active = [];
      this.$element.querySelectorAll(className + '.gui-active').forEach(function(cel) {
        active.push(Utils.$index(cel));
      });
      this.$element._active = active;
    },

    /*
     * Scroll given element into view
     * TODO: Use native method ?
     */
    scrollIntoView: function(element) {
      var el = this.$element;
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

    /*
     * Binds events and such for an entry
     */
    bindEntryEvents: function(row, className) {
      var el = this.$element;

      function createDraggable() {
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

        GUI.Helpers.createDraggable(row, {
          type   : el.getAttribute('data-draggable-type') || row.getAttribute('data-draggable-type'),
          source : source,
          data   : value
        });

        var tooltip = row.getAttribute('data-tooltip');
        if ( tooltip && !row.getAttribute('title') ) {
          row.setAttribute('title', tooltip);
        }
      }

      el.dispatchEvent(new CustomEvent('_render', {detail: {
        element: row,
        data: GUI.Helpers.getViewNodeValue(row)
      }}));

      if ( el.getAttribute('data-draggable') === 'true' ) {
        createDraggable();
      }
    },

    /*
     * Get selected from array of nodes
     */
    getSelected: function(entries) {
      var selected = [];
      entries.forEach(function(iter, idx) {
        if ( Utils.$hasClass(iter, 'gui-active') ) {
          selected.push({
            index: idx,
            data: GUI.Helpers.getViewNodeValue(iter)
          });
        }
      });
      return selected;
    },

    /*
     * Get entry from an array of nodes
     */
    getEntry: function(entries, val, key, asValue) {
      if ( val ) {
        var result = null;
        entries.forEach(function(r, idx) {
          if ( !result && matchValueByKey(r, val, key, idx) ) {
            result = r;
          }
        });

        return (asValue && result) ? getValueParameter(result) : result;
      }

      return !asValue ? entries : (entries || []).map(function(iter) {
        return getValueParameter(iter);
      });
    },

    /*
     * Set selected from array of nodes
     */
    setSelected: function(body, entries, val, key, opts) {
      var self = this;
      var select = [];
      var scrollIntoView = false;
      var el = this.$element;

      if ( typeof opts === 'object' ) {
        scrollIntoView = opts.scroll === true;
      }

      function sel(r, idx) {
        select.push(idx);
        Utils.$addClass(r, 'gui-active');
        if ( scrollIntoView ) {
          self.scrollIntoView(r);
        }
      }

      entries.forEach(function(r, idx) {
        Utils.$removeClass(r, 'gui-active');
        if ( matchValueByKey(r, val, key, idx) ) {
          sel(r, idx);
        }
      });

      el._selected = select;
    },

    /*
     * Builds element
     */
    build: function(applyArgs) {
      var self = this;
      var el = this.$element;
      el._selected = [];
      el.scrollTop = 0;

      Utils.$addClass(el, 'gui-data-view');

      var wasResized = false;
      var singleClick = el.getAttribute('data-single-click') === 'true';
      var multipleSelect = el.getAttribute('data-multiple');
      multipleSelect = multipleSelect === null || multipleSelect === 'true';

      function select(ev) {
        ev.stopPropagation();
        API.blurMenu();

        if ( wasResized ) {
          return;
        }

        var row = getEntryFromEvent(ev);
        if ( !row ) {
          return false;
        }

        var className = row.tagName.toLowerCase();
        if ( isHeader(null, row) ) {
          var col = getEntryFromEvent(ev, true);
          if ( col ) {
            var idx = Utils.$index(col);

            var sortBy = col.getAttribute('data-sortby');
            if ( sortBy ) {
              var sortDir = col.getAttribute('data-sortdir');
              var resetDir = sortDir === 'desc';
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
          self.expand({
            ev: ev,
            entry: row.parentNode
          });
          return;
        }

        var idx = Utils.$index(row);
        el._selected = handleItemSelection(ev, row, idx, className, el._selected, el, multipleSelect);
        el.dispatchEvent(new CustomEvent('_select', {detail: {entries: self.values()}}));
      }

      function activate(ev) {
        ev.stopPropagation();
        API.blurMenu();

        if ( isHeader(ev) ) {
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

        el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: self.values()}}));
      }

      function context(ev) {
        if ( isHeader(ev) ) {
          return;
        }

        select(ev);
        el.dispatchEvent(new CustomEvent('_contextmenu', {detail: {entries: self.values(), x: ev.clientX, y: ev.clientY}}));
      }

      function mousedown(ev) {
        var target = ev.target;
        wasResized = target && target.tagName === 'GUI-LIST-VIEW-COLUMN-RESIZER';
      }

      if ( !el.querySelector('textarea.gui-focus-element') && !el.getAttribute('no-selection') ) {
        var underlay = document.createElement('textarea');
        underlay.setAttribute('aria-label', '');
        underlay.setAttribute('aria-hidden', 'true');
        underlay.setAttribute('readonly', 'true');
        underlay.className = 'gui-focus-element';
        Utils.$bind(underlay, 'focus', function(ev) {
          ev.preventDefault();
          Utils.$addClass(el, 'gui-element-focused');
        });
        Utils.$bind(underlay, 'blur', function(ev) {
          ev.preventDefault();
          Utils.$removeClass(el, 'gui-element-focused');
        });
        Utils.$bind(underlay, 'keydown', function(ev) {
          ev.preventDefault();
          handleKeyPress(self, el, ev);
        });
        Utils.$bind(underlay, 'keypress', function(ev) {
          ev.preventDefault();
        });

        Utils.$bind(el, 'mousedown', mousedown, true);

        if ( singleClick ) {
          Utils.$bind(el, 'click', activate, true);
        } else {
          Utils.$bind(el, 'click', select, true);
          Utils.$bind(el, 'dblclick', activate, true);
        }

        Utils.$bind(el, 'contextmenu', function(ev) {
          ev.preventDefault();
          context(ev);
          return false;
        }, true);

        this.on('select', function(ev) {
          if ( Utils.$hasClass(el, 'gui-element-focused') ) {
            return;
          }
          // NOTE: This is a fix for Firefox stupid behaviour when focusing/blurring textboxes
          // (which is used to have a focusable area in this case, called underlay)
          var oldTop = el.scrollTop;
          underlay.focus();
          el.scrollTop = oldTop;
          setTimeout(function() {
            el.scrollTop = oldTop;
          }, 2);
        }, true);

        el.appendChild(underlay);
      }
    },

    /*
     * Focuses element
     */
    focus: function() {
      try {
        var underlay = this.$element.querySelector('.gui-focus-element');
        underlay.focus();
      } catch ( e ) {
        console.warn(e, e.stack);
      }
    },

    /*
     * Blurs element
     */
    blur: function() {
      try {
        var underlay = this.$element.querySelector('.gui-focus-element');
        underlay.blur();
      } catch ( e ) {
        console.warn(e, e.stack);
      }
    },

    /*
     * Gets values from selected entries
     */
    values: function() {
      return [];
    },

    /*
     * Binds an event
     */
    on: function(evName, callback, params) {
      if ( (['activate', 'select', 'expand', 'contextmenu', 'render', 'drop', 'sort']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      Utils.$bind(this.$element, evName, callback.bind(this), params);
      return this;
    }

  });

  GUI.DataView = Object.seal(UIDataView);

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
