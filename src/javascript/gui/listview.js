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

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function resize(rel, w) {
    var flex = w.toString() + 'px';
    rel.style['webkitFlexBasis'] = flex;
    rel.style['mozFflexBasis'] = flex;
    rel.style['msFflexBasis'] = flex;
    rel.style['oFlexBasis'] = flex;
    rel.style['flexBasis'] = flex;
  }

  function createEntry(v, head) {
    var label = v.label || '';
    if ( v.label ) {
      delete v.label;
    }
    if ( typeof v.grow === 'undefined' ) {
      v.grow = 1;
    }
    if ( typeof v.shrink === 'undefined' ) {
      v.shrink = 1;
    }
    if ( typeof v.basis === 'undefined' ) {
      v.basis = '';
    }

    var nel = GUI.Helpers.createElement('gui-list-view-column', v);
    nel.appendChild(document.createTextNode(label));

    return nel;
  }

  function createResizers(el) {
    // TODO: These do not work properly :/
    var head = el.querySelector('gui-list-view-head');
    var body = el.querySelector('gui-list-view-body');
    var cols = head.querySelectorAll('gui-list-view-column');

    head.querySelectorAll('gui-list-view-column-resizer').forEach(function(rel) {
      Utils.$remove(rel);
    });

    cols.forEach(function(col, idx) {
      var attr = col.getAttribute('data-resizable');
      if ( attr === 'true' ) {
        var resizer = document.createElement('gui-list-view-column-resizer');
        col.appendChild(resizer);

        var startWidth = 0;
        var maxWidth   = 0;

        GUI.Helpers.createDrag(resizer, function(ev) {
          startWidth = col.offsetWidth;
          maxWidth = el.offsetWidth * 0.85; // FIXME
        }, function(ev, dx, dy) {
          var newWidth = startWidth + dx;
          if ( !isNaN(newWidth) ) { //&& newWidth > 0 && newWidth < maxWidth ) {
            resize(col, newWidth);

            // FIXME: Super slow!
            body.querySelectorAll('gui-list-view-row').forEach(function(row) {
              resize(row.children[idx], newWidth);
            });
          }
        });
      }
    });
  }

  function initRow(el, row) {
    var cols = el.querySelectorAll('gui-list-view-head gui-list-view-column');
    var headContainer = el.querySelector('gui-list-view-head');

    row.querySelectorAll('gui-list-view-column').forEach(function(cel, idx) {
      var cl = cols.length;
      var x = cl ? idx % cl : idx;

      GUI.Helpers.setFlexbox(cel, null, null, null, cols[x]);

      var icon = cel.getAttribute('data-icon');
      if ( icon ) {
        Utils.$addClass(cel, 'gui-has-image');
        cel.style.backgroundImage = 'url(' + icon + ')';
      }

      var text = cel.firstChild;
      if ( text && text.nodeType === 3 ) {
        var span = document.createElement('span');
        span.appendChild(document.createTextNode(text.nodeValue));
        cel.insertBefore(span, text);
        cel.removeChild(text);
      }

      if ( el._columns[idx] && !el._columns[idx].visible ) {
        cel.style.display = 'none';
      }
    });

    GUI.Elements._dataview.bindEntryEvents(el, row, 'gui-list-view-row');
  }

  function createRow(e) {
    var row = document.createElement('gui-list-view-row');
    if ( e && e.columns ) {
      e.columns.forEach(function(se) {
        row.appendChild(createEntry(se));
      });

      var value = null;
      try {
        value = JSON.stringify(e.value);
      } catch ( e ) {}
      row.setAttribute('data-value', value);
      if ( typeof e.id !== 'undefined' && e.id !== null ) {
        row.setAttribute('data-id', e.id);
      }

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
   * Format for add():
   *
   * {
   *    value: "something or JSON or whatever",
   *    columns: [
   *      {label: "Value for column 1", icon: "Optional icon"},
   *      {label: "Value for column 2", icon: "Optional icon"}
   *    ]
   * }
   *
   * Format for columns (flexbox parameters are also usable):
   * [
   *    {label: "Column 1"},
   *    {label: "Column 2"}
   *
   * ]
   *
   * Setters:
   *  columns(arr)  Sets the columns
   *
   * @api OSjs.GUI.Elements.gui-list-view
   * @see OSjs.GUI.Elements._dataview
   * @class
   */
  GUI.Elements['gui-list-view'] = {
    bind: GUI.Elements._dataview.bind,

    values: function(el) {
      var body = el.querySelector('gui-list-view-body');
      return GUI.Elements._dataview.getSelected(el, body.querySelectorAll('gui-list-view-row'));
    },

    set: function(el, param, value, arg) {
      if ( param === 'columns' ) {
        var head = el.querySelector('gui-list-view-head');
        var row = document.createElement('gui-list-view-row');
        Utils.$empty(head);

        el._columns = [];

        value.forEach(function(v) {
          v.visible = (typeof v.visible === 'undefined') || v.visible === true;

          var nel = createEntry(v, true)

          el._columns.push(v);

          if ( !v.visible ) {
            nel.style.display = 'none';
          }
          row.appendChild(nel);

          GUI.Helpers.setFlexbox(nel);
        });

        head.appendChild(row);

        createResizers(el);
        return true;
      } else if ( param === 'selected' || param === 'value' ) {
        var body = el.querySelector('gui-list-view-body');
        GUI.Elements._dataview.setSelected(el, body.querySelectorAll('gui-list-view-row'), value, arg);
        return true;
      }

      return false;
    },

    call: function(el, method, args) {
      var body = el.querySelector('gui-list-view-body');
      if ( method === 'add' ) {
        GUI.Elements._dataview.add(el, args, function(e) {
          var row = createRow(e);
          if ( row ) {
            body.appendChild(row);
            initRow(el, row);
          }
        });
      } else if ( method === 'remove' ) {
        GUI.Elements._dataview.remove(el, args, 'gui-list-view-row');
      } else if ( method === 'clear' ) {
        GUI.Elements._dataview.clear(el, el.querySelector('gui-list-view-body'));
      } else if ( method === 'patch' ) {
        GUI.Elements._dataview.patch(el, args, 'gui-list-view-row', body, createRow, initRow);
      }
    },

    build: function(el, applyArgs) {
      el._columns  = [];

      var head = el.querySelector('gui-list-view-head');
      var body = el.querySelector('gui-list-view-body');

      // Make sure base elements are in the dom
      if ( !body ) {
        body = document.createElement('gui-list-view-body');
        el.appendChild(body);
      }

      if ( !head ) {
        head = document.createElement('gui-list-view-head');
        el.insertBefore(head, body);
      }

      // Misc UI
      createResizers(el);

      Utils.$bind(el, 'scroll', function() {
        head.style.top = el.scrollTop + 'px';
      }, false);


      // Create scheme defined header
      el.querySelectorAll('gui-list-view-head gui-list-view-column').forEach(function(cel, idx) {
        GUI.Helpers.setFlexbox(cel);

        var vis = cel.getAttribute('data-visible');
        var iter = {
          visible: vis === null || vis === 'true',
          grow: cel.getAttribute('data-grow'),
          shrink: cel.getAttribute('data-shrink'),
          basis: cel.getAttribute('data-basis')
        };

        el._columns.push(iter);

        if ( !iter.visible ) {
          cel.style.display = 'none';
        }
      });

      // Create scheme defined rows
      el.querySelectorAll('gui-list-view-body gui-list-view-row').forEach(function(row) {
        initRow(el, row);
      });

      GUI.Elements._dataview.build(el, applyArgs);
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
