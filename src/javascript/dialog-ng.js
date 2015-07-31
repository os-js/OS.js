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
(function(Utils, API, VFS, Window) {
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
    args = args || {};
    DialogWindow.apply(this, ['ApplicationChooserDialog', {
      title: args.title || API._('DIALOG_APPCHOOSER_TITLE'),
      width: 400,
      height: 400
    }, args, callback]);
  }

  ApplicationChooserDialog.prototype = Object.create(DialogWindow.prototype);
  ApplicationChooserDialog.constructor = DialogWindow;

  ApplicationChooserDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);

    var refs = this.args.list || OSjs.Core.getHandler().getApplicationsMetadata();
    var cols = [{label: API._('LBL_NAME')}];
    var rows = [];

    Object.keys(refs).forEach(function(a) {
      if ( refs[a].type === 'application' ) {
        var label = [refs[a].name];
        if ( refs[a].description ) {
          label.push(refs[a].description);
        }
        rows.push({
          value: refs[a],
          columns: [
            {label: label.join(' - '), icon: API.getIcon(refs[a].icon, null, a), value: JSON.stringify(refs[a])}
          ]
        });
      }
    });

    this.scheme.find(this, 'ApplicationList').set('columns', cols).add(rows);
    var file = '<unknown file>';
    if ( this.args.file ) {
      file = Utils.format('{0} ({1}', this.args.file.filename, this.args.file.mime);
    }
    this.scheme.find(this, 'FileName').set('value', file);

    return root;
  };

  ApplicationChooserDialog.prototype.onClose = function(ev, button) {
    var result = null;

    if ( button === 'ok' ) {
      var useDefault = this.scheme.find(this, 'SetDefault').get('value');
      var selected = this.scheme.find(this, 'ApplicationList').get('value');
      if ( selected && selected.length ) {
        result = selected[0].value;
      }

      if ( !result ) {
        OSjs.API.createDialog('Alert', {
          message: API._('DIALOG_APPCHOOSER_NO_SELECTION')
        }, null, this);

        return;
      }

      result = {
        name: result,
        useDefault: useDefault
      };
    }

    this.closeCallback(ev, button, result);
  };

  /**
   * @extends DialogWindow
   */
  function FileProgressDialog(args, callback) {
    args = args || {};
    DialogWindow.apply(this, ['FileProgressDialog', {
      title: args.title || API._('DIALOG_FILEPROGRESS_TITLE'),
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
    args = args || {};
    DialogWindow.apply(this, ['FileUploadDialog', {
      title: args.title || API._('DIALOG_UPLOAD_TITLE'),
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

  FileUploadDialog.prototype.setProgress = function(p) {
    p = parseInt(p, 10);
  };

  /**
   * @extends DialogWindow
   */
  function FileDialog(args, callback) {
    args = args || {};
    args.type = args.type || 'open';
    args.path = args.path || OSjs.API.getDefaultPath('/');
    args.multiple = args.type === 'save' ? false : args.multiple === true;
    args.multiple = false;

    var title     = API._(args.type === 'save' ? 'DIALOG_FILE_SAVE' : 'DIALOG_FILE_OPEN');
    var icon      = args.type === 'open' ? 'actions/gtk-open.png' : 'actions/gtk-save-as.png';

    DialogWindow.apply(this, ['FileDialog', {
      title: title,
      icon: icon,
      width: 400,
      height: 400
    }, args, callback]);

    this.selected = null;
    this.path = args.path;
  }

  FileDialog.prototype = Object.create(DialogWindow.prototype);
  FileDialog.constructor = DialogWindow;

  FileDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var view = this.scheme.find(this, 'FileView');
    var filename = this.scheme.find(this, 'Filename');
    var home = this.scheme.find(this, 'HomeButton');
    var mlist = this.scheme.find(this, 'ModuleSelect');

    this._toggleLoading(true);
    view.set('multiple', this.args.multiple);

    home.on('click', function() {
      var dpath = API.getDefaultPath('/');
      self.changePath(dpath);
    });

    view.on('activate', function(ev) {
      self.selected = null;
      filename.set('value', '');

      if ( ev && ev.detail && ev.detail.entries ) {
        var activated = ev.detail.entries[0];
        if ( activated ) {
          self.selected = activated.data;
          if ( self.selected.type !== 'dir' ) {
            filename.set('value', self.selected.filename);
          }
          self.checkSelection(ev);
        }
      }
    });

    view.on('select', function(ev) {
      self.selected = null;
      //filename.set('value', '');

      if ( ev && ev.detail && ev.detail.entries ) {
        var activated = ev.detail.entries[0];
        if ( activated ) {
          self.selected = activated.data;

          if ( self.selected.type !== 'dir' ) {
            filename.set('value', self.selected.filename);
          }
        }
      }
    });

    if ( this.args.type === 'save' ) {
      filename.on('enter', function(ev) {
        self.selected = null;
        self.checkSelection(ev);
      });
    } else {
      this.scheme.find(this, 'Filename').hide();
    }

    var root = '/';
    var tmp = root.split(/(.*):\/\/\//);
    if ( !tmp[0] && tmp.length > 1 ) {
      root = tmp[1] + ':///';
    }

    var modules = [];
    VFS.getModules().forEach(function(m) {
      modules.push({label: m.name, value: m.module.root});
    });
    mlist.clear().add(modules).set('value', root);
    mlist.on('change', function(ev) {
      self.changePath(ev.detail);
    });

    this.changePath();

    return root;
  };

  FileDialog.prototype.changePath = function(dir) {
    var self = this;
    var view = this.scheme.find(this, 'FileView');
    this._toggleLoading(true);

    view._call('chdir', {
      path: dir || this.path,
      done: function() {
        if ( dir ) {
          self.path = dir;
        }

        self.selected = null;
        self._toggleLoading(false);
      }
    });
  };

  FileDialog.prototype.checkSelection = function(ev) {
    var self = this;

    if ( this.selected && this.selected.type === 'dir' ) {
      this.changePath(this.selected.path);
      return false;
    }

    if ( this.args.type === 'save' ) {
      if ( !this.path || !this.selected ) {
        // TODO: Error message ?
        return;
      }

      var filename = this.scheme.find(this, 'Filename');
      var dest = this.path.replace(/^\//, '') + '/' + filename.get('value');

      // TODO: Check if already exists
      this.selected = dest;

      this.closeCallback(ev, 'ok', this.selected);
    } else {
      if ( !this.selected ) {
        // TODO: Error message
        return;
      }

      this.closeCallback(ev, 'ok', this.selected);
    }

    return true;
  };

  FileDialog.prototype.onClose = function(ev, button) {
    if ( button === 'ok' && !this.checkSelection(ev) ) {
      return;
    }

    this.closeCallback(ev, button, this.selected);
  };

  /**
   * @extends DialogWindow
   */
  function FileInfoDialog(args, callback) {
    args = args || {};
    DialogWindow.apply(this, ['FileInfoDialog', {
      title: args.title || API._('DIALOG_FILEINFO_TITLE'),
      width: 400,
      height: 400
    }, args, callback]);

    if ( !this.args.file ) {
      throw new Error('You have to select a file for FileInfo');
    }
  }

  FileInfoDialog.prototype = Object.create(DialogWindow.prototype);
  FileInfoDialog.constructor = DialogWindow;

  FileInfoDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);

    var txt = this.scheme.find(this, 'Info').set('value', API._('LBL_LOADING'));
    var file = this.args.file;

    function _onError(error) {
      txt.set('value', API._('DIALOG_FILEINFO_ERROR_LOOKUP_FMT', file.path));
    }

    function _onSuccess(data) {
      var info = [];
      Object.keys(data).forEach(function(i) {
        if ( i === 'exif' ) {
          info.push(i + ':\n\n' + data[i]);
        } else {
          info.push(i + ':\n\t' + data[i]);
        }
      });
      txt.set('value', info.join('\n\n'));
    }

    VFS.fileinfo(file, function(error, result) {
      if ( error ) {
        _onError(error);
        return;
      }
      _onSuccess(result || {});
    });

    return root;
  };

  /**
   * @extends DialogWindow
   */
  function InputDialog(args, callback) {
    args = args || {};
    DialogWindow.apply(this, ['InputDialog', {
      title: args.title || API._('DIALOG_INPUT_TITLE'),
      icon: 'status/dialog-information.png',
      width: 400,
      height: 120
    }, args, callback]);
  }

  InputDialog.prototype = Object.create(DialogWindow.prototype);
  InputDialog.constructor = DialogWindow;

  InputDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    if ( this.args.message ) {
      this.scheme.find(this, 'Message').set('value', this.args.message);
    }
    this.scheme.find(this, 'Input').set('placeholder', this.args.placeholder || '');
    this.scheme.find(this, 'Input').set('value', this.args.value || '');
    return root;
  };

  InputDialog.prototype.onClose = function(ev, button) {
    var result = this.scheme.find(this, 'Input').get('value');
    this.closeCallback(ev, button, button === 'ok' ? result : null);
  };

  /**
   * @extends DialogWindow
   */
  function AlertDialog(args, callback) {
    args = args || {};
    DialogWindow.apply(this, ['AlertDialog', {
      title: args.title || API._('DIALOG_ALERT_TITLE'),
      icon: 'status/dialog-warning.png',
      width: 400,
      height: 100
    }, args, callback]);
  }

  AlertDialog.prototype = Object.create(DialogWindow.prototype);
  AlertDialog.constructor = DialogWindow;

  AlertDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    this.scheme.find(this, 'Message').set('value', this.args.message);
    return root;
  };


  /**
   * @extends DialogWindow
   */
  function ConfirmDialog(args, callback) {
    args = args || {};
    DialogWindow.apply(this, ['ConfirmDialog', {
      title: args.title || API._('DIALOG_CONFIRM_TITLE'),
      icon: 'status/dialog-question.png',
      width: 400,
      height: 100
    }, args, callback]);
  }

  ConfirmDialog.prototype = Object.create(DialogWindow.prototype);
  ConfirmDialog.constructor = DialogWindow;

  ConfirmDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    this.scheme.find(this, 'Message').set('value', this.args.message);
    return root;
  };

  /**
   * @extends DialogWindow
   */
  function ErrorDialog(args, callback) {
    args = args || {};

    var exception = args.exception || {};
    var error = '';
    if ( exception.stack ) {
      error = exception.stack;
    } else {
      if ( Object.keys(exception).length ) {
        error = exception.name;
        error += '\nFilename: ' + exception.fileName || '<unknown>';
        error += '\nLine: ' + exception.lineNumber;
        error += '\nMessage: ' + exception.message;
        if ( exception.extMessage ) {
          error += '\n' + exception.extMessage;
        }
      }
    }

    DialogWindow.apply(this, ['ErrorDialog', {
      title: args.title || API._('DIALOG_CONFIRM_TITLE'),
      icon: 'status/dialog-error.png',
      width: 400,
      height: error ? 400 : 200,
    }, args, callback]);

    this._sound = 'dialog-warning';
    this._soundVolume = 1.0;

    this.traceMessage = error;
  }

  ErrorDialog.prototype = Object.create(DialogWindow.prototype);
  ErrorDialog.constructor = DialogWindow;

  ErrorDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);

    this.scheme.find(this, 'Message').set('value', this.args.message);
    this.scheme.find(this, 'Summary').set('value', this.args.error);
    this.scheme.find(this, 'Trace').set('value', this.traceMessage);
    if ( !this.traceMessage ) {
      this.scheme.find(this, 'Trace').hide();
      this.scheme.find(this, 'TraceLabel').hide();
    }

    if ( this.args.bugreport ) {
      this.scheme.find(this, 'ButtonBugReport').on('click', function() {
        window.open('//github.com/andersevenrud/OS.js-v2/issues/new');
      });
    } else {
      this.scheme.find(this, 'ButtonBugReport').hide();
    }

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
      title: args.title || API._('DIALOG_COLOR_TITLE'),
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
    args = Utils.argumentDefaults(args, {
      fontName: OSjs.Core.getHandler().getConfig('Fonts')['default'],
      fontSize: 12,
      fontColor: '#000000',
      backgroundColor: '#ffffff',
      fonts: OSjs.Core.getHandler().getConfig('Fonts').list,
      minSize: 6,
      maxSize: 30,
      text: 'The quick brown fox jumps over the lazy dog',
      unit: 'px'
    });

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
      preview.$element.style.fontFamily = self.selection.fontName;
      preview.$element.style.fontSize = self.selection.fontSize;
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

    return root;
  };

  FontDialog.prototype.onClose = function(ev, button) {
    var result = button === 'ok' ? this.selection : null;
    this.closeCallback(ev, button, result);
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
      //ApplicationChooser: ApplicationChooserDialog,
      //FileInfo: FileInfoDialog,
      //Input: InputDialog,
      //Alert: AlertDialog,
      //Confirm: ConfirmDialog,
      //Color: ColorDialog,
      //Error: ErrorDialog,
      //Font: FontDialog
      FileProgress: FileProgressDialog,
      FileUpload: FileUploadDialog,
      File: FileDialog
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

})(OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.Core.Window);
