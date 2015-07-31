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
(function(API, Utils) {
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
      } else if ( tagName.match(/^gui\-(tree|icon|list)\-view$/) ) {
        return CONSTRUCTORS[tagName].values(el);
      }

      return null;
    }
    return el.getAttribute('data-' + param);
  }

  function setProperty(el, param, value, tagName) {
    tagName = tagName || el.tagName.toLowerCase();

    if ( (['gui-slider', 'gui-text', 'gui-password', 'gui-textarea', 'gui-checkbox', 'gui-radio']).indexOf(tagName) >= 0 ) {
      var firstChild = el.querySelector('input');
      if ( tagName === 'gui-textarea' ) {
        firstChild = el.querySelector('textarea');
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

  var CONSTRUCTORS = (function() {

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

    function createSelectInput(el, multiple) {
      var disabled = el.getAttribute('data-disabled') !== null;

      var select = document.createElement('select');
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
      el.appendChild(select);
    }

    function createInputLabel(el, type, input) {
      var label = el.getAttribute('data-label');

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
        input.addEventListener('keydown', function(ev) {
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

      input.addEventListener('change', function(ev) {
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

        window.addEventListener('mouseup', _onMouseUp, false);
        window.addEventListener('mousemove', _onMouseMove, false);
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

        window.removeEventListener('mouseup', _onMouseUp, false);
        window.removeEventListener('mousemove', _onMouseMove, false);
      }

      el.addEventListener('mousedown', _onMouseDown, false);
    }

    function bindTextInputEvents(el, evName, callback, params) {
      if ( evName === 'enter' ) {
        evName = '_enter';
      }
      var target = el.querySelector('input');
      target.addEventListener(evName, callback.bind(new UIElement(el)), params);
    }

    return {
      //
      // INPUTS
      //

      'gui-label': {
        parameters: [],
        events: [],
        set: function(el, param, value) {
          if ( param === 'value' ) {
            var lbl = el.querySelector('label');
            Utils.$empty(lbl);
            lbl.appendChild(document.createTextNode(value));
          }
        },
        build: function(el) {
          var label = el.getAttribute('data-lbl');
          if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
            label = el.childNodes[0].nodeValue;
            Utils.$empty(el);
          }
          var lbl = document.createElement('label');
          lbl.appendChild(document.createTextNode(label));
          el.appendChild(lbl);
        }
      },

      'gui-textarea': {
        parameters: [],
        events: ['change'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('textarea');
          target.addEventListener(evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          createInputOfType(el, 'textarea');
        }
      },

      'gui-text': {
        parameters: [],
        events: ['change'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          bindTextInputEvents.apply(this, arguments);
        },
        build: function(el) {
          createInputOfType(el, 'text');
        }
      },

      'gui-password': {
        parameters: [],
        events: ['change'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          bindTextInputEvents.apply(this, arguments);
        },
        build: function(el) {
          createInputOfType(el, 'password');
        }
      },

      'gui-radio': {
        parameters: [],
        events: ['change', 'activate'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('input');
          target.addEventListener(evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          createInputOfType(el, 'radio');
        }
      },

      'gui-checkbox': {
        parameters: [],
        events: ['change', 'activate'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('input');
          target.addEventListener(evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          createInputOfType(el, 'checkbox');
        }
      },

      'gui-switch': {
        parameters: [],
        events: ['change'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('input');
          target.addEventListener(evName, callback.bind(new UIElement(el)), params);
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

          el.addEventListener('click', function() {
            var disabled = el.getAttribute('data-disabled') !== null;
            if ( !disabled ) {
              toggleValue();
            }
          }, false);

          toggleValue(false);
        }
      },

      'gui-button': {
        parameters: [],
        events: [],
        bind: function(el, evName, callback, params) {
          var target = el.querySelector('button');
          target.addEventListener(evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          var icon = el.getAttribute('data-icon');
          var disabled = el.getAttribute('data-disabled') !== null;
          var label = el.childNodes.length ? el.childNodes[0].nodeValue : '';
          Utils.$empty(el);

          var input = document.createElement('button');
          input.appendChild(document.createTextNode(label));
          if ( disabled ) {
            input.setAttribute('disabled', 'disabled');
          }

          if ( icon ) {
            Utils.$addClass(input, 'gui-has-image');
            input.style.backgroundImage = 'url(' + icon + ')';
          }

          el.appendChild(input);
        }
      },

      'gui-select': {
        parameters: [],
        events: ['change'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('select');
          target.addEventListener(evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          // TODO Selected index/entry
          createSelectInput(el);
        }
      },

      'gui-select-list': {
        parameters: [],
        events: ['change'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('select');
          target.addEventListener(evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          // TODO Selected index/entry
          createSelectInput(el, true);
        }
      },

      'gui-slider': {
        parameters: [],
        events: ['change'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'change' ) { evName = '_change'; }
          var target = el.querySelector('input');
          target.addEventListener(evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          createInputOfType(el, 'range');
        }
      },

      'gui-richtext' : {
        parameters: [],
        events: [],
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
        parameters: [],
        events: ['change'],
        bind: function(el, evName, callback, params) {
          var target = el.querySelector('canvas');
          if ( evName === 'select' || evName === 'change' ) {
            evName = '_change';
          }
          target.addEventListener(evName, callback.bind(new UIElement(el)), params);
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

          cv.addEventListener('click', function(ev) {
            cv.dispatchEvent(new CustomEvent('_change', {detail: getColor(ev)}));
          }, false);

          el.appendChild(cv);
        }
      },

      //
      // MISC
      //

      'gui-progress-bar': {
        parameters: [],
        events: [],
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

      'gui-image': {
        parameters: [],
        events: [],
        build: function(el) {
          var img = document.createElement('img');
          var src = el.getAttribute('data-src');
          img.setAttribute('src', src);
          el.appendChild(img);
        }
      },

      'gui-menu': {
        parameters: [],
        events: ['select'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'select' ) {
            evName = '_select';
          }
          el.querySelectorAll('gui-menu-entry > span').forEach(function(target) {
            target.addEventListener(evName, callback.bind(new UIElement(el)), params);
          });
        },
        build: function(el) {
          function bindSelectionEvent(child, idx, expand) {
            var id = child.parentNode.getAttribute('data-id');
            child.addEventListener('mousedown', function() {
              child.dispatchEvent(new CustomEvent('_select', {detail: {index: idx, id: id}}));
            }, false);
          }

          var children = el.children;
          var child, span, label, expand;
          for ( var i = 0; i < children.length; i++ ) {
            child = children[i];
            expand = false;

            if ( child && child.tagName.toLowerCase() === 'gui-menu-entry') {
              if ( child.children && child.children.length ) {
                Utils.$addClass(child, 'gui-menu-expand');
                expand = true;
              }

              span = document.createElement('span');
              label = child.getAttribute('data-label');
              span.appendChild(document.createTextNode(label));
              child.appendChild(span);

              bindSelectionEvent(span, i, expand);
            }
          }
        }
      },

      'gui-menu-bar': {
        parameters: [],
        events: ['select'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'select' ) {
            evName = '_select';
          }
          el.querySelectorAll('gui-menu-bar-entry').forEach(function(target) {
            target.addEventListener(evName, callback.bind(new UIElement(el)), params);
          });
        },
        build: function(el) {
          el.querySelectorAll('gui-menu-bar-entry').forEach(function(mel, idx) {
            var label = mel.getAttribute('data-label');
            var id = mel.getAttribute('data-id');

            var span = document.createElement('span');
            span.appendChild(document.createTextNode(label));

            mel.insertBefore(span, mel.firstChild);

            var submenu = mel.querySelector('gui-menu');
            if ( submenu ) {
              mel.addEventListener('click', function() {
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
        parameters: [],
        events: [],
        build: function(el) {
          var src = el.getAttribute('data-src') || 'about:blank';
          var iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.setAttribute('border', 0);
          el.appendChild(iframe);
        }
      },

      'gui-button-bar' : {
        parameters: [],
        events: [],
        build: function(el) {
        }
      },

      'gui-tabs': {
        parameters: [],
        events: ['change', 'select', 'activate'],
        bind: function(el, evName, callback, params) {
          if ( (['select', 'activate']).indexOf(evName) !== -1 ) {
            evName = 'change';
          }
          if ( evName === 'change' ) {
            evName = '_' + evName;
          }
          el.addEventListener(evName, callback.bind(new UIElement(el)), params);
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
            var label = el.getAttribute('data-label');

            tab.addEventListener('click', function(ev) {
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
        parameters: [],
        events: ['resize'],
        bind: function(el, evName, callback, params) {
          if ( evName === 'resize' ) {
            evName = '_' + evName;
          }
          el.addEventListener(evName, callback.bind(new UIElement(el)), params);
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
        parameters: [],
        events: [],
        build: function(el) {
          setFlexbox(el, 0, 0);
        }
      },

      'gui-vbox': {
        parameters: [],
        events: [],
        build: function(el) {
        }
      },

      'gui-vbox-container': {
        parameters: [],
        events: [],
        build: function(el) {
          setFlexbox(el);
        }
      },

      'gui-hbox': {
        parameters: [],
        events: [],
        build: function(el) {
        }
      },

      'gui-hbox-container': {
        parameters: [],
        events: [],
        build: function(el) {
          setFlexbox(el);
        }
      },

      //
      // VIEWS
      //

      'gui-icon-view': {
        parameters: [],
        events: ['activate', 'select', 'scroll'],
        bind: function(el, evName, callback, params) {
          if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
            evName = '_' + evName;
          }
          el.addEventListener(evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          // TODO: Custom Icon Size
          // TODO: Set value (selected items)

          var selected = [];
          function handleItemClick(ev, item, idx) {
            selected = handleItemSelection(ev, item, idx, 'gui-icon-view-entry', selected);
          }

          el.querySelectorAll('gui-icon-view-entry').forEach(function(cel, idx) {
            var icon = cel.getAttribute('data-icon');
            var label = cel.getAttribute('data-label');

            var dicon = document.createElement('div');
            var dimg = document.createElement('img');
            dimg.src = icon;
            dicon.appendChild(dimg);

            var dlabel = document.createElement('div');
            var dspan = document.createElement('span');
            dspan.appendChild(document.createTextNode(label));
            dlabel.appendChild(dspan);

            cel.addEventListener('click', function(ev) {
              handleItemClick(ev, cel, idx);
              el.dispatchEvent(new CustomEvent('_select', {detail: {entries: selected}}));
            }, false);
            cel.addEventListener('dblclick', function(ev) {
              el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: selected}}));
            }, false);

            cel.appendChild(dicon);
            cel.appendChild(dlabel);
          });
        }
      },

      'gui-tree-view': {
        parameters: [],
        events: ['activate', 'select', 'scroll'],
        bind: function(el, evName, callback, params) {
          if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
            evName = '_' + evName;
          }
          el.addEventListener(evName, callback.bind(new UIElement(el)), params);
        },
        build: function(el) {
          // TODO: Custom Icon Size
          // TODO: Set value (selected items)

          var selected = [];
          function handleItemClick(ev, item, idx) {
            selected = handleItemSelection(ev, item, idx, 'gui-tree-view-entry', selected, el);
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
            var label = sel.getAttribute('data-label');
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
              expander.addEventListener('click', function(ev) {
                handleItemExpand(ev, sel);
              });

              sel.insertBefore(container, next);
              sel.insertBefore(expander, container);
            } else {
              sel.appendChild(container);
            }

            handleItemExpand(null, sel, expanded);

            container.addEventListener('click', function(ev) {
              handleItemClick(ev, sel, idx);
              el.dispatchEvent(new CustomEvent('_select', {detail: {entries: selected}}));
            }, false);
            container.addEventListener('dblclick', function(ev) {
              el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: selected}}));
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
          var multipleSelect = el.getAttribute('data-multiple');
          multipleSelect = multipleSelect === null || multipleSelect === 'true';

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
          });

          row.addEventListener('click', function(ev) {
            var idx = Utils.$index(row);
            el._selected = handleItemSelection(ev, row, idx, 'gui-list-view-row', el._selected, null, multipleSelect);
            el.dispatchEvent(new CustomEvent('_select', {detail: {entries: el._selected}}));
          }, false);

          row.addEventListener('dblclick', function(ev) {
            el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: el._selected}}));
          }, false);
        }

        return {
          parameters: [],
          events: ['activate', 'select', 'scroll'],
          bind: function(el, evName, callback, params) {
            if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
              evName = '_' + evName;
            }
            el.addEventListener(evName, callback.bind(new UIElement(el)), params);
          },
          values: function(el) {
            var selected = [];
            var body = el.querySelector('gui-list-view-rows');
            var active = (el._selected || [])
            active.forEach(function(iter) {
              var found = body.querySelectorAll('gui-list-view-row')[iter];
              if ( found ) {
                found.querySelectorAll('gui-list-view-column').forEach(function(cell) {
                  var key = cell.getAttribute('data-key');
                  if ( key ) {
                    selected.push({
                      index: iter,
                      key: key,
                      value: cell.getAttribute('data-value')
                    });
                  }
                });
              }
            });
            return selected || active;
          },
          set: function(el, param, value) {
            if ( param === 'columns' ) {
              var head = el.querySelector('gui-list-view-columns');
              var row = head.querySelector('gui-list-view-row');
              if ( row ) {
                Utils.$empty(row);
              } else {
                row = document.createElement('gui-list-view-row');
              }

              value.forEach(function(v) {
                row.appendChild(createEntry(v));
              });

              head.appendChild(row);

              createResizers(el);
            }
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
                if ( e ) {
                  e.forEach(function(se) {
                    row.appendChild(createEntry(se));
                  });
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
              Utils.$empty(el.querySelector('gui-list-view-rows'));
            }
          },
          build: function(el) {
            // TODO: Set value (selected items)
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
              el.addEventListener('scroll', function() {
                headContainer.style.top = el.scrollTop + 'px';
              }, false);

              el.querySelectorAll('gui-list-view-head gui-list-view-column').forEach(function(cel, idx) {
                setFlexbox(cel, null, null, 1, 0);
              });
            }

            el.querySelectorAll('gui-list-view-body gui-list-view-row').forEach(function(row) {
              initRow(el, row);
            });
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

  UIElement.prototype.set = function(param, value) {
    if ( this.$element ) {
      if ( CONSTRUCTORS[this.tagName] && CONSTRUCTORS[this.tagName].set ) {
        CONSTRUCTORS[this.tagName].set(this.$element, param, value, this.tagName);
      } else {
        setProperty(this.$element, param, value);
      }
    }
    return this;
  };

  UIElement.prototype.get = function(param) {
    if ( this.$element ) {
      if ( CONSTRUCTORS[this.tagName] && CONSTRUCTORS[this.tagName].get ) {
        return CONSTRUCTORS[this.tagName].get(this.$element, param, this.tagName);
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

  UIScheme.prototype.parse = function(id, type) {
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
          el.className = 'gui-element';
        }
      });

      Object.keys(CONSTRUCTORS).forEach(function(key) {
        node.querySelectorAll(key).forEach(CONSTRUCTORS[key].build);
      });

      return node;
    }

    return null;
  };

  UIScheme.prototype.render = function(win, id, root, type) {
    root = root || win._getRoot();

    var content = this.parse(id, type);
    if ( content ) {
      var children = content.children;
      for ( var i = 0; i < children.length; i++ ) {
        root.appendChild(children[i]);
      }
    }
  };

  UIScheme.prototype.create = function(win, tagName, params, parentNode) {
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

    CONSTRUCTORS[tagName].build(el);

    return new UIElement(el);
  };

  UIScheme.prototype.find = function(win, id, root) {
    root = root || win._getRoot();
    var el = root.querySelector('[data-id="' + id + '"]');
    if ( el && (['gui-list-view', 'gui-tree-view', 'gui-icon-view', 'gui-select', 'gui-select-list']).indexOf(el.tagName.toLowerCase()) >= 0 ) {
      return new UIElementDataView(el);
    }
    return new UIElement(el);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.API.blurMenu = blurMenu;
  OSjs.API.createScheme = function(url) {
    return new UIScheme(url);
  };

})(OSjs.API, OSjs.Utils);
