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

  window.OSjs = window.OSjs || {};
  OSjs.GUING = OSjs.GUING || {};

  var lastMenu;

  var CONSTRUCTORS = (function() {
    function createSelectInput(el, multiple) {
      var select = document.createElement('select');
      if ( multiple ) {
        select.setAttribute('multiple', 'multiple');
      }

      el.querySelectorAll('gui-select-option').forEach(function(sel) {
        var value = sel.getAttribute('data-value') || '';
        var label = sel.getAttribute('data-label') || '';

        var option = document.createElement('option');
        option.setAttribute('value', value);
        option.appendChild(document.createTextNode(label));
        select.appendChild(option);
        sel.parentNode.removeChild(sel);
      });
      el.appendChild(select);
    }

    function createInputOfType(el, type) {
      var label = el.getAttribute('data-label');
      var group = el.getAttribute('data-group');
      var placeholder = el.getAttribute('data-placeholder');

      var input = document.createElement('input');
      input.setAttribute('type', type);
      if ( placeholder ) {
        input.setAttribute('placeholder', placeholder);
      }
      if ( type === 'radio' && group ) {
        input.setAttribute('name', group + '[]');
      }

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
        events: [],
        build: function(el) {
          var input = document.createElement('textarea');
          el.appendChild(input);
        }
      },

      'gui-text': {
        parameters: [],
        events: [],
        build: function(el) {
          createInputOfType(el, 'text');
        }
      },

      'gui-password': {
        parameters: [],
        events: [],
        build: function(el) {
          createInputOfType(el, 'password');
        }
      },

      'gui-radio': {
        parameters: [],
        events: [],
        build: function(el) {
          createInputOfType(el, 'radio');
        }
      },

      'gui-checkbox': {
        parameters: [],
        events: [],
        build: function(el) {
          createInputOfType(el, 'checkbox');
        }
      },

      'gui-switch': {
        parameters: [],
        events: [],
        build: function(el) {
          var input = document.createElement('input');
          input.type = 'checkbox';
          el.appendChild(input);

          var button = document.createElement('button');
          el.appendChild(button);

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
        build: function(el) {
          var input = document.createElement('button');
          var label = el.getAttribute('data-label');
          input.appendChild(document.createTextNode(label));
          el.appendChild(input);
        }
      },

      'gui-select': {
        parameters: [],
        events: [],
        build: function(el) {
          createSelectInput(el);
        }
      },

      'gui-select-list': {
        parameters: [],
        events: [],
        build: function(el) {
          createSelectInput(el, true);
        }
      },

      //
      // MISC
      //

      'gui-progress-bar': {
        parameters: [],
        events: [],
        build: function(el) {
          var percentage = '0%';
          var span = document.createElement('span');
          span.appendChild(document.createTextNode(percentage));
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
        events: [],
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
        events: [],
        build: function(el) {
          el.querySelectorAll('gui-menu-bar-entry').forEach(function(mel) {
            var span = document.createElement('span');
            var label = mel.getAttribute('data-label');
            span.appendChild(document.createTextNode(label));

            mel.insertBefore(span, mel.firstChild);

            var submenu = mel.querySelector('gui-menu');
            if ( submenu ) {
              mel.addEventListener('click', function() {
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

      'gui-button-bar' : {
        container: true,
        parameters: [],
        events: [],
        build: function(el) {
        }
      },

      'gui-tabs': {
        container: true,
        parameters: [],
        events: [],
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
        container: true,
        parameters: [],
        events: [],
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
        container: true,
        parameters: [],
        events: [],
        build: function(el) {
          setFlexbox(el, 0, 0);
        }
      },

      'gui-vbox': {
        container: true,
        parameters: [],
        events: [],
        build: function(el) {
        }
      },

      'gui-vbox-container': {
        container: true,
        parameters: [],
        events: [],
        build: function(el) {
          setFlexbox(el);
        }
      },

      'gui-hbox': {
        container: true,
        parameters: [],
        events: [],
        build: function(el) {
        }
      },

      'gui-hbox-container': {
        container: true,
        parameters: [],
        events: [],
        build: function(el) {
          setFlexbox(el);
        }
      },

      'gui-list-view': {
        container: true,
        parameters: [],
        events: [],
        build: function(el) {
          var headContainer, bodyContainer;

          var multipleSelect = el.getAttribute('data-multiple');
          multipleSelect = multipleSelect === null || multipleSelect === 'true';

          var selected = [];

          var head = el.querySelector('gui-list-view-columns');
          var body = el.querySelector('gui-list-view-rows');

          function handleRowClick(ev, row, idx) {
            if ( !ev.shiftKey ) {
              row.parentNode.querySelectorAll('gui-list-view-row').forEach(function(i) {
                Utils.$removeClass(i, 'gui-active');
              });
              selected = [];
            }

            var findex = selected.indexOf(idx);
            if ( findex >= 0 ) {
              selected.splice(findex, 1);
              Utils.$removeClass(row, 'gui-active');
            } else {
              selected.push(idx);
              Utils.$addClass(row, 'gui-active');
            }
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
          });

          el.querySelectorAll('gui-list-view-body gui-list-view-row').forEach(function(cel, idx) {
            cel.addEventListener('click', function(ev) {
              handleRowClick(ev, cel, idx);
            }, false);
          });
        }
      }

    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // CLASS
  /////////////////////////////////////////////////////////////////////////////

  function UIScheme(app) {
    this.url = API.getApplicationResource(app, './scheme.html');
    this.scheme = null;

    window.addEventListener('click', function() {
    });
  }

  UIScheme.prototype.load = function(cb) {
    var self = this;
    Utils.ajax({
      url: this.url,
      onsuccess: function(data) {
        self.scheme = self.parse(data);
        cb(false, true);
      },
      onerror: function() {
        cb('Failed to fetch scheme');
      }
    });
  };

  UIScheme.prototype.parse = function(html) {
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

    return doc;
  };

  UIScheme.prototype.emittEvent = function(ev, el) {
  };

  UIScheme.prototype.getWindow = function(id) {
    return this.scheme.querySelector('application-window[data-id="' + id + '"]');
  };

  UIScheme.prototype.getFragment = function(id) {
    return this.scheme.querySelector('application-fragment[data-id="' + id + '"]');
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUING.Scheme = UIScheme;

})(OSjs.API, OSjs.Utils);
