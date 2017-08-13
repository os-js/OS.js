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
import FileMetadata from 'vfs/file';
import Window from 'core/window';
import DialogWindow from 'core/dialog';
import {_} from 'core/locales';

/////////////////////////////////////////////////////////////////////////////
// Default Application Window Helper
/////////////////////////////////////////////////////////////////////////////

/**
 * This is a helper to more easily create an application.
 *
 * Use in combination with 'DefaultApplication'
 *
 * @desc Helper for making Applications with file interaction.
 */
export default class DefaultApplicationWindow extends Window {

  constructor(name, args, app, file) {
    super(...arguments);
    this.hasClosingDialog = false;
    this.currentFile = file ? new FileMetadata(file) : null;
    this.hasChanged = false;
  }

  /*
   * Destroy
   */
  destroy() {
    super.destroy(...arguments);
    this.currentFile = null;
  }

  /*
   * Initialize
   */
  init(wm, app) {
    const root = super.init(...arguments);
    return root;
  }

  /*
   * Applies default Window GUI stuff
   */
  _inited() {
    const result = Window.prototype._inited.apply(this, arguments);
    const app = this._app;

    const menuMap = {
      MenuNew: () => {
        app.newDialog(this.currentFile, this);
      },
      MenuSave: () => {
        app.saveDialog(this.currentFile, this);
      },
      MenuSaveAs: () => {
        app.saveDialog(this.currentFile, this, true);
      },
      MenuOpen: () => {
        app.openDialog(this.currentFile, this);
      },
      MenuClose: () => {
        this._close();
      }
    };

    this._find('SubmenuFile').on('select', (ev) => {
      if ( menuMap[ev.detail.id] ) {
        menuMap[ev.detail.id]();
      }
    });

    this._find('MenuSave').set('disabled', true);

    // Load given file
    if ( this.currentFile ) {
      if ( !this._app.openFile(this.currentFile, this) ) {
        this.currentFile = null;
      }
    }

    return result;
  }

  /*
   * On Drag-And-Drop Event
   */
  _onDndEvent(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) {
      return;
    }

    if ( type === 'itemDrop' && item ) {
      const data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._app.openFile(new FileMetadata(data), this);
      }
    }
  }

  /*
   * On Close
   */
  _close() {
    if ( this.hasClosingDialog ) {
      return;
    }

    if ( this.hasChanged ) {
      this.hasClosingDialog = true;
      this.checkHasChanged((discard) => {
        this.hasClosingDialog = false;
        if ( discard ) {
          this.hasChanged = false; // IMPORTANT
          this._close();
        }
      });
      return;
    }

    Window.prototype._close.apply(this, arguments);
  }

  /**
   * Checks if current file has changed
   *
   * @param   {Function}      cb        Callback => fn(discard_changes)
   */
  checkHasChanged(cb) {
    if ( this.hasChanged ) {
      DialogWindow.create('Confirm', {
        buttons: ['yes', 'no'],
        message: _('MSG_GENERIC_APP_DISCARD')
      }, function(ev, button) {
        cb(button === 'ok' || button === 'yes');
      }, {parent: this, modal: true});
      return;
    }

    cb(true);
  }

  /**
   * Show opened/created file
   *
   * YOU SHOULD EXTEND THIS METHOD IN YOUR WINDOW TO ACTUALLY DISPLAY CONTENT
   *
   * @param   {FileMetadata}   file        File
   * @param   {String|Object}  content     File contents
   */
  showFile(file, content) {
    this.updateFile(file);
  }

  /**
   * Updates current view for given File
   *
   * @param   {FileMetadata}       file        File
   */
  updateFile(file) {
    this.currentFile = file || null;
    this.hasChanged = false;

    if ( this._scheme ) {
      this._find('MenuSave').set('disabled', !file);
    }

    if ( file ) {
      this._setTitle(file.filename, true);
    } else {
      this._setTitle();
    }
  }

  /**
   * Gets file data
   *
   * YOU SHOULD IMPLEMENT THIS METHOD IN YOUR WINDOW TO RETURN FILE CONTENTS
   *
   * @return  {*} File contents
   */
  getFileData() {
    return null;
  }

  /**
   * Window key
   */
  _onKeyEvent(ev, type, shortcut) {
    if ( shortcut === 'SAVE' ) {
      this._app.saveDialog(this.currentFile, this, !this.currentFile);
      return false;
    } else if ( shortcut === 'SAVEAS' ) {
      this._app.saveDialog(this.currentFile, this, true);
      return false;
    } else if ( shortcut === 'OPEN' ) {
      this._app.openDialog(this.currentFile, this);
      return false;
    }

    return Window.prototype._onKeyEvent.apply(this, arguments);
  }
}

