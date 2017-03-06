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

  function createEntry(cls, e) {
    var entry = GUI.Helpers.createElement('gui-tree-view-entry', e, ['entries']);
    return entry;
  }

  function handleItemExpand(ev, el, root, expanded) {
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

    var selected = {
      index: Utils.$index(root),
      data: GUI.Helpers.getViewNodeValue(root)
    };

    root.setAttribute('data-expanded', String(expanded));
    root.setAttribute('aria-expanded', String(expanded));

    el.dispatchEvent(new CustomEvent('_expand', {detail: {entries: [selected], expanded: expanded, element: root}}));
  } // handleItemExpand()

  function initEntry(cls, sel) {
    var el = cls.$element;
    if ( sel._rendered ) {
      return;
    }
    sel._rendered = true;

    var icon = sel.getAttribute('data-icon');
    var label = GUI.Helpers.getLabel(sel);
    var expanded = el.getAttribute('data-expanded') === 'true';
    var next = sel.querySelector('gui-tree-view-entry');
    var container = document.createElement('div');
    var dspan = document.createElement('span');

    function onDndEnter(ev) {
      ev.stopPropagation();
      Utils.$addClass(sel, 'dnd-over');
    }

    function onDndLeave(ev) {
      Utils.$removeClass(sel, 'dnd-over');
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
      sel.insertBefore(container, next);
      sel.insertBefore(expander, container);
    } else {
      sel.appendChild(container);
    }

    if ( String(sel.getAttribute('data-draggable')) === 'true' ) {
      GUI.Helpers.createDraggable(container, (function() {
        var data = {};
        try {
          data = JSON.parse(sel.getAttribute('data-value'));
        } catch ( e ) {}

        return {data: data};
      })());
    }

    if ( String(sel.getAttribute('data-droppable')) === 'true' ) {
      var timeout;
      GUI.Helpers.createDroppable(container, {
        onEnter: onDndEnter,
        onOver: onDndEnter,
        onLeave: onDndLeave,
        onDrop: onDndLeave,
        onItemDropped: function(ev, eel, item) {
          ev.stopPropagation();
          ev.preventDefault();

          timeout = clearTimeout(timeout);
          timeout = setTimeout(function() {
            Utils.$removeClass(sel, 'dnd-over');
          }, 10);

          var dval = {};
          try {
            dval = JSON.parse(eel.parentNode.getAttribute('data-value'));
          } catch ( e ) {}

          el.dispatchEvent(new CustomEvent('_drop', {detail: {
            src: item.data,
            dest: dval
          }}));
        }
      });
    }

    handleItemExpand(null, el, sel, expanded);

    cls.bindEntryEvents(sel, 'gui-tree-view-entry');
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-tree-view'
   *
   * A tree view for nested content
   *
   * For more properties and events etc, see 'dataview'
   *
   * @example
   *
   *   .add({
   *      label: "Label",
   *      icon: "Optional icon path",
   *      value: "something or JSON or whatever",
   *      entries: [] // Recurse :)
   *   })
   *
   * @constructor TreeView
   * @extends OSjs.GUI.DataView
   * @memberof OSjs.GUI.Elements
   */
  GUI.Element.register({
    parent: GUI.DataView,
    tagName: 'gui-tree-view'
  }, {

    values: function() {
      var el = this.$element;
      return this.getSelected(el.querySelectorAll('gui-tree-view-entry'));
    },

    build: function(applyArgs) {
      var el = this.$element;
      var body = el.querySelector('gui-tree-view-body');
      var found = !!body;
      var self = this;

      if ( !body ) {
        body = document.createElement('gui-tree-view-body');
        el.appendChild(body);
      }

      body.setAttribute('role', 'group');
      el.setAttribute('role', 'tree');
      el.setAttribute('aria-multiselectable', body.getAttribute('data-multiselect') || 'false');

      el.querySelectorAll('gui-tree-view-entry').forEach(function(sel, idx) {
        sel.setAttribute('aria-expanded', 'false');

        if ( !found ) {
          body.appendChild(sel);
        }

        sel.setAttribute('role', 'treeitem');
        initEntry(self, sel);
      });

      return GUI.DataView.prototype.build.apply(this, arguments);
    },

    get: function(param, value, arg) {
      if ( param === 'entry' ) {
        var body = this.$element.querySelector('gui-tree-view-body');
        return this.getEntry(body.querySelectorAll('gui-tree-view-entry'), value, arg);
      }
      return GUI.DataView.prototype.get.apply(this, arguments);
    },

    set: function(param, value, arg, arg2) {
      var el = this.$element;
      var body = el.querySelector('gui-tree-view-body');
      if ( param === 'selected' || param === 'value' ) {
        this.setSelected(body, body.querySelectorAll('gui-tree-view-entry'), value, arg, arg2);
        return this;
      }
      return GUI.DataView.prototype.set.apply(this, arguments);
    },

    clear: function() {
      var body = this.$element.querySelector('gui-tree-view-body');
      return GUI.DataView.prototype.clear.call(this, body);
    },

    add: function(entries) {
      var body = this.$element.querySelector('gui-tree-view-body');
      var parentNode = body;
      var adder = GUI.DataView.prototype.add;
      var self = this;

      function recurse(a, root, level) {
        adder.call(self, a, function(cls, e) {
          if ( e ) {
            if ( e.parentNode ) {
              delete e.parentNode;
            }

            var entry = createEntry(self, e);
            root.appendChild(entry);

            if ( e.entries ) {
              recurse(e.entries, entry, level + 1);
            }

            initEntry(self, entry);
          }
        });
      }

      if ( typeof entries === 'object' && !(entries instanceof Array) && Object.keys(entries).length ) {
        entries = entries.entries || [];
        parentNode = entries.parentNode || body;
      }

      recurse(entries, parentNode, 0);

      return this;
    },

    remove: function(entries) {
      return GUI.DataView.prototype.remove.call(this, entries, 'gui-tree-view-entry');
    },

    patch: function(entries) {
      var body = this.$element.querySelector('gui-tree-view-body');
      return GUI.DataView.prototype.patch.call(this, entries, 'gui-list-view-entry', body, createEntry, initEntry);
    },

    expand: function(entry) {
      handleItemExpand(entry.ev, this.$element, entry.entry);
      return this;
    }
  });

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
