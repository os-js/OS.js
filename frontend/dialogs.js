/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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
(function(DialogWindow, GUI) {
  window.OSjs = window.OSjs || {};
  OSjs.Dialogs = OSjs.Dialogs || {};

  // FIXME: Destroy DOM events
  // FIXME: Cleanups

  var StandardDialog = function(className, args, opts, onClose) {
    this.$element       = null;
    this.$message       = null;
    this.$buttonConfirm = null;
    this.$buttonCancel  = null;

    this.className      = className;
    this.args           = args || {};
    this.message        = args.message || null;
    this.onClose        = onClose || function() {};

    DialogWindow.apply(this, [className, opts]);
    if ( this.args.title ) {
      this._title = this.args.title;
    }
  };

  StandardDialog.prototype = Object.create(DialogWindow.prototype);

  StandardDialog.prototype.destroy = function() {
    this.onClose.apply(this, ['destroy']);
    DialogWindow.prototype.destroy.apply(this, arguments);
  };

  StandardDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var self = this;

    this.$element = document.createElement('div');
    this.$element.className = 'StandardDialog ' + this.className;

    if ( this.message ) {
      this.$message = document.createElement('div');
      this.$message.className = 'Message';
      this.$message.innerHTML = this.message;
      this.$element.appendChild(this.$message);
    }

    if ( (typeof this.args.buttonCancel === 'undefined') || (this.args.buttonCancel === true) ) {
      this.$buttonCancel = document.createElement('button');
      this.$buttonCancel.className = 'Cancel';
      this.$buttonCancel.innerHTML = this.args.buttonCancelLabel || 'Cancel';
      this.$buttonCancel.onclick = function(ev) {
        if ( this.getAttribute("disabled") == "disabled" ) return;
        self.onCancelClick(ev);
      };
      this.$element.appendChild(this.$buttonCancel);
    }

    if ( (typeof this.args.buttonOk === 'undefined') || (this.args.buttonOk === true) ) {
      this.$buttonConfirm = document.createElement('button');
      this.$buttonConfirm.className = 'OK';
      this.$buttonConfirm.innerHTML = this.args.buttonOkLabel || 'OK';
      this.$buttonConfirm.onclick = function(ev) {
        if ( this.getAttribute("disabled") == "disabled" ) return;
        self.onConfirmClick.call(self, ev);
      };
      this.$element.appendChild(this.$buttonConfirm);
    }

    root.appendChild(this.$element);
    return root;
  };

  StandardDialog.prototype.onCancelClick = function(ev) {
    if ( !this.$buttonCancel ) return;
    this.end('cancel');
  };

  StandardDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.$buttonConfirm ) return;
    this.end('ok');
  };

  StandardDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === 27 ) {
      this.end('cancel');
    }
  };

  StandardDialog.prototype.end = function() {
    this.onClose.apply(this, arguments);
    this._close();
  };

  /////////////////////////////////////////////////////////////////////////////
  // SPECIAL
  /////////////////////////////////////////////////////////////////////////////

  /**
   * ErrorDialog implementation
   * TODO: Refactor
   */
  var ErrorDialog = function() {
    this.data = {title: 'No title', message: 'No message', error: ''};

    DialogWindow.apply(this, ['ErrorDialog', {width:400, height:200}]);
    this._icon = 'status/dialog-error.png';
  };

  ErrorDialog.prototype = Object.create(DialogWindow.prototype);

  ErrorDialog.prototype.init = function() {
    this._title = this.data.title;

    var root = DialogWindow.prototype.init.apply(this, arguments);
    root.className += ' ErrorDialog';

    var messagel = document.createElement('div');
    messagel.className = 'message';
    messagel.innerHTML = this.data.message;
    this._$root.appendChild(messagel);

    var messaged = document.createElement('div');
    messaged.className = 'summary';
    messaged.innerHTML = this.data.error;
    this._$root.appendChild(messaged);

    var ok = document.createElement('button');
    ok.innerHTML = 'Close';

    var self = this;
    ok.onclick = function() {
      self._close();
    };

    root.appendChild(ok);
  };

  ErrorDialog.prototype.setError = function(title, message, error) {
    this.data = {title: title, message: message, error: error};
  };

  /**
   * Application Chooser Dialog
   * TODO: Get more application info (like) icons from metadata
   */
  var ApplicationChooserDialog = function(filename, mime, list, onClose) {
    this.filename = OSjs.Utils.filename(filename);
    this.mime = mime;
    this.list = list;
    this.selectedApp = null;

    var msg = (["Choose an application to open<br />", "<span>"+this.filename+"</span>", "("+this.mime+")"]).join(" ");
    StandardDialog.apply(this, ['ApplicationChooserDialog', {title: "Choose Application", message: msg}, {width:400, height:300}, onClose]);
  };

  ApplicationChooserDialog.prototype = Object.create(StandardDialog.prototype);

  ApplicationChooserDialog.prototype.destroy = function(wm) {
    StandardDialog.prototype.destroy.apply(this, arguments);
  };

  ApplicationChooserDialog.prototype.onConfirmClick = function(ev, val) {
    if ( !this.$buttonConfirm ) return;
    var val  = this.selectedApp;
    if ( !val ) {
      var wm = OSjs.API.getWMInstance();
      if ( wm ) {
        var d = new AlertDialog("You need to select an application");
        wm.addWindow(d);
        this._addChild(d);
      }
      return;
    }
    this.end('ok', val);
  };

  ApplicationChooserDialog.prototype.init = function(wm) {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);
    var container = this.$element;
    var list = [];

    for ( var i = 0, l = this.list.length; i < l; i++ ) {
      list.push({
        image: null,
        name: this.list[i]
      });
    }

    var _callback = function(iter) {
      var icon = OSjs.API.getThemeResource('status/gtk-dialog-question.png', 'icon');
      return '' + icon;
    };

    var listView = this._addGUIElement(new OSjs.GUI.ListView('ApplicationChooserDialogListView'), container);
    listView.setColumns([
      {key: 'image', title: '', type: 'image', callback: _callback, domProperties: {width: "16"}},
      {key: 'name', title: 'Name'}
     ]);
    listView.onActivate = function(ev, el, item) {
      if ( item && item.name ) {
        self.selectedApp = item.name;
        self.$buttonConfirm.removeAttribute("disabled");
        self.end('ok', item.name);
      }
    };
    listView.onSelect = function(ev, el, item) {
      if ( item && item.name ) {
        self.selectedApp = item.name;
        self.$buttonConfirm.removeAttribute("disabled");
      }
    };

    this.$buttonConfirm.setAttribute("disabled", "disabled");

    listView.setRows(list);
    listView.render();

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // FILES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * File Progress dialog
   */
  var FileProgressDialog = function() {
    DialogWindow.apply(this, ['FileUploadDialog', {width:400, height:120}]);

    this.$desc = null;
    this.$barContainer = null;
    this.$barInner = null;
    this._title = "Upload Progress";
    this._properties.allow_close = false;
    this._icon = 'actions/document-send.png';
  };

  FileProgressDialog.prototype = Object.create(DialogWindow.prototype);

  FileProgressDialog.prototype.destroy = function() {
    DialogWindow.prototype.destroy.apply(this, arguments);
  };

  FileProgressDialog.prototype.init = function() {
    DialogWindow.prototype.init.apply(this, arguments);

    var self = this;
    var root = this._$root;

    var el = document.createElement('div');
    el.className = 'FileProgressDialog';

    var desc = document.createElement('div');
    desc.className = 'Description';
    desc.innerHTML = 'Loading...';

    var outer = document.createElement('div');
    outer.className = 'BarContainer';

    var inner = document.createElement('div');
    inner.className = 'Bar';

    outer.appendChild(inner);
    el.appendChild(desc);
    el.appendChild(outer);
    root.appendChild(el);

    this.$desc = desc;
    this.$barContainer = outer;
    this.$bar = inner;
  };

  FileProgressDialog.prototype.setDescription = function(d) {
    if ( !this.$desc ) return;
    this.$desc.innerHTML = d;
  };

  FileProgressDialog.prototype.setProgress = function(p) {
    if ( !this.$barContainer ) return;
    this.$bar.innerHTML = p + "%";
    this.$bar.style.width = p + "%";
  };

  /**
   * File Upload Dialog
   */
  var FileUploadDialog = function(dest, file, onClose) {
    this.dest     = dest;
    this.file     = file || null;
    this.$file    = null;
    this.dialog   = null;
    this._wmref   = null;

    this.uploadName = null;
    this.uploadSize = null;
    this.uploadMime = null;

    var maxSize = OSjs.API.getConfig('MaxUploadSize');
    var msg = 'Upload file to <span>' + this.dest + '</span>.<br />Maximum size: ' + maxSize + ' bytes';
    StandardDialog.apply(this, ['FileUploadDialog', {title: "Upload Dialog", message: msg, buttonOk: false}, {width:400, height:140}, onClose]);
    this._icon = 'actions/filenew.png';
  };

  FileUploadDialog.prototype = Object.create(StandardDialog.prototype);

  FileUploadDialog.prototype.init = function(wm) {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);
    this._wmref = wm;

    var file = document.createElement('input');
    file.type = 'file';
    file.name = 'upload';
    file.onchange = function(ev) {
      self.onFileSelected(ev, file.files[0]);
    };

    this.$file = file;
    this.$element.appendChild(file);
    if ( this.file ) {
      this.onFileSelected(null, this.file);
    }
  };

  FileUploadDialog.prototype.destroy = function() {
    this._wmref = null;
    if ( this.dialog ) {
      this.dialog._close();
      this.dialog = null;
    }

    StandardDialog.prototype.destroy.apply(this, arguments);
  };

  FileUploadDialog.prototype._close = function() {
    if ( this.$buttonCancel && (this.$buttonCancel.disabled === "disabled") ) {
      return;
    }
    StandardDialog.prototype._close.apply(this, arguments);
  };

  FileUploadDialog.prototype.end = function() {
    if ( this.dialog ) {
      this.dialog._close();
      this.dialog = null;
    }

    this.onClose.apply(this, arguments);
    this._close();
  };

  FileUploadDialog.prototype.upload = function(file, size) {
    this.$file.disabled = 'disabled';
    this.$buttonCancel.disabled = "disabled";

    this.dialog = this._wmref.addWindow(new FileProgressDialog());
    this.dialog.setDescription("Uploading '" + file.name + "' (" + file.type + " " + size + ") to " + this.dest);
    this.dialog.setProgress(0);
    this._addChild(this.dialog); // Importante!

    this.uploadName = file.name;
    this.uploadSize = size;
    this.uploadMime = file.type;

    var self = this;
    OSjs.Utils.AjaxUpload(file, size, this.dest, {
      progress: function() { self.onUploadProgress.apply(self, arguments); },
      complete: function() { self.onUploadComplete.apply(self, arguments); },
      failed:   function() { self.onUploadFailed.apply(self, arguments); },
      canceled: function() { self.onUploadCanceled.apply(self, arguments); }
    });

    setTimeout(function() {
      self.dialog._focus();
    }, 10);
  };

  FileUploadDialog.prototype.onFileSelected = function(evt, file) {
    console.log("FileUploadDialog::onFileSelected()", evt, file);
    if ( file ) {
      var fileSize = 0;
      if ( file.size > 1024 * 1024 ) {
        fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
      } else {
        fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
      }

      this.upload(file, fileSize);
    }
  };

  FileUploadDialog.prototype.onUploadProgress = function(evt) {
    if ( evt.lengthComputable ) {
      var p = Math.round(evt.loaded * 100 / evt.total);
      if ( this.dialog ) {
        this.dialog.setProgress(p);
      }
    }
  };

  FileUploadDialog.prototype.onUploadComplete = function(evt) {
    console.log("FileUploadDialog::onUploadComplete()");

    this.$buttonCancel.removeAttribute("disabled");
    this.end('complete', this.uploadName, this.uploadMime, this.uploadSize);
  };

  FileUploadDialog.prototype.onUploadFailed = function(evt, error) {
    console.log("FileUploadDialog::onUploadFailed()");
    if ( error ) {
      OSjs.API.error("Upload failed", "The upload has failed", error);
    } else {
      OSjs.API.error("Upload failed", "The upload has failed", "Reason unknown...");
    }
    this.$buttonCancel.removeAttribute("disabled");
    this.end('fail', error);
  };

  FileUploadDialog.prototype.onUploadCanceled = function(evt) {
    console.log("FileUploadDialog::onUploadCanceled()");
    OSjs.API.error("Upload failed", "The upload has failed", "Cancelled by user...");
    this.$buttonCancel.removeAttribute("disabled");
    this.end('cancelled', evt);
  };

  /**
   * File Dialog Class
   * TODO: Loading when waiting for files
   * TODO: Focus input element on save dialog
   */
  var FileDialog = function(args, onClose) {
    args = args || {};

    this.currentPath      = args.path || OSjs.API.getDefaultPath('/');
    this.currentFilename  = args.filename || '';
    this.type             = args.type || 'open';
    this.mime             = args.mime || null;
    this.allowMimes       = args.mimes || null;
    this.$input           = null;

    var self = this;
    this.onError          = function(err, dirname) {
      if ( err ) {
        var fileList = self._getGUIElement('FileDialogFileView');
        if ( fileList ) {
          fileList.chdir(OSjs.API.getDefaultPath('/'));
        }
        OSjs.API.error("FileDialog Error", "Failed listing directory '" + dirname + "' because an error occured", err);
      }
    };

    var title     = this.type == "save" ? "Save" : "Open";
    var className = this.type == "save" ? 'FileSaveDialog' : 'FileOpenDialog';

    StandardDialog.apply(this, [className, {title: title}, {width:600, height:350}, onClose]);

    if ( this.type === 'open' ) {
      this._icon = 'actions/gtk-open.png';
    } else {
      this._icon = 'actions/gtk-save-as.png';
    }
  };

  FileDialog.prototype = Object.create(StandardDialog.prototype);

  FileDialog.prototype.destroy = function() {
    StandardDialog.prototype.destroy.apply(this, arguments);
  };

  FileDialog.prototype.init = function() {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);

    fileList = this._addGUIElement(new OSjs.GUI.FileView('FileDialogFileView', null, {mimeFilter: this.allowMimes}), this.$element);
    fileList.onError = this.onError;

    if ( this.type === 'save' ) {
      var start = true;
      var curval = this.currentFilename ? this.currentFilename : '';

      this.$input = document.createElement('input');
      this.$input.type = 'text';
      this.$input.value = curval;
      this.$input.onkeypress  = function(ev) {
        if ( ev.keyCode === 13 ) {
          self.$buttonConfirm.onclick(ev);
          return;
        }
      };

      fileList.onSelected = function(item) {
        if ( !item || item.type == 'dir' ) {
          self.$input.value = '';
        } else {
          self.$input.value = item.filename;
        }
      };

      fileList.onFinished = function() {
        if ( start ) {
          if ( self.currentFilename ) {
            fileList.setSelected(self.currentFilename, 'filename');
          }
        }
        start = false;
        self._toggleLoading(false);
      };

      fileList.onRefresh = function() {
        if ( start ) {
          self.$input.value = curval;
        } else {
          self.$input.value = '';
        }
        self._toggleLoading(true);
      };

      this.$element.appendChild(this.$input);
    }

    fileList.chdir(this.currentPath);

    fileList.onActivated = function(path, type, mime) {
      if ( type === 'file' ) {
        if ( self.type === 'save' ) {
          if ( confirm("Are you sure you want to overwrite the file '" + OSjs.Utils.filename(path) + "'?") ) {
            self.dialogOK.call(self, path, mime);
          }
        } else {
          self.dialogOK.call(self, path, mime);
        }
      }
    };

    return root;
  };

  FileDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.$buttonConfirm ) return;
    this.dialogOK();
  };

  FileDialog.prototype.dialogOK = function(forcepath, forcemime) {
    var curr, item, mime = null;
    if ( forcepath ) {
      curr = forcepath;
      mime = forcemime;
    } else {
      var fileList = this._getGUIElement('FileDialogFileView');
      if ( this.type == 'save' ) {
        var check = this.$input ? check = this.$input.value : '';
        if ( check ) {
          item = fileList.getItemByKey('filename', check);
          if ( item !== null ) {
            if ( confirm("The file '" + check + "' already exists. Overwrite?") ) {
              mime = item.getAttribute('data-mime');
              curr = item.getAttribute('data-path');
            } else {
              return;
            }
          }
        }

        if ( !mime && check ) mime = this.mime;
        if ( !curr && check ) curr = fileList.getPath() + '/' + check
      } else {
        item = fileList.getSelected();
        if ( item !== null ) {
          mime = item.mime;
          curr = item.path;
        }
      }
    }

    if ( curr ) {
      this.end('ok', curr, mime);
    } else {
      if ( this.type === 'save' ) {
        alert('You need to select a file or enter new filename!'); // FIXME
      } else {
        alert('You need to select a file!'); // FIXME
      }
    }
  };

  FileDialog.prototype._focus = function() {
    StandardDialog.prototype._focus.apply(this, arguments);
    if ( this.$input ) {
      this.$input.focus();
      this.$input.select();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // STANDARD
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Alert/Message Dialog
   */
  var AlertDialog = function(msg, onClose) {
    StandardDialog.apply(this, ['AlertDialog', {title: "Alert Dialog", message: msg, buttonCancel: false, buttonOkLabel: "Close"}, {width:250, height:100}, onClose]);
    this._icon = 'status/dialog-warning.png';
  };
  AlertDialog.prototype = Object.create(StandardDialog.prototype);

  /**
   * Confirmation Dialog
   */
  var ConfirmDialog = function(msg, onClose) {
    StandardDialog.apply(this, ['ConfirmDialog', {title: "Confirm Dialog", message: msg}, {width:350, height:120}, onClose]);
    this._icon = 'status/dialog-question.png';
  };
  ConfirmDialog.prototype = Object.create(StandardDialog.prototype);

  /**
   * Input Dialog
   */
  var InputDialog = function(msg, val, onClose) {
    StandardDialog.apply(this, ['InputDialog', {title: "Input Dialog", message: msg}, {width:300, height:150}, onClose]);
    this._icon = 'status/dialog-information.png';

    this.value  = val || '';
    this.$input = null;
  };

  InputDialog.prototype = Object.create(StandardDialog.prototype);

  InputDialog.prototype.init = function() {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);

    this.$input             = document.createElement('input');
    this.$input.type        = "text";
    this.$input.value       = this.value;
    this.$input.onkeypress  = function(ev) {
      if ( ev.keyCode === 13 ) {
        self.$buttonConfirm.onclick(ev);
        return;
      }
    };

    var inputd = document.createElement('div');
    inputd.appendChild(this.$input);
    this.$element.appendChild(inputd);
    return root;
  };

  InputDialog.prototype._focus = function() {
    StandardDialog.prototype._focus.apply(this, arguments);
    if ( this.$input ) {
      this.$input.focus();
      this.$input.select();
    }
  };

  InputDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.$buttonConfirm ) return;
    this.end('ok', this.$input.value);
  };


  /////////////////////////////////////////////////////////////////////////////
  // OTHER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Color Dialog
   */
  var ColorDialog = function(color, onClose) {
    StandardDialog.apply(this, ['ColorDialog', {title: "Color Dialog"}, {width:450, height:270}, onClose]);
    this._icon = 'apps/gnome-settings-theme.png';

    if ( typeof color === 'object' ) {
      this.currentRGB = color;
    } else {
      this.currentRGB = OSjs.Utils.hexToRGB(color || '#ffffff');
    }
    this.$color = null;

    var self = this;
    this.swatch = new OSjs.GUI.ColorSwatch(200, 200, function(r, g, b) {
      self.setColor(r, g, b);
    });
  };

  ColorDialog.prototype = Object.create(StandardDialog.prototype);

  ColorDialog.prototype.init = function() {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);
    var color = this.currentRGB;

    var el = document.createElement('div');
    el.className = 'ColorDialog';

    var sliders = document.createElement('div');
    sliders.className = 'ColorSliders';

    var label = document.createElement('div');
    label.className = 'Label LabelR';
    label.innerHTML = 'Red: 0';
    sliders.appendChild(label);
    this._addGUIElement(new OSjs.GUI.Slider('SliderR', {min: 0, max: 255, cur: color.r}, function(value, percentage) {
      self.setColor(value, self.currentRGB.g, self.currentRGB.b);
    }), sliders);

    label = document.createElement('div');
    label.className = 'Label LabelG';
    label.innerHTML = 'Green: 0';
    sliders.appendChild(label);
    this._addGUIElement(new OSjs.GUI.Slider('SliderG', {min: 0, max: 255, cur: color.g}, function(value, percentage) {
      self.setColor(self.currentRGB.r, value, self.currentRGB.b);
    }), sliders);

    label = document.createElement('div');
    label.className = 'Label LabelB';
    label.innerHTML = 'Blue: 0';
    sliders.appendChild(label);
    this._addGUIElement(new OSjs.GUI.Slider('SliderB', {min: 0, max: 255, cur: color.b}, function(value, percentage) {
      self.setColor(self.currentRGB.r, self.currentRGB.g, value);
    }), sliders);

    this.$color = document.createElement('div');
    this.$color.className = 'ColorSelected';

    this.$element.appendChild(this.swatch.$element);
    this.$element.appendChild(sliders);
    this.$element.appendChild(this.$color);

    var rgb = this.currentRGB;
    this.setColor(rgb.r, rgb.g, rgb.b);
  };

  ColorDialog.prototype.setColor = function(r, g, b) {
    this.currentRGB = {r:r, g:g, b:b};
    this.$color.style.background = 'rgb(' + ([r, g, b]).join(',') + ')';

    this._getGUIElement('SliderR').setValue(r);
    this._getGUIElement('SliderG').setValue(g);
    this._getGUIElement('SliderB').setValue(b);

    this.$element.getElementsByClassName('LabelR')[0].innerHTML = 'Red: ' + r;
    this.$element.getElementsByClassName('LabelG')[0].innerHTML = 'Green: ' + g;
    this.$element.getElementsByClassName('LabelB')[0].innerHTML = 'Blue: ' + b;
  };

  ColorDialog.prototype.onCancelClick = function(ev) {
    if ( !this.$buttonCancel ) return;
    this.end('cancel', null, null);
  };

  ColorDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.$buttonConfirm ) return;
    this.end('ok', this.currentRGB, OSjs.Utils.RGBtoHex(this.currentRGB));
  };

  //
  // EXPORTS
  //
  OSjs.Dialogs._StandardDialog    = StandardDialog;
  OSjs.Dialogs.File               = FileDialog;
  OSjs.Dialogs.FileProgress       = FileProgressDialog;
  OSjs.Dialogs.FileUpload         = FileUploadDialog;
  OSjs.Dialogs.ErrorMessage       = ErrorDialog;
  OSjs.Dialogs.Alert              = AlertDialog;
  OSjs.Dialogs.Confirm            = ConfirmDialog;
  OSjs.Dialogs.Input              = InputDialog;
  OSjs.Dialogs.Color              = ColorDialog;
  OSjs.Dialogs.ApplicationChooser = ApplicationChooserDialog;

})(OSjs.Core.DialogWindow, OSjs.GUI);
