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
import * as VFS from 'vfs/fs';
import {_} from 'core/locales';

/**
 * An 'File Information' dialog
 *
 * @example DialogWindow.create('FileInfo', {}, fn);
 * @extends DialogWindow
 */
export default class FileInfoDialog extends DialogWindow {

  /**
   * @param  {Object}          args              An object with arguments
   * @param  {String}          args.title        Dialog title
   * @param  {FileMetadata}    args.file         File to use
   * @param  {CallbackDialog}  callback          Callback when done
   */
  constructor(args, callback) {
    args = Object.assign({}, {}, args);

    super('FileInfoDialog', {
      title: args.title || _('DIALOG_FILEINFO_TITLE'),
      width: 400,
      height: 400
    }, args, callback);

    if ( !this.args.file ) {
      throw new Error('You have to select a file for FileInfo');
    }
  }

  init() {
    const root = super.init(...arguments);

    const txt = this._find('Info').set('value', _('LBL_LOADING'));
    const file = this.args.file;

    VFS.fileinfo(file).then((data) => {
      const info = [];
      Object.keys(data).forEach((i) => {
        if ( i === 'exif' ) {
          info.push(i + ':\n\n' + data[i]);
        } else {
          info.push(i + ':\n\t' + data[i]);
        }
      });
      txt.set('value', info.join('\n\n'));
      return true;
    }).catch((error) => {
      txt.set('value', _('DIALOG_FILEINFO_ERROR_LOOKUP_FMT', file.path));
    });

    return root;
  }

}

