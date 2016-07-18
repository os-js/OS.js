/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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

  /**
   * This is the function that applies a "fake" header to the table
   * floating on top, containing the resizers.
   *
   * There's no other way to do this perfectly using tables.
   * First attempt was using flexboxes, but it has a severe performance penalty
   * when resizing because you have to repaint ALL the rows manually
   */
  function createFakeHeader(el) {

    function createResizers() {
      var fhead = el.querySelector('gui-list-view-fake-head');
      var head = el.querySelector('gui-list-view-head');
      var fcols = fhead.querySelectorAll('gui-list-view-column');
      var cols = head.querySelectorAll('gui-list-view-column');

      fhead.querySelectorAll('gui-list-view-column-resizer').forEach(function(rel) {
        Utils.$remove(rel);
      });

      cols.forEach(function(col, idx) {
        var attr = col.getAttribute('data-resizable');
        if ( attr === 'true' ) {
          var fcol = fcols[idx];

          var resizer = document.createElement('gui-list-view-column-resizer');
          fcol.appendChild(resizer);

          var startWidth   = 0;
          var maxWidth     = 0;
          var widthOffset  = 16;
          var minWidth     = widthOffset;
          var tmpEl        = null;

          GUI.Helpers.createDrag(resizer, function(ev) {
            startWidth = col.offsetWidth;
            minWidth = widthOffset;//calculateWidth();
            maxWidth = el.offsetWidth - (el.children.length * widthOffset);
          }, function(ev, diff) {
            var newWidth = startWidth - diff.x;

            if ( !isNaN(newWidth) && newWidth > minWidth && newWidth < maxWidth ) {
              col.style.width = String(newWidth) + 'px';
              fcol.style.width = String(newWidth) + 'px';
            }

            tmpEl = Utils.$remove(tmpEl);
          });
        }
      });
    }

    var fh = el.querySelector('gui-list-view-fake-head gui-list-view-head');
    Utils.$empty(fh);

    var row = el.querySelector('gui-list-view-head gui-list-view-row');
    if ( row ) {
      fh.appendChild(row.cloneNode(true));
      createResizers();
    }
  }

  /**
   * Applies DOM changes for a row to be rendered properly
   */
  function initRow(el, row) {
    var cols = el.querySelectorAll('gui-list-view-head gui-list-view-column');
    var headContainer = el.querySelector('gui-list-view-head');

    row.querySelectorAll('gui-list-view-column').forEach(function(cel, idx) {
      var cl = cols.length;
      var x = cl ? idx % cl : idx;

      var icon = cel.getAttribute('data-icon');
      if ( icon && icon !== 'null' ) {
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

      cel.setAttribute('role', 'listitem');
    });

    GUI.Elements._dataview.bindEntryEvents(el, row, 'gui-list-view-row');
  }

  /**
   * Creates a new `gui-list-view-column`
   */
  function createEntry(v, head) {
    var label = v.label || '';

    if ( v.label ) {
      delete v.label;
    }
    var setSize = null;
    if ( v.size ) {
      setSize = v.size;
      delete v.size;
    }

    var nel = GUI.Helpers.createElement('gui-list-view-column', v);
    if ( setSize ) {
      nel.style.width = setSize;
    }
    if ( typeof label === 'function' ) {
      nel.appendChild(label.call(nel, nel, v));
    } else {
      var span = document.createElement('span');
      span.appendChild(document.createTextNode(label));
      nel.appendChild(span);
    }

    return nel;
  }

  /**
   * Creates a new `gui-list-view-row` from iter
   */
  function createRow(e) {
    e = e || {};
    if ( e.columns ) {
      var row = GUI.Helpers.createElement('gui-list-view-row', e, ['columns']);

      e.columns.forEach(function(se) {
        row.appendChild(createEntry(se));
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
   *
   * @constructs OSjs.GUI.DataView
   * @memberof OSjs.GUI.Elements
   * @var gui-list-view
   */
  GUI.Elements['gui-list-view'] = {
    bind: GUI.Elements._dataview.bind,

    values: function(el) {
      var body = el.querySelector('gui-list-view-body');
      return GUI.Elements._dataview.getSelected(el, body.querySelectorAll('gui-list-view-row'));
    },

    get: function(el, param, value, arg, asValue) {
      if ( param === 'entry' ) {
        var body = el.querySelector('gui-list-view-body');
        var rows = body.querySelectorAll('gui-list-view-row');
        return GUI.Elements._dataview.getEntry(el, rows, value, arg, asValue);
      }
      return GUI.Helpers.getProperty(el, param);
    },

    set: function(el, param, value, arg) {
      if ( param === 'columns' ) {
        var head = el.querySelector('gui-list-view-head');
        var row = document.createElement('gui-list-view-row');
        Utils.$empty(head);

        el._columns = [];

        value.forEach(function(v) {
          v.visible = (typeof v.visible === 'undefined') || v.visible === true;

          var nel = createEntry(v, true);

          el._columns.push(v);

          if ( !v.visible ) {
            nel.style.display = 'none';
          }
          row.appendChild(nel);
        });

        head.appendChild(row);

        createFakeHeader(el);
        return true;
      } else if ( param === 'selected' || param === 'value' ) {
        var body = el.querySelector('gui-list-view-body');
        GUI.Elements._dataview.setSelected(el, body, body.querySelectorAll('gui-list-view-row'), value, arg);
        return true;
      }

      return false;
    },

    call: function(el, method, args) {
      var body = el.querySelector('gui-list-view-body');
      if ( method === 'add' ) {
        GUI.Elements._dataview.add(el, args, function(e) {
          var cbCreated = e.onCreated || function() {};
          var row = createRow(e);
          if ( row ) {
            body.appendChild(row);
            initRow(el, row);
          }

          cbCreated(row);
        });
      } else if ( method === 'remove' ) {
        GUI.Elements._dataview.remove(el, args, 'gui-list-view-row', null, body);
      } else if ( method === 'clear' ) {
        GUI.Elements._dataview.clear(el, el.querySelector('gui-list-view-body'));
      } else if ( method === 'patch' ) {
        GUI.Elements._dataview.patch(el, args, 'gui-list-view-row', body, createRow, initRow);
      } else if ( method === 'focus' ) {
        GUI.Elements._dataview.focus(el);
      }
      return this;
    },

    build: function(el, applyArgs) {
      el._columns  = [];

      // Make sure base elements are in the dom
      var inner = el.querySelector('gui-list-view-inner');
      var head = el.querySelector('gui-list-view-head');
      var body = el.querySelector('gui-list-view-body');

      function moveIntoInner(cel) {
        // So user can forget adding the inner
        if ( cel.parentNode.tagName !== 'GUI-LIST-VIEW-INNER' ) {
          inner.appendChild(cel);
        }
      }

      var fakeHead = el.querySelector('gui-list-view-fake-head');
      if ( !fakeHead ) {
        fakeHead = document.createElement('gui-list-view-fake-head');
        var fakeHeadInner = document.createElement('gui-list-view-inner');
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

      Utils.$bind(el, 'scroll', function(ev) {
        fakeHead.style.top = el.scrollTop + 'px';
      }, false);

      // Create scheme defined header
      var hcols = el.querySelectorAll('gui-list-view-head gui-list-view-column');
      hcols.forEach(function(cel, idx) {
        var vis = cel.getAttribute('data-visible');
        var iter = {
          visible: vis === null || vis === 'true',
          size: cel.getAttribute('data-size')
        };

        el._columns.push(iter);

        if ( !iter.visible ) {
          cel.style.display = 'none';
        }
      });

      createFakeHeader(el);

      // Create scheme defined rows
      el.querySelectorAll('gui-list-view-body gui-list-view-row').forEach(function(row) {
        initRow(el, row);
      });

      GUI.Elements._dataview.build(el, applyArgs);
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
