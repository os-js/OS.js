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
(function(CoreWM, Panel, PanelItem, PanelItemDialog, Utils, API, VFS, GUI, Window) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // Clock Settings Dialog
  /////////////////////////////////////////////////////////////////////////////

  function ClockSettingsDialog(panelItem, scheme, closeCallback) {
    PanelItemDialog.apply(this, ['ClockSettingsDialog', {
      title: 'Clock Settings',
      icon: 'status/appointment-soon.png',
      width: 400,
      height: 280
    }, panelItem._settings, scheme, closeCallback]);
  }

  ClockSettingsDialog.prototype = Object.create(PanelItemDialog.prototype);
  ClockSettingsDialog.constructor = PanelItemDialog;

  ClockSettingsDialog.prototype.init = function(wm, app) {
    var root = PanelItemDialog.prototype.init.apply(this, arguments);
    this.scheme.find(this, 'InputUseUTC').set('value', this._settings.get('utc'));
    this.scheme.find(this, 'InputInterval').set('value', String(this._settings.get('interval')));
    this.scheme.find(this, 'InputTimeFormatString').set('value', this._settings.get('format'));
    this.scheme.find(this, 'InputTooltipFormatString').set('value', this._settings.get('tooltip'));
    return root;
  };

  ClockSettingsDialog.prototype.applySettings = function() {
    this._settings.set('utc', this.scheme.find(this, 'InputUseUTC').get('value'));
    this._settings.set('interval', parseInt(this.scheme.find(this, 'InputInterval').get('value'), 10));
    this._settings.set('format', this.scheme.find(this, 'InputTimeFormatString').get('value'), true);
    this._settings.set('tooltip', this.scheme.find(this, 'InputTooltipFormatString').get('value'), true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Clock
   */
  var PanelItemClock = function(settings) {
    PanelItem.apply(this, ['PanelItemClock PanelItemFill PanelItemRight', 'Clock', settings, {
      utc: false,
      interval: 1000,
      format: 'H:i:s',
      tooltip: 'l, j F Y'
    }]);
    this.clockInterval  = null;
    this.$clock = null;
  };

  PanelItemClock.prototype = Object.create(PanelItem.prototype);
  PanelItemClock.Name = 'Clock'; // Static name
  PanelItemClock.Description = 'View the time'; // Static description
  PanelItemClock.Icon = 'status/appointment-soon.png'; // Static icon
  PanelItemClock.HasOptions = true;

  PanelItemClock.prototype.createInterval = function() {
    var self = this;
    var clock = this.$clock;
    var timeFmt = this._settings.get('format');
    var tooltipFmt = this._settings.get('tooltip');

    function update() {
      if ( clock ) {
        var now = new Date();
        var t = OSjs.Helpers.Date.format(now, timeFmt);
        var d = OSjs.Helpers.Date.format(now, tooltipFmt);
        Utils.$empty(clock);
        clock.appendChild(document.createTextNode(t));
        clock.title = d;
      }
    }

    function create(interval) {
      clearInterval(self.clockInterval);
      self.clockInterval = setInterval(function() {
        update();
      }, interval);
    }

    create(this._settings.get('interval'));
    update();
  };

  PanelItemClock.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$clock = document.createElement('div');
    this.$clock.innerHTML = '00:00:00';
    root.appendChild(this.$clock);

    this.createInterval();

    return root;
  };

  PanelItemClock.prototype.applySettings = function() {
    this.createInterval();
  };

  PanelItemClock.prototype.openSettings = function() {
    PanelItem.prototype.openSettings.call(this, ClockSettingsDialog, {});
  };

  PanelItemClock.prototype.destroy = function() {
    this.clockInterval = clearInterval(this.clockInterval);
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.Clock            = PanelItemClock;

})(
  OSjs.Applications.CoreWM.Class,
  OSjs.Applications.CoreWM.Panel,
  OSjs.Applications.CoreWM.PanelItem,
  OSjs.Applications.CoreWM.PanelItemDialog,
  OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI, OSjs.Core.Window);
