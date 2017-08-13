/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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

/*eslint valid-jsdoc: "off"*/
import Application from 'core/application';
import DialogWindow from 'core/dialog';
import FileMetadata from 'vfs/file';
import * as VFS from 'vfs/fs';
import * as FS from 'utils/fs';
import {_} from 'core/locales';

/////////////////////////////////////////////////////////////////////////////
// Default Application Helper
/////////////////////////////////////////////////////////////////////////////

/**
 * This is a helper to more easily create an application.
 *
 * Handles opening, saving and creation of files.
 *
 * @desc Helper for making Applications with file interaction.
 */
export default class DefaultApplication extends Application {

  constructor(name, args, metadata, opts) {
    super(...arguments);

    this.defaultOptions = Object.assign({}, {
      readData: true,
      rawData: false,
      extension: '',
      mime: 'application/octet-stream',
      filetypes: [],
      filename: 'New file'
    }, opts);
  }

  /*
   * Destroy
   */
  destroy() {
    super.destroy(...arguments);
  }

  /*
   * On Message
   */
  _onMessage(msg, obj, args) {
    super._onMessage(...arguments);

    const current = this._getArgument('file');
    const win = this._getWindow(this.__mainwindow);

    if ( msg === 'vfs' && args.source !== null && args.source !== this.__pid && args.file ) {
      if ( win && current && current.path === args.file.path ) {
        DialogWindow.create('Confirm', {
          buttons: ['yes', 'no'],
          message: _('MSG_FILE_CHANGED')
        }, (ev, button) => {
          if ( button === 'ok' || button === 'yes' ) {
            this.openFile(new FileMetadata(args.file), win);
          }
        }, {parent: win, modal: true});
      }
    }
  }

  /**
   * Open given File
   *
   * @param   {FileMetadata}  file        File
   * @param   {Window}        win         Window reference
   */
  openFile(file, win) {
    if ( !file ) {
      return false;
    }

    const onError = (error) => {
      if ( error ) {
        OSjs.error(this.__label,
                   _('ERR_FILE_APP_OPEN'),
                   _('ERR_FILE_APP_OPEN_ALT_FMT',
                     file.path, error)
        );
        return true;
      }
      return false;
    };

    const onDone = (result) => {
      this._setArgument('file', file);
      win.showFile(file, result);
    };

    const check = this.__metadata.mime || [];
    if ( !FS.checkAcceptMime(file.mime, check) ) {
      OSjs.error(this.__label,
                 _('ERR_FILE_APP_OPEN'),
                 _('ERR_FILE_APP_OPEN_FMT', file.path, file.mime)
      );
      return false;
    }

    win._toggleLoading(true);

    function callbackVFS(error, result) {
      win._toggleLoading(false);
      if ( onError(error) ) {
        return;
      }
      onDone(result);
    }

    if ( this.defaultOptions.readData ) {
      VFS.read(file, {type: this.defaultOptions.rawData ? 'binary' : 'text'}, this)
        .then((res) => callbackVFS(false, res))
        .catch((err) => callbackVFS(err));
    } else {
      VFS.url(file)
        .then((res) => callbackVFS(false, res))
        .catch((err) => callbackVFS(err));
    }

    return true;
  }

  /**
   * Save given File
   *
   * @param   {FileMetadata}  file        File
   * @param   {String|Object} value       File contents
   * @param   {Window}        win         Window reference
   */
  saveFile(file, value, win) {
    if ( !file ) {
      return;
    }

    win._toggleLoading(true);
    VFS.write(file, value || '', null, this).then(() => {
      this._setArgument('file', file);
      win.updateFile(file);
      return true;
    }).catch((error) => {
      OSjs.error(this.__label,
                 _('ERR_FILE_APP_SAVE'),
                 _('ERR_FILE_APP_SAVE_ALT_FMT', file.path, error)
      );

    }).finally(() => {
      win._toggleLoading(false);
    });
  }

  /**
   * Open Save dialog
   *
   * @param   {FileMetadata}       file        File
   * @param   {Window}             win         Window reference
   * @param   {Boolean}            saveAs      SaveAs ?
   * @param   {CallbackDialog}     cb          Called after the user closed the dialog
   */
  saveDialog(file, win, saveAs, cb) {
    const value = win.getFileData();

    if ( !saveAs ) {
      this.saveFile(file, value, win);
      return;
    }

    DialogWindow.create('File', {
      file: file,
      filename: file ? file.filename : this.defaultOptions.filename,
      filetypes: this.defaultOptions.filetypes,
      filter: this.__metadata.mime,
      extension: this.defaultOptions.extension,
      mime: this.defaultOptions.mime,
      type: 'save'
    }, (ev, button, result) => {
      if ( button === 'ok' ) {
        this.saveFile(result, value, win);
      }
      if (typeof cb === 'function') {
        cb(ev, button, result);
      }
    }, {parent: win, modal: true});
  }

  /**
   * Open Open dialog
   *
   * @param   {FileMetadata}   [file]      Current File
   * @param   {Window}         [win]       Window reference
   */
  openDialog(file, win) {

    const openDialog = () => {
      DialogWindow.create('File', {
        file: file,
        filter: this.__metadata.mime
      }, (ev, button, result) => {
        if ( button === 'ok' && result ) {
          this.openFile(new FileMetadata(result), win);
        }
      }, {parent: win, modal: true});
    };

    win.checkHasChanged((discard) => {
      if ( discard ) {
        openDialog();
      }
    });
  }

  /**
   * Create a new file
   *
   * @param   {String}    [path]        Current path
   * @param   {Window}    [win]         Window reference
   */
  newDialog(path, win) {
    win.checkHasChanged((discard) => {
      if ( discard ) {
        this._setArgument('file', null);
        win.showFile(null, null);
      }
    });
  }

}

