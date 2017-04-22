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

  var _buttonCount = 0;

  /////////////////////////////////////////////////////////////////////////////
  // INPUT HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function createInputOfType(el, type) {
    var group = el.getAttribute('data-group');
    var placeholder = el.getAttribute('data-placeholder');
    var disabled = String(el.getAttribute('data-disabled')) === 'true';
    var value = el.childNodes.length ? el.childNodes[0].nodeValue : null;
    Utils.$empty(el);

    var input = document.createElement(type === 'textarea' ? 'textarea' : 'input');

    var attribs = {
      value: null,
      type: type,
      tabindex: -1,
      placeholder: placeholder,
      disabled: disabled ? 'disabled' : null,
      name: group ? group + '[]' : null
    };

    (['autocomplete', 'autocorrect', 'autocapitalize', 'spellcheck']).forEach(function(a) {
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

      Object.keys(attribs).forEach(function(a) {
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
        Utils.$bind(input, 'keydown', function(ev) {
          if ( ev.keyCode === Utils.Keys.ENTER ) {
            input.dispatchEvent(new CustomEvent('_enter', {detail: input.value}));
          } else if ( ev.keyCode === Utils.Keys.C && ev.ctrlKey ) {
            API.setClipboard(input.value);
          }

          if ( type === 'textarea' && ev.keyCode === Utils.Keys.TAB ) {
            ev.preventDefault();
            input.value += '\t';
          }
        }, false);
      }
    }

    function _create() {
      _bindDefaults();
      _bindEvents();

      GUI.Helpers.createInputLabel(el, type, input);

      var rolemap = {
        'TEXTAREA': function() {
          return 'textbox';
        },
        'INPUT': function(i) {
          var typemap = {
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

      Utils.$bind(input, 'change', function(ev) {
        var value = input.value;
        if ( type === 'radio' || type === 'checkbox' ) {
          //value = input.getAttribute('checked') === 'checked';
          value = input.checked; //input.value === 'on';
        }
        input.dispatchEvent(new CustomEvent('_change', {detail: value}));
      }, false);
    }

    _create();
  }

  function bindInputEvents(evName, callback, params) {
    /* eslint no-invalid-this: "off" */
    if ( evName === 'enter' ) {
      evName = '_enter';
    } else if ( evName === 'change' ) {
      evName = '_change';
    }

    var target = this.$element.querySelector('textarea, input, select');
    Utils.$bind(target, evName, callback.bind(this), params);
    return this;
  }

  /////////////////////////////////////////////////////////////////////////////
  // SELECT HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function addToSelectBox(el, entries) {
    var target = el.querySelector('select');
    if ( !(entries instanceof Array) ) {
      entries = [entries];
    }

    entries.forEach(function(e) {
      var opt = document.createElement('option');
      opt.setAttribute('role', 'option');
      opt.setAttribute('value', e.value);
      opt.appendChild(document.createTextNode(e.label));

      target.appendChild(opt);
    });
  }

  function removeFromSelectBox(el, what) {
    var target = el.querySelector('select');
    target.querySelectorAll('option').forEach(function(opt) {
      if ( String(opt.value) === String(what) ) {
        Utils.$remove(opt);
        return false;
      }
      return true;
    });
  }

  function createSelectInput(el, multiple) {
    var disabled = el.getAttribute('data-disabled') !== null;
    var selected = el.getAttribute('data-selected');

    var select = document.createElement('select');
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

    el.querySelectorAll('gui-select-option').forEach(function(sel) {
      var value = sel.getAttribute('data-value') || '';
      var label = sel.childNodes.length ? sel.childNodes[0].nodeValue : '';

      var option = document.createElement('option');
      option.setAttribute('role', 'option');
      option.setAttribute('value', value);
      option.appendChild(document.createTextNode(label));
      if ( sel.getAttribute('selected') ) {
        option.setAttribute('selected', 'selected');
      }
      select.appendChild(option);
      sel.parentNode.removeChild(sel);
    });

    Utils.$bind(select, 'change', function(ev) {
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
      Utils.$removeClass(button, 'gui-active');
      button.innerHTML = '0';
    } else {
      input.setAttribute('checked', 'checked');
      Utils.$addClass(button, 'gui-active');
      button.innerHTML = '1';
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // CLASSES
  /////////////////////////////////////////////////////////////////////////////

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
   *
   * @constructor Label
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUILabel = {
    set: function(param, value, isHTML) {
      var el = this.$element;
      if ( param === 'value' || param === 'label' ) {
        el.setAttribute('data-label', String(value));

        var lbl = el.querySelector('label');
        Utils.$empty(lbl);
        if ( isHTML ) {
          lbl.innerHTML = value;
        } else {
          lbl.appendChild(document.createTextNode(value));
        }
        return this;
      }
      return GUI.Element.prototype.set.apply(this, arguments);
    },

    build: function() {
      var el = this.$element;
      var label = GUI.Helpers.getValueLabel(el, true);
      var lbl = document.createElement('label');
      lbl.appendChild(document.createTextNode(label));
      el.setAttribute('role', 'heading');
      el.setAttribute('data-label', String(label));
      el.appendChild(lbl);

      return this;
    }
  };

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
   *
   * @constructor Textarea
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUITextarea = {
    on: bindInputEvents,

    build: function() {
      createInputOfType(this.$element, 'textarea');

      return this;
    },

    set: function(param, value) {
      var el = this.$element;
      if ( el && param === 'scrollTop' ) {
        if ( typeof value !== 'number' ) {
          value = el.firstChild.scrollHeight;
        }
        el.firstChild.scrollTop = value;
        return this;
      }
      return GUI.Element.prototype.set.apply(this, arguments);
    }
  };

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
   *
   * @constructor Text
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIText = {
    on: bindInputEvents,
    build: function() {
      createInputOfType(this.$element, 'text');

      return this;
    }
  };

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
   *
   * @constructor Password
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIPassword = {
    on: bindInputEvents,
    build: function() {
      createInputOfType(this.$element, 'password');

      return this;
    }
  };

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
   *
   * @constructor FileUpload
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIFileUpload = {
    on: bindInputEvents,
    build: function() {
      var input = document.createElement('input');
      input.setAttribute('role', 'button');
      input.setAttribute('type', 'file');
      input.onchange = function(ev) {
        input.dispatchEvent(new CustomEvent('_change', {detail: input.files[0]}));
      };
      this.$element.appendChild(input);

      return this;
    }
  };

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
   *
   * @constructor Radio
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIRadio = {
    on: bindInputEvents,
    build: function() {
      createInputOfType(this.$element, 'radio');

      return this;
    }
  };

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
   *
   * @constructor Checkbox
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUICheckbox = {
    on: bindInputEvents,
    build: function() {
      createInputOfType(this.$element, 'checkbox');

      return this;
    }
  };

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
   *
   * @constructor Button
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUISwitch = {
    on: bindInputEvents,

    set: function(param, value) {
      if ( param === 'value' ) {
        var input = this.$element.querySelector('input');
        var button = this.$element.querySelector('button');

        setSwitchValue(value, input, button);

        return this;
      }
      return GUI.Element.prototype.set.apply(this, arguments);
    },

    build: function() {
      var el = this.$element;
      var input = document.createElement('input');
      input.type = 'checkbox';
      el.appendChild(input);

      var inner = document.createElement('div');

      var button = document.createElement('button');
      inner.appendChild(button);
      GUI.Helpers.createInputLabel(el, 'switch', inner);

      function toggleValue(v) {
        var val = false;
        if ( typeof v === 'undefined' ) {
          val = !!input.checked;
          val = !val;
        } else {
          val = v;
        }

        setSwitchValue(val, input, button);
      }

      Utils.$bind(inner, 'click', function(ev) {
        ev.preventDefault();
        var disabled = el.getAttribute('data-disabled') !== null;
        if ( !disabled ) {
          toggleValue();
        }
      }, false);

      toggleValue(false);

      return this;
    }
  };

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
   *
   * @constructor Button
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIButton = {
    set: function(param, value, isHTML) {
      if ( param === 'value' || param === 'label' ) {
        var lbl = this.$element.querySelector('button');
        Utils.$empty(lbl);
        if ( isHTML ) {
          lbl.innerHTML = value;
        } else {
          lbl.appendChild(document.createTextNode(value));
        }

        lbl.setAttribute('aria-label', value);

        return this;
      }
      return GUI.Element.prototype.set.apply(this, arguments);
    },

    create: function(params) {
      var label = params.label;
      if ( params.label ) {
        delete params.label;
      }

      var el = GUI.Helpers.createElement('gui-button', params);
      if ( label ) {
        el.appendChild(document.createTextNode(label));
      }
      return el;
    },

    on: function(evName, callback, params) {
      var target = this.$element.querySelector('button');
      Utils.$bind(target, evName, callback.bind(this), params);
      return this;
    },

    build: function() {
      var el = this.$element;
      var icon = el.getAttribute('data-icon');
      var disabled = el.getAttribute('data-disabled') !== null;
      var group = el.getAttribute('data-group');
      var label = GUI.Helpers.getValueLabel(el);
      var input = document.createElement('button');

      function setGroup(g) {
        if ( g ) {
          input.setAttribute('name', g + '[' + _buttonCount + ']');

          Utils.$bind(input, 'click', function() {
            // NOTE: This is probably a bit slow
            var root = el;
            while ( root.parentNode ) {
              if ( root.tagName.toLowerCase() === 'application-window-content' ) {
                break;
              }
              root = root.parentNode;
            }

            Utils.$addClass(input, 'gui-active');
            root.querySelectorAll('gui-button[data-group="' + g + '"] > button').forEach(function(b) {
              if ( b.name === input.name ) {
                return;
              }
              Utils.$removeClass(b, 'gui-active');
            });
          });
        }
      }

      function setImage() {
        if ( icon && icon !== 'null' ) {
          var tip = API._(el.getAttribute('data-tooltip') || '');
          var img = document.createElement('img');
          img.src = icon;
          img.alt = tip;
          img.title = tip;

          if ( input.firstChild ) {
            input.insertBefore(img, input.firstChild);
          } else {
            input.appendChild(img);
          }
          Utils.$addClass(el, 'gui-has-image');
        }
      }

      function setLabel() {
        if ( label ) {
          Utils.$addClass(el, 'gui-has-label');
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
  };

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
   *
   * @constructor SelectList
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUISelect = {
    on: bindInputEvents,

    add: function(arg) {
      addToSelectBox(this.$element, arg);
      return this;
    },

    remove: function(arg) {
      removeFromSelectBox(this.$element, arg);
      return this;
    },

    clear: function() {
      var target = this.$element.querySelector('select');
      Utils.$empty(target);
      return this;
    },

    build: function() {
      var el = this.$element;
      var multiple = (el.tagName.toLowerCase() === 'gui-select-list');
      createSelectInput(el, multiple);

      return this;
    }
  };

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
   *
   * @constructor SelectList
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUISelectList = GUISelect;

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
   *
   * @constructor Slider
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUISlider = {
    on: bindInputEvents,

    get: function(param) {
      var val = GUI.Helpers.getProperty(this.$element, param);
      if ( param === 'value' ) {
        return parseInt(val, 10);
      }
      return val;
    },

    build: function() {
      createInputOfType(this.$element, 'range');

      return this;
    }
  };

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
   *
   * @constructor InputModal
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIInputModal = {
    on: function(evName, callback, params) {
      if ( evName === 'open' ) {
        evName = '_open';
      }
      Utils.$bind(this.$element, evName, callback.bind(this), params);
      return this;
    },

    get: function(param) {
      if ( param === 'value' ) {
        var input = this.$element.querySelector('input');
        return input.value;
      }
      return GUI.Element.prototype.get.apply(this, arguments);
    },

    set: function(param, value) {
      if ( param === 'value' ) {
        var input = this.$element.querySelector('input');
        input.removeAttribute('disabled');
        input.value = value;
        input.setAttribute('disabled', 'disabled');
        input.setAttribute('aria-disabled', 'true');

        return this;
      }
      return GUI.Element.prototype.set.apply(this, arguments);
    },

    build: function() {
      var el = this.$element;
      var container = document.createElement('div');

      var input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('disabled', 'disabled');

      var button = document.createElement('button');
      button.innerHTML = '...';

      Utils.$bind(button, 'click', function(ev) {
        el.dispatchEvent(new CustomEvent('_open', {detail: input.value}));
      }, false);

      container.appendChild(input);
      container.appendChild(button);
      el.appendChild(container);

      return this;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // REGISTRATION
  /////////////////////////////////////////////////////////////////////////////

  GUI.Element.register({
    tagName: 'gui-label'
  }, GUILabel);

  GUI.Element.register({
    tagName: 'gui-textarea',
    type: 'input'
  }, GUITextarea);

  GUI.Element.register({
    tagName: 'gui-text',
    type: 'input'
  }, GUIText);

  GUI.Element.register({
    tagName: 'gui-password',
    type: 'input'
  }, GUIPassword);

  GUI.Element.register({
    tagName: 'gui-file-upload',
    type: 'input'
  }, GUIFileUpload);

  GUI.Element.register({
    tagName: 'gui-radio',
    type: 'input'
  }, GUIRadio);

  GUI.Element.register({
    tagName: 'gui-checkbox',
    type: 'input'
  }, GUICheckbox);

  GUI.Element.register({
    tagName: 'gui-switch',
    type: 'input'
  }, GUISwitch);

  GUI.Element.register({
    tagName: 'gui-button',
    type: 'input'
  }, GUIButton);

  GUI.Element.register({
    tagName: 'gui-select',
    type: 'input'
  }, GUISelect);

  GUI.Element.register({
    tagName: 'gui-select-list',
    type: 'input'
  }, GUISelectList);

  GUI.Element.register({
    tagName: 'gui-slider',
    type: 'input'
  }, GUISlider);

  GUI.Element.register({
    tagName: 'gui-input-modal',
    type: 'input'
  }, GUIInputModal);

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
