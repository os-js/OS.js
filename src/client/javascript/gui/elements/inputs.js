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
import * as DOM from 'utils/dom';
import * as GUI from 'utils/gui';
import * as Clipboard from 'utils/clipboard';
import * as Events from 'utils/events';
import Keycodes from 'utils/keycodes';
import GUIElement from 'gui/element';
import {_} from 'core/locales';

let _buttonCount = 0;

/////////////////////////////////////////////////////////////////////////////
// INPUT HELPERS
/////////////////////////////////////////////////////////////////////////////

function createInputOfType(el, type) {
  const group = el.getAttribute('data-group');
  const placeholder = el.getAttribute('data-placeholder');
  const disabled = String(el.getAttribute('data-disabled')) === 'true';
  const value = el.childNodes.length ? el.childNodes[0].nodeValue : null;
  DOM.$empty(el);

  const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');

  const attribs = {
    value: null,
    type: type,
    tabindex: -1,
    placeholder: placeholder,
    disabled: disabled ? 'disabled' : null,
    name: group ? group + '[]' : null
  };

  (['autocomplete', 'autocorrect', 'autocapitalize', 'spellcheck']).forEach((a) => {
    attribs[a] = el.getAttribute('data-' + a) || 'false';
  });

  function _bindDefaults() {
    if ( ['range', 'slider'].indexOf(type) >= 0 ) {
      attribs.min = el.getAttribute('data-min');
      attribs.max = el.getAttribute('data-max');
      attribs.step = el.getAttribute('data-step');
    } else if ( ['radio', 'checkbox'].indexOf(type) >= 0 ) {
      if ( el.getAttribute('data-value') === 'true' ) {
        attribs.checked = 'checked';
      }
    } else if ( ['text', 'password', 'textarea'].indexOf(type) >= 0 ) {
      attribs.value = value || '';
    }

    Object.keys(attribs).forEach((a) => {
      if ( attribs[a] !== null ) {
        if ( a === 'value' ) {
          input.value = attribs[a];
        } else {
          input.setAttribute(a, attribs[a]);
        }
      }
    });
  }
  function _bindEvents() {
    if ( type === 'text' || type === 'password' || type === 'textarea' ) {
      Events.$bind(input, 'keydown', (ev) => {
        if ( ev.keyCode === Keycodes.ENTER ) {
          input.dispatchEvent(new CustomEvent('_enter', {detail: input.value}));
        } else if ( ev.keyCode === Keycodes.C && ev.ctrlKey ) {
          Clipboard.setClipboard(input.value);
        }

        if ( type === 'textarea' && ev.keyCode === Keycodes.TAB ) {
          ev.preventDefault();
          input.value += '\t';
        }
      }, false);
    }
  }

  function _create() {
    _bindDefaults();
    _bindEvents();

    GUI.createInputLabel(el, type, input);

    const rolemap = {
      'TEXTAREA': () => {
        return 'textbox';
      },
      'INPUT': (i) => {
        const typemap = {
          'range': 'slider',
          'text': 'textbox',
          'password': 'textbox'
        };

        return typemap[i.type] || i.type;
      }
    };

    if ( rolemap[el.tagName] ) {
      input.setAttribute('role', rolemap[el.tagName](input));
    }
    input.setAttribute('aria-label', el.getAttribute('title') || '');
    el.setAttribute('role', 'region');
    el.setAttribute('aria-disabled', String(disabled));

    Events.$bind(input, 'change', (ev) => {
      let value = input.value;
      if ( type === 'radio' || type === 'checkbox' ) {
        //value = input.getAttribute('checked') === 'checked';
        value = input.checked; //input.value === 'on';
      }
      input.dispatchEvent(new CustomEvent('_change', {detail: value}));
    }, false);
  }

  _create();
}

/////////////////////////////////////////////////////////////////////////////
// SELECT HELPERS
/////////////////////////////////////////////////////////////////////////////

function addToSelectBox(el, entries) {
  const target = el.querySelector('select');
  if ( !(entries instanceof Array) ) {
    entries = [entries];
  }

  entries.forEach((e) => {
    const opt = document.createElement('option');
    opt.setAttribute('role', 'option');
    opt.setAttribute('value', e.value);
    opt.appendChild(document.createTextNode(e.label));

    target.appendChild(opt);
  });
}

function removeFromSelectBox(el, what) {
  const target = el.querySelector('select');
  target.querySelectorAll('option').forEach((opt) => {
    if ( String(opt.value) === String(what) ) {
      DOM.$remove(opt);
      return false;
    }
    return true;
  });
}

function createSelectInput(el, multiple) {
  const disabled = el.getAttribute('data-disabled') !== null;
  const selected = el.getAttribute('data-selected');

  const select = document.createElement('select');
  if ( multiple ) {
    select.setAttribute('size', el.getAttribute('data-size') || 2);
    multiple = el.getAttribute('data-multiple') === 'true';
  }

  if ( multiple ) {
    select.setAttribute('multiple', 'multiple');
  }
  if ( disabled ) {
    select.setAttribute('disabled', 'disabled');
  }
  if ( selected !== null ) {
    select.selectedIndex = selected;
  }

  el.querySelectorAll('gui-select-option').forEach((sel) => {
    const value = sel.getAttribute('data-value') || '';
    const label = sel.childNodes.length ? sel.childNodes[0].nodeValue : '';

    const option = document.createElement('option');
    option.setAttribute('role', 'option');
    option.setAttribute('value', value);
    option.appendChild(document.createTextNode(label));
    if ( sel.getAttribute('selected') ) {
      option.setAttribute('selected', 'selected');
    }
    select.appendChild(option);
    sel.parentNode.removeChild(sel);
  });

  Events.$bind(select, 'change', (ev) => {
    select.dispatchEvent(new CustomEvent('_change', {detail: select.value}));
  }, false);

  select.setAttribute('role', 'listbox');
  select.setAttribute('aria-label', el.getAttribute('title') || '');
  el.setAttribute('aria-disabled', String(disabled));
  el.setAttribute('role', 'region');
  el.appendChild(select);
}

/////////////////////////////////////////////////////////////////////////////
// OTHER HELPERS
/////////////////////////////////////////////////////////////////////////////

function setSwitchValue(val, input, button) {
  if ( val !== true ) {
    input.removeAttribute('checked');
    DOM.$removeClass(button, 'gui-active');
    button.innerHTML = '0';
  } else {
    input.setAttribute('checked', 'checked');
    DOM.$addClass(button, 'gui-active');
    button.innerHTML = '1';
  }
}

/////////////////////////////////////////////////////////////////////////////
// CLASSES
/////////////////////////////////////////////////////////////////////////////

class _GUIInput extends GUIElement {
  on(evName, callback, params) {
    /* eslint no-invalid-this: "off" */
    if ( evName === 'enter' ) {
      evName = '_enter';
    } else if ( evName === 'change' ) {
      evName = '_change';
    }

    const target = this.$element.querySelector('textarea, input, select');
    Events.$bind(target, evName, callback.bind(this), params);
    return this;
  }
}

/**
 * Element: 'gui-label'
 *
 * Just a normal label.
 *
 * <pre><code>
 *   getter    value     String        The value/contents
 *   setter    value     String        The value/contents
 *   setter    label     String        The label text
 *   property  disabled  boolean       Disabled state
 * </code></pre>
 */
class GUILabel extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-label'
    }, this);
  }

  set(param, value, isHTML) {
    const el = this.$element;
    if ( param === 'value' || param === 'label' ) {
      el.setAttribute('data-label', String(value));

      const lbl = el.querySelector('label');
      DOM.$empty(lbl);
      if ( isHTML ) {
        lbl.innerHTML = value;
      } else {
        lbl.appendChild(document.createTextNode(value));
      }
      return this;
    }
    return super.set(...arguments);
  }

  build() {
    const el = this.$element;
    const label = GUI.getValueLabel(el, true);
    const lbl = document.createElement('label');
    lbl.appendChild(document.createTextNode(label));
    el.setAttribute('role', 'heading');
    el.setAttribute('data-label', String(label));
    el.appendChild(lbl);

    return this;
  }
}

/**
 * Element: 'gui-textarea'
 *
 * Text area input (multi-line)
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value         String        The value/contents
 *   setter    value         String        The value/contents
 *   setter    label         String        The label text
 *   setter    disabled      boolean       Set disabled state
 *   property  disabled      boolean       Disabled state
 *   property  value         String        The input value
 *   property  placeholder   String        An optional placeholder
 *   event     change                      When input has changed => fn(ev)
 * </code></pre>
 */
class GUITextarea extends _GUIInput {
  static register() {
    return super.register({
      tagName: 'gui-textarea',
      type: 'input'
    }, this);
  }

  build() {
    createInputOfType(this.$element, 'textarea');

    return this;
  }

  set(param, value) {
    const el = this.$element;
    if ( el && param === 'scrollTop' ) {
      if ( typeof value !== 'number' ) {
        value = el.firstChild.scrollHeight;
      }
      el.firstChild.scrollTop = value;
      return this;
    }
    return super.set(...arguments);
  }
}

/**
 * Element: 'gui-text'
 *
 * Text input.
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value         String        The value/contents
 *   setter    value         String        The value/contents
 *   setter    disabled      boolean       Set disabled state
 *   property  disabled      boolean       Disabled state
 *   property  value         String        The input value
 *   property  placeholder   String        An optional placeholder
 *   event     change                      When input has changed => fn(ev)
 *   event     enter                       When enter key was pressed => fn(ev)
 * </code></pre>
 */
class GUIText extends _GUIInput {
  static register() {
    return super.register({
      tagName: 'gui-text',
      type: 'input'
    }, this);
  }

  build() {
    createInputOfType(this.$element, 'text');
    return this;
  }
}

/**
 * Element: 'gui-password'
 *
 * Password input.
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value         String        The value/contents
 *   setter    value         String        The value/contents
 *   setter    disabled      boolean       Set disabled state
 *   property  disabled      boolean       Disabled state
 *   property  value         String        The input value
 *   property  placeholder   String        An optional placeholder
 *   event     change                      When input has changed => fn(ev)
 *   event     enter                       When enter key was pressed => fn(ev)
 * </code></pre>
 */
class GUIPassword extends _GUIInput {
  static register() {
    return super.register({
      tagName: 'gui-password',
      type: 'input'
    }, this);
  }

  build() {
    createInputOfType(this.$element, 'password');
    return this;
  }
}

/**
 * Element: 'gui-file-upload'
 *
 * File upload selector.
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value     String        The value/contents
 *   setter    value     String        The value/contents
 *   setter    disabled  boolean       Set disabled state
 *   property  disabled  boolean       Disabled state
 *   event     change                  When input has changed => fn(ev)
 * </code></pre>
 */
class GUIFileUpload extends _GUIInput {
  static register() {
    return super.register({
      tagName: 'gui-file-upload',
      type: 'input'
    }, this);
  }

  build() {
    const input = document.createElement('input');
    input.setAttribute('role', 'button');
    input.setAttribute('type', 'file');
    input.onchange = (ev) => {
      input.dispatchEvent(new CustomEvent('_change', {detail: input.files[0]}));
    };
    this.$element.appendChild(input);

    return this;
  }
}

/**
 * Element: 'gui-radio'
 *
 * Radio selection input.
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value     boolean       The value/checked state
 *   setter    value     boolean       The value/checked state
 *   setter    disabled  boolean       Set disabled state
 *   property  disabled  boolean       Disabled state
 *   property  label     String        (Optional) Set a label on the input element
 *   property  group     String        (Optional) A group identificator
 *   event     change                  When input has changed => fn(ev)
 * </code></pre>
 */
class GUIRadio extends _GUIInput {
  static register() {
    return super.register({
      tagName: 'gui-radio',
      type: 'input'
    }, this);
  }

  build() {
    createInputOfType(this.$element, 'radio');
    return this;
  }
}

/**
 * Element: 'gui-checbox'
 *
 * Checkbox selection input.
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value     boolean       The value/checked state
 *   setter    value     boolean       The value/checked state
 *   setter    disabled  boolean       Set disabled state
 *   property  disabled  boolean       Disabled state
 *   property  label     String        (Optional) Set a label on the input element
 *   property  group     String        (Optional) A group identificator
 *   event     change                  When input has changed => fn(ev)
 * </code></pre>
 */
class GUICheckbox extends _GUIInput {
  static register() {
    return super.register({
      tagName: 'gui-checkbox',
      type: 'input'
    }, this);
  }

  build() {
    createInputOfType(this.$element, 'checkbox');
    return this;
  }
}

/**
 * Element: 'gui-switch'
 *
 * A switch (on/off) input.
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value     String        The value/enabled state
 *   setter    value     String        The value/enabled state
 *   setter    disabled  boolean       Set disabled state
 *   property  disabled  boolean       Disabled state
 *   event     change                  When input has changed => fn(ev)
 * </code></pre>
 */
class GUISwitch extends _GUIInput {
  static register() {
    return super.register({
      tagName: 'gui-switch',
      type: 'input'
    }, this);
  }

  set(param, value) {
    if ( param === 'value' ) {
      const input = this.$element.querySelector('input');
      const button = this.$element.querySelector('button');

      setSwitchValue(value, input, button);

      return this;
    }
    return super.set(...arguments);
  }

  build() {
    const el = this.$element;
    const input = document.createElement('input');
    input.type = 'checkbox';
    el.appendChild(input);

    const inner = document.createElement('div');

    const button = document.createElement('button');
    inner.appendChild(button);
    GUI.createInputLabel(el, 'switch', inner);

    function toggleValue(v) {
      let val = false;
      if ( typeof v === 'undefined' ) {
        val = !!input.checked;
        val = !val;
      } else {
        val = v;
      }

      setSwitchValue(val, input, button);
    }

    Events.$bind(inner, 'pointerup', (ev) => {
      ev.preventDefault();
      const disabled = el.getAttribute('data-disabled') !== null;
      if ( !disabled ) {
        toggleValue();
      }
    }, false);

    toggleValue(false);

    return this;
  }
}

/**
 * Element: 'gui-button'
 *
 * A normal button
 *
 * <pre><code>
 *   getter    value     String        The value
 *   setter    value     String        The value
 *   setter    icon      String        Icon source
 *   setter    disabled  boolean       Set disabled state
 *   property  disabled  boolean       Disabled state
 *   property  icon      String        Icon source
 *   event     click                   When input was clicked => fn(ev)
 * </code></pre>
 */
class GUIButton extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-button',
      type: 'input'
    }, this);
  }

  set(param, value, isHTML) {
    if ( param === 'value' || param === 'label' ) {
      const lbl = this.$element.querySelector('button');
      DOM.$empty(lbl);
      if ( isHTML ) {
        lbl.innerHTML = value;
      } else {
        lbl.appendChild(document.createTextNode(value));
      }

      lbl.setAttribute('aria-label', value);

      return this;
    }
    return super.set(...arguments);
  }

  create(params) {
    const label = params.label;
    if ( params.label ) {
      delete params.label;
    }

    const el = GUI.createElement('gui-button', params);
    if ( label ) {
      el.appendChild(document.createTextNode(label));
    }
    return el;
  }

  on(evName, callback, params) {
    const target = this.$element.querySelector('button');
    Events.$bind(target, evName, callback.bind(this), params);
    return this;
  }

  build() {
    const el = this.$element;
    const icon = el.getAttribute('data-icon');
    const disabled = el.getAttribute('data-disabled') !== null;
    const group = el.getAttribute('data-group');
    const label = GUI.getValueLabel(el);
    const input = document.createElement('button');

    function setGroup(g) {
      if ( g ) {
        input.setAttribute('name', g + '[' + _buttonCount + ']');

        Events.$bind(input, 'pointerup', () => {
          // NOTE: This is probably a bit slow
          let root = el;
          while ( root.parentNode ) {
            if ( root.tagName.toLowerCase() === 'application-window-content' ) {
              break;
            }
            root = root.parentNode;
          }

          DOM.$addClass(input, 'gui-active');
          root.querySelectorAll('gui-button[data-group="' + g + '"] > button').forEach((b) => {
            if ( b.name === input.name ) {
              return;
            }
            DOM.$removeClass(b, 'gui-active');
          });
        });
      }
    }

    function setImage() {
      if ( icon && icon !== 'null' ) {
        const tip = _(el.getAttribute('data-tooltip') || '');
        const img = document.createElement('img');
        img.src = icon;
        img.alt = tip;
        img.title = tip;

        if ( input.firstChild ) {
          input.insertBefore(img, input.firstChild);
        } else {
          input.appendChild(img);
        }
        DOM.$addClass(el, 'gui-has-image');
      }
    }

    function setLabel() {
      if ( label ) {
        DOM.$addClass(el, 'gui-has-label');
      }
      input.appendChild(document.createTextNode(label));
      input.setAttribute('aria-label', label);
    }

    if ( disabled ) {
      input.setAttribute('disabled', 'disabled');
    }

    setLabel();
    setImage();
    setGroup(group);
    _buttonCount++;

    el.setAttribute('role', 'navigation');
    el.appendChild(input);

    return this;
  }
}

class _GUISelect extends _GUIInput {
  add(arg) {
    addToSelectBox(this.$element, arg);
    return this;
  }

  remove(arg) {
    removeFromSelectBox(this.$element, arg);
    return this;
  }

  clear() {
    const target = this.$element.querySelector('select');
    DOM.$empty(target);
    return this;
  }

  build() {
    const el = this.$element;
    const multiple = (el.tagName.toLowerCase() === 'gui-select-list');
    createSelectInput(el, multiple);

    return this;
  }

}

/**
 * Element: 'gui-select'
 *
 * A selection dropdown.
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value     String        The value
 *   setter    value     String        The value
 *   setter    disabled  boolean       Set disabled state
 *   property  disabled  boolean       Disabled state
 *   event     change                  When input has changed => fn(ev)
 *   action    add                     Add elements(s) => fn(entries)
 *   action    clear                   Clear elements => fn()
 *   action    remove                  Removes element => fn(arg)
 * </code></pre>
 *
 * @example
 *   add({
 *    label: "Label",
 *    value: "Value"
 *   })
 */
class GUISelect extends _GUISelect {
  static register() {
    return super.register({
      tagName: 'gui-select',
      type: 'input'
    }, this);
  }
}

/**
 * Element: 'gui-select-list'
 *
 * A selection list (same as dropdown except multiple)
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value     String        The value
 *   setter    value     String        The value
 *   setter    disabled  boolean       Set disabled state
 *   property  disabled  boolean       Disabled state
 *   event     change                  When input has changed => fn(ev)
 *   action    add                     Add elements(s) => fn(entries)
 *   action    clear                   Clear elements => fn()
 *   action    remove                  Removes element => fn(arg)
 * </code></pre>
 */
class GUISelectList extends _GUISelect {
  static register() {
    return super.register({
      tagName: 'gui-select-list',
      type: 'input'
    }, this);
  }
}

/**
 * Element: 'gui-slider'
 *
 * A slider input.
 *
 * See `ev.detail` for data on events (like on 'change').
 *
 * <pre><code>
 *   getter    value     String        The value
 *   setter    value     String        The value
 *   setter    disabled  boolean       Set disabled state
 *   property  min       integer       The minimum value
 *   property  max       integer       The maxmimum value
 *   property  disabled  boolean       Disabled state
 *   event     change                  When input has changed => fn(ev)
 * </code></pre>
 */
class GUISlider extends _GUIInput {
  static register() {
    return super.register({
      tagName: 'gui-slider',
      type: 'input'
    }, this);
  }

  get(param) {
    const val = GUI.getProperty(this.$element, param);
    if ( param === 'value' ) {
      return parseInt(val, 10);
    }
    return val;
  }

  build() {
    createInputOfType(this.$element, 'range');

    return this;
  }
}

/**
 * Element: 'gui-input-modal'
 *
 * A text area displaying current value with a button to open a modal/dialog etc.
 *
 * <pre><code>
 *   getter    value     String        The value
 *   setter    value     String        The value
 *   event     open                    When button was pressed => fn(ev)
 * </code></pre>
 */
class GUIInputModal extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-input-modal',
      type: 'input'
    }, this);
  }

  on(evName, callback, params) {
    if ( evName === 'open' ) {
      evName = '_open';
    }
    Events.$bind(this.$element, evName, callback.bind(this), params);
    return this;
  }

  get(param) {
    if ( param === 'value' ) {
      const input = this.$element.querySelector('input');
      return input.value;
    }
    return super.get(...arguments);
  }

  set(param, value) {
    if ( param === 'value' ) {
      const input = this.$element.querySelector('input');
      input.removeAttribute('disabled');
      input.value = value;
      input.setAttribute('disabled', 'disabled');
      input.setAttribute('aria-disabled', 'true');

      return this;
    }
    return super.set(...arguments);
  }

  build() {
    const el = this.$element;
    const container = document.createElement('div');

    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('disabled', 'disabled');

    const button = document.createElement('button');
    button.innerHTML = '...';

    Events.$bind(button, 'pointerup', (ev) => {
      el.dispatchEvent(new CustomEvent('_open', {detail: input.value}));
    }, false);

    container.appendChild(input);
    container.appendChild(button);
    el.appendChild(container);

    return this;
  }
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default {
  GUILabel: GUILabel,
  GUITextarea: GUITextarea,
  GUIText: GUIText,
  GUIPassword: GUIPassword,
  GUIFileUpload: GUIFileUpload,
  GUIRadio: GUIRadio,
  GUICheckbox: GUICheckbox,
  GUISwitch: GUISwitch,
  GUIButton: GUIButton,
  GUISelect: GUISelect,
  GUISelectList: GUISelectList,
  GUISlider: GUISlider,
  GUIInputModal: GUIInputModal
};

