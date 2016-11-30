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
(function(Widget, Utils, API, VFS, GUI, Window) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Widget: DigitalClock
   */
  function WidgetDigitalClock(settings) {
    Widget.call(this, 'DigitalClock', {
      width: 300,
      height: 100,
      aspect: true,
      top: 100,
      right: 20,
      canvas: true,
      frequency: 1,
      resizable: true,
      viewBox: true,
      settings: {
        enabled: false,
        tree: {
          color: '#ffffff'
        }
      }
    }, settings);
  }

  WidgetDigitalClock.prototype = Object.create(Widget.prototype);
  WidgetDigitalClock.constructor = Widget;

  WidgetDigitalClock.prototype.onRender = function() {
    if ( !this._$canvas ) {
      return;
    }

    var ctx = this._$context;
    var now = new Date();
    var txt = [now.getHours(), now.getMinutes(), now.getSeconds()].map(function(i) {
      return i < 10 ? '0' + String(i) : String(i);
    }).join(':');

    var ratio = 0.55;
    var xOffset = -10;
    var fontSize = Math.round(this._dimension.height * ratio);

    ctx.font = String(fontSize) + 'px Digital-7Mono';
    //ctx.textAlign = 'center'; // Does not work properly for @font-facve
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this._getSetting('color');

    var x = Math.round(this._dimension.width / 2);
    var y = Math.round(this._dimension.height / 2);
    var m = ctx.measureText(txt).width;

    ctx.clearRect(0, 0, this._dimension.width, this._dimension.height);
    //ctx.fillText(txt, x, y);
    ctx.fillText(txt, x - (m / 2) + xOffset, y);
  };

  WidgetDigitalClock.prototype.onContextMenu = function(ev) {
    var color = this._getSetting('color') || '#ffffff';
    var self = this;

    return [{
      title: API._('LBL_COLOR'),
      onClick: function() {
        API.createDialog('Color', {
          color: color
        }, function(ev, btn, result) {
          if ( btn === 'ok' ) {
            self._setSetting('color', result.hex, true);
          }
        });
      }
    }];
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications.CoreWM = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.Widgets = OSjs.Applications.CoreWM.Widgets || {};
  OSjs.Applications.CoreWM.Widgets.DigitalClock = WidgetDigitalClock;

})(OSjs.Applications.CoreWM.Widget, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI, OSjs.Core.Window);
