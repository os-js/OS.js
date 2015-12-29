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
(function(API, VFS, Utils, DialogWindow) {
  'use strict';

  /**
   * An 'File' dialog
   *
   * @param   args      Object        An object with arguments
   * @param   callback  Function      Callback when done => fn(ev, button, result)
   *
   * @option    args    title       String      Dialog title
   * @option    args    type        String      Dialog type (default=open, alternative=save)
   * @option    args    multiple    boolean     Multiple file selection (default=false)
   * @option    args    file        VFS.File    (Optional) Current file
   * @option    args    path        String      (Optional) Default path
   * @option    args    filename    String      (Optional) Default filename
   * @option    args    extension   String      (Optional) Default file extension
   * @option    args    mime        String      (Optional) Default file MIME
   * @option    args    filter      Array       (Optional) Array of MIMIE filters
   * @option    args    select      String      (Optional) Selection type (file/dir)
   *
   * @extends DialogWindow
   * @class FileDialog
   * @api OSjs.Dialogs.File
   */
  function FileDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      file:       null,
      type:       'open',
      path:       OSjs.API.getDefaultPath(),
      filename:   '',
      filetypes:  [],
      extension:  '',
      mime:       'application/octet-stream',
      filter:     [],
      select:     null,
      multiple:   false
    });

    args.multiple = (args.type === 'save' ? false : args.multiple === true);

    if ( args.path && args.path instanceof VFS.File ) {
      args.path = Utils.dirname(args.path.path);
    }

    if ( args.file && args.file.path ) {
      args.path = Utils.dirname(args.file.path);
      args.filename = args.file.filename;
      args.mime = args.file.mime;

      if ( args.filetypes.length ) {
        var setTo = args.filetypes[0];
        args.filename = Utils.replaceFileExtension(args.filename, setTo.extension);
        args.mime = setTo.mime;
      }
    }

    var title     = API._(args.type === 'save' ? 'DIALOG_FILE_SAVE' : 'DIALOG_FILE_OPEN');
    var icon      = args.type === 'open' ? 'actions/gtk-open.png' : 'actions/gtk-save-as.png';

    DialogWindow.apply(this, ['FileDialog', {
      title: title,
      icon: icon,
      width: 600,
      height: 400
    }, args, callback]);

    this.selected = null;
    this.path = args.path;

    var self = this;
    this.settingsWatch = OSjs.Core.getSettingsManager().watch('VFS', function() {
      self.changePath();
    });
  }

  FileDialog.prototype = Object.create(DialogWindow.prototype);
  FileDialog.constructor = DialogWindow;

  FileDialog.prototype.destroy = function() {
    try {
      OSjs.Core.getSettingsManager().unwatch(this.settingsWatch);
    } catch ( e ) {}
    return DialogWindow.prototype.destroy.apply(this, arguments);
  };

  FileDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var view = this.scheme.find(this, 'FileView');
    view.set('filter', this.args.filter);
    view.set('filetype', this.args.select || '');
    view.set('defaultcolumns', 'true');

    var filename = this.scheme.find(this, 'Filename');
    var home = this.scheme.find(this, 'HomeButton');
    var mlist = this.scheme.find(this, 'ModuleSelect');

    function checkEmptyInput() {
      var disable = false;
      if ( self.args.select !== 'dir' ) {
        disable = !filename.get('value').length;
      }
      self.scheme.find(self, 'ButtonOK').set('disabled', disable);
    }

    this._toggleLoading(true);
    view.set('multiple', this.args.multiple);
    filename.set('value', this.args.filename || '');

    home.on('click', function() {
      var dpath = API.getDefaultPath();
      self.changePath(dpath);
    });

    view.on('activate', function(ev) {
      self.selected = null;
      if ( self.args.type !== 'save' ) {
        filename.set('value', '');
      }

      if ( ev && ev.detail && ev.detail.entries ) {
        var activated = ev.detail.entries[0];
        if ( activated ) {
          self.selected = new VFS.File(activated.data);
          if ( self.selected.type !== 'dir' ) {
            filename.set('value', self.selected.filename);
          }
          self.checkSelection(ev, true);
        }
      }
    });

    view.on('select', function(ev) {
      self.selected = null;
      //filename.set('value', '');

      if ( ev && ev.detail && ev.detail.entries ) {
        var activated = ev.detail.entries[0];
        if ( activated ) {
          self.selected = new VFS.File(activated.data);

          if ( self.selected.type !== 'dir' ) {
            filename.set('value', self.selected.filename);
          }
        }
      }

      checkEmptyInput();
    });

    if ( this.args.type === 'save' ) {
      var filetypes = [];
      this.args.filetypes.forEach(function(f) {
        filetypes.push({
          label: Utils.format('{0} (.{1} {2})', f.label, f.extension, f.mime),
          value: f.extension
        });
      });

      var ft = this.scheme.find(this, 'Filetype').add(filetypes).on('change', function(ev) {
        var newinput = Utils.replaceFileExtension(filename.get('value'), ev.detail);
        filename.set('value', newinput);
      });

      if ( filetypes.length <= 1 ) {
        new OSjs.GUI.Element(ft.$element.parentNode).hide();
      }

      filename.on('enter', function(ev) {
        self.selected = null;
        self.checkSelection(ev);
      });
      filename.on('change', function(ev) {
        checkEmptyInput();
      });
      filename.on('keyup', function(ev) {
        checkEmptyInput();
      });
    } else {
      this.scheme.find(this, 'FileInput').hide();
    }

    var rootPath = VFS.getRootFromPath(this.path);
    var modules = [];
    VFS.getModules().forEach(function(m) {
      modules.push({
        label: m.name + (m.module.readOnly ? Utils.format(' ({0})', API._('LBL_READONLY')) : ''),
        value: m.module.root
      });
    });
    mlist.clear().add(modules).set('value', rootPath);
    mlist.on('change', function(ev) {
      self.changePath(ev.detail, true);
    });

    this.changePath();

    checkEmptyInput();

    return root;
  };

  FileDialog.prototype.changePath = function(dir, fromDropdown) {
    var self = this;
    var view = this.scheme.find(this, 'FileView');
    var lastDir = this.path;

    function resetLastSelected() {
      var rootPath = VFS.getRootFromPath(lastDir);
      self.scheme.find(self, 'ModuleSelect').set('value', rootPath);
    }

    this._toggleLoading(true);


    view._call('chdir', {
      path: dir || this.path,
      done: function(error) {
        if ( error ) {
          if ( fromDropdown ) {
            resetLastSelected();
          }
        } else {
          if ( dir ) {
            self.path = dir;
          }
        }

        self.selected = null;
        self._toggleLoading(false);
      }
    });
  };

  FileDialog.prototype.checkFileExtension = function() {
    var filename = this.scheme.find(this, 'Filename');
    var filetypes = this.scheme.find(this, 'Filetypes');

    var mime = this.args.mime;
    var input = filename.get('value');

    if ( this.args.filetypes.length ) {
      if ( !input && this.args.filename ) {
        input = this.args.filename;
      }

      if ( input.length ) {
        var extension = input.split('.').pop();
        var current = filetypes.get('value');
        var found = false;

        this.args.filetypes.forEach(function(f) {
          if ( f.extension === extension ) {
            found = f;
          }
          return !!found;
        });

        found = found || this.args.filetypes[0];
        input = Utils.replaceFileExtension(input, found.extension);
        mime  = found.mime;
      }
    }

    return {
      filename: input,
      mime: mime
    };
  };

  FileDialog.prototype.checkSelection = function(ev, wasActivated) {
    var self = this;

    if ( this.selected && this.selected.type === 'dir' ) {
      if ( wasActivated ) {
       // this.args.select !== 'dir' && 
        this.changePath(this.selected.path);
        return false;
      }
    }

    if ( this.args.type === 'save' ) {
      var check = this.checkFileExtension();

      if ( !this.path || !check.filename ) {
        API.error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_MISSING_FILENAME'));
        return;
      }

      this.selected = new VFS.File(this.path.replace(/^\//, '') + '/' + check.filename, check.mime);
      this._toggleDisabled(true);

      VFS.exists(this.selected, function(error, result) {
        self._toggleDisabled(false);

        if ( error ) {
          API.error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_MISSING_FILENAME'));
          return;
        }

        if ( result ) {
          self._toggleDisabled(true);
          API.createDialog('Confirm', {
            buttons: ['yes', 'no'],
            message: API._('DIALOG_FILE_OVERWRITE', self.selected.filename)
          }, function(ev, button) {
            self._toggleDisabled(false);

            if ( button === 'yes' || button === 'ok' ) {
              self.closeCallback(ev, 'ok', self.selected);
            }
          }, self);
        } else {
          self.closeCallback(ev, 'ok', self.selected);
        }

      });
    } else {
      if ( !this.selected && this.args.select !== 'dir' ) {
        API.error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_MISSING_SELECTION'));
        return false;
      }

      var res = this.selected;
      if ( !res && this.args.select === 'dir' ) {
        res = new VFS.File({
          filename: Utils.filename(this.path),
          path: this.path,
          type: 'dir'
        });
      }

      this.closeCallback(ev, 'ok', res);
    }

    return true;
  };

  FileDialog.prototype.onClose = function(ev, button) {
    if ( button === 'ok' && !this.checkSelection(ev) ) {
      return;
    }

    this.closeCallback(ev, button, this.selected);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.File = FileDialog;

})(OSjs.API, OSjs.VFS, OSjs.Utils, OSjs.Core.DialogWindow);
