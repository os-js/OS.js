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
  // CLASSES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-paned-view'
   *
   * A view with resizable content boxes
   *
   * @constructor PanedView
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIPanedView = {
    on: function(evName, callback, params) {
      var el = this.$element;
      if ( evName === 'resize' ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(this), params);

      return this;
    },

    build: function() {
      var el = this.$element;
      var orient = el.getAttribute('data-orientation') || 'horizontal';

      function bindResizer(resizer, idx, cel) {
        var resizeEl = resizer.previousElementSibling;
        if ( !resizeEl ) {
          return;
        }

        var startWidth = resizeEl.offsetWidth;
        var startHeight = resizeEl.offsetHeight;
        var minSize = 16;
        var maxSize = Number.MAX_VALUE;

        GUI.Helpers.createDrag(resizer, function(ev) {
          startWidth = resizeEl.offsetWidth;
          startHeight = resizeEl.offsetHeight;
          minSize = parseInt(cel.getAttribute('data-min-size'), 10) || minSize;

          var max = parseInt(cel.getAttribute('data-max-size'), 10);
          if ( !max ) {
            var totalSize = resizer.parentNode[(orient === 'horizontal' ? 'offsetWidth' : 'offsetHeight')];
            var totalContainers = resizer.parentNode.querySelectorAll('gui-paned-view-container').length;
            var totalSpacers = resizer.parentNode.querySelectorAll('gui-paned-view-handle').length;

            maxSize = totalSize - (totalContainers * 16) - (totalSpacers * 8);
          }
        }, function(ev, diff) {
          var newWidth = startWidth + diff.x;
          var newHeight = startHeight + diff.y;

          var flex;
          if ( orient === 'horizontal' ) {
            if ( !isNaN(newWidth) && newWidth > 0 && newWidth >= minSize && newWidth <= maxSize ) {
              flex = newWidth.toString() + 'px';
            }
          } else {
            if ( !isNaN(newHeight) && newHeight > 0 && newHeight >= minSize && newHeight <= maxSize ) {
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

      el.querySelectorAll('gui-paned-view-container').forEach(function(cel, idx) {
        if ( idx % 2 ) {
          var resizer = document.createElement('gui-paned-view-handle');
          resizer.setAttribute('role', 'separator');
          cel.parentNode.insertBefore(resizer, cel);
          bindResizer(resizer, idx, cel);
        }
      });

      return this;
    }
  };

  /**
   * Element: 'gui-paned-view-container'
   *
   * <pre><code>
   *   property  base      String        CSS base flexbox property
   *   property  grow      integer       CSS grow flexbox property
   *   property  shrink    integer       CSS shrink flexbox property
   *   property  min-size  integer       Minimum size in pixels
   *   property  max-size  integer       Maxmimum size in pixels
   * </code></pre>
   *
   * @constructor PanedViewContainer
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIPanedViewContainer = {
    build: function() {
      GUI.Helpers.setFlexbox(this.$element);
      return this;
    }
  };

  /**
   * Element: 'gui-button-bar'
   *
   * @constructor ButtonBar
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIButtonBar = {
    build: function() {
      this.$element.setAttribute('role', 'toolbar');
      return this;
    }
  };

  /**
   * Element: 'gui-toolbar'
   *
   * @constructor ToolBar
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIToolBar = {
    build: function() {
      this.$element.setAttribute('role', 'toolbar');
      return this;
    }
  };

  /**
   * Element: 'gui-grid'
   *
   * A grid-type container with equal-sized containers
   *
   * @constructor Grid
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIGrid = {
    build: function() {
      var rows = this.$element.querySelectorAll('gui-grid-row');
      var p = 100 / rows.length;

      rows.forEach(function(r) {
        r.style.height = String(p) + '%';
      });

      return this;
    }
  };

  /**
   * Element: 'gui-grid-row'
   *
   * @constructor GridRow
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIGridRow = {};

  /**
   * Element: 'gui-grid-entry'
   *
   * @constructor GridEntry
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIGridEntry = {};

  /**
   * Element: 'gui-vbox'
   *
   * Vertical boxed layout
   *
   * @constructor VBox
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIVBox = {};

  /**
   * Element: 'gui-vbox-container'
   *
   * Vertical boxed layout container
   *
   * <pre><code>
   *   property  base      String        CSS base flexbox property
   *   property  grow      integer       CSS grow flexbox property
   *   property  shrink    integer       CSS shrink flexbox property
   *   property  expand    boolean       Make content expand to full width
   *   property  fill      boolean       Make content fill up entire space
   * </code></pre>
   *
   * @constructor VBoxContainer
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIVBoxContainer = {
    build: function() {
      GUI.Helpers.setFlexbox(this.$element);

      return this;
    }
  };

  /**
   * Element: 'gui-hbox'
   *
   * Horizontal boxed layout
   *
   * @constructor HBox
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIHBox = {};

  /**
   * Element: 'gui-hbox-container'
   *
   * Horizontal boxed layout container
   *
   * <pre><code>
   *   property  base      String        CSS base flexbox property
   *   property  grow      integer       CSS grow flexbox property
   *   property  shrink    integer       CSS shrink flexbox property
   *   property  expand    boolean       Make content expand to full width
   *   property  fill      boolean       Make content fill up entire space
   * </code></pre>
   *
   * @constructor HBoxContainer
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIHBoxContainer = {
    build: function() {
      GUI.Helpers.setFlexbox(this.$element);

      return this;
    }
  };

  /**
   * Element: 'gui-expander'
   *
   * A expandable/collapsable container with label and indicator
   *
   * <pre><code>
   *   property  label     String        The label
   *   property  expanded  boolean       Expanded state (default=true)
   * </code></pre>
   *
   * @constructor Expander
   * @extends OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   */
  var GUIExpander = (function() {
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
      set: function(param, value) {
        if ( param === 'expanded' ) {
          return toggleState(this.$element, value === true);
        }
        return GUI.Element.prototype.set.apply(this, arguments);
      },

      on: function(evName, callback, params) {
        if ( (['change']).indexOf(evName) !== -1 ) {
          evName = '_' + evName;
        }
        Utils.$bind(this.$element, evName, callback.bind(this), params);

        return this;
      },

      build: function() {
        var el = this.$element;
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

        return this;
      }
    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // REGISTRATION
  /////////////////////////////////////////////////////////////////////////////

  GUI.Element.register({
    tagName: 'gui-paned-view',
    type: 'container',
    allowedChildren: ['gui-paned-view-container']
  }, GUIPanedView);

  GUI.Element.register({
    tagName: 'gui-paned-view-container',
    type: 'container',
    allowedParents: ['gui-paned-view']
  }, GUIPanedViewContainer);

  GUI.Element.register({
    tagName: 'gui-button-bar',
    type: 'container'
  }, GUIButtonBar);

  GUI.Element.register({
    tagName: 'gui-toolbar',
    type: 'container'
  }, GUIToolBar);

  GUI.Element.register({
    tagName: 'gui-grid',
    type: 'container',
    allowedChildren: ['gui-grid-row']
  }, GUIGrid);

  GUI.Element.register({
    tagName: 'gui-grid-row',
    type: 'container',
    allowedChildren: ['gui-grid-entry'],
    allowedParents: ['gui-grid-row']
  }, GUIGridRow);

  GUI.Element.register({
    tagName: 'gui-grid-entry',
    type: 'container',
    allowedParents: ['gui-grid-row']
  }, GUIGridEntry);

  GUI.Element.register({
    tagName: 'gui-vbox',
    type: 'container',
    allowedChildren: ['gui-vbox-container']
  }, GUIVBox);

  GUI.Element.register({
    tagName: 'gui-vbox-container',
    type: 'container',
    allowedParents: ['gui-vbox']
  }, GUIVBoxContainer);

  GUI.Element.register({
    tagName: 'gui-hbox',
    type: 'container',
    allowedChildren: ['gui-hbox-container']
  }, GUIHBox);

  GUI.Element.register({
    tagName: 'gui-hbox-container',
    type: 'container',
    allowedParents: ['gui-hbox']
  }, GUIHBoxContainer);

  GUI.Element.register({
    tagName: 'gui-expander',
    type: 'container'
  }, GUIExpander);

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
