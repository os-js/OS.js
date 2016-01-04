/*!
 * OS.js - JavaScript Operating System
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
   * An 'Alert' dialog
   *
   * @param   args      Object        An object with arguments
   * @param   callback  Function      Callback when done => fn(ev, button, result)
   *
   * @option    args    title       String      Dialog title
   * @option    args    message     String      Dialog message
   *
   * @extends DialogWindow
   * @class AlertDialog
   * @api OSjs.Dialogs.Alert
   */
  function AlertDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    DialogWindow.apply(this, ['AlertDialog', {
      title: args.title || API._('DIALOG_ALERT_TITLE'),
      icon: 'status/dialog-warning.png',
      width: 400,
      height: 100
    }, args, callback]);
  }

  AlertDialog.prototype = Object.create(DialogWindow.prototype);
  AlertDialog.constructor = DialogWindow;

  AlertDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    this.scheme.find(this, 'Message').set('value', this.args.message, true);
    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.Alert = AlertDialog;

})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);
