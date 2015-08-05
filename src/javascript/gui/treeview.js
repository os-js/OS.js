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

  function createEntry(e) {
    // TODO: Recursive
    var entry = GUI.Helpers.createElement('gui-tree-view-entry', e);
    return entry;
  }

  function initEntry(el, sel) {
    // TODO: Custom Icon Size

    var icon = sel.getAttribute('data-icon');
    var label = GUI.Helpers.getLabel(sel);
    var expanded = sel.getAttribute('data-expanded') === 'true';
    var next = sel.querySelector('gui-tree-view-entry');
    var container = document.createElement('div');
    var dspan = document.createElement('span');

    function handleItemExpand(ev, root, expanded) {
      if ( typeof expanded === 'undefined' ) {
        expanded = !Utils.$hasClass(root, 'gui-expanded');
      }

      Utils.$removeClass(root, 'gui-expanded');
      if ( expanded ) {
        Utils.$addClass(root, 'gui-expanded');
      }

      var children = root.children;
      for ( var i = 0; i < children.length; i++ ) {
        if ( children[i].tagName.toLowerCase() === 'gui-tree-view-entry' ) {
          children[i].style.display = expanded ? 'block' : 'none';
        }
      }

      var idx = Utils.$index(root);
      var entries = el.querySelectorAll('gui-tree-view-entry')[idx];
      var selected = null;
      if ( entries[idx] ) {
        selected = {
          index: idx,
          data: GUI.Helpers.getViewNodeValue(entries[idx])
        };
      }
      el.dispatchEvent(new CustomEvent('_expand', {detail: {entries: selected}}));
    }

    if ( icon ) {
      dspan.style.backgroundImage = 'url(' + icon + ')';
      Utils.$addClass(dspan, 'gui-has-image');
    }
    dspan.appendChild(document.createTextNode(label));

    container.appendChild(dspan);

    if ( next ) {
      Utils.$addClass(sel, 'gui-expandable');
      var expander = document.createElement('gui-tree-view-expander');
      Utils.$bind(expander, 'click', function(ev) {
        handleItemExpand(ev, sel);
      });

      sel.insertBefore(container, next);
      sel.insertBefore(expander, container);
    } else {
      sel.appendChild(container);
    }

    handleItemExpand(null, sel, expanded);

    GUI.Elements._dataview.bindEntryEvents(el, sel, 'gui-tree-view-entry');
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-tree-view'
   *
   * A tree view for nested content
   *
   * Format for add():
   *
   * {
   *    label: "Label",
   *    icon: "Optional icon path",
   *    value: "something or JSON or whatever",
   *    entries: [] // Recurse :)
   * }
   *
   * @api OSjs.GUI.Elements.gui-tree-view
   * @see OSjs.GUI.Elements._dataview
   * @class
   */
  GUI.Elements['gui-tree-view'] = {
    bind: GUI.Elements._dataview.bind,

    values: function(el) {
      return GUI.Elements._dataview.getSelected(el, el.querySelectorAll('gui-tree-view-entry'));
    },

    build: function(el) {
      el.querySelectorAll('gui-tree-view-entry').forEach(function(sel, idx) {
        initEntry(el, sel);
      });
    },

    set: function(el, param, value, arg) {
      if ( param === 'selected' || param === 'value' ) {
        GUI.Elements._dataview.setSelected(el, el.querySelectorAll('gui-icon-view-entry'), value, arg);
        return true;
      }

      return false;
    },

    call: function(el, method, args) {
      if ( method === 'add' ) {
        GUI.Elements._dataview.add(el, args, function(e) {
          var entry = createEntry(e);
          el.appendChild(entry);
          initEntry(el, entry);
        });
      } else if ( method === 'remove' ) {
        GUI.Elements._dataview.remove(el, args, 'gui-icon-tree-entry');
      } else if ( method === 'clear' ) {
        GUI.Elements._dataview.clear(el);
      } else if ( method === 'patch' ) {
        GUI.Elements._dataview.patch(el, args, 'gui-icon-tree-entry', el, createEntry, initEntry);
      }
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
