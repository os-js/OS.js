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
    var entry = GUI.Helpers.createElement('gui-icon-view-entry', e);
    return entry;
  }

  function initEntry(cls, cel) {
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

    cls.bindEntryEvents(cel, 'gui-icon-view-entry');

    cel.setAttribute('role', 'listitem');
    cel.appendChild(dicon);
    cel.appendChild(dlabel);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-icon-view'
   *
   * A container for displaying icons with labels
   *
   * For more properties and events etc, see 'dataview'
   *
   * <pre><code>
   *   property  icon-size   integer       Icon size (default=16)
   * </code></pre>
   *
   * @example
   *   .add([{
   *      label: "Label",
   *      icon: "Optional icon path",
   *      value: "something or JSON or whatever"
   *   }])
   *
   * @constructor IconView
   * @extends OSjs.GUI.DataView
   * @memberof OSjs.GUI.Elements
   */
  GUI.Element.register({
    parent: GUI.DataView,
    tagName: 'gui-icon-view'
  }, {
    values: function() {
      return this.getSelected(this.$element.querySelectorAll('gui-icon-view-entry'));
    },

    build: function() {
      var el = this.$element;
      var body = el.querySelector('gui-icon-view-body');
      var found = !!body;
      var self = this;

      if ( !found ) {
        body = document.createElement('gui-icon-view-body');
        el.appendChild(body);
      }

      el.querySelectorAll('gui-icon-view-entry').forEach(function(cel, idx) {
        if ( !found ) {
          body.appendChild(cel);
        }
        initEntry(self, cel);
      });

      el.setAttribute('role', 'list');

      return GUI.DataView.prototype.build.apply(this, arguments);
    },

    get: function(param, value, arg, asValue) {
      if ( param === 'entry' ) {
        var body = this.$element.querySelector('gui-icon-view-body');
        var rows = body.querySelectorAll('gui-icon-view-entry');
        return this.getEntry(rows, value, arg, asValue);
      }
      return GUI.DataView.prototype.get.apply(this, arguments);
    },

    set: function(param, value, arg) {
      var body = this.$element.querySelector('gui-icon-view-body');
      if ( param === 'selected' || param === 'value' ) {
        this.setSelected(body, body.querySelectorAll('gui-icon-view-entry'), value, arg);
        return this;
      }

      return GUI.DataView.prototype.set.apply(this, arguments);
    },

    add: function(entries) {
      var body = this.$element.querySelector('gui-icon-view-body');
      var self = this;

      return GUI.DataView.prototype.add.call(this, entries, function(cls, e) {
        var entry = createEntry(self, e);
        body.appendChild(entry);
        initEntry(self, entry);
      });
    },

    clear: function() {
      var body = this.$element.querySelector('gui-icon-view-body');
      return GUI.DataView.prototype.clear.call(this, body);
    },

    remove: function(entries) {
      return GUI.DataView.prototype.remove.call(this, entries, 'gui-icon-view-entry');
    },

    patch: function(entries) {
      var body = this.$element.querySelector('gui-icon-view-body');
      return GUI.DataView.prototype.patch.call(this, entries, 'gui-icon-view-entry', body, createEntry, initEntry);
    }

  });

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
