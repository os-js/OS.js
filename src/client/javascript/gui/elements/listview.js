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

  /*
   * Applies DOM changes for a row to be rendered properly
   */
  function initRow(cls, row) {
    var el = cls.$element;

    row.querySelectorAll('gui-list-view-column').forEach(function(cel, idx) {
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

    cls.bindEntryEvents(row, 'gui-list-view-row');
  }

  /*
   * Creates a new `gui-list-view-column`
   */
  function createEntry(cls, v, head) {
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

  /*
   * Creates a new `gui-list-view-row` from iter
   */
  function createRow(cls, e) {
    e = e || {};
    if ( e.columns ) {
      var row = GUI.Helpers.createElement('gui-list-view-row', e, ['columns']);

      e.columns.forEach(function(se) {
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
   *
   * @constructor ListView
   * @extends OSjs.GUI.DataView
   * @memberof OSjs.GUI.Elements
   */
  GUI.Element.register({
    parent: GUI.DataView,
    tagName: 'gui-list-view'
  }, {

    values: function() {
      var body = this.$element.querySelector('gui-list-view-body');
      var values = this.getSelected(body.querySelectorAll('gui-list-view-row'));
      return values;
    },

    get: function(param, value, arg, asValue) {
      if ( param === 'entry' ) {
        var body = this.$element.querySelector('gui-list-view-body');
        var rows = body.querySelectorAll('gui-list-view-row');
        return this.getEntry(rows, value, arg, asValue);
      }
      return GUI.DataView.prototype.get.apply(this, arguments);
    },

    set: function(param, value, arg, arg2) {
      var el = this.$element;
      var self = this;

      if ( param === 'columns' ) {
        var head = el.querySelector('gui-list-view-head');
        var row = document.createElement('gui-list-view-row');
        Utils.$empty(head);

        el._columns = [];

        value.forEach(function(v) {
          v.visible = (typeof v.visible === 'undefined') || v.visible === true;

          var nel = createEntry(self, v, true);

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
        var body = el.querySelector('gui-list-view-body');
        this.setSelected(body, body.querySelectorAll('gui-list-view-row'), value, arg, arg2);
        return this;
      }

      return GUI.DataView.prototype.set.apply(this, arguments);
    },

    add: function(entries) {
      var body = this.$element.querySelector('gui-list-view-body');
      var self = this;

      return GUI.DataView.prototype.add.call(this, entries, function(cls, e) {
        var cbCreated = e.onCreated || function() {};
        var row = createRow(self, e);
        if ( row ) {
          body.appendChild(row);
          initRow(self, row);
        }

        cbCreated(row);
      });
    },

    clear: function() {
      var body = this.$element.querySelector('gui-list-view-body');
      return GUI.DataView.prototype.clear.call(this, body);
    },

    remove: function(entries) {
      var body = this.$element.querySelector('gui-list-view-body');
      return GUI.DataView.prototype.remove.call(this, entries, 'gui-list-view-row', null, body);
    },

    patch: function(entries) {
      var body = this.$element.querySelector('gui-list-view-body');
      return GUI.DataView.prototype.patch.call(this, entries, 'gui-list-view-row', body, createRow, initRow);
    },

    build: function() {
      var el = this.$element;
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
      el.querySelectorAll('gui-list-view-body gui-list-view-row').forEach(function(row) {
        initRow(self, row);
      });

      return GUI.DataView.prototype.build.apply(this, arguments);
    }
  });

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
