"use strict";
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

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  var StandardDialog = function(className, args, opts, onClose) {
    this.$element       = null;
    this.$message       = null;
    this.buttonConfirm  = null;
    this.buttonCancel   = null;

    this.className      = className;
    this.args           = args          || {};
    this.message        = args.message  || null;
    this.onClose        = onClose       || function() {};

    DialogWindow.apply(this, [className, opts]);
    if ( this.args.title ) {
      this._title = this.args.title;
    }

    this._sound = 'dialog-information';
    this._soundVolume = 0.5;
  };

  StandardDialog.prototype = Object.create(DialogWindow.prototype);

  StandardDialog.prototype.destroy = function() {
    if ( this._destroyed ) { return; }

    this.onClose.apply(this, ['destroy']);
    DialogWindow.prototype.destroy.apply(this, arguments);
  };

  StandardDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var self = this;

    this.$element = document.createElement('div');
    this.$element.className = 'StandardDialog ' + this.className;

    if ( this.message ) {
      this.$message           = document.createElement('div');
      this.$message.className = 'Message';
      this.$message.innerHTML = this.message;
      this.$element.appendChild(this.$message);
    }

    var lbl;
    if ( (typeof this.args.buttonCancel === 'undefined') || (this.args.buttonCancel === true) ) {
      lbl = (this.args.buttonCancelLabel || OSjs._('Cancel'));
      this.buttonCancel = this._addGUIElement(new OSjs.GUI.Button('Cancel', {label: lbl, onClick: function(el, ev) {
        if ( !this.isDisabled() ) {
          self.onCancelClick(ev);
        }
      }}), this.$element);
    }

    if ( (typeof this.args.buttonOk === 'undefined') || (this.args.buttonOk === true) ) {
      lbl = (this.args.buttonOkLabel || OSjs._('OK'));
      this.buttonConfirm = this._addGUIElement(new OSjs.GUI.Button('OK', {label: lbl, onClick: function(el, ev) {
        if ( !this.isDisabled() ) {
          self.onConfirmClick.call(self, ev);
        }
      }}), this.$element);
    }

    root.appendChild(this.$element);
    return root;
  };

  StandardDialog.prototype._inited = function() {
    DialogWindow.prototype._inited.apply(this, arguments);
    if ( this.buttonConfirm ) {
      this.buttonConfirm.focus();
    } else {
      if ( this.buttonCancel ) {
        this.buttonCancel.focus();
      }
    }
  };

  StandardDialog.prototype.onCancelClick = function(ev) {
    if ( !this.buttonCancel ) { return; }
    this.end('cancel');
  };

  StandardDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.buttonConfirm ) { return; }
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
   */
  var ErrorDialog = function() {
    this.data = {title: 'No title', message: 'No message', error: ''};

    DialogWindow.apply(this, ['ErrorDialog', {width:400, height:280}]);
    this._icon = 'status/dialog-error.png';
    this._sound = 'dialog-warning';
    this._soundVolume = 1.0;
  };

  ErrorDialog.prototype = Object.create(DialogWindow.prototype);

  ErrorDialog.prototype.init = function(wmRef) {
    var bugData = this.data;
    var self = this;
    this._title = this.data.title;

    var label;

    var root        = DialogWindow.prototype.init.apply(this, arguments);
    root.className += ' ErrorDialog';

    var messagel        = document.createElement('div');
    messagel.className  = OSjs._('Message');
    messagel.innerHTML  = this.data.message;
    root.appendChild(messagel);

    label           = document.createElement('div');
    label.className = 'Label';
    label.innerHTML = OSjs._('Summary');
    root.appendChild(label);

    var messaged = this._addGUIElement(new OSjs.GUI.Textarea('Summary'), root);
    messaged.setValue(this.data.error);

    var exception = this.data.exception;
    if ( exception ) {
      root.className += ' WithTrace';
      var error = '';
      if ( exception.stack ) {
        error = exception.stack;
      } else {
        error = exception.name;
        error += "\nFilename: " + exception.fileName || '<unknown>';
        error += "\nLine: " + exception.lineNumber;
        error += "\nMessage: " + exception.message;
        if ( exception.extMessage ) {
          error += "\n" + exception.extMessage;
        }
      }

      bugData.exceptionDetail = '' + error;

      label           = document.createElement('div');
      label.className = 'Label';
      label.innerHTML = OSjs._('Trace');
      root.appendChild(label);

      var traced = this._addGUIElement(new OSjs.GUI.Textarea('Trace'), root);
      traced.setValue(error);
    }

    var ok = this._addGUIElement(new OSjs.GUI.Button('OK', {label: OSjs._('Close'), onClick: function() {
      self._close();
    }}), root);

    if ( this.data.bugreport ) {
      var _onBugError = function(error) {
        alert("Bugreport failed: " + error); // FIXME
      };
      var _onBugSuccess = function() {
        alert("The error was reported and will be looked into"); // FIXME
        ok.onClick();
      };

      var sendBug = this._addGUIElement(new OSjs.GUI.Button('Bug', {label: OSjs._('Bugreport'), onClick: function() {
        OSjs.API.call('bugreport', {data: bugData}, function(res) {
          if ( res ) {
            if ( res.result ) {
              _onBugSuccess();
              return;
            } else if ( res.error ) {
              _onBugError(res.error);
              return;
            }
          }
          _onBugError("Something went wrong during reporting. You can mail it to andersevenrud@gmail.com"); // FIXME
        }, function(error) {
          _onBugError(error);
        });
      }}), root);
    }
  };

  ErrorDialog.prototype.setError = function(title, message, error, exception, bugreport) {
    this.data = {title: title, message: message, error: error, exception: exception, bugreport: bugreport};
  };

  ErrorDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === 27 ) {
      this._close();
    }
  };

  /**
   * Application Chooser Dialog
   */
  var ApplicationChooserDialog = function(filename, mime, list, onClose) {
    this.filename     = OSjs.Utils.filename(filename);
    this.mime         = mime;
    this.list         = list;
    this.selectedApp  = null;
    this.useDefault   = false;

    var msg = ([OSjs._("Choose an application to open"), "<br />" ,OSjs.Utils.format("<span>{0}</span>", this.filename), OSjs.Utils.format("({0})", this.mime)]).join(" ");
    StandardDialog.apply(this, ['ApplicationChooserDialog', {title: OSjs._("Choose Application"), message: msg}, {width:400, height:360}, onClose]);
  };

  ApplicationChooserDialog.prototype = Object.create(StandardDialog.prototype);

  ApplicationChooserDialog.prototype.destroy = function(wm) {
    StandardDialog.prototype.destroy.apply(this, arguments);
  };

  ApplicationChooserDialog.prototype.onConfirmClick = function(ev, val) {
    if ( !this.buttonConfirm ) { return; }
    /*var*/ val  = this.selectedApp;
    if ( !val ) {
      var wm = OSjs.API.getWMInstance();
      if ( wm ) {
        var d = new AlertDialog(OSjs._("You need to select an application"));
        wm.addWindow(d);
        this._addChild(d);
      }
      return;
    }
    this.end('ok', val, this.useDefault);
  };

  ApplicationChooserDialog.prototype.init = function(wm) {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);
    var container = this.$element;
    var list = [];
    var refs = OSjs.API.getHandlerInstance().getApplicationsMetadata();

    var _createIcon = function(icon, appname) {
      return OSjs.API.getIcon(icon, appname);
    };

    var image, icon, name, iter;
    for ( var i = 0, l = this.list.length; i < l; i++ ) {
      name = this.list[i];
      icon = null;
      if ( refs[this.list[i]] ) {
        iter = refs[this.list[i]];
        if ( iter ) {
          name = OSjs.Utils.format("{0} - {1}", (iter.name || name), (iter.description || '<no description>')); // FIXME
          icon = _createIcon(iter.icon, iter.path);
        }
      }

      list.push({
        key:   this.list[i],
        image: icon,
        name:  name
      });
    }

    var listView = this._addGUIElement(new OSjs.GUI.ListView('ApplicationChooserDialogListView'), container);
    listView.setColumns([
      {key: 'image', title: '', type: 'image', domProperties: {width: "16"}},
      {key: 'name',  title: OSjs._('Name')},
      {key: 'key',   title: 'Key', visible: false}
     ]);
    listView.onActivate = function(ev, el, item) {
      if ( item && item.key ) {
        self.selectedApp = item.key;
        self.buttonConfirm.setDisabled(false);
        self.end('ok', item.key, self.useDefault);
      }
    };
    listView.onSelect = function(ev, el, item) {
      if ( item && item.key ) {
        self.selectedApp = item.key;
        self.buttonConfirm.setDisabled(false);
      }
    };

    this.buttonConfirm.setDisabled(true);

    listView.setRows(list);
    listView.render();

    this._addGUIElement(new OSjs.GUI.Checkbox('ApplicationChooserDefault', {label: OSjs._('Use as default application for {0}', this.mime), value: this.useDefault, onChange: function(el, ev, value) {
      self.useDefault = value ? true : false;
    }}), container);

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // FILES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * File Progress dialog
   */
  var FileProgressDialog = function(title) {
    DialogWindow.apply(this, ['FileProgressDialog', {width:400, height:120}]);

    this.$desc                    = null;
    this._title                   = title || OSjs._("File Operation Progress");
    this._properties.allow_close  = false;
    this._icon                    = 'actions/document-send.png';
  };

  FileProgressDialog.prototype = Object.create(DialogWindow.prototype);

  FileProgressDialog.prototype.destroy = function() {
    DialogWindow.prototype.destroy.apply(this, arguments);
  };

  FileProgressDialog.prototype.init = function() {
    DialogWindow.prototype.init.apply(this, arguments);

    var self = this;
    var root = this._$root;

    var el          = document.createElement('div');
    el.className    = 'FileProgressDialog';

    var desc        = document.createElement('div');
    desc.className  = 'Description';
    desc.innerHTML  = OSjs._('Loading...');


    el.appendChild(desc);
    this._addGUIElement(new OSjs.GUI.ProgressBar('FileProgressBar', 0), el);
    root.appendChild(el);

    this.$desc = desc;
  };

  FileProgressDialog.prototype.setDescription = function(d) {
    if ( !this.$desc ) { return; }
    this.$desc.innerHTML = d;
  };

  FileProgressDialog.prototype.setProgress = function(p) {
    var el = this._getGUIElement('FileProgressBar');
    if ( el ) {
      el.setPercentage(p);
    }
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

    var maxSize = OSjs.API.getHandlerInstance().getConfig('Core').MaxUploadSize;
    var msg = OSjs._('Upload file to <span>{0}</span>.<br />Maximum size: {1} bytes', this.dest, maxSize);
    StandardDialog.apply(this, ['FileUploadDialog', {title: OSjs._("Upload Dialog"), message: msg, buttonOk: false}, {width:400, height:140}, onClose]);
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
    if ( this.buttonCancel && (this.buttonCancel.isDisabled()) ) {
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
    this.buttonCancel.setDisabled(true);

    this.dialog = this._wmref.addWindow(new FileProgressDialog(OSjs._("Uploading file...")));
    this.dialog.setDescription(OSjs._("Uploading '{0}' ({1} {2}) to {3}" + file.name, file.type, size, this.dest));
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
      if ( self.dialog ) {
        self.dialog._focus();
      }
    }, 100);
  };

  FileUploadDialog.prototype.onFileSelected = function(evt, file) {
    console.info("FileUploadDialog::onFileSelected()", evt, file);
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
    console.info("FileUploadDialog::onUploadComplete()");

    this.buttonCancel.setDisabled(false);
    this.end('complete', this.uploadName, this.uploadMime, this.uploadSize);
  };

  FileUploadDialog.prototype.onUploadFailed = function(evt, error) {
    console.info("FileUploadDialog::onUploadFailed()");
    if ( error ) {
      this._error(OSjs._("Upload failed"), OSjs._("The upload has failed"), error);
    } else {
      this._error(OSjs._("Upload failed"), OSjs._("The upload has failed"), OSjs._("Reason unknown..."));
    }
    this.buttonCancel.setDisabled(false);
    this.end('fail', error);
  };

  FileUploadDialog.prototype.onUploadCanceled = function(evt) {
    console.info("FileUploadDialog::onUploadCanceled()");
    this._error(OSjs._("Upload failed"), OSjs._("The upload has failed"), OSjs._("Cancelled by user..."));
    this.buttonCancel.setDisabled(false);
    this.end('cancelled', evt);
  };

  FileUploadDialog.prototype._error = function() {
    OSjs.API.error.apply(this, arguments); // Because this window may close automatically, and that will remove errors
  };

  /**
   * File Dialog Class
   */
  var FileDialog = function(args, onClose) {
    args = args || {};

    this.currentPath      = args.path             || OSjs.API.getDefaultPath('/');
    this.currentFilename  = args.filename         || '';
    this.defaultFilename  = args.defaultFilename  || '';
    this.type             = args.type             || 'open';
    this.mime             = args.mime             || null;
    this.allowMimes       = args.mimes            || null;
    this.select           = args.select           || 'file';
    this.input            = null;

    var self = this;

    var errors = 0;
    this.onError          = function(err, dirname, fatal) {
      if ( err ) {
        if ( !fatal ) {
          if ( errors < 2 ) {
            var fileList = self._getGUIElement('FileDialogFileView');
            if ( fileList ) {
              fileList.chdir(OSjs.API.getDefaultPath('/'));
            }
          } else {
            errors = 0;
          }
          errors++;
        }
        self._error(OSjs._("FileDialog Error"), OSjs._("Failed listing directory '{0}' because an error occured", dirname), err);
      }
    };

    var title     = OSjs._(this.type == "save" ? "Save" : "Open");
    var className = this.type == "save" ? 'FileSaveDialog' : 'FileOpenDialog';

    StandardDialog.apply(this, [className, {title: title}, {width:600, height:380}, onClose]);

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

    var typeFilter = this.select === 'path' ? 'dir' : null;
    var fileList = this._addGUIElement(new OSjs.GUI.FileView('FileDialogFileView', {mimeFilter: this.allowMimes, typeFilter: typeFilter}), this.$element);
    fileList.onError = function() {
      self._toggleLoading(false);
      self.onError.apply(this, arguments);
    };

    var statusBar = this._addGUIElement(new OSjs.GUI.StatusBar('FileDialogStatusBar'), this.$element);
    statusBar.setText("");

    if ( this.type === 'save' ) {
      var start = true;
      var curval = OSjs.Utils.escapeFilename(this.currentFilename ? this.currentFilename : this.defaultFilename);

      this.input = this._addGUIElement(new OSjs.GUI.Text('FileName', {value: curval, onKeyPress: function(el, ev) {
        self.buttonConfirm.setDisabled(el.value.length <= 0);
        if ( ev.keyCode === 13 ) {
          self.buttonConfirm.onClick(ev);
          return;
        }
      }}), this.$element);

      fileList.onFinished = function() {
        statusBar.setText(fileList.getPath());
        self._toggleLoading(false);
        if ( start ) {
          if ( self.currentFilename ) {
            fileList.setSelected(self.currentFilename, 'filename');
          }
        }
        start = false;
      };

      fileList.onRefresh = function() {
        //self.buttonConfirm.setDisabled(true);

        statusBar.setText(fileList.getPath());
        self._toggleLoading(true);
        if ( start ) {
          self.input.setValue(curval);
        } else {
          self.input.setValue('');
        }
      };

      fileList.onSelected = function(item) {
        if ( !item || item.type == 'dir' ) {
          self.input.setValue('');
        } else {
          self.input.setValue(item.filename);
        }
      };

    } else {
      if ( this.select === 'file' ) {
        this.buttonConfirm.setDisabled(true);
      }

      fileList.onSelected = function(item) {
        if ( item ) {
          if ( this.select === 'path' ) {
            if ( item.type == 'dir' || (this.select === 'file' && item.type != 'dir' && item.filename !== '..') ) {
              self.buttonConfirm.setDisabled(false);
            }
          } else {
            if ( item.type === 'file' ) {
              self.buttonConfirm.setDisabled(false);
            }
          }
        }
      };

      fileList.onFinished = function() {
        statusBar.setText(fileList.getPath());
        self._toggleLoading(false);
      };
      fileList.onRefresh = function() {
        statusBar.setText(fileList.getPath());
        self._toggleLoading(true);

        if ( self.select === 'file' ) {
          self.buttonConfirm.setDisabled(true);
        }
      };
    }

    fileList.onActivated = function(path, type, mime) {
      if ( self.select === 'file' && type === 'file' ) {
        self.buttonConfirm.setDisabled(false);

        if ( self.type === 'save' ) {
          if ( confirm(OSjs._("Are you sure you want to overwrite the file '{0}'?", OSjs.Utils.filename(path))) ) { // FIXME
            self.dialogOK.call(self, path, mime);
          }
        } else {
          self.dialogOK.call(self, path, mime);
        }
      } else if ( self.select === 'path' && type === 'dir' && OSjs.Utils.filename(path) != '..' ) {
        self.buttonConfirm.setDisabled(false);
      }
    };

    return root;
  };

  FileDialog.prototype._inited = function() {
    StandardDialog.prototype._inited.apply(this, arguments);

    var fileList = this._getGUIElement('FileDialogFileView');
    if ( fileList ) {
      fileList.chdir(this.currentPath);
    }
  };

  FileDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.buttonConfirm ) { return; }
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
        var check = this.input ? check = OSjs.Utils.escapeFilename(this.input.getValue()) : '';
        if ( check ) {
          item = fileList.$view.getItemByKey('filename', check);
          if ( item !== null ) {
            if ( confirm(OSjs._("The file '{0}' already exists. Overwrite?", check)) ) { // FIXME
              mime = item.getAttribute('data-mime');
              curr = item.getAttribute('data-path');
            } else {
              return;
            }
          }
        }

        if ( !mime && check ) { mime = this.mime; }
        if ( !curr && check ) { curr = fileList.getPath() + '/' + check; }
      } else {
        if ( this.select === 'path' ) {
          item =  fileList.getSelected();
          if ( item !== null ) {
            mime = item.mime;
            curr = item.path;
          } else {
            curr = fileList.getPath();
            mime = null;
          }
        } else {
          item =  fileList.getSelected();
          if ( item !== null ) {
            mime = item.mime;
            curr = item.path;
          }
        }
      }
    }

    if ( curr ) {
      this.end('ok', curr, mime);
    } else {
      var wm = OSjs.API.getWMInstance();
      if ( wm ) {
        var dwin;
        if ( this.type === 'save' ) {
          dwin = new AlertDialog(OSjs._('You need to select a file or enter new filename!'));
        } else {
          dwin = new AlertDialog(OSjs._('You need to select a file!'));
        }
        wm.addWindow(dwin);
        this._addChild(dwin);
      }
    }
  };

  FileDialog.prototype._focus = function() {
    StandardDialog.prototype._focus.apply(this, arguments);
    if ( this.input ) {
      this.input.focus();

      var val = this.input.getValue();
      var range = {
        min: 0,
        max: val.length - 1
      };

      if ( val.match(/\.(\w+)$/) ) {
        var m = val.split(/\.(\w+)$/);
        if ( m ) {
          range.max -= (m.length);
        }
      }

      this.input.select(range);
    }
  };

  /**
   * File Information Dialog
   */
  var FileInformationDialog = function(path, onClose) {
    this.path = path;
    onClose = onClose || function() {};
    StandardDialog.apply(this, ['FileInformationDialog', {title: OSjs._("File Information"), buttonCancel: false, buttonOkLabel: OSjs._("Close")}, {width:300, height:400}, onClose]);
  };
  FileInformationDialog.prototype = Object.create(StandardDialog.prototype);

  FileInformationDialog.prototype.init = function() {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);

    var desc = OSjs._("Loading file information for: {0}", this.path);
    var txt = this._addGUIElement(new OSjs.GUI.Textarea('FileInformationTextarea', {disabled: true, value: desc}), this.$element);

    var _onError = function(err) {
      var fname = OSjs.Utils.filename(self.path);
      self._error(OSjs._("FileInformationDialog Error"), OSjs._("Failed to get file information for <span>{0}</span>", fname), err);
      txt.setValue(OSjs._("Failed to get file information for: {0}", self.path));
    };

    var _onSuccess = function(data) {
      var info = [];
      for ( var i in data ) {
        if ( data.hasOwnProperty(i) ) {
          if ( i === 'exif' ) {
            info.push(i + ":\n\n" + data[i]);
          } else {
            info.push(i + ":\n\t" + data[i]);
          }
        }
      }
      txt.setValue(info.join("\n\n"));
    };

    OSjs.API.call('fs', {method: 'fileinfo', 'arguments' : [this.path]}, function(res) {
      if ( res ) {
        if ( res.error ) {
          _onError(res.error);
          return;
        }
        if ( res.result ) {
          _onSuccess(res.result);
        }
      }
    }, function(error) {
      _onError(error);
    });

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // STANDARD
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Alert/Message Dialog
   */
  var AlertDialog = function(msg, onClose) {
    StandardDialog.apply(this, ['AlertDialog', {title: OSjs._("Alert Dialog"), message: msg, buttonCancel: false, buttonOkLabel: OSjs._("Close")}, {width:250, height:100}, onClose]);
    this._icon = 'status/dialog-warning.png';
  };
  AlertDialog.prototype = Object.create(StandardDialog.prototype);

  /**
   * Confirmation Dialog
   */
  var ConfirmDialog = function(msg, onClose) {
    StandardDialog.apply(this, ['ConfirmDialog', {title: OSjs._("Confirm Dialog"), message: msg}, {width:350, height:120}, onClose]);
    this._icon = 'status/dialog-question.png';
  };
  ConfirmDialog.prototype = Object.create(StandardDialog.prototype);

  /**
   * Input Dialog
   */
  var InputDialog = function(msg, val, onClose) {
    StandardDialog.apply(this, ['InputDialog', {title: OSjs._("Input Dialog"), message: msg}, {width:300, height:150}, onClose]);
    this._icon = 'status/dialog-information.png';

    this.value = val || '';
    this.input = null;
  };

  InputDialog.prototype = Object.create(StandardDialog.prototype);

  InputDialog.prototype.init = function() {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);

    var inputd = document.createElement('div');

    this.input = this._addGUIElement(new OSjs.GUI.Text('TextInput', {value: this.value, onKeyPress: function(el, ev) {
      if ( ev.keyCode === 13 ) {
        self.buttonConfirm.onClick(ev);
        return;
      }
    }}), inputd);
    this.$element.appendChild(inputd);
    return root;
  };

  InputDialog.prototype._focus = function() {
    StandardDialog.prototype._focus.apply(this, arguments);
    if ( this.input ) {
      this.input.focus();
      this.input.select();
    }
  };

  InputDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.buttonConfirm ) { return; }
    this.end('ok', this.input.getValue());
  };


  /////////////////////////////////////////////////////////////////////////////
  // OTHER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Color Dialog
   */
  var ColorDialog = function(opts, onClose) {
    opts = opts || {};
    if ( typeof opts.alpha === 'undefined' ) {
      opts.alpha = 1.0;
    }

    StandardDialog.apply(this, ['ColorDialog', {title: OSjs._("Color Dialog")}, {width:450, height:270}, onClose]);
    this._icon = 'apps/gnome-settings-theme.png';

    if ( typeof opts.color === 'object' ) {
      this.currentRGB = opts.color;
    } else {
      this.currentRGB = OSjs.Utils.HEXtoRGB(opts.color || '#ffffff');
    }
    this.showAlpha    = opts.showAlpha ? true : false;
    this.currentAlpha = opts.alpha * 100;
    this.$color       = null;
  };

  ColorDialog.prototype = Object.create(StandardDialog.prototype);

  ColorDialog.prototype.init = function() {
    var self  = this;
    var root  = StandardDialog.prototype.init.apply(this, arguments);
    var color = this.currentRGB;

    var el        = document.createElement('div');
    el.className  = 'ColorDialog';

    var sliders       = document.createElement('div');
    sliders.className = 'ColorSliders';

    var label       = document.createElement('div');
    label.className = 'Label LabelR';
    label.innerHTML = OSjs._('Red: {0}', 0);
    sliders.appendChild(label);
    this._addGUIElement(new OSjs.GUI.Slider('SliderR', {min: 0, max: 255, val: color.r}, function(value, percentage) {
      self.setColor(value, self.currentRGB.g, self.currentRGB.b);
    }), sliders);

    label           = document.createElement('div');
    label.className = 'Label LabelG';
    label.innerHTML = OSjs._('Green: {0}', 0);
    sliders.appendChild(label);
    this._addGUIElement(new OSjs.GUI.Slider('SliderG', {min: 0, max: 255, val: color.g}, function(value, percentage) {
      self.setColor(self.currentRGB.r, value, self.currentRGB.b);
    }), sliders);

    label           = document.createElement('div');
    label.className = 'Label LabelB';
    label.innerHTML = OSjs._('Blue: {0}', 0);
    sliders.appendChild(label);
    this._addGUIElement(new OSjs.GUI.Slider('SliderB', {min: 0, max: 255, val: color.b}, function(value, percentage) {
      self.setColor(self.currentRGB.r, self.currentRGB.g, value);
    }), sliders);

    if ( this.showAlpha ) {
      label           = document.createElement('div');
      label.className = 'Label LabelA';
      label.innerHTML = OSjs._('Alpha: {0}', 0);
      sliders.appendChild(label);
      this._addGUIElement(new OSjs.GUI.Slider('SliderA', {min: 0, max: 100, val: this.currentAlpha}, function(value, percentage) {
        self.setColor(self.currentRGB.r, self.currentRGB.g, self.currentRGB.b, value);
      }), sliders);
    }

    this.$color           = document.createElement('div');
    this.$color.className = 'ColorSelected';

    this._addGUIElement(new OSjs.GUI.ColorSwatch('ColorDialogColorSwatch', 200, 200, function(r, g, b) {
      self.setColor(r, g, b);
    }), this.$element);

    this.$element.appendChild(sliders);
    this.$element.appendChild(this.$color);

    var rgb = this.currentRGB;
    this.setColor(rgb.r, rgb.g, rgb.b, this.currentAlpha);
  };

  ColorDialog.prototype.setColor = function(r, g, b, a) {
    this.currentAlpha = (typeof a === 'undefined' ? this.currentAlpha : a);
    this.currentRGB   = {r:r, g:g, b:b};

    this.$color.style.background = 'rgb(' + ([r, g, b]).join(',') + ')';

    this._getGUIElement('SliderR').setValue(r);
    this.$element.getElementsByClassName('LabelR')[0].innerHTML = OSjs._('Red: {0}', r);

    this._getGUIElement('SliderG').setValue(g);
    this.$element.getElementsByClassName('LabelG')[0].innerHTML = OSjs._('Green: {0}', g);

    this._getGUIElement('SliderB').setValue(b);
    this.$element.getElementsByClassName('LabelB')[0].innerHTML = OSjs._('Blue: {0}', b);

    if ( this.showAlpha ) {
      var ca = (this.currentAlpha/100);
      this._getGUIElement('SliderA').setValue(this.currentAlpha);
      this.$element.getElementsByClassName('LabelA')[0].innerHTML = OSjs._('Alpha: {0}', ca);
    }

  };

  ColorDialog.prototype.onCancelClick = function(ev) {
    if ( !this.buttonCancel ) { return; }
    this.end('cancel', null, null);
  };

  ColorDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.buttonConfirm ) { return; }
    this.end('ok', this.currentRGB, OSjs.Utils.RGBtoHEX(this.currentRGB), (this.currentAlpha/100));
  };

  /**
   * Font Dialog
   */
  var FontDialog = function(args, onClose) {
    args = args || {};
    this.fontName   = args.name       || OSjs.API.getHandlerInstance().getConfig('Fonts')['default'];
    this.fontSize   = args.size       || 12;
    this.background = args.background || '#ffffff';
    this.color      = args.color      || '#000000';
    this.fonts      = args.list       || OSjs.API.getHandlerInstance().getConfig('Fonts').list;
    this.sizeType   = args.sizeType   || 'px';
    this.text       = args.text       || 'The quick brown fox jumps over the lazy dog';

    this.minSize    = typeof args.minSize === 'undefined' ? 6  : args.minSize;
    this.maxSize    = typeof args.maxSize === 'undefined' ? 30 : args.maxSize;

    this.$selectFonts = null;
    this.$selectSize  = null;

    StandardDialog.apply(this, ['FontDialog', {title: OSjs._("Font Dialog")}, {width:450, height:270}, onClose]);
  };

  FontDialog.prototype = Object.create(StandardDialog.prototype);

  FontDialog.prototype.updateFont = function(name, size) {
    var rt = this._getGUIElement('GUIRichText');

    if ( name !== null && name ) {
      this.fontName = name;
    }
    if ( size !== null && size ) {
      this.fontSize = size << 0;
    }

    var styles = [];
    if ( this.sizeType == 'internal' ) {
      styles = [
        'font-family: ' + this.fontName,
        'background: '  + this.background,
        'color: '       + this.color
      ];
      rt.setContent('<font size="' + this.fontSize + '" style="' + styles.join(";") + '">' + this.text + '</font>');
    } else {
      styles = [
        'font-family: ' + this.fontName,
        'font-size: '   + this.fontSize + 'px',
        'background: '  + this.background,
        'color: '       + this.color
      ];
      rt.setContent('<div style="' + styles.join(";") + '">' + this.text + '</div>');
    }
  };

  FontDialog.prototype.init = function() {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);
    var option;

    var rt = this._addGUIElement(new OSjs.GUI.RichText('GUIRichText'), this.$element);

    this.$selectFont = document.createElement('select');
    this.$selectFont.className = 'SelectFont';
    this.$selectFont.setAttribute("size", "7");

    for ( var f = 0; f < this.fonts.length; f++ ) {
      option            = document.createElement('option');
      option.value      = f;
      option.appendChild(document.createTextNode(this.fonts[f]));
      this.$selectFont.appendChild(option);
      if ( this.fontName.toLowerCase() == this.fonts[f].toLowerCase() ) {
        this.$selectFont.selectedIndex = f;
      }
    }

    this._addEvent(this.$selectFont, 'onchange', function(ev) {
      var i = this.selectedIndex;
      if ( self.fonts[i] ) {
        self.updateFont(self.fonts[i], null);
      }
    });

    this.$element.appendChild(this.$selectFont);

    if ( this.maxSize > 0 ) {
      this.$selectSize = document.createElement('select');
      this.$selectSize.className = 'SelectSize';
      this.$selectSize.setAttribute("size", "7");

      var i = 0;
      for ( var s = this.minSize; s <= this.maxSize; s++ ) {
        option            = document.createElement('option');
        option.value      = s;
        option.innerHTML  = s;
        this.$selectSize.appendChild(option);
        if ( this.fontSize == s ) {
          this.$selectSize.selectedIndex = i;
        }
        i++;
      }

      this._addEvent(this.$selectSize, 'onchange', function(ev) {
        var i = this.selectedIndex;
        var o = this.options[i];
        if ( o ) {
          self.updateFont(null, o.value);
        }
      });

      this.$element.appendChild(this.$selectSize);
    } else {
      this.$element.className += ' NoFontSizes';
    }

    return root;
  };

  FontDialog.prototype._inited = function() {
    StandardDialog.prototype._inited.apply(this, arguments);
    this.updateFont();
  };

  FontDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.buttonConfirm ) { return; }
    this.end('ok', this.fontName, this.fontSize);
  };

  //
  // EXPORTS
  //
  OSjs.Dialogs._StandardDialog    = StandardDialog;
  OSjs.Dialogs.File               = FileDialog;
  OSjs.Dialogs.FileProgress       = FileProgressDialog;
  OSjs.Dialogs.FileUpload         = FileUploadDialog;
  OSjs.Dialogs.FileInfo           = FileInformationDialog;
  OSjs.Dialogs.ErrorMessage       = ErrorDialog;
  OSjs.Dialogs.Alert              = AlertDialog;
  OSjs.Dialogs.Confirm            = ConfirmDialog;
  OSjs.Dialogs.Input              = InputDialog;
  OSjs.Dialogs.Color              = ColorDialog;
  OSjs.Dialogs.Font               = FontDialog;
  OSjs.Dialogs.ApplicationChooser = ApplicationChooserDialog;

})(OSjs.Core.DialogWindow, OSjs.GUI);
