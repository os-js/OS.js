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
  // PANEL ITEM DIALOG
  /////////////////////////////////////////////////////////////////////////////

  function PanelItemDialog(name, args, settings, scheme, closeCallback) {
    this._closeCallback = closeCallback || function() {};
    this._settings = settings;
    Window.apply(this, [name, args, null, scheme]);
  }

  PanelItemDialog.prototype = Object.create(Window.prototype);
  PanelItemDialog.constructor = Window;

  PanelItemDialog.prototype.init = function(wm, app, scheme) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    scheme.render(this, this._name);

    scheme.find(this, 'ButtonApply').on('click', function() {
      self.applySettings();
      self._close();
    });

    scheme.find(this, 'ButtonCancel').on('click', function() {
      self._close();
    });

    return root;
  };

  PanelItemDialog.prototype.applySettings = function() {
  };

  PanelItemDialog.prototype._close = function() {
    this._closeCallback();
    return Window.prototype._close.apply(this, arguments);
  };

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
    this._items = [];
    this._outtimeout = null;
    this._intimeout = null;
    this._options = options.mergeDefaults({
      position: 'top'
    });

    console.debug('Panel::construct()', this._name, this._options.get());
  };

  Panel.prototype.init = function(root) {
    var self = this;
    var wm = OSjs.Core.getWindowManager();

    function createMenu(ev) {
      var menu = [
        {title: OSjs.Applications.CoreWM._('Open Panel Settings'), onClick: function(ev) {
          wm.showSettings('panel');
        }}
      ];

      if ( wm.getSetting('useTouchMenu') === true ) {
        menu.push({title: OSjs.Applications.CoreWM._('Turn off TouchMenu'), onClick: function(ev) {
          wm.applySettings({useTouchMenu: false}, false, true);
        }});
      } else {
        menu.push({title: OSjs.Applications.CoreWM._('Turn on TouchMenu'), onClick: function(ev) {
          wm.applySettings({useTouchMenu: true}, false, true);
        }});
      }

      API.createMenu(menu, ev);
    }

    this._$container = document.createElement('corewm-panel-container');
    this._$element = document.createElement('corewm-panel');

    Utils.$bind(this._$element, 'mousedown', function(ev) {
      ev.preventDefault();
    });
    Utils.$bind(this._$element, 'mouseover', function(ev) {
      self.onMouseOver(ev);
    });
    Utils.$bind(this._$element, 'mouseout', function(ev) {
      self.onMouseOut(ev);
    });
    Utils.$bind(this._$element, 'click', function(ev) {
      OSjs.API.blurMenu();
    });
    Utils.$bind(this._$element, 'contextmenu', function(ev) {
      createMenu(ev);
    });
    Utils.$bind(document, 'mouseout', function(ev) {
      self.onMouseLeave(ev);
    }, false);

    this._$element.appendChild(this._$container);
    root.appendChild(this._$element);

    setTimeout(function() {
      self.update();
    }, 0);
  };

  Panel.prototype.destroy = function() {
    this._clearTimeouts();

    var self = this;
    Utils.$unbind(document, 'mouseout', function(ev) {
      self.onMouseLeave(ev);
    }, false);

    this._items.forEach(function(item) {
      item.destroy();
    });
    this._items = [];
    this._$element = Utils.$remove(this._$element);
    this._$container = null;
  };

  Panel.prototype.update = function(options) {
    options = options || this._options.get();

    // CSS IS SET IN THE WINDOW MANAGER!
    var self = this;
    var attrs = {
      ontop: !!options.ontop,
      position: options.position || 'bottom'
    };

    if ( options.autohide ) {
      this.onMouseOut();
    }
    if ( this._$element ) {
      Object.keys(attrs).forEach(function(k) {
        self._$element.setAttribute('data-' + k, typeof attrs[k] === 'boolean' ? (attrs[k] ? 'true' : 'false') : attrs[k]);
      });
    }
    this._options.set(null, options);
  };

  Panel.prototype.autohide = function(hide) {
    if ( !this._options.get('autohide') || !this._$element ) {
      return;
    }

    if ( hide ) {
      this._$element.setAttribute('data-autohide', 'true');
    } else {
      this._$element.setAttribute('data-autohide', 'false');
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

    this._items.forEach(function(item, idx) {
      if ( item instanceof type ) {
        if ( multiple ) {
          result.push(item);
        } else {
          result = item;
          return false;
        }
      }
      return true;
    });

    return result;
  };

  Panel.prototype.getOntop = function() {
    return this._options.get('ontop');
  };

  Panel.prototype.getPosition = function(pos) {
    return pos ? (this._options.get('position') == pos) : this._options.get('position');
  };

  Panel.prototype.getAutohide = function() {
    return this._options.get('autohide');
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

  var PanelItem = function(className, itemName, settings, defaults) {
    this._$root = null;
    this._className = className || 'Unknown';
    this._itemName = itemName || className.split(' ')[0];
    this._settings = null;
    this._settingsDialog = null;

    if ( settings && defaults ) {
      this._settings = settings.mergeDefaults(defaults);
    }
  };

  PanelItem.Name = 'PanelItem'; // Static name
  PanelItem.Description = 'PanelItem Description'; // Static description
  PanelItem.Icon = 'actions/stock_about.png'; // Static icon
  PanelItem.HasOptions = false;

  PanelItem.prototype.init = function() {
    var self = this;

    this._$root = document.createElement('corewm-panel-item');
    this._$root.className = this._className;

    if ( this._settings ) {
      var title = 'Open ' + this._itemName + ' settings'; // FIXME: Locale
      Utils.$bind(this._$root, 'contextmenu', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();

        API.createMenu([{
          title: title,
          onClick: function() {
            self.openSettings();
          }
        }], ev);
      });
    }

    return this._$root;
  };

  PanelItem.prototype.destroy = function() {
    if ( this._settingsDialog ) {
      this._settingsDialog.destroy();
    }
    this._settingsDialog = null;
    this._$root = Utils.$remove(this._$root);
  };

  PanelItem.prototype.openSettings = function(_DialogRef, args) {
    if ( this._settingsDialog ) {
      this._settingsDialog._restore();
      return false;
    }

    var wm = OSjs.Core.getWindowManager();
    this._settingsDialog = new _DialogRef(this, wm.scheme);
    OSjs.Core.getWindowManager().addWindow(this._settingsDialog, true);
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
  OSjs.Applications.CoreWM.PanelItemDialog   = PanelItemDialog;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
