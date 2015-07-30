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

  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};

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
    Window.apply(this, [className + DialogIndex, opts]);

    this._properties.gravity          = 'center';
    this._properties.allow_resize     = false;
    this._properties.allow_minimize   = false;
    this._properties.allow_maximize   = false;
    this._properties.allow_windowlist = false;
    this._properties.allow_session    = false;
    this._state.ontop                 = true;

    this.className = className;
    DialogIndex++;
  }

  DialogWindow.prototype = Object.create(Window.prototype);
  DialogWindow.constructor = Window;

  DialogWindow.prototype.init = function() {
    var root = Window.prototype.init.apply(this, arguments);
    var handler = OSjs.Core.getHandler();
    handler.dialogs.render(this, this.className.replace(/Dialog$/, ''), root, 'application-dialog');
    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // IMPLEMENTATIONS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @extends DialogWindow
   */
  function ApplicationChooserDialog(args, callback) {
    DialogWindow.apply(this, ['ApplicationChooserDialog', {
      width: 400,
      height: 400
    }, args, callback]);
  }

  ApplicationChooserDialog.prototype = Object.create(DialogWindow.prototype);
  ApplicationChooserDialog.constructor = DialogWindow;

  ApplicationChooserDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    return root;
  };

  /**
   * @extends DialogWindow
   */
  function FileProgressDialog(args, callback) {
    DialogWindow.apply(this, ['FileProgressDialog', {
      width: 400,
      height: 400
    }, args, callback]);
  }

  FileProgressDialog.prototype = Object.create(DialogWindow.prototype);
  FileProgressDialog.constructor = DialogWindow;

  FileProgressDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    return root;
  };

  /**
   * @extends DialogWindow
   */
  function FileUploadDialog(args, callback) {
    DialogWindow.apply(this, ['FileUploadDialog', {
      width: 400,
      height: 400
    }, args, callback]);
  }

  FileUploadDialog.prototype = Object.create(DialogWindow.prototype);
  FileUploadDialog.constructor = DialogWindow;

  FileUploadDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    return root;
  };

  /**
   * @extends DialogWindow
   */
  function FileDialog(args, callback) {
    DialogWindow.apply(this, ['FileDialog', {
      width: 400,
      height: 400
    }, args, callback]);
  }

  FileDialog.prototype = Object.create(DialogWindow.prototype);
  FileDialog.constructor = DialogWindow;

  FileDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    return root;
  };

  /**
   * @extends DialogWindow
   */
  function FileInfoDialog(args, callback) {
    DialogWindow.apply(this, ['FileInfoDialog', {
      width: 400,
      height: 400
    }, args, callback]);
  }

  FileInfoDialog.prototype = Object.create(DialogWindow.prototype);
  FileInfoDialog.constructor = DialogWindow;

  FileInfoDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    return root;
  };

  /**
   * @extends DialogWindow
   */
  function InputDialog(args, callback) {
    DialogWindow.apply(this, ['InputDialog', {
      width: 400,
      height: 400
    }, args, callback]);
  }

  InputDialog.prototype = Object.create(DialogWindow.prototype);
  InputDialog.constructor = DialogWindow;

  InputDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    return root;
  };

  /**
   * @extends DialogWindow
   */
  function AlertDialog(args, callback) {
    DialogWindow.apply(this, ['AlertDialog', {
      width: 400,
      height: 400
    }, args, callback]);
  }

  AlertDialog.prototype = Object.create(DialogWindow.prototype);
  AlertDialog.constructor = DialogWindow;

  AlertDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    return root;
  };

  /**
   * @extends DialogWindow
   */
  function ConfirmDialog(args, callback) {
    DialogWindow.apply(this, ['ConfirmDialog', {
      width: 400,
      height: 400
    }, args, callback]);
  }

  ConfirmDialog.prototype = Object.create(DialogWindow.prototype);
  ConfirmDialog.constructor = DialogWindow;

  ConfirmDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    return root;
  };

  /**
   * @extends DialogWindow
   */
  function ColorDialog(args, callback) {
    DialogWindow.apply(this, ['ColorDialog', {
      width: 400,
      height: 400
    }, args, callback]);
  }

  ColorDialog.prototype = Object.create(DialogWindow.prototype);
  ColorDialog.constructor = DialogWindow;

  ColorDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    return root;
  };

  /**
   * @extends DialogWindow
   */
  function FontDialog(args, callback) {
    DialogWindow.apply(this, ['FontDialog', {
      width: 400,
      height: 400
    }, args, callback]);
  }

  FontDialog.prototype = Object.create(DialogWindow.prototype);
  FontDialog.constructor = DialogWindow;

  FontDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.DialogWindow      = DialogWindow;

  OSjs.Dialogs = {
    ApplicationChooser: ApplicationChooserDialog,
    FileProgress: FileProgressDialog,
    FileUpload: FileUploadDialog,
    File: FileDialog,
    FileInfo: FileInfoDialog,
    Input: InputDialog,
    Alert: AlertDialog,
    Confirm: ConfirmDialog,
    Color: ColorDialog,
    Font: FontDialog
  };

  OSjs.Dialogs.createDialog = function(className, args, callback, parentObj) {
    var win = new OSjs.Dialogs[className](args, callback);

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
