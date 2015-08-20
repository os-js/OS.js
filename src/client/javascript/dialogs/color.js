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
(function(API, Utils, DialogWindow) {
  'use strict';

  /**
   * An 'Color Chooser' dialog
   *
   * @param   args      Object        An object with arguments
   * @param   callback  Function      Callback when done => fn(ev, button, result)
   *
   * @option    args    title       String      Dialog title
   * @option    args    color       Mixed       Either hex string or rbg object
   *
   * @extends DialogWindow
   * @class ColorDialog
   * @api OSjs.Dialogs.Color
   */
  function ColorDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
    });

    var rgb = args.color;
    var hex = rgb;
    if ( typeof rgb === 'string' ) {
      hex = rgb;
      rgb = Utils.convertToRGB(rgb);
      rgb.a = null;
    } else {
      if ( typeof rgb.a === 'undefined' ) {
        rgb.a = null;
      } else {
        if ( rgb.a > 1.0 ) {
          rgb.a /= 100;
        }
      }

      rgb = rgb || {r: 0, g: 0, b: 0, a: 100};
      hex = Utils.convertToHEX(rgb.r, rgb.g, rgb.b);
    }

    DialogWindow.apply(this, ['ColorDialog', {
      title: args.title || API._('DIALOG_COLOR_TITLE'),
      icon: 'apps/gnome-settings-theme.png',
      width: 400,
      height: rgb.a !== null ? 300  : 220
    }, args, callback]);

    this.color = {r: rgb.r, g: rgb.g, b: rgb.b, a: rgb.a, hex: hex};
  }

  ColorDialog.prototype = Object.create(DialogWindow.prototype);
  ColorDialog.constructor = DialogWindow;

  ColorDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);

    function updateHex(update) {
      self.scheme.find(self, 'LabelRed').set('value', API._('DIALOG_COLOR_R', self.color.r));
      self.scheme.find(self, 'LabelGreen').set('value', API._('DIALOG_COLOR_G', self.color.g));
      self.scheme.find(self, 'LabelBlue').set('value', API._('DIALOG_COLOR_B', self.color.b));
      self.scheme.find(self, 'LabelAlpha').set('value', API._('DIALOG_COLOR_A', self.color.a));

      if ( update ) {
        self.color.hex = Utils.convertToHEX(self.color.r, self.color.g, self.color.b);
      }

      var value = self.color.hex;
      if ( self.color.a !== null ) {
        value = Utils.format('rgba({0}, {1}, {2}, {3})', self.color.r, self.color.g, self.color.b, self.color.a);
      }
      self.scheme.find(self, 'ColorPreview').set('value', value);
    }

    this.scheme.find(this, 'ColorSelect').on('change', function(ev) {
      self.color = ev.detail;
      self.scheme.find(self, 'Red').set('value', self.color.r);
      self.scheme.find(self, 'Green').set('value', self.color.g);
      self.scheme.find(self, 'Blue').set('value', self.color.b);
      updateHex(true);
    });

    this.scheme.find(this, 'Red').on('change', function(ev) {
      self.color.r = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.r);

    this.scheme.find(this, 'Green').on('change', function(ev) {
      self.color.g = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.g);

    this.scheme.find(this, 'Blue').on('change', function(ev) {
      self.color.b = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.b);

    this.scheme.find(this, 'Alpha').on('change', function(ev) {
      self.color.a = parseInt(ev.detail, 10) / 100;
      updateHex(true);
    }).set('value', this.color.a * 100);

    if ( this.color.a === null ) {
      this.scheme.find(this, 'AlphaContainer').hide();
      this.scheme.find(this, 'AlphaLabelContainer').hide();
    }

    updateHex(false, this.color.a !== null);

    return root;
  };

  ColorDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, button === 'ok' ? this.color : null);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.Color = ColorDialog;

})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);
