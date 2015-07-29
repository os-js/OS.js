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
  OSjs.GUING = OSjs.GUING || {};

  var lastMenu;

  function blurMenu() {
    if ( !lastMenu ) return;
    lastMenu();
  }

  var CONSTRUCTORS = (function() {

    function handleItemSelection(ev, item, idx, className, selected, root) {
      root = root || item.parentNode;
      if ( !ev.shiftKey ) {
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
      var select = document.createElement('select');
      if ( multiple ) {
        select.setAttribute('multiple', 'multiple');
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
      var value = el.childNodes.length ? el.childNodes[0].nodeValue : null;
      Utils.$empty(el);

      var input = document.createElement('input');
      input.setAttribute('type', type);
      if ( placeholder ) {
        input.setAttribute('placeholder', placeholder);
      }
      if ( type === 'radio' && group ) {
        input.setAttribute('name', group + '[]');
      }

      if ( type === 'text' || type === 'password' ) {
        input.value = value;
      }

      createInputLabel(el, type, input);
    }

    function setFlexbox(el, grow, shrink, defaultGrow, defaultShrink, checkEl) {
      var basis = (checkEl || el).getAttribute('data-basis') || 'auto';

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

    return {
      //
      // INPUTS
      //

      'gui-label': {
        parameters: [],
        events: [],
        build: function(el) {
          var label = document.createElement('label');
          label.appendChild(document.createTextNode(el.getAttribute('data-label')));
          el.appendChild(label);
        }
      },

      'gui-textarea': {
        parameters: [],
        events: ['change'],
        build: function(el) {
          // TODO Disabled state
          var input = document.createElement('textarea');
          var value = el.childNodes.length ? el.childNodes[0].nodeValue : null;
          Utils.$empty(el);
          input.value = value;
          el.appendChild(input);
        }
      },

      'gui-text': {
        parameters: [],
        events: ['change'],
        build: function(el) {
          // TODO Disabled state
          createInputOfType(el, 'text');
        }
      },

      'gui-password': {
        parameters: [],
        events: ['change'],
        build: function(el) {
          // TODO Disabled state
          createInputOfType(el, 'password');
        }
      },

      'gui-radio': {
        parameters: [],
        events: [],
        build: function(el) {
          // TODO Disabled state
          createInputOfType(el, 'radio');
        }
      },

      'gui-checkbox': {
        parameters: [],
        events: ['change'],
        build: function(el) {
          // TODO Disabled state
          createInputOfType(el, 'checkbox');
        }
      },

      'gui-switch': {
        parameters: [],
        events: ['change'],
        build: function(el) {
          // TODO Disabled state
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
            toggleValue();
          }, false);

          toggleValue(false);
        }
      },

      'gui-button': {
        parameters: [],
        events: [],
        bind: function(el, evName, callback, params) {
          el = el.querySelector('button');
          if ( el ) {
            el.addEventListener(evName, callback, params);
          }
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
        build: function(el) {
          // TODO Disabled state
          createSelectInput(el);
        }
      },

      'gui-select-list': {
        parameters: [],
        events: ['change'],
        build: function(el) {
          // TODO Disabled state
          createSelectInput(el, true);
        }
      },

      'gui-slider': {
        parameters: [],
        events: ['change'],
        build: function(el) {
          // TODO Disabled state
          createInputOfType(el, 'range');
        }
      },

      'gui-color-swatch': {
        parameters: [],
        events: ['change'],
        build: function(el) {
          var cv        = document.createElement('canvas');
          cv.width      = 100;
          cv.height     = 100;

          var ctx       = cv.getContext('2d');
          var gradient  = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);

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

          el.appendChild(cv);
        }
      },

      'gui-richtext' : {
        parameters: [],
        events: [],
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
        build: function(el) {
          var children = el.childNodes;
          var child, span, label;
          for ( var i = 0; i < children.length; i++ ) {
            child = children[i];
            if ( child && child.nodeType !== 3 && child.tagName.toLowerCase() === 'gui-menu-entry') {
              if ( child.childNodes && child.childNodes.length ) {
                Utils.$addClass(child, 'gui-menu-expand');
              }

              span = document.createElement('span');
              label = child.getAttribute('data-label');
              span.appendChild(document.createTextNode(label));
              child.appendChild(span);
            }
          }
        }
      },

      'gui-menu-bar': {
        parameters: [],
        events: ['select'],
        build: function(el) {
          el.querySelectorAll('gui-menu-bar-entry').forEach(function(mel) {
            var span = document.createElement('span');
            var label = mel.getAttribute('data-label');
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
        events: ['change'],
        build: function(el) {
          // TODO: Param for active tab index

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

            // TODO: Trigger activated event
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

          selectTab(null, 0);
        }
      },

      'gui-paned-view': {
        parameters: [],
        events: ['resize'],
        build: function(el) {
          function bindResizer(resizer) {
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
              // TODO: Trigger resized event
            });

          }

          el.querySelectorAll('gui-paned-view-container').forEach(function(cel, idx) {
            if ( idx % 2 ) {
              var resizer = document.createElement('gui-paned-view-handle');
              cel.parentNode.insertBefore(resizer, cel);
              bindResizer(resizer);
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
        events: ['activate', 'select', 'change', 'scroll'],
        build: function(el) {
          // TODO: Custom Icon Size

          var selected = [];
          function handleItemClick(ev, item, idx) {
            selected = handleItemSelection(ev, item, idx, 'gui-icon-view-entry', selected);
            console.warn(selected);
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
            }, false);
            cel.addEventListener('dblclick', function(ev) {
              // TODO
            }, false);

            cel.appendChild(dicon);
            cel.appendChild(dlabel);
          });
        }
      },

      'gui-tree-view': {
        parameters: [],
        events: ['activate', 'select', 'change', 'scroll'],
        build: function(el) {
          // TODO: Custom Icon Size

          var selected = [];
          function handleItemClick(ev, item, idx) {
            selected = handleItemSelection(ev, item, idx, 'gui-tree-view-entry', selected, el);
            console.warn(selected);
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
            }, false);
            container.addEventListener('dblclick', function(ev) {
              // TODO
            }, false);

          });
        }
      },

      'gui-list-view': {
        parameters: [],
        events: ['activate', 'select', 'change', 'scroll'],
        build: function(el) {
          // TODO: Custom Icon Size

          var headContainer, bodyContainer;

          var multipleSelect = el.getAttribute('data-multiple');
          multipleSelect = multipleSelect === null || multipleSelect === 'true';

          var selected = [];

          var head = el.querySelector('gui-list-view-columns');
          var body = el.querySelector('gui-list-view-rows');

          function handleRowClick(ev, row, idx) {
            selected = handleItemSelection(ev, row, idx, 'gui-list-view-row', selected);
            console.warn(selected);
          }

          function resize(rel, w) {
            var flex = w.toString() + 'px';
            rel.style['webkitFlexBasis'] = flex;
            rel.style['mozFflexBasis'] = flex;
            rel.style['msFflexBasis'] = flex;
            rel.style['oFlexBasis'] = flex;
            rel.style['flexBasis'] = flex;
          }

          if ( head ) {
            headContainer = document.createElement('gui-list-view-head');
            headContainer.appendChild(head);
            if ( body ) {
              el.insertBefore(headContainer, body);
            } else {
              el.appendChild(headContainer);
            }

            var cols = head.querySelectorAll('gui-list-view-column');
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
                }, function(ev) {
                  // TODO: Trigger resized event
                });
              }
            });
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

            var cols = 0;
            el.querySelectorAll('gui-list-view-head gui-list-view-column').forEach(function(cel, idx) {
              setFlexbox(cel, null, null, 1, 0);
              cols++;
            });
          }

          el.querySelectorAll('gui-list-view-body gui-list-view-column').forEach(function(cel, idx) {
            var x = cols ? idx % cols : idx;
            var grow = cols ? 1 : 0;
            var shrink = cols ? 1 : 0;
            var headerEl = headContainer ? headContainer.querySelectorAll('gui-list-view-column')[x] : null;
            setFlexbox(cel, null, null, grow, shrink, headerEl);

            var icon = cel.getAttribute('data-icon');
            if ( icon ) {
              Utils.$addClass(cel, 'gui-has-image');
              cel.style.backgroundImage = 'url(' + icon + ')';
            }
          });

          el.querySelectorAll('gui-list-view-body gui-list-view-row').forEach(function(cel, idx) {
            cel.addEventListener('click', function(ev) {
              handleRowClick(ev, cel, idx);
            }, false);
            cel.addEventListener('dblclick', function(ev) {
              // TODO
            }, false);
          });
        }
      }

    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // UIELEMENT CLASS
  /////////////////////////////////////////////////////////////////////////////

  function UIElement(el) {
    this.$element = el || null;
    this.tagName = el ? el.tagName.toLowerCase() : null;
  }

  UIElement.prototype.on = function(evName, callback, args) {
    if ( CONSTRUCTORS[this.tagName] && CONSTRUCTORS[this.tagName].bind ) {
      CONSTRUCTORS[this.tagName].bind(this.$element, evName, callback, args);
    }
    return this;
  };

  UIElement.prototype.set = function(param, value) {
    if ( CONSTRUCTORS[this.tagName] && CONSTRUCTORS[this.tagName].set ) {
      CONSTRUCTORS[this.tagName].set(this.$element);
    }
    return this;
  };

  UIElement.prototype.get = function(param) {
    if ( CONSTRUCTORS[this.tagName] && CONSTRUCTORS[this.tagName].get ) {
      return CONSTRUCTORS[this.tagName].get(this.$element, param);
    }
    return null;
  };

  /////////////////////////////////////////////////////////////////////////////
  // UISCHEME CLASS
  /////////////////////////////////////////////////////////////////////////////

  function UIScheme(app) {
    this.url = API.getApplicationResource(app, './scheme.html');
    this.fragments = {
    };
  }

  UIScheme.prototype.load = function(cb) {
    var self = this;
    Utils.ajax({
      url: this.url,
      onsuccess: function(data) {
        self.fragments = self.parse(data);
        cb(false, true);
      },
      onerror: function() {
        cb('Failed to fetch scheme');
      }
    });
  };

  UIScheme.prototype.parse = function(html) {
    var fragments = {};
    var doc = document.createDocumentFragment();
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    doc.appendChild(wrapper);

    doc.querySelectorAll('*').forEach(function(el) {
      var lcase = el.tagName.toLowerCase();
      if ( lcase.match(/^gui\-/) && !lcase.match(/\-container|\-(h|v)box$|\-columns?|\-rows?/) ) {
        el.className = 'gui-element';
      }
    });

    Object.keys(CONSTRUCTORS).forEach(function(key) {
      doc.querySelectorAll(key).forEach(CONSTRUCTORS[key].build);
    });

    doc.querySelectorAll('application-window, application-fragment').forEach(function(f) {
      var id = f.getAttribute('data-id');
      if ( id ) {
        fragments[id] = {
          winref: null,
          data: f
        }
      }
    });

    return fragments;
  };

  UIScheme.prototype.renderWindow = function(win, id, root) {
    root = root || win._getRoot();
    var content = this.getWindow(id);
    if ( content ) {
      var children = content.data.children;
      for ( var i = 0; i < children.length; i++ ) {
        root.appendChild(children[i]);
      }
    }
  };

  UIScheme.prototype.addElement = function(tagName, params, parentNode) {
    tagName = tagName || '';
    params = params || {};

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

    CONSTRUCTORS[tagName](el);

    return new UIElement(el);
  };

  UIScheme.prototype.getElement = function(win, id, root) {
    root = root || win._getRoot();
    var el = root.querySelector('[data-id="' + id + '"]');
    return new UIElement(el);
  };

  UIScheme.prototype.getWindow = function(id) {
    return this.fragments[id];
  };

  UIScheme.prototype.getFragment = function(id) {
    return this.fragments[id];
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUING.blurMenu = blurMenu;
  OSjs.GUING.Scheme = UIScheme;

})(OSjs.API, OSjs.Utils);
