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
(function(StandardDialog) {

  /**
   * File Dialog Class
   */
  var FileDialog = function(args, onClose) {
    args = args || {};

    this.currentPath      = args.path             || OSjs.API.getDefaultPath('/');
    this.currentFilename  = args.filename         || '';
    this.defaultFilename  = args.defaultFilename  || '';
    this.defaultExtension = args.defaultExtension || '';
    this.extensions       = args.extensions       || null;
    this.type             = args.type             || 'open';
    this.mime             = args.mime             || null;
    this.allowMimes       = args.mimes            || null;
    this.select           = args.select           || 'file';
    this.input            = null;

    if ( !this.defaultExtension && this.defaultFilename ) {
      this.defaultExtension = OSjs.Utils.filext(this.defaultFilename);
    }

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

    var openMenu = function(ev) {
      if ( !fileList ) { return; }
      var curr = fileList.viewType;
      var viewMenu = [
        {name: 'ListView', title: OSjs._('List View'), disabled: (curr.toLowerCase() == 'listview'), onClick: function() {
          if ( fileList ) {
            fileList.setViewType('ListView');
          }
          self._focus();
        }},
        {name: 'IconView', title: OSjs._('Icon View'), disabled: (curr.toLowerCase() == 'iconview'), onClick: function() {
          if ( fileList ) {
            fileList.setViewType('IconView');
          }
          self._focus();
        }},
        {name: 'TreeView', title: OSjs._('Tree View'), disabled: (curr.toLowerCase() == 'treeview'), onClick: function() {
          if ( fileList ) {
            fileList.setViewType('TreeView');
          }
          self._focus();
        }}
      ];

      var menu = [
        {name: 'ListView', title: OSjs._('View type'), menu: viewMenu},
      ];

      var pos = {x: ev.clientX, y: ev.clientY};
      OSjs.GUI.createMenu(menu, pos);
    };

    fileList.onError = function() {
      self._toggleLoading(false);
      self.onError.apply(this, arguments);
    };
    fileList.onContextMenu = function(ev) {
      openMenu(ev);
    };
    fileList.onViewContextMenu = function(ev) {
      openMenu(ev);
    };


    if ( this.extensions ) {
      var typeSelect = this._addGUIElement(new OSjs.GUI.Select('FileDialogFiletypeSelect', {onChange: function(sobj, sdom, val) {
        self.changeFileType(val);
      }}), this.$element);
      typeSelect.addItems(this.extensions);
      OSjs.Utils.$addClass(root.firstChild, "HasFileTypes");
    }

    var statusBar = this._addGUIElement(new OSjs.GUI.StatusBar('FileDialogStatusBar'), this.$element);
    statusBar.setText("");

    if ( this.type === 'save' ) {
      var start = true;
      var curval = OSjs.Utils.escapeFilename(this.currentFilename ? this.currentFilename : this.defaultFilename);

      this.input = this._addGUIElement(new OSjs.GUI.Text('FileName', {value: curval, onKeyPress: function(ev) {
        self.buttonConfirm.setDisabled(this.value.length <= 0);
        if ( ev.keyCode === OSjs.Utils.Keys.ENTER ) {
          self.buttonConfirm.onClick(ev);
          return;
        }
      }}), this.$element);
      this.input.onKeyPress = function() {
        self.buttonConfirm.setDisabled(this.getValue().length <= 0);
      };

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

          var wm = OSjs.API.getWMInstance();
          if ( wm ) {
            self._toggleDisabled(true);
            var conf = new OSjs.Dialogs.Confirm(OSjs._("Are you sure you want to overwrite the file '{0}'?", OSjs.Utils.filename(path)), function(btn) {
              self._toggleDisabled(false);
              if ( btn == 'ok' ) {
                self.dialogOK.call(self, path, mime);
              }
            });
            wm.addWindow(conf);
            self._addChild(conf);
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

    var _ok = function(curr, mime) {
      if ( curr ) {
        this.end('ok', curr, mime);
      } else {
        var wm = OSjs.API.getWMInstance();
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
      }
    };


    var curr, item, mime = null;
    if ( forcepath ) {
      curr = forcepath;
      mime = forcemime;
    } else {
      var fileList = this._getGUIElement('FileDialogFileView');
      if ( this.type == 'save' ) {
        var check = this.input ? check = OSjs.Utils.escapeFilename(this.input.getValue()) : '';
        if ( check ) {
          item = fileList.viewRef.getItemByKey('filename', check);
          if ( item !== null ) {
            var wm = OSjs.API.getWMInstance();
            var self = this;
            if ( wm ) {
              self._toggleDisabled(true);
              var conf = new OSjs.Dialogs.Confirm(OSjs._("Are you sure you want to overwrite the file '{0}'?", check), function(btn) {
                self._toggleDisabled(false);
                if ( btn == 'ok' ) {
                  _ok.call(self, item.path, item.mime);
                }
              });
              wm.addWindow(conf);
              this._addChild(conf);
            }

            return;
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

    _ok.call(this, curr, mime);
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

  FileDialog.prototype.changeFileType = function(t) {
    if ( !this.input ) { return; }

    var old = this.input.getValue();
    var oext = OSjs.Utils.filext(old);

    this.input.setValue(old.replace(("." + oext), t));
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.File               = FileDialog;

})(OSjs.Dialogs.StandardDialog);
