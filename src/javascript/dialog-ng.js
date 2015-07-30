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
(function(Utils, API, Window) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // DIALOG
  /////////////////////////////////////////////////////////////////////////////


  /**
   * Dialog Window
   *
   * A simple wrapper with some pre-defined options
   *
   * @see OSjs.Core.Window
   * @api OSjs.Core.DialogWindow
   * @class DialogWindow
   * @extends Window
   */
  var DialogIndex = 0;
  function DialogWindow(className, opts, args, callback) {
    var self = this;

    opts = opts || {};
    args = args || {};
    callback = callback || function() {};

    Window.apply(this, [className + DialogIndex, opts]);

    this._properties.gravity          = 'center';
    this._properties.allow_resize     = false;
    this._properties.allow_minimize   = false;
    this._properties.allow_maximize   = false;
    this._properties.allow_windowlist = false;
    this._properties.allow_session    = false;
    this._state.ontop                 = true;

    this.args = args;
    this.scheme = OSjs.Core.getHandler().dialogs;
    this.className = className;
    this.buttonClicked = false;

    this.closeCallback = function(ev, button, result) {
      self.buttonClicked = true;
      callback.apply(self, arguments);
      self._close();
    };

    DialogIndex++;
  }

  DialogWindow.prototype = Object.create(Window.prototype);
  DialogWindow.constructor = Window;

  DialogWindow.prototype.init = function() {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    this.scheme.render(this, this.className.replace(/Dialog$/, ''), root, 'application-dialog');

    this.scheme.find(this, 'ButtonOK').on('click', function(ev) {
      self.onClose(ev, 'ok');
    });
    this.scheme.find(this, 'ButtonCancel').on('click', function(ev) {
      self.onClose(ev, 'cancel');
    });
    this.scheme.find(this, 'ButtonYes').on('click', function(ev) {
      self.onClose(ev, 'yes');
    });
    this.scheme.find(this, 'ButtonNo').on('click', function(ev) {
      self.onClose(ev, 'no');
    });

    return root;
  };

  DialogWindow.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };

  DialogWindow.prototype._close = function() {
    if ( !this.buttonClicked ) {
      this.onClose(null, 'cancel', null);
    }
    return Window.prototype._close.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // IMPLEMENTATIONS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @extends DialogWindow
   */
  function ApplicationChooserDialog(args, callback) {
    DialogWindow.apply(this, ['ApplicationChooserDialog', {
      title: API._('DIALOG_APPCHOOSER_TITLE'),
      width: 400,
      height: 400
    }, args, callback]);
  }

  ApplicationChooserDialog.prototype = Object.create(DialogWindow.prototype);
  ApplicationChooserDialog.constructor = DialogWindow;

  ApplicationChooserDialog.prototype.onClose = function(ev, button) {
    var result = null;
    if ( button === 'ok' ) {
      var app = this.scheme.find(this, 'ApplicationList').get('value');
    }
    this.closeCallback(ev, button, result);
  };

  /**
   * @extends DialogWindow
   */
  function FileProgressDialog(args, callback) {
    DialogWindow.apply(this, ['FileProgressDialog', {
      title: API._('DIALOG_FILEPROGRESS_TITLE'),
      icon: 'actions/document-send.png',
      width: 400,
      height: 100
    }, args, callback]);
  }

  FileProgressDialog.prototype = Object.create(DialogWindow.prototype);
  FileProgressDialog.constructor = DialogWindow;

  FileProgressDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };

  /**
   * @extends DialogWindow
   */
  function FileUploadDialog(args, callback) {
    DialogWindow.apply(this, ['FileUploadDialog', {
      title: API._('DIALOG_UPLOAD_TITLE'),
      icon: 'actions/filenew.png',
      width: 400,
      height: 100
    }, args, callback]);
  }

  FileUploadDialog.prototype = Object.create(DialogWindow.prototype);
  FileUploadDialog.constructor = DialogWindow;

  FileUploadDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };

  /**
   * @extends DialogWindow
   */
  function FileDialog(args, callback) {
    args = args || {};
    args.type = args.type || 'open';

    var title     = API._(args.type === 'save' ? 'DIALOG_FILE_SAVE' : 'DIALOG_FILE_OPEN');
    var icon      = args.type === 'open' ? 'actions/gtk-open.png' : 'actions/gtk-save-as.png';

    DialogWindow.apply(this, ['FileDialog', {
      title: title,
      icon: icon,
      width: 400,
      height: 400
    }, args, callback]);
  }

  FileDialog.prototype = Object.create(DialogWindow.prototype);
  FileDialog.constructor = DialogWindow;

  FileDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };

  /**
   * @extends DialogWindow
   */
  function FileInfoDialog(args, callback) {
    DialogWindow.apply(this, ['FileInfoDialog', {
      title: API._('DIALOG_FILEINFO_TITLE'),
      width: 400,
      height: 400
    }, args, callback]);
  }

  FileInfoDialog.prototype = Object.create(DialogWindow.prototype);
  FileInfoDialog.constructor = DialogWindow;

  FileInfoDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };

  /**
   * @extends DialogWindow
   */
  function InputDialog(args, callback) {
    DialogWindow.apply(this, ['InputDialog', {
      title: API._('DIALOG_INPUT_TITLE'),
      icon: 'status/dialog-information.png',
      width: 400,
      height: 120
    }, args, callback]);
  }

  InputDialog.prototype = Object.create(DialogWindow.prototype);
  InputDialog.constructor = DialogWindow;

  InputDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };

  /**
   * @extends DialogWindow
   */
  function AlertDialog(args, callback) {
    DialogWindow.apply(this, ['AlertDialog', {
      title: API._('DIALOG_ALERT_TITLE'),
      icon: 'status/dialog-warning.png',
      width: 400,
      height: 100
    }, args, callback]);
  }

  AlertDialog.prototype = Object.create(DialogWindow.prototype);
  AlertDialog.constructor = DialogWindow;


  /**
   * @extends DialogWindow
   */
  function ConfirmDialog(args, callback) {
    DialogWindow.apply(this, ['ConfirmDialog', {
      title: API._('DIALOG_CONFIRM_TITLE'),
      icon: 'status/dialog-question.png',
      width: 400,
      height: 100
    }, args, callback]);
  }

  ConfirmDialog.prototype = Object.create(DialogWindow.prototype);
  ConfirmDialog.constructor = DialogWindow;

  /**
   * @extends DialogWindow
   */
  function ErrorDialog(args, callback) {
    DialogWindow.apply(this, ['ErrorDialog', {
      title: API._('DIALOG_CONFIRM_TITLE'),
      icon: 'status/dialog-error.png',
      width: 400,
      height: 400
    }, args, callback]);

    this._sound = 'dialog-warning';
    this._soundVolume = 1.0;
  }

  ErrorDialog.prototype = Object.create(DialogWindow.prototype);
  ErrorDialog.constructor = DialogWindow;

  ErrorDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);

    this.scheme.find(this, 'Message').set('value', this.args.title);

    return root;
  };

  /**
   * TODO: Alpha
   *
   * @extends DialogWindow
   */
  function ColorDialog(args, callback) {
    args = args || {};

    DialogWindow.apply(this, ['ColorDialog', {
      title: API._('DIALOG_COLOR_TITLE'),
      icon: 'apps/gnome-settings-theme.png',
      width: 400,
      height: 220
    }, args, callback]);

    var rgb = args.color;
    var hex = rgb;
    if ( typeof rgb === 'string' ) {
      hex = rgb;
      rgb = Utils.convertToRGB(rgb);
    } else {
      rgb = rgb || {r: 0, g: 0, b: 0};
      hex = Utils.convertToHEX(rgb.r, rgb.g, rgb.b);
    }

    this.color = {r: rgb.r, g: rgb.g, b: rgb.b, hex: hex};
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
      if ( update ) {
        self.color.hex = Utils.convertToHEX(self.color.r, self.color.g, self.color.b);
      }

      self.scheme.find(self, 'ColorPreview').set('value', self.color.hex);
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

    updateHex();

    return root;
  };

  ColorDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, button === 'ok' ? this.color : null);
  };

  /**
   * @extends DialogWindow
   */
  function FontDialog(args, callback) {
    DialogWindow.apply(this, ['FontDialog', {
      title: API._('DIALOG_FONT_TITLE'),
      width: 400,
      height: 300
    }, args, callback]);
  }

  FontDialog.prototype = Object.create(DialogWindow.prototype);
  FontDialog.constructor = DialogWindow;

  FontDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  var Dialogs = {
    ApplicationChooser: ApplicationChooserDialog,
    FileProgress: FileProgressDialog,
    FileUpload: FileUploadDialog,
    File: FileDialog,
    FileInfo: FileInfoDialog,
    Input: InputDialog,
    Alert: AlertDialog,
    Confirm: ConfirmDialog,
    Color: ColorDialog,
    Error: ErrorDialog,
    Font: FontDialog
  };

  OSjs.Core.DialogWindow      = DialogWindow;

  OSjs.API.debugDialogs = function() {
    var ds = {
      ApplicationChooser: ApplicationChooserDialog,
      FileProgress: FileProgressDialog,
      FileUpload: FileUploadDialog,
      File: FileDialog,
      FileInfo: FileInfoDialog,
      Input: InputDialog,
      Alert: AlertDialog,
      Confirm: ConfirmDialog,
      //Color: ColorDialog,
      Error: ErrorDialog,
      Font: FontDialog
    };
    Object.keys(ds).forEach(function(d) {
      OSjs.API.createDialog(d, null, function(ev, button, result) {
        console.warn("DIALOG CLOSED", ev, button, result);
      });
    });
  };

  OSjs.API.createDialog = function(className, args, callback, parentObj) {
    var win = new Dialogs[className](args, callback);

    if ( !parentObj ) {
      var wm = OSjs.Core.getWindowManager();
      wm.addWindow(win, true);
    } else if ( parentObj instanceof Window ) {
      parentObj._addChild(win, true);
    } else if ( parentObj instanceof OSjs.Core.Application ) {
      parentObj._addWidow(win);
    }

    return win;
  };

})(OSjs.Utils, OSjs.API, OSjs.Core.Window);
