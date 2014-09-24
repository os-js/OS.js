/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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
(function(StandardDialog, Utils, API) {
  'use strict';

  function replaceExtension(orig, rep) {
    var spl = orig.split('.');
    spl.pop();
    spl.push(rep);
    return spl.join('.');
  }

  /**
   * Init
   *
   * Arguments:
   *  type                  Dialog type: "open" or "save"
   *  select                Selection type: "file" or "dir"
   *  path                  Current path
   *  filename              Current filename
   *  mime                  Current file MIME
   *  mimes                 Browse filetype filter (defaults to [none] all files)
   *  filetypes             Save filetypes dict (ext => mime)
   *  defaultFilename       Default filename
   *  defaultFilemime       Default filemime (defaults to given MIME)
   */
  var FileDialog = function(args, onClose) {
    args = args || {};

    // Arguments
    this.type             = args.type             || 'open';
    this.path             = args.path;
    this.select           = args.select           || 'file';
    this.filename         = args.filename         || '';
    this.filemime         = args.mime             || '';
    this.filter           = args.mimes            || [];
    this.filetypes        = args.filetypes        || null;
    this.defaultFilename  = args.defaultFilename  || 'New File';
    this.defaultFilemime  = args.defaultFilemime  || this.filemime || '';

    if ( !this.path && this.filename ) {
      if ( this.filename.match(/\//) ) {
        this.path     = Utils.dirname(this.filename);
        this.filename = Utils.filename(this.filename);
      }
    }

    if ( !this.path ) {
      this.path = API.getDefaultPath('/');
    }

    // Stored elements etc.
    this.errors       = 0;
    this.selectedFile = null;
    this.$input       = null;
    this.$fileView    = null;
    this.$statusBar   = null;
    this.$select      = null;

    // Window
    var title     = OSjs._(this.type === 'save' ? 'Save' : 'Open');
    var className = this.type === 'save' ? 'FileSaveDialog' : 'FileOpenDialog';

    StandardDialog.apply(this, [className, {title: title}, {width:600, height:380}, onClose]);

    if ( this.type === 'open' ) {
      this._icon = 'actions/gtk-open.png';
    } else {
      this._icon = 'actions/gtk-save-as.png';
    }
  };

  FileDialog.prototype = Object.create(StandardDialog.prototype);

  /**
   * Destroy
   */
  FileDialog.prototype.destroy = function() {
    StandardDialog.prototype.destroy.apply(this, arguments);
  };

  /**
   * Create
   */
  FileDialog.prototype.init = function() {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);

    this.$fileView = this._addGUIElement(new OSjs.GUI.FileView('FileDialogFileView', {
      mimeFilter: this.filter,
      typeFilter: (this.select === 'path' ? 'dir' : null)
    }), this.$element);
    this.$fileView.onError = function() {
      self.onError.apply(self, arguments);
    };
    this.$fileView.onContextMenu = function(ev) {
      self.createContextMenu(ev);
    };
    this.$fileView.onViewContextMenu = function(ev) {
      self.createContextMenu(ev);
    };
    this.$fileView.onSelected = function(item) {
      self.onFileSelected(item);
    };
    this.$fileView.onFinished = function() {
      self.onFileFinished();
    };
    this.$fileView.onRefresh = function() {
      self.onFileRefresh();
    };
    this.$fileView.onActivated = function(path, type, mime) {
      self.onFileActivated(path, type, mime);
    };

    this.$statusBar = this._addGUIElement(new OSjs.GUI.StatusBar('FileDialogStatusBar'), this.$element);
    this.$statusBar.setText('');

    if ( this.type === 'save' ) {
      var curval = Utils.escapeFilename(this.filename ? this.filename : this.defaultFilename);

      if ( this.filetypes ) {
        var types = {};
        var val;
        var MIMEDescriptions = OSjs.Settings.DefaultConfig().MIME || {};
        for ( var i in this.filetypes ) {
          if ( this.filetypes.hasOwnProperty(i) ) {
            val = this.filetypes[i];
            types[i] = '';

            if ( MIMEDescriptions[val] ) {
              types[i] += MIMEDescriptions[val] + ' ';
            }

            types[i] += val + ' (.' + i + ')';
          }
        }

        this.$select = this._addGUIElement(new OSjs.GUI.Select('FileDialogFiletypeSelect', {onChange: function(sobj, sdom, val) {
          self.onSelectChange(val);
        }}), this.$element);
        this.$select.addItems(types);
        Utils.$addClass(root.firstChild, 'HasFileTypes');
      }

      this.$input = this._addGUIElement(new OSjs.GUI.Text('FileName', {value: curval, onKeyPress: function(ev) {
        self.onInputKey(ev);
        if ( ev.keyCode === Utils.Keys.ENTER ) {
          self.onInputEnter(ev);
          return;
        }
      }, onChange: function(ev) {
        self.onInputKey(ev);
      }, onKeyUp: function(ev) {
        self.onInputKey(ev);
      }}), this.$element);
    }

    return root;
  };

  /**
   * Window has been displayed
   */
  FileDialog.prototype._inited = function() {
    StandardDialog.prototype._inited.apply(this, arguments);

    // Force override of default MIME if we have a selector
    if ( this.filetypes && this.$select ) {
      for ( var i in this.filetypes ) {
        if ( this.filetypes.hasOwnProperty(i) ) {
          this.filemime = i;
          this.defaultFilemime = i;
          break;
        }
      }
    }

    if ( this.$fileView ) {
      this.$fileView.chdir(this.path);
    }

    if ( this.buttonConfirm ) {
      if ( this.type === 'save' && this.$input && this.$input.getValue() ) {
        this.buttonConfirm.setDisabled(false);
      }
    }

    this.highlightFilename();
  };

  /**
   * Window has been focused
   */
  FileDialog.prototype._focus = function() {
    StandardDialog.prototype._focus.apply(this, arguments);

    this.highlightFilename();
  };

  /**
   * File has been chosen
   */
  FileDialog.prototype.finishDialog = function(path, mime) {
    var self = this;

    function _getSelected() {
      var result = '';

      if ( this.select === 'path' ) {
        result = this.selectedFile;
      } else {
        if ( this.$fileView ) {
          var root = this.$fileView.getPath();
          if ( this.$input ) {
            result = root + '/' + this.$input.getValue();
          } else {
            result = this.selectedFile;
          }
        }
      }

      return result;
    }

    mime = mime || this.defaultFilemime;
    path = path || _getSelected.call(this);

    function _confirm() {
      var wm = API.getWMInstance();
      if ( wm ) {
        this._toggleDisabled(true);
        var conf = new OSjs.Dialogs.Confirm(OSjs._('Are you sure you want to overwrite the file \'{0}\'?', Utils.filename(path)), function(btn) {
          self._toggleDisabled(false);
          if ( btn === 'ok' ) {
            self.end('ok', path, mime);
          }
        });
        wm.addWindow(conf);
        this._addChild(conf);
      }
    }

    if ( this.type === 'open' ) {
      this.end('ok', path, mime);
    } else {
      API.call('fs', {method: 'exists', 'arguments' : [path]}, function(res) {
        res = res || {};

        if ( res.error ) {
          self.onError((res.error || 'Failed to stat file'), path);
          return;
        }

        if ( res.result ) {
          _confirm.call(self);
        } else {
          self.end('ok', path, mime);
        }
      }, function(error) {
        self.onError(error, path);
      });
    }
  };

  /**
   * Highlights the filename in input
   */
  FileDialog.prototype.highlightFilename = function() {
    if ( this.$input ) {
      this.$input.focus();

      var val = this.$input.getValue();
      var range = {
        min: 0,
        max: val.length
      };

      if ( val.match(/\.(\w+)$/) ) {
        var m = val.split(/\.(\w+)$/);
        for ( var i = m.length - 1; i >= 0; i-- ) {
          if ( m[i].length ) {
            range.max = val.length - m[i].length - 1;
            break;
          }
        }
      }

      this.$input.select(range);
    }
  };

  FileDialog.prototype.checkInput = function() {
    if ( this.type !== 'save' ) { return; }
    if ( !this.buttonConfirm ) { return; }

    if ( this.$input.getValue().length ) {
      this.buttonConfirm.setDisabled(false);
    } else {
      this.buttonConfirm.setDisabled(true);
    }
  };

  /**
   * Create Context Menu
   */
  FileDialog.prototype.createContextMenu = function(ev) {
    var self = this;
    var fileList = this.$fileView;
    if ( !fileList ) { return; }
    var viewType = fileList.viewType || '';

    OSjs.GUI.createMenu([
      {name: 'ListView', title: OSjs._('View type'), menu: [
        {name: 'ListView', title: OSjs._('List View'), disabled: (viewType.toLowerCase() === 'listview'), onClick: function() {
          self.onMenuSelect('ListView');
        }},
        {name: 'IconView', title: OSjs._('Icon View'), disabled: (viewType.toLowerCase() === 'iconview'), onClick: function() {
          self.onMenuSelect('IconView');
        }},
        {name: 'TreeView', title: OSjs._('Tree View'), disabled: (viewType.toLowerCase() === 'treeview'), onClick: function() {
          self.onMenuSelect('TreeView');
        }}
      ]}
    ], {x: ev.clientX, y: ev.clientY});
  };

  /**
   * Error wrapper
   */
  FileDialog.prototype.onError = function(err, dirname, fatal) {
    this._toggleLoading(false);

    if ( err ) {
      if ( !fatal ) {
        if ( this.errors < 2 ) {
          if ( this.$fileView ) {
            this.$fileView.chdir(API.getDefaultPath('/'));
          }
        } else {
          this.errors = 0;
        }
        this.errors++;
      }

      this._error(OSjs._('FileDialog Error'), OSjs._('Failed listing directory \'{0}\' because an error occured', dirname), err);
    }
  };

  /**
   * Menu: Item selected
   */
  FileDialog.prototype.onMenuSelect = function(type) {
    if ( this.$fileView ) {
      this.$fileView.setViewType(type);
    }
    this._focus();
  };

  /**
   * FileView: Selection
   */
  FileDialog.prototype.onFileSelected = function(item) {
    var selected = null;

    if ( this.select === 'path' ) {
      if ( item && item.type === 'dir' ) {
        selected = item.path;
      }
    } else {
      if ( item && item.type === 'file' ) {
        selected = item.path;
      }
    }

    if ( this.buttonConfirm ) {
      this.buttonConfirm.setDisabled(selected === null);
    }

    if ( this.$input ) {
      var fname = Utils.filename(selected ? selected : this.defaultFilename);
      this.$input.setValue(Utils.escapeFilename(fname));
    }

    this.selectedFile = selected;
  };

  /**
   * FileView: Refresh Finished
   */
  FileDialog.prototype.onFileFinished = function() {
    if ( this.$statusBar && this.$fileView ) {
      this.path = this.$fileView.getPath();
      this.$statusBar.setText(this.path);
    }
    this._toggleLoading(false);

    if ( this.select === 'path' ) {
      this.selectedFile = this.path; // Dir selection dialog needs to start on default
      this.buttonConfirm.setDisabled(false);
    }

    this.checkInput();
  };

  /**
   * FileView: Refresh
   */
  FileDialog.prototype.onFileRefresh = function() {
    this.selectedFile = null;

    if ( this.$statusBar && this.$fileView ) {
      this.$statusBar.setText(this.$fileView.getPath());
    }
    this._toggleLoading(true);

    if ( this.buttonConfirm ) {
      this.buttonConfirm.setDisabled(true);
    }
  };

  /**
   * FileView: Activated
   */
  FileDialog.prototype.onFileActivated = function(path, type, mime) {
    this.selectedFile = null;

    function _activated() {
      this.buttonConfirm.setDisabled(false);
      this.finishDialog.call(this, path, mime);
    }

    if ( this.select === 'file' && type === 'file' ) {
      _activated.call(this);
    } else if ( this.select === 'path' && type === 'dir' && Utils.filename(path) !== '..' ) {
      _activated.call(this);
    }
  };

  /**
   * Select: Item changed
   */
  FileDialog.prototype.onSelectChange = function(type) {
    this.filemime = this.filetypes[type];

    if ( this.$input ) {
      var newval = replaceExtension(this.$input.getValue(), type);
      this.$input.setValue(newval);
    }

    this.highlightFilename();
  };

  /**
   * Input: key pressed
   */
  FileDialog.prototype.onInputKey = function() {
    this.checkInput();
  };

  /**
   * Input: enter pressed
   */
  FileDialog.prototype.onInputEnter = function(ev) {
    if ( this.buttonConfirm && this.buttonConfirm.getDisabled() ) {
      return;
    }

    this.onConfirmClick(ev);
  };

  /**
   * Button: pressed
   */
  FileDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.buttonConfirm ) { return; }

    var sel = this.$input ? this.$input.getValue() : this.selectedFile;
    if ( !sel ) {
      var wm = API.getWMInstance();
      if ( wm ) {
        var dwin;
        if ( this.type === 'save' ) {
          dwin = new OSjs.Dialogs.Alert(OSjs._('You need to select a file or enter new filename!'));
        } else {
          dwin = new OSjs.Dialogs.Alert(OSjs._('You need to select a file!'));
        }
        wm.addWindow(dwin);
        this._addChild(dwin);
      }
      return;
    }

    this.finishDialog();
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.File               = FileDialog;

})(OSjs.Dialogs.StandardDialog, OSjs.Utils, OSjs.API);
