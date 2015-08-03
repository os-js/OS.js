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
      if ( pos !== null && 
           (pos.top > (el.scrollTop + el.offsetHeight) || 
           (pos.top < el.scrollTop)) ) {
        el.scrollTop = pos.top;
      }
    },

    bindEntryEvents: function(el, row, className) {
      function getSelected() {
        return GUI.Elements[el.tagName.toLowerCase()].values(el);
      }

      var singleClick = el.getAttribute('data-single-click') === 'true';
      if ( singleClick ) {
        Utils.$bind(row, 'click', function(ev) {
          var multipleSelect = el.getAttribute('data-multiple');
          multipleSelect = multipleSelect === null || multipleSelect === 'true';
          var idx = Utils.$index(row);
          el._selected = GUI.Helpers.handleItemSelection(ev, row, idx, className, el._selected, null, multipleSelect);

          var selected = getSelected();
          el.dispatchEvent(new CustomEvent('_select', {detail: {entries: selected}}));
          el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: selected}}));
        });
      } else {
        Utils.$bind(row, 'click', function(ev) {
          var multipleSelect = el.getAttribute('data-multiple');
          multipleSelect = multipleSelect === null || multipleSelect === 'true';

          var idx = Utils.$index(row);
          el._selected = GUI.Helpers.handleItemSelection(ev, row, idx, className, el._selected, null, multipleSelect);
          el.dispatchEvent(new CustomEvent('_select', {detail: {entries: getSelected()}}));
        }, false);

        Utils.$bind(row, 'dblclick', function(ev) {
          el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected()}}));
        }, false);
      }

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

    setSelected: function(el, entries) {
      var self = this;
      var select = [];

      entries.forEach(function(r, idx) {
        Utils.$removeClass(r, 'gui-active');

        try {
          var json = JSON.parse(r.getAttribute('data-value'));
          if ( json[arg] == value ) {
            select.push(idx);
            Utils.$addClass(r, 'gui-active');
            self.scrollIntoView(el, r);
          }
        } catch ( e ) {}
      });
      el._selected = select;
    },

    build: function(el, applyArgs) {
      el._selected = [];
    },

    bind: function(el, evName, callback, params) {
      if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    }

  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
