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
(function(API, Utils, VFS) {
  'use strict';

  //////////////////////////////////////////////////////////////////////
  //                                                                  //
  //                         !!! WARNING !!!                          //
  //                                                                  //
  // THIS IS HIGHLY EXPERIMENTAL, BUT WILL BECOME THE NEXT GENERATION //
  // GUI SYSTEM: https://github.com/andersevenrud/OS.js-v2/issues/136 //
  //                                                                  //
  //////////////////////////////////////////////////////////////////////

  window.OSjs = window.OSjs || {};
  OSjs.API = OSjs.API || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  var lastMenu;

  function getWindowId(el) {
    while ( el.parentNode ) {
      var attr = el.getAttribute('data-window-id');
      if ( attr !== null ) {
        return parseInt(attr, 10);
      }
      el = el.parentNode;
    }
    return null;
  }

  function getLabel(el) {
    var label = el.getAttribute('data-label');
    return label || '';
  }

  function getValueLabel(el, attr) {
    var label = attr ? el.getAttribute('data-label') : null;

    if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
      label = el.childNodes[0].nodeValue;
      Utils.$empty(el);
    }

    return label || '';
  }

  function getIcon(el) {
    var image = el.getAttribute('data-icon');

    if ( image && image.match(/^stock:\/\//) ) {
      image = image.replace('stock://', '');

      var size  = '16x16';
      try {
        var spl = image.split('/');
        var tmp = spl.shift();
        var siz = tmp.match(/^\d+x\d+/);
        if ( siz ) {
          size = siz[0];
          image = spl.join('/');
        }

        image = API.getIcon(image, size);
      } catch ( e ) {}
    }

    return image;
  }

  function parseDynamic(node, win) {
    // TODO: Support application locales! :)
    node.querySelectorAll('*[data-label]').forEach(function(el) {
      var label = API._(el.getAttribute('data-label'));
      el.setAttribute('data-label', label);
    });

    node.querySelectorAll('gui-button').forEach(function(el) {
      var label = getValueLabel(el);
      if ( label ) {
        el.appendChild(document.createTextNode(API._(label)));
      }
    });

    // TODO: Support application resources
    //var url = API.getApplicationResource(win._app, ref);
    node.querySelectorAll('*[data-icon^="stock:"]').forEach(function(el) {
      var image = getIcon(el);
      el.setAttribute('data-icon', image);
    });
  }

  function blurMenu() {
    if ( !lastMenu ) return;
    lastMenu();
  }

  function getProperty(el, param, tagName) {
    tagName = tagName || el.tagName.toLowerCase();
    if ( param === 'value' ) {
      var firstChild;
      if ( tagName.match(/^gui\-(text|password|textarea)$/) ) {
        firstChild = el.querySelector('input');
        if ( tagName === 'gui-textarea' ) {
          firstChild = el.querySelector('textarea');
        }
        if ( firstChild ) {
          return firstChild[param];
        }
      } else if ( tagName.match(/^gui\-(checkbox|radio)$/) ) {
        firstChild = el.querySelector('input');
        if ( firstChild ) {
          return firstChild.value === 'on';
          //return firstChild.getAttribute('checked') === 'checked';
        }
      } else if ( tagName.match(/^gui\-(tree|icon|list|file)\-view$/) ) {
        return CONSTRUCTORS[tagName].values(el);
      }

      return null;
    }
    return el.getAttribute('data-' + param);
  }

  function setProperty(el, param, value, tagName) {
    tagName = tagName || el.tagName.toLowerCase();

    var accept = ['gui-slider', 'gui-text', 'gui-password', 'gui-textarea', 'gui-checkbox', 'gui-radio', 'gui-select', 'gui-select-list', 'gui-button'];
    if ( accept.indexOf(tagName) >= 0 ) {
      var firstChild = el.querySelector('input');
      if ( tagName === 'gui-textarea' ) {
        firstChild = el.querySelector('textarea');
      } else if ( tagName.match(/^gui\-select/) ) {
        firstChild = el.querySelector('select');
      } else if ( tagName.match(/^gui\-button/) ) {
        firstChild = el.querySelector('button');
      }

      if ( param === 'value' ) {
        if ( tagName === 'gui-radio' || tagName === 'gui-checkbox' ) {
          if ( value ) {
            firstChild.setAttribute('checked', 'checked');
          } else {
            firstChild.removeAttribute('checked');
          }
        } else {
          firstChild[param] = value;
        }
      } else if ( param === 'placeholder' ) {
        firstChild.setAttribute('placeholder', value || '');
      } else if ( param === 'disabled' ) {
        if ( value ) {
          firstChild.setAttribute('disabled', 'disabled');
        } else {
          firstChild.removeAttribute('disabled');
        }
      }
    }

    if ( param !== 'value' ) {
      if ( typeof value === 'boolean' ) {
        value = value ? 'true' : 'false';
      } else if ( typeof value === 'object' ) {
        try {
          value = JSON.stringify(value);
        } catch ( e ) {}
      }
      el.setAttribute('data-' + param, value);
    }
  }

  function createElement(tagName, params) {
    var el = document.createElement(tagName);
    Object.keys(params).forEach(function(k) {
      var value = params[k];
      if ( typeof value === 'boolean' ) {
        value = value ? 'true' : 'false';
      }
      el.setAttribute('data-' + k, value);
    });
    return el;
  }

  function handleItemSelection(ev, item, idx, className, selected, root, multipleSelect) {
    root = root || item.parentNode;

    if ( !multipleSelect || !ev.shiftKey ) {
      root.querySelectorAll(className).forEach(function(i) {
        Utils.$removeClass(i, 'gui-active');
      });
      selected = [];
    }

    var findex = selected.indexOf(idx);
    if ( findex >= 0 ) {
      selected.splice(findex, 1);
      Utils.$removeClass(item, 'gui-active');
    } else {
      selected.push(idx);
      Utils.$addClass(item, 'gui-active');
    }

    return selected;
  }

  function createVisualElement(el, nodeType, applyArgs) {
    applyArgs = applyArgs || {};

    var img = document.createElement(nodeType);
    var src = el.getAttribute('data-src');
    var controls = el.getAttribute('data-controls');
    if ( controls ) {
      img.setAttribute('controls', 'controls');
    }
    var autoplay = el.getAttribute('data-autoplay');
    if ( autoplay ) {
      img.setAttribute('autoplay', 'autoplay');
    }

    Object.keys(applyArgs).forEach(function(k) {
      var val = applyArgs[k];
      if ( typeof val === 'function' ) {
        k = k.replace(/^on/, '');
        if ( (nodeType === 'video' || nodeType === 'audio') && k === 'load' ) {
          k = 'loadedmetadata';
        }
        Utils.$bind(img, k, val, false);
      } else {
        if ( typeof applyArgs[k] === 'boolean' ) {
          val = val ? 'true' : 'false';
        }
        img.setAttribute(k, val);
      }
    });

    if ( src ) {
      img.setAttribute('src', src);
    }
    el.appendChild(img);
  }

  function createSelectInput(el, multiple) {
    var disabled = el.getAttribute('data-disabled') !== null;
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

    el.querySelectorAll('gui-select-option').forEach(function(sel) {
      var value = sel.getAttribute('data-value') || '';
      var label = sel.childNodes.length ? sel.childNodes[0].nodeValue : '';

      var option = document.createElement('option');
      option.setAttribute('value', value);
      option.appendChild(document.createTextNode(label));
      select.appendChild(option);
      sel.parentNode.removeChild(sel);
    });

    Utils.$bind(select, 'change', function(ev) {
      select.dispatchEvent(new CustomEvent('_change', {detail: select.value}));
    }, false);

    el.appendChild(select);
  }

  function createInputLabel(el, type, input) {
    var label = getLabel(el);

    if ( label ) {
      var lbl = document.createElement('label');
      var span = document.createElement('span');
      span.appendChild(document.createTextNode(label));

      if ( type === 'checkbox' || type === 'radio' ) {
        lbl.appendChild(input);
        lbl.appendChild(span);
      } else {
        lbl.appendChild(span);
        lbl.appendChild(input);
      }
      el.appendChild(lbl);
    } else {
      el.appendChild(input);
    }
  }

  function createInputOfType(el, type) {
    var group = el.getAttribute('data-group');
    var placeholder = el.getAttribute('data-placeholder');
    var disabled = el.getAttribute('data-disabled') !== null;
    var value = el.childNodes.length ? el.childNodes[0].nodeValue : null;
    Utils.$empty(el);

    var input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    input.setAttribute('type', type);
    if ( placeholder ) {
      input.setAttribute('placeholder', placeholder);
    }
    if ( type === 'radio' && group ) {
      input.setAttribute('name', group + '[]');
    }

    if ( type === 'text' || type === 'password' || type === 'textarea' ) {
      input.value = value;
      Utils.$bind(input, 'keydown', function(ev) {
        if ( ev.keyCode === Utils.Keys.ENTER ) {
          input.dispatchEvent(new CustomEvent('_enter', {detail: this.value}));
        }
      }, false);
    }

    if ( type === 'range' || type === 'slider' ) {
      var min = el.getAttribute('data-min');
      var max = el.getAttribute('data-max');
      var ste = el.getAttribute('data-step');

      if ( min ) { input.setAttribute('min', min); }
      if ( max ) { input.setAttribute('max', max); }
      if ( ste ) { input.setAttribute('step', ste); }
    }

    if ( disabled ) {
      input.setAttribute('disabled', 'disabled');
    }

    // TODO: Custom tabindex
    input.setAttribute('tabindex', -1);

    Utils.$bind(input, 'change', function(ev) {
      var value = input.value;
      if ( type === 'radio' || type === 'checkbox' ) {
        //value = input.getAttribute('checked') === 'checked';
        value = input.value === 'on';
      }
      input.dispatchEvent(new CustomEvent('_change', {detail: value}));
    }, false);

    createInputLabel(el, type, input);
  }

  function setFlexbox(el, grow, shrink, defaultGrow, defaultShrink, checkEl) {
    var basis = (checkEl || el).getAttribute('data-basis') || 'auto';
    var align = el.getAttribute('data-align');

    var tmp;
    if ( typeof grow === 'undefined' || grow === null ) {
      tmp = (checkEl || el).getAttribute('data-grow');
      if ( tmp === null ) {
        grow = typeof defaultGrow === 'undefined' ? 0 : defaultGrow;
      } else {
        grow = parseInt(tmp, 10) || 0;
      }
    } else {
      grow = basis === 'auto' ? 1 : grow;
    }

    if ( typeof shrink === 'undefined' || shrink === null ) {
      tmp = (checkEl || el).getAttribute('data-shrink');
      if ( tmp === null ) {
        shrink = typeof defaultShrink === 'undefined' ? 0 : defaultShrink;
      } else {
        shrink = parseInt(tmp, 10) || 0;
      }
    } else {
      shrink = basis === 'auto' ? 1 : shrink;
    }

    var flex = Utils.format('{0} {1} {2}', grow.toString(), shrink.toString(), basis);
    el.style['webkitFlex'] = flex;
    el.style['mozFflex'] = flex;
    el.style['msFflex'] = flex;
    el.style['oFlex'] = flex;
    el.style['flex'] = flex;

    if ( align ) {
      el.style.alignSelf = align.match(/start|end/) ? 'flex-' + align : align;
    }
  }

  function createDrag(el, onDown, onMove, onUp) {
    onDown = onDown || function() {};
    onMove = onMove || function() {};
    onUp = onUp || function() {};

    var startX, startY;
    var dragging = false;

    function _onMouseDown(ev) {
      ev.preventDefault();

      startX = ev.clientX;
      startY = ev.clientY;

      onDown(ev);
      dragging = true;

      Utils.$bind(window, 'mouseup', _onMouseUp, false);
      Utils.$bind(window, 'mousemove', _onMouseMove, false);
    }
    function _onMouseMove(ev) {
      ev.preventDefault();

      if ( dragging ) {
        var diffX = ev.clientX - startX;
        var diffY = ev.clientY - startY;
        onMove(ev, diffX, diffX);
      }
    }
    function _onMouseUp(ev) {
      onUp(ev);
      dragging = false;

      Utils.$unbind(window, 'mouseup', _onMouseUp, false);
      Utils.$unbind(window, 'mousemove', _onMouseMove, false);
    }

    Utils.$bind(el, 'mousedown', _onMouseDown, false);
  }

  function bindTextInputEvents(el, evName, callback, params) {
    if ( evName === 'enter' ) {
      evName = '_enter';
    }
    var target = el.querySelector('input');
    Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
  }

  function addToSelectBox(el, entries) {
    var target = el.querySelector('select');
    if ( !(entries instanceof Array) ) {
      entries = [entries];
    }

    entries.forEach(function(e) {
      var opt = document.createElement('option');
      opt.setAttribute('value', e.value);
      opt.appendChild(document.createTextNode(e.label));

      target.appendChild(opt);
    });
  }

  function removeFromSelectBox(el, what) {
    var target = el.querySelector('select');
    // TODO
  }

  function clearSelectBox(el) {
    var target = el.querySelector('select');
    Utils.$empty(target);
  }

  function getViewNodeValue(found) {
    var value = found.getAttribute('data-value');
    try {
      value = JSON.parse(value);
    } catch ( e ) {
      value = null;
    }
    return value;
  }

  /////////////////////////////////////////////////////////////////////////////
  // ELEMENTS
  /////////////////////////////////////////////////////////////////////////////

  var CONSTRUCTORS = (function() {

    return {
      //
      // INPUTS
      //

      'gui-label': {
        set: function(el, param, value, isHTML) {
          if ( param === 'value' ) {
            var lbl = el.querySelector('label');
            Utils.$empty(lbl);
            if ( isHTML ) {
              lbl.innerHTML = value;
            } else {
              lbl.appendChild(document.createTextNode(value));
            }
          }
        },
        build: function(el) {
          var label = getValueLabel(el, true);
          var lbl = document.createElement('label');
          lbl.appendChild(document.createTextNode(label));
          el.appendChild(lbl);
        }
      },

      'gui-textarea': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('textarea');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          createInputOfType(el, 'textarea');
        }
      },

      'gui-text': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          bindTextInputEvents.apply(this, arguments);
        },
        build: function(el) {
          createInputOfType(el, 'text');
        }
      },

      'gui-password': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          bindTextInputEvents.apply(this, arguments);
        },
        build: function(el) {
          createInputOfType(el, 'password');
        }
      },

      'gui-file-upload': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('input');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          var input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.onchange = function(ev) {
            input.dispatchEvent(new CustomEvent('_change', {detail: input.files[0]}));
          };
          el.appendChild(input);
        }
      },

      'gui-radio': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('input');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          createInputOfType(el, 'radio');
        }
      },

      'gui-checkbox': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('input');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          createInputOfType(el, 'checkbox');
        }
      },

      'gui-switch': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('input');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          var input = document.createElement('input');
          input.type = 'checkbox';
          el.appendChild(input);

          var inner = document.createElement('div');

          var button = document.createElement('button');
          inner.appendChild(button);
          createInputLabel(el, 'switch', inner);

          var val = false;
          function toggleValue(v) {
            if ( typeof v === 'undefined' ) {
              val = !val;
            } else {
              val = v;
            }

            if ( val !== true ) {
              input.removeAttribute('checked', 'checked');
              Utils.$removeClass(button, 'gui-active');
              button.innerHTML = '0';
            } else {
              input.setAttribute('checked', 'checked');
              Utils.$addClass(button, 'gui-active');
              button.innerHTML = '1';
            }
          }

          Utils.$bind(el, 'click', function() {
            var disabled = el.getAttribute('data-disabled') !== null;
            if ( !disabled ) {
              toggleValue();
            }
          }, false);

          toggleValue(false);
        }
      },

      'gui-button': {
        set: function(el, param, value, isHTML) {
          if ( param === 'value' ) {
            var lbl = el.querySelector('button');
            Utils.$empty(lbl);
            if ( isHTML ) {
              lbl.innerHTML = value;
            } else {
              lbl.appendChild(document.createTextNode(value));
            }
          }
        },
        bind: function(el, evName, callback, params) {
          var target = el.querySelector('button');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          var icon = el.getAttribute('data-icon');
          var disabled = el.getAttribute('data-disabled') !== null;
          var label = getValueLabel(el);

          var input = document.createElement('button');
          input.appendChild(document.createTextNode(label));
          if ( disabled ) {
            input.setAttribute('disabled', 'disabled');
          }

          if ( icon ) {
            var img = document.createElement('img');
            img.src = icon;
            if ( input.firstChild ) {
              input.insertBefore(img, input.firstChild);
            } else {
              input.appendChild(img);
            }
            Utils.$addClass(input, 'gui-has-image');
          }

          el.appendChild(input);
        }
      },

      'gui-select': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('select');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          // TODO Selected index/entry
          createSelectInput(el);
        },
        call: function(el, method, args) {
          if ( method === 'add' ) {
            addToSelectBox(el, args[0]);
          } else if ( method === 'remove' ) {
            removeFromSelectBox(el, args[0]);
          } else if ( method === 'clear' ) {
            clearSelectBox(el);
          }
        }
      },

      'gui-select-list': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('select');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          // TODO Selected index/entry
          createSelectInput(el, true);
        },
        call: function(el, method, args) {
          if ( method === 'add' ) {
            addToSelectBox(el, args[0]);
          } else if ( method === 'remove' ) {
            removeFromSelectBox(el, args[0]);
          } else if ( method === 'clear' ) {
            clearSelectBox(el);
          }
        }
      },

      'gui-slider': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('input');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          createInputOfType(el, 'range');
        }
      },

      'gui-richtext' : {
        // TODO Events
        build: function(el) {
          var text = el.childNodes.length ? el.childNodes[0].nodeValue : '';

          var wm = OSjs.Core.getWindowManager();
          var theme = (wm ? wm.getSetting('theme') : 'default') || 'default';
          var themeSrc = OSjs.API.getThemeCSS(theme);

          var editable = el.getAttribute('data-editable');
          editable = editable === null || editable === 'true';

          var template = '<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="' + themeSrc + '" /></head><body contentEditable="true"></body></html>';
          if ( !editable ) {
            template = template.replace(' contentEditable="true"', '');
          }

          Utils.$empty(el);

          var doc;
          var iframe = document.createElement('iframe');
          iframe.setAttribute('border', 0);
          el.appendChild(iframe);

          setTimeout(function() {
            try {
              doc = iframe.contentDocument || iframe.contentWindow.document;
              doc.open();
              doc.write(template);
              doc.close();

              if ( text ) {
                doc.body.innerHTML = text;
              }
            } catch ( error ) {
              console.error('gui-richtext', error);
            }
          }, 0);
        }
      },

      //
      // MISC
      //
      'gui-color-box': {
        set: function(el, param, value) {
          if ( param === 'value' ) {
            el.style.backgroundColor = value;
          }
        },
        build: function(el) {
        }
      },

      'gui-color-swatch': {
        bind: function(el, evName, callback, params) {
          var target = el.querySelector('canvas');
          if ( evName === 'select' || evName === 'change' ) {
            evName = '_change';
          }
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          var cv        = document.createElement('canvas');
          cv.width      = 100;
          cv.height     = 100;

          var ctx       = cv.getContext('2d');
          var gradient  = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);

          function getColor(ev) {
            var pos = OSjs.Utils.$position(cv);
            var cx = typeof ev.offsetX === 'undefined' ? (ev.clientX - pos.left) : ev.offsetX;
            var cy = typeof ev.offsetY === 'undefined' ? (ev.clientY - pos.top) : ev.offsetY;
            var data = ctx.getImageData(cx, cy, 1, 1).data;

            return {
              r: data[0],
              g: data[1],
              b: data[2],
              hex: Utils.convertToHEX(data[0], data[1], data[2])
            };
          }

          gradient.addColorStop(0,    'rgb(255,   0,   0)');
          gradient.addColorStop(0.15, 'rgb(255,   0, 255)');
          gradient.addColorStop(0.33, 'rgb(0,     0, 255)');
          gradient.addColorStop(0.49, 'rgb(0,   255, 255)');
          gradient.addColorStop(0.67, 'rgb(0,   255,   0)');
          gradient.addColorStop(0.84, 'rgb(255, 255,   0)');
          gradient.addColorStop(1,    'rgb(255,   0,   0)');

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

          gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
          gradient.addColorStop(0,   'rgba(255, 255, 255, 1)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
          gradient.addColorStop(0.5, 'rgba(0,     0,   0, 0)');
          gradient.addColorStop(1,   'rgba(0,     0,   0, 1)');

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

          Utils.$bind(cv, 'click', function(ev) {
            cv.dispatchEvent(new CustomEvent('_change', {detail: getColor(ev)}));
          }, false);

          el.appendChild(cv);
        }
      },

      //
      // MISC
      //

      'gui-progress-bar': {
        set: function(el, param, value) {
          el.setAttribute('data-' + param, value);
          if ( param === 'progress' ) {
            value = parseInt(value, 10);
            value = value % 100;

            el.querySelector('div').style.width = value + '%';
            el.querySelector('span').innerHTML = value + '%';
          }
        },
        build: function(el) {
          var p = (el.getAttribute('data-progress') || 0);
          var percentage = p.toString() + '%';

          var progress = document.createElement('div');
          progress.style.width = percentage;

          var span = document.createElement('span');
          span.appendChild(document.createTextNode(percentage));

          el.appendChild(progress);
          el.appendChild(span);
        }
      },

      'gui-audio': {
        bind: function(el, evName, callback, params) {
          var target = el.querySelector('audio');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el, applyArgs) {
          createVisualElement(el, 'audio', applyArgs);
        }
      },

      'gui-video': {
        bind: function(el, evName, callback, params) {
          var target = el.querySelector('video');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el, applyArgs) {
          createVisualElement(el, 'video', applyArgs);
        }
      },

      'gui-image': {
        bind: function(el, evName, callback, params) {
          var target = el.querySelector('img');
          Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el, applyArgs) {
          createVisualElement(el, 'img', applyArgs);
        }
      },

      'gui-menu': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'select' ) {
            evName = '_select';
          }
          el.querySelectorAll('gui-menu-entry > span').forEach(function(target) {
            Utils.$bind(target.parentNode, evName, callback.bind(new UIElement(el)), params);
          });
        },
        build: function(el, customMenu) {
          function bindSelectionEvent(child, idx, expand) {
            var id = child.getAttribute('data-id');
            Utils.$bind(child, 'mousedown', function(ev) {
              ev.stopPropagation();
              child.dispatchEvent(new CustomEvent('_select', {detail: {index: idx, id: id}}));
              blurMenu();
            }, false);
          }

          function runChildren(pel, level) {
            var children = pel.children;
            var child, span, label, expand, icon;

            for ( var i = 0; i < children.length; i++ ) {
              child = children[i];
              expand = false;

              if ( child && child.tagName.toLowerCase() === 'gui-menu-entry') {
                if ( child.children && child.children.length ) {
                  Utils.$addClass(child, 'gui-menu-expand');
                  expand = true;
                }
                label = getLabel(child);
                icon = getIcon(child);

                span = document.createElement('span');
                span.appendChild(document.createTextNode(label));
                if ( icon ) {
                  child.style.backgroundImage = 'url(' + icon + ')';
                  Utils.$addClass(span, 'gui-has-image');
                }
                child.appendChild(span);

                bindSelectionEvent(child, i, expand);

                if ( customMenu ) {
                  var sub = child.querySelector('gui-menu');
                  if ( sub ) {
                    runChildren(sub, level + 1);
                  }
                }
              }
            }
          }

          runChildren(el, 0);
        }
      },

      'gui-menu-bar': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'select' ) {
            evName = '_select';
          }
          el.querySelectorAll('gui-menu-bar-entry').forEach(function(target) {
            Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
          });
        },
        build: function(el) {
          el.querySelectorAll('gui-menu-bar-entry').forEach(function(mel, idx) {
            var label = getLabel(mel);
            var id = mel.getAttribute('data-id');

            var span = document.createElement('span');
            span.appendChild(document.createTextNode(label));

            mel.insertBefore(span, mel.firstChild);

            var submenu = mel.querySelector('gui-menu');
            if ( submenu ) {
              Utils.$bind(mel, 'click', function(ev) {
                lastMenu = function() {
                  Utils.$removeClass(mel, 'gui-active');
                };

                if ( Utils.$hasClass(mel, 'gui-active') ) {
                  Utils.$removeClass(mel, 'gui-active');
                } else {
                  Utils.$addClass(mel, 'gui-active');

                  mel.dispatchEvent(new CustomEvent('_select', {detail: {index: idx, id: id}}));
                }
              }, false);
            }

          });
        }
      },

      //
      // CONTAINERS
      //

      'gui-iframe' : {
        build: function(el) {
          var src = el.getAttribute('data-src') || 'about:blank';
          var iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.setAttribute('border', 0);
          el.appendChild(iframe);
        }
      },

      'gui-button-bar' : {
        build: function(el) {
        }
      },

      'gui-tabs': {
        bind: function(el, evName, callback, params) {
          if ( (['select', 'activate']).indexOf(evName) !== -1 ) {
            evName = 'change';
          }
          if ( evName === 'change' ) {
            evName = '_' + evName;
          }
          Utils.$bind(el, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          var tabs = document.createElement('ul');
          var contents = document.createElement('div');

          var lastTab;
          function selectTab(ev, idx, tab) {
            if ( lastTab ) {
              Utils.$removeClass(lastTab, 'gui-active');
            }

            tabs.querySelectorAll('li').forEach(function(el, eidx) {
              Utils.$removeClass(el, 'gui-active');
              if ( eidx === idx ) {
                Utils.$addClass(el, 'gui-active');
              }
            });
            contents.querySelectorAll('gui-tab-container').forEach(function(el, eidx) {
              Utils.$removeClass(el, 'gui-active');
              if ( eidx === idx ) {
                Utils.$addClass(el, 'gui-active');
              }
            });

            lastTab = tab;
            Utils.$addClass(tab, 'gui-active');

            el.dispatchEvent(new CustomEvent('_change', {detail: {index: idx}}));
          }

          el.querySelectorAll('gui-tab-container').forEach(function(el, idx) {
            var tab = document.createElement('li');
            var label = getLabel(el);

            Utils.$bind(tab, 'click', function(ev) {
              selectTab(ev, idx, tab);
            }, false);

            tab.appendChild(document.createTextNode(label));
            tabs.appendChild(tab);
            contents.appendChild(el);
          });

          el.appendChild(tabs);
          el.appendChild(contents);

          var currentTab = parseInt(el.getAttribute('data-selected-index'), 10) || 0;
          selectTab(null, currentTab);
        }
      },

      'gui-paned-view': {
        bind: function(el, evName, callback, params) {
          if ( evName === 'resize' ) {
            evName = '_' + evName;
          }
          Utils.$bind(el, evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          function bindResizer(resizer, idx) {
            var resizeEl = resizer.previousElementSibling;
            if ( !resizeEl ) return;

            var startWidth = resizeEl.offsetWidth;
            var maxWidth = el.offsetWidth;

            createDrag(resizer, function(ev) {
              startWidth = resizeEl.offsetWidth;
              maxWidth = el.offsetWidth / 2;
            }, function(ev, dx, dy) {
              var newWidth = startWidth + dx;
              if ( !isNaN(newWidth) && newWidth > 0 && newWidth < maxWidth ) {
                var flex = newWidth.toString() + 'px';
                resizeEl.style['webkitFlexBasis'] = flex;
                resizeEl.style['mozFflexBasis'] = flex;
                resizeEl.style['msFflexBasis'] = flex;
                resizeEl.style['oFlexBasis'] = flex;
                resizeEl.style['flexBasis'] = flex;
              }
            }, function(ev) {
              el.dispatchEvent(new CustomEvent('_resize', {detail: {index: idx}}));
            });

          }

          el.querySelectorAll('gui-paned-view-container').forEach(function(cel, idx) {
            if ( idx % 2 ) {
              var resizer = document.createElement('gui-paned-view-handle');
              cel.parentNode.insertBefore(resizer, cel);
              bindResizer(resizer, idx);
            }
          });
        }
      },

      'gui-paned-view-container': {
        build: function(el) {
          setFlexbox(el, 0, 0);
        }
      },

      'gui-vbox': {
        build: function(el) {
        }
      },

      'gui-vbox-container': {
        build: function(el) {
          setFlexbox(el);
        }
      },

      'gui-hbox': {
        build: function(el) {
        }
      },

      'gui-hbox-container': {
        build: function(el) {
          setFlexbox(el);
        }
      },

      //
      // VIEWS
      //

      'gui-icon-view': {
        bind: function(el, evName, callback, params) {
          if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
            evName = '_' + evName;
          }
          Utils.$bind(el, evName, callback.bind(new UIElement(el)), params);
        },
        values: function(el) {
          var selected = [];
          var active = (el._selected || [])

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

          function handleItemClick(ev, item, idx, selected) {
            var multipleSelect = el.getAttribute('data-multiple');
            multipleSelect = multipleSelect === null || multipleSelect === 'true';

            return handleItemSelection(ev, item, idx, 'gui-icon-view-entry', selected, null, multipleSelect);
          }

          function getSelected() {
            return CONSTRUCTORS['gui-icon-view'].values(el);
          }

          el.querySelectorAll('gui-icon-view-entry').forEach(function(cel, idx) {
            var icon = cel.getAttribute('data-icon');
            var label = getLabel(cel);

            var dicon = document.createElement('div');
            var dimg = document.createElement('img');
            dimg.src = icon;
            dicon.appendChild(dimg);

            var dlabel = document.createElement('div');
            var dspan = document.createElement('span');
            dspan.appendChild(document.createTextNode(label));
            dlabel.appendChild(dspan);

            Utils.$bind(cel, 'click', function(ev) {
              el._selected = handleItemClick(ev, cel, idx, el._selected);
              el.dispatchEvent(new CustomEvent('_select', {detail: {entries: getSelected()}}));
            }, false);
            Utils.$bind(cel, 'dblclick', function(ev) {
              el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected()}}));
            }, false);

            cel.appendChild(dicon);
            cel.appendChild(dlabel);
          });
        }
      },

      'gui-tree-view': {
        bind: function(el, evName, callback, params) {
          if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
            evName = '_' + evName;
          }
          Utils.$bind(el, evName, callback.bind(new UIElement(el)), params);
        },
        values: function(el) {
          var selected = [];
          var active = (el._selected || [])

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
            return CONSTRUCTORS['gui-tree-view'].values(el);
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
            var label = getLabel(sel);
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
      },

      'gui-list-view': (function() {

        function resize(rel, w) {
          var flex = w.toString() + 'px';
          rel.style['webkitFlexBasis'] = flex;
          rel.style['mozFflexBasis'] = flex;
          rel.style['msFflexBasis'] = flex;
          rel.style['oFlexBasis'] = flex;
          rel.style['flexBasis'] = flex;
        }

        function createEntry(v) {
          var label = v.label || '';
          if ( v.label ) {
            delete v.label;
          }

          var nel = createElement('gui-list-view-column', v);
          nel.appendChild(document.createTextNode(label));
          setFlexbox(nel, null, null, 1, 0);
          return nel;
        }

        function createResizers(el) {
          var head = el.querySelector('gui-list-view-columns');
          var body = el.querySelector('gui-list-view-rows');
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

              createDrag(resizer, function(ev) {
                startWidth = col.offsetWidth;
                maxWidth = el.offsetWidth / 2; // FIXME
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
            return CONSTRUCTORS['gui-list-view'].values(el);
          }

          row.querySelectorAll('gui-list-view-column').forEach(function(cel, idx) {
            var cl = cols.length;
            var x = cl ? idx % cl : idx;
            var grow = cl ? 1 : 0;
            var shrink = cl ? 1 : 0;
            var headerEl = headContainer ? headContainer.querySelectorAll('gui-list-view-column')[x] : null;

            setFlexbox(cel, null, null, grow, shrink, headerEl);

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
              el._selected = handleItemSelection(ev, row, idx, 'gui-list-view-row', el._selected, null, multipleSelect);

              var selected = getSelected();
              el.dispatchEvent(new CustomEvent('_select', {detail: {entries: selected}}));
              el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: selected}}));
            });
          } else {
            Utils.$bind(row, 'click', function(ev) {
              var multipleSelect = el.getAttribute('data-multiple');
              multipleSelect = multipleSelect === null || multipleSelect === 'true';

              var idx = Utils.$index(row);
              el._selected = handleItemSelection(ev, row, idx, 'gui-list-view-row', el._selected, null, multipleSelect);
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
              source = getWindowId(el);
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

        return {
          bind: function(el, evName, callback, params) {
            if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
              evName = '_' + evName;
            }
            Utils.$bind(el, evName, callback.bind(new UIElement(el)), params);
          },
          values: function(el) {
            var selected = [];
            var body = el.querySelector('gui-list-view-rows');
            var active = (el._selected || [])
            active.forEach(function(iter) {
              var found = body.querySelectorAll('gui-list-view-row')[iter];
              if ( found ) {
                selected.push({index: iter, data: getViewNodeValue(found)});
              }
            });
            return selected;
          },
          set: function(el, param, value, arg) {
            if ( param === 'columns' ) {
              var head = el.querySelector('gui-list-view-columns');
              var row = head.querySelector('gui-list-view-row');
              if ( row ) {
                Utils.$empty(row);
              } else {
                row = document.createElement('gui-list-view-row');
              }

              el._columns = [];
              value.forEach(function(v) {
                var iter = {
                  visible: (typeof v.visible === 'undefined') || v.visible === true
                };
                el._columns.push(iter);
                var nel = createEntry(v);
                if ( !iter.visible ) {
                  nel.style.display = 'none';
                }
                row.appendChild(nel);
              });

              head.appendChild(row);

              createResizers(el);
              return;
            } else if ( param === 'selected' ) {
              var body = el.querySelector('gui-list-view-rows');
              var select = [];

              body.querySelectorAll('gui-list-view-row').forEach(function(r, idx) {
                Utils.$removeClass(r, 'gui-active');

                try {
                  var json = JSON.parse(r.getAttribute('data-value'));
                  if ( json[arg] == value ) {
                    select.push(idx);
                    Utils.$addClass(r, 'gui-active');
                    // TODO: Scroll to position
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
              var cols = el.querySelectorAll('gui-list-view-head gui-list-view-column');
              var body = el.querySelector('gui-list-view-rows');
              var entries = args[0];
              if ( !(entries instanceof Array) ) {
                entries = [entries];
              }

              entries.forEach(function(e) {
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

                  body.appendChild(row);
                }

                initRow(el, row);
              });

            } else if ( method === 'remove' ) {
              var findId = args[0];
              var findKey = args[1] || 'id';
              var q = 'data-' + findKey + '="' + findId + '"';

              el.querySelectorAll('gui-list-view-rows > gui-list-view-row[' + q + ']').forEach(function(cel) {
                Utils.$remove(cel);
              });
            } else if ( method === 'clear' ) {
              // TODO: Reset scrolltop
              Utils.$empty(el.querySelector('gui-list-view-rows'));
            }
          },
          build: function(el, applyArgs) {
            var headContainer, bodyContainer;
            var head = el.querySelector('gui-list-view-columns');

            if ( !head ) {
              head = document.createElement('gui-list-view-columns');
              if ( el.children.length )  {
                el.insertBefore(head, el.firstChild);
              } else {
                el.appendChild(head);
              }
            }
            var body = el.querySelector('gui-list-view-rows');
            if ( !body ) {
              body = document.createElement('gui-list-view-rows');
              el.appendChild(body);
            }

            el._selected = [];
            el._columns = [];

            if ( head ) {
              headContainer = document.createElement('gui-list-view-head');
              headContainer.appendChild(head);
              if ( body ) {
                el.insertBefore(headContainer, body);
              } else {
                el.appendChild(headContainer);
              }
              createResizers(el);
            }

            if ( body ) {
              bodyContainer = document.createElement('gui-list-view-body');
              bodyContainer.appendChild(body);
              el.appendChild(bodyContainer);
            }

            if ( headContainer ) {
              Utils.$bind(el, 'scroll', function() {
                headContainer.style.top = el.scrollTop + 'px';
              }, false);

              el.querySelectorAll('gui-list-view-head gui-list-view-column').forEach(function(cel, idx) {
                setFlexbox(cel, null, null, 1, 0);

                var vis = cel.getAttribute('data-visible');
                var iter = {
                  visible: vis === null || vis === 'true'
                };

                el._columns.push(iter);

                if ( !iter.visible ) {
                  cel.style.display = 'none';
                }
              });
            }

            el.querySelectorAll('gui-list-view-body gui-list-view-row').forEach(function(row) {
              initRow(el, row);
            });
          }
        };
      })(),

      'gui-file-view': (function() {
        function getChildView(el) {
          return el.children[0];
        }

        function buildChildView(el) {
          var type = el.getAttribute('data-type') || 'list-view';
          if ( !type.match(/^gui\-/) ) {
            type = 'gui-' + type;
          }

          var nel = new UIElementDataView(createElement(type, {'draggable': true, 'draggable-type': 'file'}));
          CONSTRUCTORS[type].build(nel.$element);

          if ( type === 'gui-list-view' ) {
            nel.set('columns', [
              {label: 'Filename', resizable: true, basis: '100px'},
              {label: 'MIME', resizable: true},
              {label: 'Size', basis: '50px'}
            ]);
          }

          el.appendChild(nel.$element);
        }

        function scandir(tagName, dir, opts, cb) {
          var file = new VFS.File(dir);
          file.type  = 'dir';

          function _getIcon(iter) {
            var icon = 'status/gtk-dialog-question.png';
            return API.getFileIcon(iter, null, icon);
          }

          var scanopts = {
            showDotFiles: opts.dotfiles === true,
            mimeFilter:   opts.filter || [],
            typeFilter:   opts.filetype || null
          };

          VFS.scandir(file, function(error, result) {
            if ( error ) { cb(error); return; }

            var list = [];
            var summary = {size: 0, directories: 0, files: 0, hidden: 0};
            (result || []).forEach(function(iter) {
              list.push({
                value: iter,
                columns: [
                  {label: iter.filename, icon: _getIcon(iter)},
                  {label: iter.mime},
                  {label: iter.size}
                ]
              });

              summary.size += iter.size || 0;
              summary.directories += iter.type === 'dir' ? 1 : 0;
              summary.files += iter.type !== 'dir' ? 1 : 0;
              summary.hidden += iter.filename.substr(0) === '.' ? 1 : 0;
            });

            cb(false, list, summary);
          }, scanopts);
        }

        return {
          bind: function(el, evName, callback, params) {
            if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
              evName = '_' + evName;
            }

            var target = getChildView(el);
            if ( target ) {
              Utils.$bind(target, evName, callback.bind(new UIElement(el)), params);
            }
          },
          set: function(el, param, value, arg) {
            if ( param === 'type' ) {
              Utils.$empty(el);
              el.setAttribute('data-type', value);
              buildChildView(el);
              return;
            } else if ( (['filter', 'dotfiles', 'filetype']).indexOf(param) >= 0 ) {
              setProperty(el, param, value);
              return;
            }

            var target = getChildView(el);
            if ( target ) {
              var tagName = target.tagName.toLowerCase();
              CONSTRUCTORS[tagName].set(target, param, value, arg);
            }

          },
          build: function(el) {
            buildChildView(el);
          },
          values: function(el) {
            var target = getChildView(el);
            if ( target ) {
              var tagName = target.tagName.toLowerCase();
              return CONSTRUCTORS[tagName].values(target);
            }
            return null;
          },
          call: function(el, method, args) {
            args = args || {};
            args.done = args.done || function() {};

            var target = getChildView(el);
            if ( target ) {
              var tagName = target.tagName.toLowerCase();

              if ( method === 'chdir' ) {
                var t = new UIElementDataView(target);
                var dir = args.path || OSjs.API.getDefaultPath('/');

                var opts = {
                  filter: null,
                  dotfiles: el.getAttribute('data-dotfiles') === 'true',
                  filetype: el.getAttribute('data-filetype')
                };

                try {
                  opts.filter = JSON.parse(el.getAttribute('data-filter'));
                } catch ( e ) {
                }

                scandir(tagName, dir, opts, function(error, result, summary) {
                  if ( !error ) {
                    t.clear();
                    t.add(result);
                  }

                  args.done(error, summary);
                });

                return;
              }

              CONSTRUCTORS[tagName].call(target, method, args);
            }
          }
        };
      })()

    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // UIELEMENT CLASS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Base UIElement Class
   */
  function UIElement(el) {
    this.$element = el || null;
    this.tagName = el ? el.tagName.toLowerCase() : null;
    this.oldDisplay = null;

    if ( !el ) {
      console.warn('UIElement() was constructed without a DOM element');
    }
  }

  UIElement.prototype.blur = function() {
    // TODO: For more elements
    if ( this.$element ) {
      var firstChild = this.$element.querySelector('input');
      if ( firstChild ) {
        firstChild.blur();
      }
    }
    return this;
  };

  UIElement.prototype.focus = function() {
    // TODO: For more elements
    if ( this.$element ) {
      var firstChild = this.$element.firstChild || this.$element; //this.$element.querySelector('input');
      if ( firstChild ) {
        firstChild.focus();
      }
    }
    return this;
  };

  UIElement.prototype.show = function() {
    if ( this.$element ) {
      this.$element.style.display = this.oldDisplay || '';
    }
    return this;
  };

  UIElement.prototype.hide = function() {
    if ( this.$element ) {
      if ( !this.oldDisplay ) {
        this.oldDisplay = this.$element.style.display;
      }
      this.$element.style.display = 'none';
    }
    return this;
  };

  UIElement.prototype.on = function(evName, callback, args) {
    if ( CONSTRUCTORS[this.tagName] && CONSTRUCTORS[this.tagName].bind ) {
      CONSTRUCTORS[this.tagName].bind(this.$element, evName, callback, args);
    }
    return this;
  };

  UIElement.prototype.set = function(param, value, arg) {
    if ( this.$element ) {
      if ( CONSTRUCTORS[this.tagName] && CONSTRUCTORS[this.tagName].set ) {
        CONSTRUCTORS[this.tagName].set(this.$element, param, value, arg);
      } else {
        setProperty(this.$element, param, value, arg);
      }
    }
    return this;
  };

  UIElement.prototype.get = function(param) {
    if ( this.$element ) {
      if ( CONSTRUCTORS[this.tagName] && CONSTRUCTORS[this.tagName].get ) {
        return CONSTRUCTORS[this.tagName].get(this.$element, param);
      } else {
        return getProperty(this.$element, param);
      }
    }
    return null;
  };

  UIElement.prototype.append = function(el) {
    if ( el instanceof UIElement ) {
      el = el.$element;
    }
    this.$element.appendChild(el);
  };

  /**
   * Extended UIElement for ListView, TreeView, IconView, Select, SelectList
   */
  function UIElementDataView() {
    UIElement.apply(this, arguments);
  }

  UIElementDataView.prototype = Object.create(UIElement.prototype);
  UIElementDataView.constructor = UIElement;

  UIElementDataView.prototype._call = function(method, args) {
    if ( CONSTRUCTORS[this.tagName] && CONSTRUCTORS[this.tagName].call ) {
      var cargs = ([this.$element, method, args]);//.concat(args);
      CONSTRUCTORS[this.tagName].call.apply(this, cargs);
    }
    return this;
  };

  UIElementDataView.prototype.clear = function() {
    return this._call('clear', []);
  };

  UIElementDataView.prototype.add = function(props) {
    return this._call('add', [props]);
  };

  UIElementDataView.prototype.remove = function(id, key) {
    return this._call('remove', [id, key]);
  };

  /////////////////////////////////////////////////////////////////////////////
  // UISCHEME CLASS
  /////////////////////////////////////////////////////////////////////////////

  function UIScheme(url) {
    this.url = url;
    this.scheme = null;
  }

  UIScheme.prototype.load = function(cb) {
    var self = this;
    Utils.ajax({
      url: this.url,
      onsuccess: function(html) {
        var doc = document.createDocumentFragment();
        var wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        doc.appendChild(wrapper);
        self.scheme = doc;

        cb(false, doc);
      },
      onerror: function() {
        cb('Failed to fetch scheme');
      }
    });
  };

  UIScheme.prototype.parse = function(id, type, win, onparse) {
    onparse = onparse || function() {};

    var content;
    if ( type ) {
      content = this.scheme.querySelector(type + '[data-id="' + id + '"]');
    } else {
      content = this.scheme.querySelector('application-window[data-id="' + id + '"]') ||
                this.scheme.querySelector('application-fragment[data-id="' + id + '"]');
    }

    if ( content ) {
      var node = content.cloneNode(true);

      node.querySelectorAll('*').forEach(function(el) {
        var lcase = el.tagName.toLowerCase();
        if ( lcase.match(/^gui\-/) && !lcase.match(/\-container|\-(h|v)box$|\-columns?|\-rows?/) ) {
          Utils.$addClass(el, 'gui-element');
        }
      });

      parseDynamic(node, win);

      onparse(node);

      Object.keys(CONSTRUCTORS).forEach(function(key) {
        node.querySelectorAll(key).forEach(CONSTRUCTORS[key].build);
      });

      return node;
    }

    return null;
  };

  UIScheme.prototype.render = function(win, id, root, type, onparse) {
    root = root || win._getRoot();

    var content = this.parse(id, type, win, onparse);
    if ( content ) {
      // NOTE: This for some reasons fail when there is more than one child. WHY ?!?!?
      var children = content.children;
      for ( var i = 0; i < children.length; i++ ) {
        try {
          root.appendChild(children[i]);
        } catch ( e ) {
          console.warn('UIScheme::parse()', 'exception', e);
        }
      }
    }
  };

  UIScheme.prototype.create = function(win, tagName, params, parentNode, applyArgs) {
    tagName = tagName || '';
    params = params || {};
    parentNode = parentNode || win.getRoot();

    var el = document.createElement(tagName);
    Object.keys(params).forEach(function(k) {
      var val = params[k];
      if ( typeof val === 'boolean' ) {
        val = val ? 'true' : 'false';
      } else {
        val = val.toString();
      }

      el.setAttribute('data-' + k, val);
    });

    parentNode.appendChild(el);

    CONSTRUCTORS[tagName].build(el, applyArgs, win);

    return new UIElement(el);
  };

  UIScheme.prototype.find = function(win, id, root) {
    root = root || win._getRoot();
    return this.get(root.querySelector('[data-id="' + id + '"]'));
  };

  UIScheme.prototype.get = function(el) {
    if ( el ) {
      var tagName = el.tagName.toLowerCase();
      if ( tagName.match(/^gui\-(list|tree|icon|file)\-view$/) || tagName.match(/^gui\-select/) ) {
        return new UIElementDataView(el);
      }
    }
    return new UIElement(el);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.API.blurMenu = blurMenu;

  OSjs.API.createMenu = function(items, ev, customInstance) {
    items = items || [];

    blurMenu();

    var root = createElement('gui-menu', {});
    function resolveItems(arr, par) {
      arr.forEach(function(iter) {
        var entry = createElement('gui-menu-entry', {label: iter.title, icon: iter.icon});
        if ( iter.menu ) {
          var nroot = createElement('gui-menu', {});
          resolveItems(iter.menu, nroot);
          entry.appendChild(nroot);
        }
        if ( iter.onClick ) {
          Utils.$bind(entry, 'mousedown', function(ev) {
            ev.stopPropagation();
            iter.onClick.apply(this, arguments);

            blurMenu();
          }, false);
        }
        par.appendChild(entry);
      });
    }

    resolveItems(items || [], root);
    CONSTRUCTORS['gui-menu'].build(root, true);

    var x = typeof ev.clientX === 'undefined' ? ev.x : ev.clientX;
    var y = typeof ev.clientY === 'undefined' ? ev.y : ev.clientY;

    Utils.$addClass(root, 'gui-root-menu');
    root.style.left = x + 'px';
    root.style.top  = y + 'px';

    document.body.appendChild(root);

    lastMenu = function() {
      Utils.$remove(root);
    };
  };

  OSjs.API.createScheme = function(url) {
    return new UIScheme(url);
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS);
