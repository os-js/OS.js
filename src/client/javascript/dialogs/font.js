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
(function(API, Utils, DialogWindow) {
  'use strict';

  /**
   * An 'Font Selection' dialog
   *
   * @param   args      Object        An object with arguments
   * @param   callback  Function      Callback when done => fn(ev, button, result)
   *
   * @option    args    title               String      Dialog title
   * @option    args    fontName            String      Current font name (default=internal)
   * @option    args    fontSize            int         Current font size (default=12)
   * @option    args    fontColor           String      (Optional) Font color (default=#00000)
   * @option    args    backgroundColor     String      (Optional) Background color (default=#ffffff)
   * @option    args    fonts               Array       (Optional) Default font list
   * @option    args    minSize             int         (Optional) Minimun size (default=6)
   * @option    args    maxSize             int         (Optional) Maximum size (default=30
   * @option    args    text                String      (Optional) Preview text
   * @option    args    unit                String      (Optional) Size unit (default="px")
   *
   * @extends DialogWindow
   * @class FontDialog
   * @api OSjs.Dialogs.Font
   */
  function FontDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      fontName: API.getConfig('Fonts.default'),
      fontSize: 12,
      fontColor: '#000000',
      backgroundColor: '#ffffff',
      fonts: API.getConfig('Fonts.list'),
      minSize: 6,
      maxSize: 30,
      text: 'The quick brown fox jumps over the lazy dog',
      unit: 'px'
    });

    if ( args.unit === 'null' || args.unit === 'unit' ) {
      args.unit = '';
    }

    DialogWindow.apply(this, ['FontDialog', {
      title: args.title || API._('DIALOG_FONT_TITLE'),
      width: 400,
      height: 300
    }, args, callback]);

    this.selection = {
      fontName: args.fontName,
      fontSize: args.fontSize + args.unit
    };
  }

  FontDialog.prototype = Object.create(DialogWindow.prototype);
  FontDialog.constructor = DialogWindow;

  FontDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);

    var self = this;
    var preview = this.scheme.find(this, 'FontPreview');
    var sizes = [];
    var fonts = [];

    for ( var i = this.args.minSize; i < this.args.maxSize; i++ ) {
      sizes.push({value: i, label: i});
    }
    for ( var j = 0; j < this.args.fonts.length; j++ ) {
      fonts.push({value: this.args.fonts[j], label: this.args.fonts[j]});
    }

    function updatePreview() {
      preview.querySelector('textarea').style.fontFamily = self.selection.fontName;
      preview.querySelector('textarea').style.fontSize = self.selection.fontSize;
    }

    var listFonts = this.scheme.find(this, 'FontName');
    listFonts.add(fonts).set('value', this.args.fontName);
    listFonts.on('change', function(ev) {
      self.selection.fontName = ev.detail;
      updatePreview();
    });

    var listSizes = this.scheme.find(this, 'FontSize');
    listSizes.add(sizes).set('value', this.args.fontSize);
    listSizes.on('change', function(ev) {
      self.selection.fontSize = ev.detail + self.args.unit;
      updatePreview();
    });

    preview.$element.style.color = this.args.fontColor;
    preview.$element.style.backgroundColor = this.args.backgroundColor;
    preview.set('value', this.args.text);

    if ( this.args.fontSize < 0 ) {
      this.scheme.find(this, 'FontSizeContainer').hide();
    }

    updatePreview();

    return root;
  };

  FontDialog.prototype.onClose = function(ev, button) {
    var result = button === 'ok' ? this.selection : null;
    this.closeCallback(ev, button, result);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.Font = FontDialog;

})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);
