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
import DialogWindow from 'core/dialog';
import PackageManager from 'core/package-manager';
import Theme from 'core/theme';
import * as Utils from 'utils/misc';
import {_} from 'core/locales';

/**
 * An 'Application Chooser' dialog
 *
 * @example DialogWindow.create('ApplicationChooser', {}, fn);
 * @extends DialogWindow
 */
export default class ApplicationChooserDialog extends DialogWindow {

  /**
   * @param  {Object}          args              An object with arguments
   * @param  {String}          args.title        Dialog title
   * @param  {String}          args.message      Dialog message
   * @param  {FileMetadata}    args.file         The file to open
   * @param  {CallbackDialog}  callback          Callback when done
   */
  constructor(args, callback) {
    args = Object.assign({}, {}, args);

    super('ApplicationChooserDialog', {
      title: args.title || _('DIALOG_APPCHOOSER_TITLE'),
      width: 400,
      height: 400
    }, args, callback);
  }

  init() {
    const root = super.init(...arguments);

    const cols = [{label: _('LBL_NAME')}];
    const rows = [];
    const metadata = PackageManager.getPackages();

    (this.args.list || []).forEach((name) => {
      const iter = metadata[name];

      if ( iter && iter.type === 'application' ) {
        const label = [iter.name];
        if ( iter.description ) {
          label.push(iter.description);
        }
        rows.push({
          value: iter,
          columns: [
            {label: label.join(' - '), icon: Theme.getIcon(iter.icon, null, name), value: JSON.stringify(iter)}
          ]
        });
      }
    });

    this._find('ApplicationList').set('columns', cols).add(rows).on('activate', (ev) => {
      this.onClose(ev, 'ok');
    });

    let file = '<unknown file>';
    let label = '<unknown mime>';
    if ( this.args.file ) {
      file = Utils.format('{0} ({1})', this.args.file.filename, this.args.file.mime);
      label = _('DIALOG_APPCHOOSER_SET_DEFAULT', this.args.file.mime);
    }

    this._find('FileName').set('value', file);
    this._find('SetDefault').set('label', label);

    return root;
  }

  onClose(ev, button) {
    let result = null;

    if ( button === 'ok' ) {
      const useDefault = this._find('SetDefault').get('value');
      const selected = this._find('ApplicationList').get('value');

      if ( selected && selected.length ) {
        result = selected[0].data.className;
      }

      if ( !result ) {
        DialogWindow.create('Alert', {
          message: _('DIALOG_APPCHOOSER_NO_SELECTION')
        }, null, this);

        return;
      }
      result = {
        name: result,
        useDefault: useDefault
      };
    }

    this.closeCallback(ev, button, result);
  }

}

