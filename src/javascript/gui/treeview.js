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


  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  GUI.Elements['gui-tree-view'] = {
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
        var found = el.querySelectorAll('gui-tree-view-entry')[iter];
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
        return GUI.Elements['gui-tree-view'].values(el);
      }

      function handleItemClick(ev, item, idx, selected) {
        var multipleSelect = el.getAttribute('data-multiple');
        multipleSelect = multipleSelect === null || multipleSelect === 'true';

        return handleItemSelection(ev, item, idx, 'gui-tree-view-entry', selected, el, multipleSelect);
      }

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
      }

      el.querySelectorAll('gui-tree-view-entry').forEach(function(sel, idx) {

        var icon = sel.getAttribute('data-icon');
        var label = GUI.Helpers.getLabel(sel);
        var expanded = sel.getAttribute('data-expanded') === 'true';
        var next = sel.querySelector('gui-tree-view-entry');

        var container = document.createElement('div');
        var dspan = document.createElement('span');
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

        Utils.$bind(container, 'click', function(ev) {
          el._selected = handleItemClick(ev, sel, idx, el._selected);
          el.dispatchEvent(new CustomEvent('_select', {detail: {entries: getSelected()}}));
        }, false);
        Utils.$bind(container, 'dblclick', function(ev) {
          el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected()}}));
        }, false);

      });
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
