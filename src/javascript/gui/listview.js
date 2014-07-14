"use strict";
/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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
(function(GUIElement, _DataView) {

  /**
   * List View Class
   *
   * column data example:
   * [
   *   {key: 'mykey', title: 'Title'},
   *   {key: 'id', visible: false}
   * ]
   * row data example:
   * [
   *  {mykey: 'Some title', id: 1},
   *  {mykey: 'Some title', id: 2}
   * ]
   *
   * options: (See _DataView for more)
   *  columns           Object          Columns
   *  rows              Array           Rows (data alias)
   *  singleClick       bool            Single click to Activate (dblclick) forced on touch devices
   */
  var ListView = function(name, opts) {
    opts = opts || {};

    if ( opts.rows ) {
      opts.data = opts.rows;
      delete opts.rows;
    }


    this.columns          = opts.columns || [];
    this.$head            = null;
    this.$headTop         = null;
    this.$body            = null;
    this.$table           = null;
    this.$tableTop        = null;
    this.$scroll          = null;
    this.lastSelectedDOM  = null;
    this.onCreateItem     = opts.onCreateItem   || function(el, iter, col) {};

    this.singleClick      = typeof opts.singleClick === 'undefined' ? false : (opts.singleClick === true);
    if ( OSjs.Utils.getCompability().touch ) {
      this.singleClick = true;
    }

    _DataView.apply(this, ['ListView', name, opts]);
  };

  ListView.prototype = Object.create(_DataView.prototype);

  ListView.prototype.destroy = function() {
    _DataView.prototype.destroy.apply(this, arguments);
  };

  ListView.prototype.init = function() {
    var el = _DataView.prototype.init.apply(this, ['GUIListView', false]);

    var startW = 0;
    var startX = 0;
    var column = null;
    var self = this;

    var onResizeMove = function(ev) {
      var newW = startW + (ev.clientX - startX);
      if ( column >= 0 && newW >= 16 ) {
        self.$headTop.rows[0].childNodes[column].width = newW;
        self.$body.rows[0].childNodes[column].width = newW;
      }
    };

    var onResizeEnd = function(ev) {
      document.removeEventListener('mouseup',   onResizeEnd,  false);
      document.removeEventListener('mousemove', onResizeMove, false);
    };

    var onResizeStart = function(ev, col) {
      startX = ev.clientX;
      startW = col.offsetWidth;
      column = col.parentNode.getAttribute("data-index");

      document.addEventListener('mouseup',    onResizeEnd,  false);
      document.addEventListener('mousemove',  onResizeMove, false);
    };

    var onHeaderAction = function(ev, type) {
      ev.preventDefault();
      var t = ev.target;
      if ( t.tagName === 'DIV' ) {
        if ( type === 'mousedown' && t.className === 'Resizer' ) {
          onResizeStart(ev, t.parentNode);
        } else if ( type === 'click' && t.className === 'Label' ) {
          var col = t.parentNode.className.replace('Column_', '');
          self._onColumnClick(ev, col);
        }
        return false;
      }
      return true;
    };

    var table = document.createElement('table');
    table.className = 'Body';

    var head = document.createElement('thead');
    var body = document.createElement('tbody');

    var tableTop        = document.createElement('table');
    var headTop         = document.createElement('thead');
    tableTop.className  = 'Header';

    this.$scroll            = document.createElement('div');
    this.$scroll.className  = 'Scroll';
    this.$scroll.appendChild(table);

    this._addEventListener(tableTop, 'mousedown', function(ev) {
      return onHeaderAction(ev, 'mousedown');
    });
    this._addEventListener(tableTop, 'click', function(ev) {
      return onHeaderAction(ev, 'click');
    });
    this._addEventListener(this.$scroll, 'scroll', function(ev) {
      tableTop.style.left = -this.scrollLeft + 'px';
    });
    this._addEvent(this.$scroll, 'oncontextmenu', function(ev) {
      ev.stopPropagation(); // Or else eventual ContextMenu is blurred
      ev.preventDefault();

      self.onViewContextMenu.call(self, ev);

      return false;
    });

    this._addEventListener(el, "scroll", function(ev) {
      self.fixScrollbar();
    });

    table.appendChild(head);
    table.appendChild(body);
    tableTop.appendChild(headTop);
    el.appendChild(tableTop);
    el.appendChild(this.$scroll);

    this.$head      = head;
    this.$headTop   = headTop;
    this.$body      = body;
    this.$table     = table;
    this.$tableTop  = tableTop;
    this.$view      = this.$scroll; // NOTE: Shorthand
  };

  ListView.prototype._render = function(list, columns) {
    var self = this;
    var i, l, ii, ll, row, col, colref, iter, val, type, tmp, d, span, label, resizer;

    // Columns (header)
    row = document.createElement('tr');
    for ( i = 0, l = columns.length; i < l; i++ ) {
      colref = columns[i];
      if ( typeof colref.visible !== 'undefined' && colref.visible === false ) { continue; }

      col           = document.createElement('td');
      col.className = 'Column_' + colref.key;
      col.setAttribute("data-index", i);

      label           = document.createElement('div');
      label.className = 'Label';
      label.appendChild(document.createTextNode(colref.title));

      if ( typeof colref.resizable === 'undefined' || colref.resizable === true ) {
        if ( i < (l-i) ) {
          resizer           = document.createElement('div');
          resizer.className = 'Resizer';
          label.appendChild(resizer);
        }
      }
      col.appendChild(label);

      if ( colref.domProperties ) {
        for ( d in colref.domProperties ) {
          if ( colref.domProperties.hasOwnProperty(d) ) {
            col.setAttribute(d, colref.domProperties[d]);
          }
        }
      }
      row.appendChild(col);
    }
    this.$head.appendChild(row);
    this.$headTop.appendChild(row);

    // Rows (data)
    for ( i = 0, l = list.length; i < l; i++ ) {
      row = document.createElement('tr');
      iter = list[i];

      for ( ii = 0, ll = columns.length; ii < ll; ii++ ) {
        span = null;

        colref = columns[ii];
        row.setAttribute('data-' + colref.key, iter[colref.key]);

        if ( (typeof colref.visible !== 'undefined' && colref.visible === false) ) { continue; }
        type = (typeof colref.type === 'undefined') ? 'text' : colref.type;
        col = document.createElement('td');
        col.className = 'Column_' + colref.key;

        if ( colref.callback ) {
          val = colref.callback(iter);
        } else {
          val = iter[colref.key];
        }

        if ( colref.domProperties ) {
          for ( d in colref.domProperties ) {
            if ( colref.domProperties.hasOwnProperty(d) ) {
              col.setAttribute(d, colref.domProperties[d]);
            }
          }
        }

        if ( type === 'image' ) {
          tmp = document.createElement('img');
          //tmp.ondragstart = function() { return false; };
          tmp.alt = '';
          tmp.src = val;
          col.appendChild(tmp);
          row.removeAttribute('data-' + colref.key);
        } else if ( type === 'button' ) {
          tmp = document.createElement('button');
          tmp.appendChild(document.createTextNode(val || ''));
          tmp.onclick = iter.customEvent;
          col.appendChild(tmp);
          row.removeAttribute('data-' + colref.key);
        } else {
          span = document.createElement('span');
          span.appendChild(document.createTextNode(val || ''));
          col.appendChild(span);
        }

        // FIXME: ListView - Use local event listener adding

        row.oncontextmenu = (function(it) {
          return function(ev) {
            ev.stopPropagation(); // Or else eventual ContextMenu is blurred
            ev.preventDefault();

            self._onContextMenu(ev, it);
          };
        })(this.data[i]);

        if ( this.singleClick ) {
          row.onclick = (function(it) {
            return function(ev) {
              self._onSelect(ev, it);
              self._onActivate(ev, it);
            };
          })(this.data[i]);
        } else {
          row.onclick = (function(it) {
            return function(ev) {
              self._onSelect(ev, it);
            };
          })(this.data[i]);

          row.ondblclick = (function(it) {
            return function(ev) {
              self._onActivate(ev, it);
            };
          })(this.data[i]);
        }


        row.appendChild(col);
      }
      this.$body.appendChild(row);

      this.onCreateItem(row, iter, colref);

      this.data[i]._index   = i;
      this.data[i]._element = row;
    }

    this.fixScrollbar();
  };

  ListView.prototype.render = function(data, reset) {
    if ( !_DataView.prototype.render.apply(this, arguments) ) {
      return;
    }

    this._render(this.data, this.columns);
  };

  ListView.prototype._onRender = function() {
    OSjs.Utils.$empty(this.$head);
    OSjs.Utils.$empty(this.$body);
    OSjs.Utils.$empty(this.$headTop);
  };

  ListView.prototype._onColumnClick = function(ev, col) {
  };

  ListView.prototype.fixScrollbar = function() {
    if ( !this.$element ) { return; }
    this.$tableTop.style.top = this.$element.scrollTop + "px";
  };

  ListView.prototype.addColumn = function(c) {
    this.columns.push(c);
  };

  ListView.prototype.addRow = function(r) {
    this.rows.push(r);
  };

  ListView.prototype.setColumns = function(cols) {
    this.columns = cols || [];
  };

  ListView.prototype.setRows = function(rows, render) {
    this.setData.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.ListView     = ListView;

})(OSjs.GUI.GUIElement, OSjs.GUI._DataView);
