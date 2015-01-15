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
(function(API, Utils, DialogWindow) {
  'use strict';

  /**
   * File Progress dialog
   *
   * @param   String          title   Dialog title/message
   *
   * @api OSjs.Dialogs.FileProgressDialog
   * @see OSjs.Core.DialogWindow
   *
   * @extends DialogWindow
   * @class
   */
  var FileProgressDialog = function(title) {
    DialogWindow.apply(this, ['FileProgressDialog', {width:400, height:120}]);

    this.$desc                    = null;
    this._title                   = title || API._('DIALOG_FILEPROGRESS_TITLE');
    this._properties.allow_close  = false;
    this._icon                    = 'actions/document-send.png';
  };

  FileProgressDialog.prototype = Object.create(DialogWindow.prototype);

  FileProgressDialog.prototype.destroy = function() {
    DialogWindow.prototype.destroy.apply(this, arguments);
  };

  FileProgressDialog.prototype.init = function() {
    DialogWindow.prototype.init.apply(this, arguments);

    var self = this;
    var root = this._$root;

    var el          = document.createElement('div');
    el.className    = 'FileProgressDialog';

    var desc        = document.createElement('div');
    desc.className  = 'Description';
    desc.innerHTML  = API._('DIALOG_FILEPROGRESS_LOADING');


    el.appendChild(desc);
    this._addGUIElement(new OSjs.GUI.ProgressBar('FileProgressBar', 0), el);
    root.appendChild(el);

    this.$desc = desc;
  };

  /**
   * Set the description
   *
   * @param   String    d     Description
   *
   * @return  void
   *
   * @method  FileProgressDialog::setDescription()
   */
  FileProgressDialog.prototype.setDescription = function(d) {
    if ( !this.$desc ) { return; }
    this.$desc.innerHTML = d;
  };

  /**
   * Set the progress
   *
   * @param   int     p       Percentage
   *
   * @return  void
   *
   * @method  FileProgressDialog::setProgress()
   */
  FileProgressDialog.prototype.setProgress = function(p) {
    var el = this._getGUIElement('FileProgressBar');
    if ( el ) {
      el.setPercentage(p);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.FileProgress       = FileProgressDialog;

})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);
