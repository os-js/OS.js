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
import {_} from 'core/locales';
import {getConfig} from 'core/config';

/**
 * An 'Error' dialog
 *
 * @example DialogWindow.create('Error', {}, fn);
 * @extends DialogWindow
 */
export default class ErrorDialog extends DialogWindow {

  /**
   * @param  {Object}          args              An object with arguments
   * @param  {String}          args.title        Dialog title
   * @param  {String}          args.message      Dialog message
   * @param  {String}          args.error        Error message
   * @param  {Error}           [args.exception]  Exception
   * @param  {CallbackDialog}  callback          Callback when done
   */
  constructor(args, callback) {
    args = Object.assign({}, {}, args);

    const exception = args.exception || {};

    let error = '';
    if ( exception.stack ) {
      error = exception.stack;
    } else {
      if ( Object.keys(exception).length ) {
        error = exception.name;
        error += '\nFilename: ' + exception.fileName || '<unknown>';
        error += '\nLine: ' + exception.lineNumber;
        error += '\nMessage: ' + exception.message;
        if ( exception.extMessage ) {
          error += '\n' + exception.extMessage;
        }
      }
    }

    super('ErrorDialog', {
      title: args.title || _('DIALOG_ERROR_TITLE'),
      icon: 'status/dialog-error.png',
      width: 400,
      height: error ? 400 : 200
    }, args, callback);

    this._sound = 'ERROR';
    this._soundVolume = 1.0;

    this.traceMessage = error;
  }

  init() {
    const root = super.init(...arguments);
    root.setAttribute('role', 'alertdialog');

    const msg = DialogWindow.parseMessage(this.args.message);
    this._find('Message').empty().append(msg);
    this._find('Summary').set('value', this.args.error);
    this._find('Trace').set('value', this.traceMessage);
    if ( !this.traceMessage ) {
      this._find('Trace').hide();
      this._find('TraceLabel').hide();
    }

    if ( this.args.bugreport ) {
      this._find('ButtonBugReport').on('click', () => {
        let title = '';
        let body = [];

        if ( getConfig('BugReporting.options.issue') ) {
          const obj = {};
          const keys = ['userAgent', 'platform', 'language', 'appVersion'];
          keys.forEach((k) => {
            obj[k] = navigator[k];
          });

          title = getConfig('BugReporting.options.title');
          body = [
            '**' + getConfig('BugReporting.options.message').replace('%VERSION%', getConfig('Version')) +  ':**',
            '\n',
            '> ' + this.args.message,
            '\n',
            '> ' + (this.args.error || 'Unknown error'),
            '\n',
            '## Expected behaviour',
            '\n',
            '## Actual behaviour',
            '\n',
            '## Steps to reproduce the error',
            '\n',
            '## (Optinal) Browser and OS information',
            '\n',
            '```\n' + JSON.stringify(obj) + '\n```'
          ];

          if ( this.traceMessage ) {
            body.push('\n## Stack Trace \n```\n' + this.traceMessage + '\n```\n');
          }
        }

        const url = getConfig('BugReporting.url')
          .replace('%TITLE%', encodeURIComponent(title))
          .replace('%BODY%', encodeURIComponent(body.join('\n')));

        window.open(url);
      });
    } else {
      this._find('ButtonBugReport').hide();
    }

    return root;
  }

}

