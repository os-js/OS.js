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
(function(WindowManager, Window, GUI, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // PANELS
  /////////////////////////////////////////////////////////////////////////////

  var PANEL_SHOW_TIMEOUT = 150;
  var PANEL_HIDE_TIMEOUT = 600;

  var Panel = function(name, options, wm) {
    options = options || {};

    this._name = name;
    this._$element = null;
    this._$container = null;
    this._$background = null;
    this._items = [];
    this._outtimeout = null;
    this._intimeout = null;
    this._options = {
      position:   options.position || 'top',
      ontop:      options.ontop === true,
      autohide:   options.autohide === true,
      background: options.background,
      foreground: options.foreground,
      opacity:    options.opacity
    };

    console.debug('Panel::construct()', this._name, this._options);
  };

  Panel.prototype.init = function(root) {
    var self = this;

    this._$container = document.createElement('ul');

    this._$element = document.createElement('div');
    this._$element.className = 'WMPanel';

    this._$element.onmousedown = function(ev) {
      ev.preventDefault();
      return false;
    };
    this._$element.onmouseover = function(ev) {
      self.onMouseOver(ev);
    };
    this._$element.onmouseout = function(ev) {
      self.onMouseOut(ev);
    };
    this._$element.onclick = function(ev) {
      OSjs.API.blurMenu();
    };
    this._$element.oncontextmenu = function(ev) {
		var wm = OSjs.Core.getWindowManager();
		var enabled = wm.getSetting('useTouchMenu') === true;
		if (enabled) {
		OSjs.API.createMenu([{title: OSjs.Applications.CoreWM._('Open Panel Settings'), onClick: function(ev) {
        var wm = OSjs.Core.getWindowManager();
        if ( wm ) {
          wm.showSettings('panel');
        }
      }},{title: OSjs.Applications.CoreWM._('Turn off TouchMenu'), onClick: function(ev) {
var settings = {useTouchMenu: false};
var wm = OSjs.Core.getWindowManager();
wm.applySettings(settings, false, true);
      }}], {x: ev.clientX, y: ev.clientY});
		} else {
		OSjs.API.createMenu([{title: OSjs.Applications.CoreWM._('Open Panel Settings'), onClick: function(ev) {
        var wm = OSjs.Core.getWindowManager();
        if ( wm ) {
          wm.showSettings('panel');
        }
      }},{title: OSjs.Applications.CoreWM._('Turn on TouchMenu'), onClick: function(ev) {
var settings = {useTouchMenu: true};
var wm = OSjs.Core.getWindowManager();
wm.applySettings(settings, false, true);
      }}], {x: ev.clientX, y: ev.clientY});
		}
      return false;
    };

    document.addEventListener('mouseout', function(ev) {
      self.onMouseLeave(ev);
    }, false);

    this._$background = document.createElement('div');
    this._$background.className = 'WMPanelBackground';

    this._$element.appendChild(this._$background);
    this._$element.appendChild(this._$container);
    root.appendChild(this._$element);

    setTimeout(function() {
      self.update();
    }, 0);
  };

  Panel.prototype.destroy = function() {
    this._clearTimeouts();

    var self = this;
    document.removeEventListener('mouseout', function(ev) {
      self.onMouseLeave(ev);
    }, false);

    for ( var i = 0; i < this._items.length; i++ ) {
      this._items[i].destroy();
    }
    this._items = [];

    if ( this._$element && this._$element.parentNode ) {
      this._$element.onmousedown = null;
      this._$element.onclick = null;
      this._$element.oncontextmenu = null;
      this._$element.parentNode.removeChild(this._$element);
      this._$element = null;
    }

    this._$container = null;
    this._$background = null;
  };

  Panel.prototype.update = function(options) {
    options = options || this._options;

    // CSS IS SET IN THE WINDOW MANAGER!

    var cn = ['WMPanel'];
    if ( options.ontop ) {
      cn.push('Ontop');
    }
    if ( options.position ) {
      cn.push(options.position == 'top' ? 'Top' : 'Bottom');
    }
    if ( options.autohide ) {
      this.onMouseOut();
    }
    if ( this._$element ) {
      this._$element.className = cn.join(' ');
    }
    this._options = options;
  };

  Panel.prototype.autohide = function(hide) {
    if ( !this._options.autohide || !this._$element ) {
      return;
    }

    if ( hide ) {
      this._$element.className = this._$element.className.replace(/\s?Visible/, '');
      if ( !this._$element.className.match(/Autohide/) ) {
        this._$element.className += ' Autohide';
      }
    } else {
      this._$element.className = this._$element.className.replace(/\s?Autohide/, '');
      if ( !this._$element.className.match(/Visible/) ) {
        this._$element.className += ' Visible';
      }
    }
  };

  Panel.prototype._clearTimeouts = function() {
    if ( this._outtimeout ) {
      clearTimeout(this._outtimeout);
      this._outtimeout = null;
    }
    if ( this._intimeout ) {
      clearTimeout(this._intimeout);
      this._intimeout = null;
    }
  };

  Panel.prototype.onMouseLeave = function(ev) {
    var from = ev.relatedTarget || ev.toElement;
    if ( !from || from.nodeName == "HTML" ) {
      this.onMouseOut(ev);
    }
  };

  Panel.prototype.onMouseOver = function() {
    var self = this;
    this._clearTimeouts();
    this._intimeout = setTimeout(function() {
      self.autohide(false);
    }, PANEL_SHOW_TIMEOUT);
  };

  Panel.prototype.onMouseOut = function() {
    var self = this;
    this._clearTimeouts();
    this._outtimeout = setTimeout(function() {
      self.autohide(true);
    }, PANEL_HIDE_TIMEOUT);
  };

  Panel.prototype.addItem = function(item) {
    if ( !(item instanceof OSjs.Applications.CoreWM.PanelItem) ) {
      throw "Expected a PanelItem in Panel::addItem()";
    }

    this._items.push(item);
    this._$container.appendChild(item.init());
  };

  Panel.prototype.getItemByType = function(type) {
    return this.getItem(type);
  };

  Panel.prototype.getItemsByType = function(type) {
    return this.getItem(type, true);
  };

  Panel.prototype.getItem = function(type, multiple) {
    var result = multiple ? [] : null;
    for ( var i = 0; i < this._items.length; i++ ) {
      if ( this._items[i] instanceof type ) {
        if ( multiple ) {
          result.push(this._items[i]);
        } else {
          result = this._items[i];
          break;
        }
      }
    }
    return result;
  };

  Panel.prototype.getOntop = function() {
    return this._options.ontop;
  };

  Panel.prototype.getPosition = function(pos) {
    return pos ? (this._options.position == pos) : this._options.position;
  };

  Panel.prototype.getAutohide = function() {
    return this._options.autohide;
  };

  Panel.prototype.getRoot = function() {
    return this._$element;
  };

  Panel.prototype.getHeight = function() {
    return this._$element ? this._$element.offsetHeight : 0;
  };

  /////////////////////////////////////////////////////////////////////////////
  // PANEL ITEM
  /////////////////////////////////////////////////////////////////////////////

  var PanelItem = function(className) {
    this._$root = null;
    this._className = className || 'Unknown';
  };

  PanelItem.Name = 'PanelItem'; // Static name
  PanelItem.Description = 'PanelItem Description'; // Static description
  PanelItem.Icon = 'actions/stock_about.png'; // Static icon

  PanelItem.prototype.init = function() {
    this._$root = document.createElement('li');
    this._$root.className = 'PanelItem ' + this._className;

    return this._$root;
  };

  PanelItem.prototype.destroy = function() {
    if ( this._$root ) {
      if ( this._$root.parentNode ) {
        this._$root.parentNode.removeChild(this._$root);
      }
      this._$root = null;
    }
  };

  PanelItem.prototype.getRoot = function() {
    return this._$root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.Panel             = Panel;
  OSjs.Applications.CoreWM.PanelItem         = PanelItem;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
