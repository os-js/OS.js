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
import * as Events from 'utils/events';
import GUIElement from 'gui/element';

function toggleState(el, expanded) {
  if ( typeof expanded === 'undefined' ) {
    expanded = el.getAttribute('data-expanded') !== 'false';
    expanded = !expanded;
  }

  el.setAttribute('aria-expanded', String(expanded));
  el.setAttribute('data-expanded', String(expanded));
  return expanded;
}

/////////////////////////////////////////////////////////////////////////////
// CLASSES
/////////////////////////////////////////////////////////////////////////////

/**
 * Element: 'gui-paned-view'
 *
 * A view with resizable content boxes
 */
class GUIPanedView extends GUIElement {

  static register() {
    return super.register({
      tagName: 'gui-paned-view',
      type: 'container',
      allowedChildren: ['gui-paned-view-container']
    }, this);
  }

  on(evName, callback, params) {
    const el = this.$element;
    if ( evName === 'resize' ) {
      evName = '_' + evName;
    }
    Events.$bind(el, evName, callback.bind(this), params);

    return this;
  }

  build() {
    const el = this.$element;
    const orient = el.getAttribute('data-orientation') || 'horizontal';

    function bindResizer(resizer, idx, cel) {
      const resizeEl = resizer.previousElementSibling;
      if ( !resizeEl ) {
        return;
      }

      let startWidth = resizeEl.offsetWidth;
      let startHeight = resizeEl.offsetHeight;
      let minSize = 16;
      let maxSize = Number.MAX_VALUE;

      GUI.createDrag(resizer, (ev) => {
        startWidth = resizeEl.offsetWidth;
        startHeight = resizeEl.offsetHeight;
        minSize = parseInt(cel.getAttribute('data-min-size'), 10) || minSize;

        const max = parseInt(cel.getAttribute('data-max-size'), 10);
        if ( !max ) {
          const totalSize = resizer.parentNode[(orient === 'horizontal' ? 'offsetWidth' : 'offsetHeight')];
          const totalContainers = resizer.parentNode.querySelectorAll('gui-paned-view-container').length;
          const totalSpacers = resizer.parentNode.querySelectorAll('gui-paned-view-handle').length;

          maxSize = totalSize - (totalContainers * 16) - (totalSpacers * 8);
        }
      }, (ev, diff) => {
        const newWidth = startWidth + diff.x;
        const newHeight = startHeight + diff.y;

        let flex;
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
      }, (ev) => {
        el.dispatchEvent(new CustomEvent('_resize', {detail: {index: idx}}));
      });

    }

    el.querySelectorAll('gui-paned-view-container').forEach((cel, idx) => {
      if ( idx % 2 ) {
        const resizer = document.createElement('gui-paned-view-handle');
        resizer.setAttribute('role', 'separator');
        cel.parentNode.insertBefore(resizer, cel);
        bindResizer(resizer, idx, cel);
      }
    });

    return this;
  }
}

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
 */
class GUIPanedViewContainer extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-paned-view-container',
      type: 'container',
      allowedParents: ['gui-paned-view']
    }, this);
  }

  build() {
    GUI.setFlexbox(this.$element);
    return this;
  }
}

/**
 * Element: 'gui-button-bar'
 */
class GUIButtonBar extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-button-bar',
      type: 'container'
    }, this);
  }

  build() {
    this.$element.setAttribute('role', 'toolbar');
    return this;
  }
}

/**
 * Element: 'gui-toolbar'
 */
class GUIToolBar extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-toolbar',
      type: 'container'
    }, this);
  }

  build() {
    this.$element.setAttribute('role', 'toolbar');
    return this;
  }
}

/**
 * Element: 'gui-grid'
 *
 * A grid-type container with equal-sized containers
 */
class GUIGrid extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-grid',
      type: 'container',
      allowedChildren: ['gui-grid-row']
    }, this);
  }

  build() {
    const rows = this.$element.querySelectorAll('gui-grid-row');
    const p = 100 / rows.length;

    rows.forEach((r) => {
      r.style.height = String(p) + '%';
    });

    return this;
  }
}

/**
 * Element: 'gui-grid-row'
 */
class GUIGridRow extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-grid-row',
      type: 'container',
      allowedChildren: ['gui-grid-entry'],
      allowedParents: ['gui-grid-row']
    }, this);
  }
}

/**
 * Element: 'gui-grid-entry'
 */
class GUIGridEntry extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-grid-entry',
      type: 'container',
      allowedParents: ['gui-grid-row']
    }, this);
  }
}

/**
 * Element: 'gui-vbox'
 *
 * Vertical boxed layout
 */
class GUIVBox extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-vbox',
      type: 'container',
      allowedChildren: ['gui-vbox-container']
    }, this);
  }
}

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
 */
class GUIVBoxContainer extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-vbox-container',
      type: 'container',
      allowedParents: ['gui-vbox']
    }, this);
  }

  build() {
    GUI.setFlexbox(this.$element);

    return this;
  }
}

/**
 * Element: 'gui-hbox'
 *
 * Horizontal boxed layout
 */
class GUIHBox extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-hbox',
      type: 'container',
      allowedChildren: ['gui-hbox-container']
    }, this);
  }
}

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
 */
class GUIHBoxContainer extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-hbox-container',
      type: 'container',
      allowedParents: ['gui-hbox']
    }, this);
  }

  build() {
    GUI.setFlexbox(this.$element);

    return this;
  }
}

/**
 * Element: 'gui-expander'
 *
 * A expandable/collapsable container with label and indicator
 *
 * <pre><code>
 *   property  label     String        The label
 *   property  expanded  boolean       Expanded state (default=true)
 * </code></pre>
 */

class GUIExpander extends GUIElement {
  static register() {
    return super.register({
      tagName: 'gui-expander',
      type: 'container'
    }, this);
  }

  set(param, value) {
    if ( param === 'expanded' ) {
      return toggleState(this.$element, value === true);
    }
    return super.set(...arguments);
  }

  on(evName, callback, params) {
    if ( (['change']).indexOf(evName) !== -1 ) {
      evName = '_' + evName;
    }
    Events.$bind(this.$element, evName, callback.bind(this), params);

    return this;
  }

  build() {
    const el = this.$element;
    const lbltxt = el.getAttribute('data-label') || '';
    const label = document.createElement('gui-expander-label');

    Events.$bind(label, 'pointerdown', (ev) => {
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
}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export default {
  GUIPanedView: GUIPanedView,
  GUIPanedViewContainer: GUIPanedViewContainer,
  GUIButtonBar: GUIButtonBar,
  GUIToolBar: GUIToolBar,
  GUIGrid: GUIGrid,
  GUIGridRow: GUIGridRow,
  GUIGridEntry: GUIGridEntry,
  GUIVBox: GUIVBox,
  GUIVBoxContainer: GUIVBoxContainer,
  GUIHBox: GUIHBox,
  GUIHBoxContainer: GUIHBoxContainer,
  GUIExpander: GUIExpander
};

