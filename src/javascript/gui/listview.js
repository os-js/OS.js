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

  function setHeadFlex(el, cell) {
    var basis = cell.getAttribute('data-basis') || '';
    var grow  = basis ? 0 : 1;
    GUI.Helpers.setFlexbox(cell, grow, null, basis);
  }

  function setBodyFlex(el, cell, idx, cols) {
    var col = cols[idx];
    var basis = col ? col.getAttribute('data-basis') : null;
    var grow = col ? col.getAttribute('data-grow') : null;
    if ( basis ) {
      grow = 0;
    }

    GUI.Helpers.setFlexbox(cell,
      grow,
      col ? col.getAttribute('data-shrink') : null,
      basis );
  }

  function scrollIntoView(el, element) {
    var pos = Utils.$position(element, el);
    if ( pos !== null && 
         (pos.top > (el.scrollTop + el.offsetHeight) || 
         (pos.top < el.scrollTop)) ) {
      el.scrollTop = pos.top;
    }
  }

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
    var singleClick = el.getAttribute('data-single-click') === 'true';

    function getSelected() {
      return GUI.Elements['gui-list-view'].values(el);
    }

    row.querySelectorAll('gui-list-view-column').forEach(function(cel, idx) {
      var cl = cols.length;
      var x = cl ? idx % cl : idx;

      setBodyFlex(el, cel, x, cols);

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

    if ( singleClick ) {
      Utils.$bind(row, 'click', function(ev) {
        var multipleSelect = el.getAttribute('data-multiple');
        multipleSelect = multipleSelect === null || multipleSelect === 'true';
        var idx = Utils.$index(row);
        el._selected = GUI.Helpers.handleItemSelection(ev, row, idx, 'gui-list-view-row', el._selected, null, multipleSelect);

        var selected = getSelected();
        el.dispatchEvent(new CustomEvent('_select', {detail: {entries: selected}}));
        el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: selected}}));
      });
    } else {
      Utils.$bind(row, 'click', function(ev) {
        var multipleSelect = el.getAttribute('data-multiple');
        multipleSelect = multipleSelect === null || multipleSelect === 'true';

        var idx = Utils.$index(row);
        el._selected = GUI.Helpers.handleItemSelection(ev, row, idx, 'gui-list-view-row', el._selected, null, multipleSelect);
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

  function addToView(el, args) {
    var cols = el.querySelectorAll('gui-list-view-head gui-list-view-column');
    var body = el.querySelector('gui-list-view-body');
    var entries = args[0];
    if ( !(entries instanceof Array) ) {
      entries = [entries];
    }

    entries.forEach(function(e) {
      var row = createRow(e);
      if ( row ) {
        body.appendChild(row);
        initRow(el, row);
      }
    });
  }

  function updateActiveSelection(el) {
    var active = [];
    el.querySelectorAll('gui-list-view-row.gui-active').forEach(function(cel) {
      active.push(Utils.$index(cel));
    });
    el._active = active;
  }

  function removeFromView(el, args, target) {
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
    el.querySelectorAll('gui-list-view-body > gui-list-view-row[' + q + ']').forEach(remove);
    updateActiveSelection(el);
  }

  function patchIntoView(el, args) {
    var entries = args[0];
    var single = false;
    var body = el.querySelector('gui-list-view-body');

    if ( !(entries instanceof Array) ) {
      entries = [entries];
      single = true;
    }

    var inView = {};
    el.querySelectorAll('gui-list-view-body > gui-list-view-row').forEach(function(row) {
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

        var row = createRow(entry);
        if ( row ) {
          if ( insertBefore ) {
            if ( Utils.$hasClass(insertBefore, 'gui-active') ) {
              Utils.$addClass(row, 'gui-active');
            }

            body.insertBefore(row, insertBefore);
            removeFromView(el, null, insertBefore);
          } else {
            body.appendChild(row);
          }
          initRow(el, row);
        }
      }
    });

    if ( !single ) {
      Object.keys(inView).forEach(function(k) {
        removeFromView(el, null, inView[k]);
      });
    }

    inView = {};
    updateActiveSelection(el);
  }

  function clearView(el) {
    Utils.$empty(el.querySelector('gui-list-view-body'));
    el.scrollTop = 0;
    el._selected = [];
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  GUI.Elements['gui-list-view'] = {
    bind: function(el, evName, callback, params) {
      if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    values: function(el) {
      var selected = [];
      var body = el.querySelector('gui-list-view-body');
      var active = (el._selected || []);

      active.forEach(function(iter) {
        var found = body.querySelectorAll('gui-list-view-row')[iter];
        if ( found ) {
          selected.push({index: iter, data: GUI.Helpers.getViewNodeValue(found)});
        }
      });
      return selected;
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

          setHeadFlex(el, nel);
        });

        head.appendChild(row);

        createResizers(el);
        return;
      } else if ( param === 'selected' ) {
        var body = el.querySelector('gui-list-view-body');
        var select = [];

        body.querySelectorAll('gui-list-view-row').forEach(function(r, idx) {
          Utils.$removeClass(r, 'gui-active');

          try {
            var json = JSON.parse(r.getAttribute('data-value'));
            if ( json[arg] == value ) {
              select.push(idx);
              Utils.$addClass(r, 'gui-active');
              scrollIntoView(el, r);
            }
          } catch ( e ) {}
        });

        el._selected = select;

        return;
      }

      setProperty(el, param, value);
    },
    call: function(el, method, args) {
      if ( method === 'add' ) {
        addToView(el, args);
      } else if ( method === 'remove' ) {
        removeFromView(el, args);
      } else if ( method === 'clear' ) {
        clearView(el);
      } else if ( method === 'patch' ) {
        patchIntoView(el, args);
      }
    },
    build: function(el, applyArgs) {
      el._selected = [];
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

      createResizers(el);

      Utils.$bind(el, 'scroll', function() {
        head.style.top = el.scrollTop + 'px';
      }, false);


      // Create scheme defined header
      el.querySelectorAll('gui-list-view-head gui-list-view-column').forEach(function(cel, idx) {
        setHeadFlex(el, cel);

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
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
