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
import * as GUI from 'utils/gui';
import GUIDataView from 'gui/dataview';

/////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////

function createEntry(cls, e) {
  const entry = GUI.createElement('gui-icon-view-entry', e);
  return entry;
}

function initEntry(cls, cel) {
  const icon = cel.getAttribute('data-icon');
  const label = GUI.getLabel(cel);

  const dicon = document.createElement('div');
  const dimg = document.createElement('img');
  dimg.src = icon;
  dicon.appendChild(dimg);

  const dlabel = document.createElement('div');
  const dspan = document.createElement('span');
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
 */
class GUIIconView extends GUIDataView {
  static register() {
    return super.register({
      parent: GUIDataView,
      tagName: 'gui-icon-view'
    }, this);
  }

  values() {
    return this.getSelected(this.$element.querySelectorAll('gui-icon-view-entry'));
  }

  build() {
    const el = this.$element;
    let body = el.querySelector('gui-icon-view-body');
    const found = !!body;

    if ( !found ) {
      body = document.createElement('gui-icon-view-body');
      el.appendChild(body);
    }

    el.querySelectorAll('gui-icon-view-entry').forEach((cel, idx) => {
      if ( !found ) {
        body.appendChild(cel);
      }
      initEntry(this, cel);
    });

    el.setAttribute('role', 'list');

    return super.build(...arguments);
  }

  get(param, value, arg, asValue) {
    if ( param === 'entry' ) {
      const body = this.$element.querySelector('gui-icon-view-body');
      const rows = body.querySelectorAll('gui-icon-view-entry');
      return this.getEntry(rows, value, arg, asValue);
    }
    return super.get(...arguments);
  }

  set(param, value, arg) {
    const body = this.$element.querySelector('gui-icon-view-body');
    if ( param === 'selected' || param === 'value' ) {
      if ( body ) {
        this.setSelected(body, body.querySelectorAll('gui-icon-view-entry'), value, arg);
      }
      return this;
    }

    return super.set(...arguments);
  }

  add(entries) {
    const body = this.$element.querySelector('gui-icon-view-body');
    return super.add(entries, (cls, e) => {
      const entry = createEntry(this, e);
      body.appendChild(entry);
      initEntry(this, entry);
    });
  }

  clear() {
    const body = this.$element.querySelector('gui-icon-view-body');
    return super.clear(body);
  }

  remove(entries) {
    return super.remove(entries, 'gui-icon-view-entry');
  }

  patch(entries) {
    const body = this.$element.querySelector('gui-icon-view-body');
    return super.patch(entries, 'gui-icon-view-entry', body, createEntry, initEntry);
  }

}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default {
  GUIIconView: GUIIconView
};
