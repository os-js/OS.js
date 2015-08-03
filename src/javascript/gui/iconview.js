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

  function getViewNodeValue(found) {
    var value = found.getAttribute('data-value');
    try {
      value = JSON.parse(value);
    } catch ( e ) {
      value = null;
    }
    return value;
  }

  function handleItemClick(ev, item, idx, selected) {
  }

  function initEntry(el, cel) {
    function getSelected() {
      return GUI.Elements['gui-icon-view'].values(el);
    }

    var icon = cel.getAttribute('data-icon');
    var label = GUI.Helpers.getLabel(cel);

    var dicon = document.createElement('div');
    var dimg = document.createElement('img');
    dimg.src = icon;
    dicon.appendChild(dimg);

    var dlabel = document.createElement('div');
    var dspan = document.createElement('span');
    dspan.appendChild(document.createTextNode(label));
    dlabel.appendChild(dspan);

    Utils.$bind(cel, 'click', function(ev) {
      var idx = Utils.$index(cel);
      var multipleSelect = el.getAttribute('data-multiple');
      multipleSelect = multipleSelect === null || multipleSelect === 'true';
      el._selected = handleItemSelection(ev, cel, idx, 'gui-icon-view-entry', el._selected, null, multipleSelect);
      el.dispatchEvent(new CustomEvent('_select', {detail: {entries: getSelected()}}));
    }, false);
    Utils.$bind(cel, 'dblclick', function(ev) {
      var idx = Utils.$index(cel);
      el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected()}}));
    }, false);

    cel.appendChild(dicon);
    cel.appendChild(dlabel);
  }

  function addToView(el, args) {
    var entries = args[0];
    if ( !(entries instanceof Array) ) {
      entries = [entries];
    }

    entries.forEach(function(e) {
      var entry = GUI.Helpers.createElement('gui-icon-view-entry', e);
      el.appendChild(entry);
      initEntry(el, entry);
    });
  }

  function updateActiveSelection(el) {
    var active = [];
    el.querySelectorAll('gui-icon-view-entry.gui-active').forEach(function(cel) {
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
    el.querySelectorAll('gui-icon-view-entry[' + q + ']').forEach(remove);
    updateActiveSelection(el);
  }

  function patchIntoView(el, args) {
    // TODO
  }

  function clearView(el) {
    Utils.$empty(el);
    el.scrollTop = 0;
    el._selected = [];
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  GUI.Elements['gui-icon-view'] = {
    bind: function(el, evName, callback, params) {
      if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    values: function(el) {
      var selected = [];
      var active = (el._selected || []);

      active.forEach(function(iter) {
        var found = el.querySelectorAll('gui-icon-view-entry')[iter];
        if ( found ) {
          selected.push({
            index: iter,
            data: getViewNodeValue(found)
          });
        }
      });

      return selected;
    },
    build: function(el) {
      // TODO: Custom Icon Size
      // TODO: Set value (selected items)

      function getSelected() {
        return GUI.Elements['gui-icon-view'].values(el);
      }

      el.querySelectorAll('gui-icon-view-entry').forEach(function(cel, idx) {
        initEntry(el, cel);
      });
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

    values: function(el) {
      var selected = [];
      var active = (el._selected || []);
      active.forEach(function(iter) {
        var found = el.querySelectorAll('gui-icon-view-entry')[iter];
        if ( found ) {
          selected.push({index: iter, data: getViewNodeValue(found)});
        }
      });
      return selected;
    },
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
