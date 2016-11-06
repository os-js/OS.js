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

  function toggleActive(el, eidx, idx) {
    Utils.$removeClass(el, 'gui-active');
    if ( eidx === idx ) {
      Utils.$addClass(el, 'gui-active');
    }
  }

  function selectTab(el, tabs, ev, idx, tab) {
    tabs.querySelectorAll('li').forEach(function(tel, eidx) {
      toggleActive(tel, eidx, idx);
    });

    el.querySelectorAll('gui-tab-container').forEach(function(tel, eidx) {
      toggleActive(tel, eidx, idx);
    });

    Utils.$addClass(tab, 'gui-active');

    el.dispatchEvent(new CustomEvent('_change', {detail: {index: idx}}));
  }

  function findTab(el, tabs, idx) {
    var found = null;
    if ( typeof idx === 'number' ) {
      found = idx;
    } else {
      tabs.querySelectorAll('li').forEach(function(iter, i) {
        if ( found === null && iter.firstChild.textContent === idx ) {
          found = i;
        }
      });
    }
    return found;
  }

  function removeTab(el, tabs, idx) {
    var found = findTab(el, tabs, idx);
    if ( found !== null ) {
      tabs.children[found].remove();
      el.querySelectorAll('gui-tab-container')[found].remove();
    }
  }

  function createTab(el, tabs, label, prog) {
    var tab = document.createElement('li');
    var idx = tabs.children.length;

    Utils.$bind(tab, 'click', function(ev) {
      selectTab(el, tabs, ev, idx, tab);
    }, false);

    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-label', label);
    tab.appendChild(document.createTextNode(label));
    tabs.appendChild(tab);

    if ( prog ) {
      var tel = document.createElement('gui-tab-container');
      tel.setAttribute('data-label', label);
      tel.setAttribute('role', 'tabpanel');
      el.appendChild(tel);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-tabs'
   *
   * A container with tabs for displaying content.
   *
   * <pre><code>
   *   event     select                    When tab has changed => fn(ev)
   *   event     activate                  Alias of 'select'
   * </code></pre>
   *
   * @constructs OSjs.GUI.Element
   * @memberof OSjs.GUI.Elements
   * @var gui-tabs
   */
  GUI.Elements['gui-tabs'] = {
    bind: function(el, evName, callback, params) {
      if ( (['select', 'activate']).indexOf(evName) !== -1 ) {
        evName = 'change';
      }
      if ( evName === 'change' ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    set: function(el, param, value) {
      if ( ['current', 'selected', 'active'].indexOf(param) !== -1 ) {
        var tabs = el.querySelector('ul');
        var found = findTab(el, tabs, value);
        if ( found !== null ) {
          selectTab(el, tabs, null, found, tabs[found]);
        }
      }
    },
    get: function(el, param, value) {
      if ( ['current', 'selected', 'active'].indexOf(param) !== -1 ) {
        var cur = el.querySelector('ul > li[class="gui-active"]');
        return Utils.$index(cur);
      }
      return GUI.Helpers.getProperty(el, param);
    },
    call: function(el, method, arg) {
      var tabs = el.querySelector('ul');

      if ( method === 'add' ) {
        arg.forEach(function(label) {
          createTab(el, tabs, label, true);
        });
      } else if ( method === 'remove' ) {
        arg.forEach(function(id) {
          if ( typeof id !== 'undefined' ) {
            removeTab(el, tabs, id);
          }
        });
      }
    },
    build: function(el) {
      var tabs = document.createElement('ul');

      el.querySelectorAll('gui-tab-container').forEach(function(tel, idx) {
        createTab(el, tabs, GUI.Helpers.getLabel(tel));
        tel.setAttribute('role', 'tabpanel');
      });

      tabs.setAttribute('role', 'tablist');
      el.setAttribute('role', 'navigation');

      if ( el.children.length ) {
        el.insertBefore(tabs, el.children[0]);
      } else {
        el.appendChild(tabs);
      }

      var currentTab = parseInt(el.getAttribute('data-selected-index'), 10) || 0;
      selectTab(el, tabs, null, currentTab);
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
