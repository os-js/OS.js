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
   * TODO: Autodetect MIME on extension (also option to provide)
   * TODO: Disable button if no selection is made (or empty text on save)
   *
   * @extends DialogWindow
   */
  function FileDialog(args, callback) {
    args            = args || {};
    args.file       = args.file || null;
    args.type       = args.type || 'open';
    args.path       = args.path || OSjs.API.getDefaultPath('/');
    args.filename   = args.filename || '';
    args.extension  = args.extension || '';
    args.mime       = args.mime || 'application/octet-stream';
    args.multiple   = args.type === 'save' ? false : args.multiple === true;
    args.multiple   = false;

    if ( args.path && args.path instanceof VFS.File ) {
      args.path = args.path.path;
    }

    if ( args.file && args.file.path ) {
      args.path = Utils.dirname(args.file.path);
      args.filename = args.file.filename;
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
    filename.set('value', this.args.filename || '');

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
          self.selected = new VFS.File(activated.data);
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
          self.selected = new VFS.File(activated.data);

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
      var filename = this.scheme.find(this, 'Filename');
      var input = filename.get('value');
      if ( !this.path || !input ) {
        API.error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_MISSING_FILENAME'));
        return;
      }

      this.selected = new VFS.File(this.path.replace(/^\//, '') + '/' + input, this.args.mime);
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
      if ( !this.selected ) {
        API.error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_MISSING_SELECTION'));
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

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.File = FileDialog;

})(OSjs.API, OSjs.VFS, OSjs.Utils, OSjs.Core.DialogWindow);
