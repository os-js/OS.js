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
(function(CoreWM, Panel, PanelItem, Utils, API, VFS, GUI, Window) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // Clock Settings Dialog
  /////////////////////////////////////////////////////////////////////////////
  function ClockSettingsDialog(args, scheme, closeCallback) {
    this._closeCallback = closeCallback || function() {};
    this._settings = args.settings;
    this._scheme = null;

    Window.apply(this, ['ClockSettingsDialog', {
      title: 'Clock Settings',
      icon: 'status/appointment-soon.png',
      width: 300,
      height: 150
    }, null, scheme]);
  }

  ClockSettingsDialog.prototype = Object.create(Window.prototype);
  ClockSettingsDialog.constructor = Window;

  ClockSettingsDialog.prototype.init = function(wm, app, scheme) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    scheme.render(this, 'ClockSettingsDialog');

    scheme.find(this, 'InputUseUTC').set('value', self._settings.get('utc'));
    scheme.find(this, 'InputFormatString').set('value', self._settings.get('format'));

    scheme.find(this, 'ButtonApply').on('click', function() {
      self._settings.set('utc', scheme.find(self, 'InputUseUTC').get('value'));
      self._settings.set('format', scheme.find(self, 'InputFormatString').get('value'), true);
      self._close();
    });

    scheme.find(this, 'ButtonCancel').on('click', function() {
      self._close();
    });

    return root;
  };

  ClockSettingsDialog.prototype._close = function() {
    this._closeCallback();
    return Window.prototype._close.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Clock
   */
  var PanelItemClock = function(settings) {
    PanelItem.apply(this, ['PanelItemClock PanelItemFill PanelItemRight']);
    this.clockInterval  = null;
    this._settings = settings.mergeDefaults({
      utc: false,
      format: 'H:i:s'
    });
  };

  PanelItemClock.prototype = Object.create(PanelItem.prototype);
  PanelItemClock.Name = 'Clock'; // Static name
  PanelItemClock.Description = 'View the time'; // Static description
  PanelItemClock.Icon = 'status/appointment-soon.png'; // Static icon

  PanelItemClock.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);
    var wm = OSjs.Core.getWindowManager();
    var self = this;

    var clock = document.createElement('div');
    clock.innerHTML = '00:00:00';
    clock.oncontextmenu = function(ev) {
      ev.stopPropagation();
      return false;
    };
    var _updateClock = function() {
      var t = OSjs.Helpers.Date.format(new Date(), self._settings.get());

      clock.innerHTML = t;
      clock.title     = t;
    };
    this.clockInterval = setInterval(_updateClock, 1000);
    _updateClock();

    root.appendChild(clock);

    Utils.$bind(clock, 'contextmenu', function(ev) {
      API.createMenu([{
        title: 'Clock Settings',
        onClick: function() {
          var dialog = new ClockSettingsDialog({settings: self._settings}, wm.scheme);
          OSjs.Core.getWindowManager().addWindow(dialog, true);
        }
      }], ev);
    });

    return root;
  };

  PanelItemClock.prototype.destroy = function() {
    if ( this.clockInterval ) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }

    PanelItem.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.Clock            = PanelItemClock;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI, OSjs.Core.Window);
