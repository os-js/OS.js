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
(function(GUIElement) {
  'use strict';

  /**
   * Tabs > Tab Container
   *
   * options:
   *  title           String        Tab title/label
   *  onCreate        Function      Callback - On creation
   *  onSelect        Function      Callback - On selected
   *  onUnselect      Function      Callback - On unselected
   *  onDestroy       Function      Callback - When destroyed
   *  onClose         Function      Callback - When closed
   */
  var Tab = function(name, opts, index, $tabs, $container, _tabs) {
    var self = this;

    opts            = opts            || {};
    opts.title      = opts.title      || {};
    opts.onCreate   = opts.onCreate   || function() {};
    opts.onSelect   = opts.onSelect   || function() {};
    opts.onUnselect = opts.onUnselect || function() {};
    opts.onDestroy  = opts.onDestroy  || function() {};
    opts.onClose    = opts.onClose    || function() { return true; };

    this.firstTab     = null;

    this.$c           = document.createElement('div');
    this.$c.className = 'TabContent';

    this.$t           = document.createElement('div');
    this.$t.className = 'Tab';
    this.$t.innerHTML = '<span>&nbsp;</span>';
    this.$t.onclick = function(ev) {
      _tabs.setTab(name);
    };

    this.$x               = null;
    if ( opts.closeable ) {
      this.$x             = document.createElement('span');
      this.$x.className   = 'Close';
      this.$x.innerHTML   = 'X';
      this.$x.onclick     = function(ev) {
        ev.stopPropagation();
        if ( opts.onClose(ev, self) === true ) {
          _tabs.removeTab(name);
        }
      };
      this.$t.appendChild(this.$x);
      this.$t.className += ' HasClose';
    }

    this.name     = name;
    this.selected = false;
    this.index    = index;
    this.params   = opts;

    this.setTitle(opts.title);
    $tabs.appendChild(this.$t);
    $container.appendChild(this.$c);

    this.params.onCreate.call(this);
  };
  Tab.prototype.destroy = function() {
    this.params.onDestroy.call(this);

    if ( this.$x ) {
      this.$x.onclick = null;
      if ( this.$x.parentNode ) {
        this.$x.parentNode.removeChild(this.$x);
      }
      this.$x = null;
    }

    if ( this.$c ) {
      if ( this.$c.parentNode ) {
        this.$c.parentNode.removeChild(this.$c);
      }
      this.$c = null;
    }
    if ( this.$t ) {
      this.$t.onclick = null;
      if ( this.$t.parentNode ) {
        this.$t.parentNode.removeChild(this.$t);
      }
      this.$t = null;
    }
  };
  Tab.prototype.select = function() {
    if ( this.selected || !this.$c || !this.$t ) { return; }
    OSjs.Utils.$addClass(this.$c, 'Active');
    OSjs.Utils.$addClass(this.$t, 'Active');
    this.selected = true;
    this.params.onSelect.call(this);
  };
  Tab.prototype.unselect = function() {
    if ( !this.selected || !this.$c || !this.$t ) { return; }
    OSjs.Utils.$removeClass(this.$c, 'Active');
    OSjs.Utils.$removeClass(this.$t, 'Active');
    this.selected = false;
    this.params.onUnselect.call(this);
  };
  Tab.prototype.appendChild = function(c) {
    if ( this.$c ) {
      this.$c.appendChild(c);
    }
  };
  Tab.prototype.setTitle = function(t) {
    this.params.title = t;
    if ( this.$t ) {
      this.$t.firstChild.innerHTML = '';
      this.$t.firstChild.appendChild(document.createTextNode(this.params.title));
    }
  };
  Tab.prototype.getTitle = function(t) {
    return this.params.title;
  };

  /**
   * Tabs Container
   *
   * options: (See GUIElement for more)
   *  orientation     String        Orientation (Default = horizontal)
   */
  var Tabs = function(name, opts) {
    opts = opts || {};

    this.$container   = null;
    this.$tabs        = null;
    this.orientation  = opts.orientation || 'horizontal';
    this.tabs         = {};
    this.tabCount     = 0;
    this.currentTab   = null;

    GUIElement.apply(this, [name, opts]);
  };

  Tabs.prototype = Object.create(GUIElement.prototype);

  Tabs.prototype.init = function() {
    var self = this;
    var el = GUIElement.prototype.init.apply(this, ['GUITabs']);
    OSjs.Utils.$addClass(el, OSjs.Utils.$safeName(this.orientation));

    this.$container = document.createElement('div');
    this.$container.className = 'TabContents';

    this.$tabs = document.createElement('div');
    this.$tabs.className = 'Tabs';

    el.appendChild(this.$tabs);
    el.appendChild(this.$container);

    return el;
  };

  Tabs.prototype.destroy = function() {
    var self = this;
    Object.keys(this.tabs).forEach(function(i) {
      if ( self.tabs[i] ) {
        self.tabs[i].destroy();
      }
    });
    this.tabs = {};
    GUIElement.prototype.destroy.apply(this, arguments);

  };

  Tabs.prototype.setTab = function(idx) {
    console.debug('OSjs::GUI::Tabs::setTab()', idx);

    if ( this.tabs[idx] ) {
      if ( this.currentTab ) {
        this.currentTab.unselect();
        this.currentTab = null;
      }

      this.currentTab = this.tabs[idx];
      this.currentTab.select();
    }
  };

  Tabs.prototype.removeTab = function(idx) {
    console.debug('OSjs::GUI::Tabs::removeTab()', idx);

    if ( idx instanceof Tab ) {
      idx = idx.name;
    }

    if ( this.tabs[idx] ) {
      this.tabs[idx].destroy();
      delete this.tabs[idx];
      this.tabCount--;
    }

    this.selectFirstTab();
  };

  Tabs.prototype.selectFirstTab = function() {
    if ( !this.$tabs || !this.$container ) { return; }

    if ( this.firstTab ) {
      this.setTab(this.firstTab);
    }
  };

  Tabs.prototype.addTab = function(name, opts) {
    var self  = this;

    if ( !this.firstTab ) {
      this.firstTab = name;
    }

    console.debug('OSjs::GUI::Tabs::addTab()', name, opts);

    var tab = new Tab(name, opts, this.tabCount, this.$tabs, this.$container, this);
    this.tabs[name] = tab;
    this.tabCount++;

    if ( this.inited && this.tabCount > 0 ) {
      this.setTab(name);
    }

    return tab;
  };

  Tabs.prototype.update = function() {
    if ( !this.inited ) {
      this.selectFirstTab();
    }
    GUIElement.prototype.update.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Tabs         = Tabs;

})(OSjs.GUI.GUIElement);
