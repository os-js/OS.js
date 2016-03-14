/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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
          input.setAttribute(a, attribs[a]);
        }
      });
    }
    function _bindEvents() {
      if ( type === 'text' || type === 'password' || type === 'textarea' ) {
        Utils.$bind(input, 'keydown', function(ev) {
          if ( ev.keyCode === Utils.Keys.ENTER ) {
            input.dispatchEvent(new CustomEvent('_enter', {detail: this.value}));
          }
          if ( type === 'textarea' && ev.keyCode === Utils.Keys.TAB ) {
            ev.preventDefault();
            this.value += '\t';
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

  function bindInputEvents(el, evName, callback, params) {
    if ( evName === 'enter' ) { evName = '_enter'; }
    if ( evName === 'change' ) { evName = '_change'; }

    var target = el.querySelector('textarea, input, select');
    Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
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

  function callSelectBox(el, method, args) {
    if ( method === 'add' ) {
      addToSelectBox(el, args[0]);
    } else if ( method === 'remove' ) {
      removeFromSelectBox(el, args[0]);
    } else if ( method === 'clear' ) {
      var target = el.querySelector('select');
      Utils.$empty(target);
    }
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

    select.setAttribute('role', 'combobox');
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

  var guiSelect = {
    bind: bindInputEvents,
    call: function() {
      callSelectBox.apply(this, arguments);
      return this;
    },
    build: function(el) {
      var multiple = (el.tagName.toLowerCase() === 'gui-select-list');
      createSelectInput(el, multiple);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-label'
   *
   * Just a normal label.
   *
   * Setters:
   *  value         Sets the label
   *  label         Alias for 'value'
   *
   * @api OSjs.GUI.Elements.gui-label
   * @class
   */
  GUI.Elements['gui-label'] = {
    set: function(el, param, value, isHTML) {
      if ( param === 'value' || param === 'label' ) {
        el.setAttribute('data-label', String(value));

        var lbl = el.querySelector('label');
        Utils.$empty(lbl);
        if ( isHTML ) {
          lbl.innerHTML = value;
        } else {
          lbl.appendChild(document.createTextNode(value));
        }
        return true;
      }
      return false;
    },
    build: function(el) {
      var label = GUI.Helpers.getValueLabel(el, true);
      var lbl = document.createElement('label');
      lbl.appendChild(document.createTextNode(label));
      el.setAttribute('role', 'heading');
      el.setAttribute('data-label', String(label));
      el.appendChild(lbl);
    }
  };

  /**
   * Element: 'gui-textarea'
   *
   * Text area input (multi-line)
   *
   * Events:
   *  change        When input has changed => fn(ev)
   *
   * Parameters:
   *  disabled  boolean     Disabled state
   *
   * Getters:
   *  value         Gets the input value
   *
   * Setters:
   *  value         Sets the input value
   *
   * @api OSjs.GUI.Elements.gui-textarea
   * @class
   */
  GUI.Elements['gui-textarea'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'textarea');
    }
  };

  /**
   * Element: 'gui-text'
   *
   * Text input.
   *
   * Events:
   *  change        When input has changed => fn(ev)
   *  enter         On enter press => fn(ev)
   *
   * Parameters:
   *  disabled  boolean     Disabled state
   *
   * Getters:
   *  value         Gets the input value
   *
   * Setters:
   *  value         Sets the input value
   *
   * @api OSjs.GUI.Elements.gui-text
   * @class
   */
  GUI.Elements['gui-text'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'text');
    }
  };

  /**
   * Element: 'gui-password'
   *
   * Password input.
   *
   * Events:
   *  change        When input has changed => fn(ev)
   *  enter         On enter press => fn(ev)
   *
   * Parameters:
   *  disabled  boolean     Disabled state
   *
   * Getters:
   *  value         Gets the input value
   *
   * Setters:
   *  value         Sets the input value
   *
   * @api OSjs.GUI.Elements.gui-password
   * @class
   */
  GUI.Elements['gui-password'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'password');
    }
  };

  /**
   * Element: 'gui-file-upload'
   *
   * File upload selector.
   *
   * Events:
   *  change        When input has changed => fn(ev)
   *
   * Getters:
   *  value         Gets the input value
   *
   * Setters:
   *  value         Sets the input value
   *
   * @api OSjs.GUI.Elements.gui-file-upload
   * @class
   */
  GUI.Elements['gui-file-upload'] = {
    bind: bindInputEvents,
    build: function(el) {
      var input = document.createElement('input');
      input.setAttribute('role', 'button');
      input.setAttribute('type', 'file');
      input.onchange = function(ev) {
        input.dispatchEvent(new CustomEvent('_change', {detail: input.files[0]}));
      };
      el.appendChild(input);
    }
  };

  /**
   * Element: 'gui-radio'
   *
   * Radio selection input.
   *
   * Events:
   *  change        When input has changed => fn(ev)
   *
   * Parameters:
   *  disabled  boolean     Disabled state
   *
   * Getters:
   *  value         Gets the input value
   *
   * Setters:
   *  value         Sets the input value
   *
   * @api OSjs.GUI.Elements.gui-radio
   * @class
   */
  GUI.Elements['gui-radio'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'radio');
    }
  };

  /**
   * Element: 'gui-checbox'
   *
   * Checkbox selection input.
   *
   * Events:
   *  change        When input has changed => fn(ev)
   *
   * Parameters:
   *  disabled  boolean     Disabled state
   *
   * Getters:
   *  value         Gets the input value
   *
   * Setters:
   *  value         Sets the input value
   *
   * @api OSjs.GUI.Elements.gui-checbox
   * @class
   */
  GUI.Elements['gui-checkbox'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'checkbox');
    }
  };

  /**
   * Element: 'gui-switch'
   *
   * A switch (on/off) input.
   *
   * Events:
   *  change        When input has changed => fn(ev)
   *
   * Parameters:
   *  disabled  boolean     Disabled state
   *
   * Getters:
   *  value         Gets the input value
   *
   * Setters:
   *  value         Sets the input value
   *
   * @api OSjs.GUI.Elements.gui-switch
   * @class
   */
  GUI.Elements['gui-switch'] = {
    bind: bindInputEvents,
    set: function(el, param, value) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        var button = el.querySelector('button');

        setSwitchValue(value, input, button);
        return true;
      }
      return false;
    },

    build: function(el) {
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
    }
  };

  /**
   * Element: 'gui-button'
   *
   * A normal button
   *
   * Events:
   *  click         When button was clicked => fn(ev)
   *
   * Parameters:
   *  disabled    boolean     Disabled state
   *  label       String      The label
   *  icon        String      The icon (optional)
   *
   * @api OSjs.GUI.Elements.gui-button
   * @class
   */
  GUI.Elements['gui-button'] = {
    set: function(el, param, value, isHTML) {
      if ( param === 'value' || param === 'label' ) {
        var lbl = el.querySelector('button');
        Utils.$empty(lbl);
        if ( isHTML ) {
          lbl.innerHTML = value;
        } else {
          lbl.appendChild(document.createTextNode(value));
        }

        lbl.setAttribute('aria-label', value);

        return true;
      }
      return false;
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
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('button');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
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
        if ( icon ) {
          var img = document.createElement('img');
          img.src = icon;
          img.alt = el.getAttribute('data-tooltip') || '';
          img.title = el.getAttribute('data-tooltip') || '';

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
    }
  };

  /**
   * Element: 'gui-select'
   *
   * A selection dropdown.
   *
   * Events:
   *  change        When input has changed => fn(ev)
   *
   * Parameters:
   *  disabled  boolean     Disabled state
   *
   * Actions:
   *  add(arg)      Adds en entry (or from array)
   *  remove(arg)   Removes an entry
   *  clear()
   *
   * Getters:
   *  value         Gets the input value
   *
   * Setters:
   *  value         Sets the input value
   *
   * @api OSjs.GUI.Elements.gui-select
   * @class
   */
  GUI.Elements['gui-select'] = guiSelect;

  /**
   * Element: 'gui-select-list'
   *
   * A selection list (same as dropdown except multiple)
   *
   * Events:
   *  change        When input has changed => fn(ev)
   *
   * Parameters:
   *  disabled  boolean     Disabled state
   *
   * Actions:
   *  add(arg)      Adds en entry (or from array)
   *  remove(arg)   Removes an entry
   *  clear()
   *
   * Getters:
   *  value         Gets the input value
   *
   * Setters:
   *  value         Sets the input value
   *
   * @api OSjs.GUI.Elements.gui-select-list
   * @class
   */
  GUI.Elements['gui-select-list'] = guiSelect;

  /**
   * Element: 'gui-slider'
   *
   * A slider input.
   *
   * Events:
   *  change        When input has changed => fn(ev)
   *
   * Parameters:
   *  min       int         Minimum value
   *  max       int         Maximum value
   *  disabled  boolean     Disabled state
   *
   * Getters:
   *  value         Gets the input value
   *
   * Setters:
   *  value         Sets the input value
   *
   * @api OSjs.GUI.Elements.gui-slider
   * @class
   */
  GUI.Elements['gui-slider'] = {
    bind: bindInputEvents,
    get: function(el, param) {
      var val = GUI.Helpers.getProperty(el, param);
      if ( param === 'value' ) {
        return parseInt(val, 10);
      }
      return val;
    },
    build: function(el) {
      createInputOfType(el, 'range');
    }
  };

  /**
   * Element: 'gui-input-modal'
   *
   * A text area displaying current value with a button to open a modal/dialog etc.
   *
   * Events:
   *  open          When the open button was pressed => fn(ev)
   *
   * Getters:
   *  value         Gets the input value
   *
   * Setters:
   *  value         Sets the input value
   *
   * @api OSjs.GUI.Elements.gui-input-modal
   * @class
   */
  GUI.Elements['gui-input-modal'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'open' ) { evName = '_open'; }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    get: function(el, param) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        return input.value;
      }
      return false;
    },
    set: function(el, param, value) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        input.removeAttribute('disabled');
        input.value = value;
        input.setAttribute('disabled', 'disabled');
        input.setAttribute('aria-disabled', 'true');

        return true;
      }
      return false;
    },
    build: function(el) {
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
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
