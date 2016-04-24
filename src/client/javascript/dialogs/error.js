/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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
(function(API, Utils, DialogWindow) {
  'use strict';

  /**
   * An 'Error' dialog
   *
   * @param   args      Object        An object with arguments
   * @param   callback  Function      Callback when done => fn(ev, button, result)
   *
   * @option    args    title       String      Dialog title
   * @option    args    message     String      Dialog message
   * @option    args    error       String      Error message
   * @option    args    exception   Object      (Optional) Exception object
   *
   * @extends DialogWindow
   * @class ErrorDialog
   * @api OSjs.Dialogs.Error
   */
  function ErrorDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});

    console.error('ErrorDialog::constructor()', args);

    var exception = args.exception || {};
    var error = '';
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

    DialogWindow.apply(this, ['ErrorDialog', {
      title: args.title || API._('DIALOG_CONFIRM_TITLE'),
      icon: 'status/dialog-error.png',
      width: 400,
      height: error ? 400 : 200
    }, args, callback]);

    this._sound = 'dialog-warning';
    this._soundVolume = 1.0;

    this.traceMessage = error;
  }

  ErrorDialog.prototype = Object.create(DialogWindow.prototype);
  ErrorDialog.constructor = DialogWindow;

  ErrorDialog.prototype.init = function() {
    var self = this;

    var root = DialogWindow.prototype.init.apply(this, arguments);
    root.setAttribute('role', 'alertdialog');

    var msg = Utils.$escape(this.args.message || '').replace(/\*\*(\w+)\*\*/, '<span>$1</span>');

    this.scheme.find(this, 'Message').set('value', msg, true);
    this.scheme.find(this, 'Summary').set('value', this.args.error);
    this.scheme.find(this, 'Trace').set('value', this.traceMessage);
    if ( !this.traceMessage ) {
      this.scheme.find(this, 'Trace').hide();
      this.scheme.find(this, 'TraceLabel').hide();
    }

    if ( this.args.bugreport ) {
      this.scheme.find(this, 'ButtonBugReport').on('click', function() {
        var title = encodeURIComponent('');
        var body = [self.args.message];
        if ( self.args.error ) {
          body.push('\n> ' + self.args.error.replace('\n', ' '));
        }
        if ( self.traceMessage ) {
          body.push('\n```\n' + self.traceMessage + '\n```');
        }
        window.open('//github.com/os-js/OS.js/issues/new?title=' + title + '&body=' + encodeURIComponent(body.join('\n')));
      });
    } else {
      this.scheme.find(this, 'ButtonBugReport').hide();
    }

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.Error = ErrorDialog;

})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);
