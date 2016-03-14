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

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function boxRole(el, role) {
    el.children.forEach(function(e) {
      if ( e.getAttribute('role') ) {
        e.setAttribute('role', e.getAttribute('role') + ' ' + role);
      } else {
        e.setAttribute('role', role);
      }
    });
  }

  function boxContainer(el) {
    el.setAttribute('role', 'row');
    boxRole(el, 'cell');
    GUI.Helpers.setFlexbox(el);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-paned-view'
   *
   * A view with resizable content boxes
   *
   * @api OSjs.GUI.Elements.gui-paned-view
   * @class
   */
  GUI.Elements['gui-paned-view'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'resize' ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var orient = el.getAttribute('data-orientation') || 'horizontal';

      function bindResizer(resizer, idx) {
        var resizeEl = resizer.previousElementSibling;
        if ( !resizeEl ) { return; }

        var startWidth = resizeEl.offsetWidth;
        var startHeight = resizeEl.offsetHeight;
        var maxWidth = el.offsetWidth;
        var maxHeight = el.offsetHeight;

        GUI.Helpers.createDrag(resizer, function(ev) {
          startWidth = resizeEl.offsetWidth;
          startHeight = resizeEl.offsetHeight;
          maxWidth = el.offsetWidth / 2;
          maxHeight = el.offsetHeight / 2;
        }, function(ev, diff) {
          var newWidth = startWidth + diff.x;
          var newHeight = startHeight + diff.y;

          var flex;
          if ( orient === 'horizontal' ) {
            if ( !isNaN(newWidth) && newWidth > 0 && newWidth <= maxWidth ) {
              flex = newWidth.toString() + 'px';
            }
          } else {
            if ( !isNaN(newHeight) && newHeight > 0 && newHeight <= maxHeight ) {
              flex = newHeight.toString() + 'px';
            }
          }

          if ( flex ) {
            resizeEl.style.webkitFlexBasis = flex;
            resizeEl.style.mozFflexBasis = flex;
            resizeEl.style.msFflexBasis = flex;
            resizeEl.style.oFlexBasis = flex;
            resizeEl.style.flexBasis = flex;
          }
        }, function(ev) {
          el.dispatchEvent(new CustomEvent('_resize', {detail: {index: idx}}));
        });

      }

      el.setAttribute('role', 'grid');
      el.querySelectorAll('gui-paned-view-container').forEach(function(cel, idx) {
        if ( idx % 2 ) {
          var resizer = document.createElement('gui-paned-view-handle');
          resizer.setAttribute('role', 'separator');
          cel.parentNode.insertBefore(resizer, cel);
          bindResizer(resizer, idx);
        }
      });
    }
  };

  GUI.Elements['gui-paned-view-container'] = {
    build: function(el) {
      el.setAttribute('role', 'row');
      boxRole(el, 'cell');
      GUI.Helpers.setFlexbox(el);
    }
  };

  /**
   * Element: 'gui-button-bar'
   *
   * @api OSjs.GUI.Elements.gui-button-bar
   * @class
   */
  GUI.Elements['gui-button-bar'] = {
    build: function(el) {
      el.setAttribute('role', 'toolbar');
    }
  };

  /**
   * Element: 'gui-toolbar'
   *
   * @api OSjs.GUI.Elements.gui-toolbar
   * @class
   */
  GUI.Elements['gui-toolbar'] = {
    build: function(el) {
      el.setAttribute('role', 'toolbar');
    }
  };

  /**
   * Element: 'gui-grid'
   *
   * A grid-type container with equal-sized containers
   *
   * @api OSjs.GUI.Elements.gui-grid
   * @class
   */
  GUI.Elements['gui-grid'] = {
    build: function(el) {
      var rows = el.querySelectorAll('gui-grid-row');
      var p = 100 / rows.length;

      el.setAttribute('role', 'grid');

      rows.forEach(function(r) {
        r.style.height = String(p) + '%';
        r.setAttribute('role', 'row');

        r.getElementsByTagName('gui-grid-entry').forEach(function(c) {
          c.setAttribute('role', 'gridcell');
        });
      });

    }
  };

  /**
   * Element: 'gui-vbox'
   *
   * Vertical boxed layout
   *
   * @api OSjs.GUI.Elements.gui-vbox
   * @class
   */
  GUI.Elements['gui-vbox'] = {
    build: function(el) {
      el.setAttribute('role', 'grid');
      //el.setAttribute('aria-orientation', 'vertical');
    }
  };

  GUI.Elements['gui-vbox-container'] = {
    build: function(el) {
      boxContainer(el);
    }
  };

  /**
   * Element: 'gui-hbox'
   *
   * Horizontal boxed layout
   *
   * @api OSjs.GUI.Elements.gui-hbox
   * @class
   */
  GUI.Elements['gui-hbox'] = {
    build: function(el) {
      el.setAttribute('role', 'grid');
      //el.setAttribute('aria-orientation', 'horizontal');
    }
  };

  GUI.Elements['gui-hbox-container'] = {
    build: function(el) {
      boxContainer(el);
    }
  };

  /**
   * Element: 'gui-expander'
   *
   * A expandable/collapsable container with label and indicator
   *
   * Parameters:
   *  String      label     The label
   *  boolean     expanded  Expanded state (default=true)
   *
   * @api OSjs.GUI.Elements.gui-expander
   * @class
   */
  GUI.Elements['gui-expander'] = (function() {
    function toggleState(el, expanded) {
      if ( typeof expanded === 'undefined' ) {
        expanded = el.getAttribute('data-expanded') !== 'false';
        expanded = !expanded;
      }

      el.setAttribute('aria-expanded', String(expanded));
      el.setAttribute('data-expanded', String(expanded));
      return expanded;
    }

    return {
      set: function(el, param, value) {
        if ( param === 'expanded' ) {
          return toggleState(el, value === true);
        }
        return null;
      },
      bind: function(el, evName, callback, params) {
        if ( (['change']).indexOf(evName) !== -1 ) {
          evName = '_' + evName;
        }
        Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
      },
      build: function(el) {
        var lbltxt = el.getAttribute('data-label') || '';
        var label = document.createElement('gui-expander-label');

        Utils.$bind(label, 'click', function(ev) {
          el.dispatchEvent(new CustomEvent('_change', {detail: {expanded: toggleState(el)}}));
        }, false);

        label.appendChild(document.createTextNode(lbltxt));

        el.setAttribute('role', 'toolbar');
        el.setAttribute('aria-expanded', 'true');
        el.setAttribute('data-expanded', 'true');
        if ( el.children.length ) {
          el.insertBefore(label, el.children[0]);
        } else {
          el.appendChild(label);
        }
      }
    };
  })();

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
