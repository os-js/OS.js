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
(function(API, Utils, StandardDialog) {
  'use strict';

  /**
   * Application Chooser Dialog
   */
  var ApplicationChooserDialog = function(file, list, onClose) {
    this.filename     = Utils.filename(file.path);
    this.mime         = file.mime;
    this.list         = list || [];
    this.selectedApp  = null;
    this.useDefault   = false;

    var msg = ([API._('DIALOG_APPCHOOSER_MSG'), '<br />' ,Utils.format('<span>{0}</span>', this.filename), Utils.format('({0})', this.mime)]).join(' ');
    StandardDialog.apply(this, ['ApplicationChooserDialog', {title: API._('DIALOG_APPCHOOSER_TITLE'), message: msg}, {width:400, height:360}, onClose]);
  };

  ApplicationChooserDialog.prototype = Object.create(StandardDialog.prototype);

  ApplicationChooserDialog.prototype.destroy = function(wm) {
    StandardDialog.prototype.destroy.apply(this, arguments);
  };

  ApplicationChooserDialog.prototype.onConfirmClick = function(ev, val) {
    if ( !this.buttonConfirm ) { return; }
    /*var*/ val  = this.selectedApp;
    if ( !val ) {
      var wm = API.getWMInstance();
      if ( wm ) {
        var d = new OSjs.Dialogs.Alert(API._('DIALOG_APPCHOOSER_NO_SELECTION'));
        wm.addWindow(d);
        this._addChild(d);
      }
      return;
    }
    this.end('ok', val, this.useDefault);
  };

  ApplicationChooserDialog.prototype.init = function(wm) {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);
    var container = this.$element;
    var list = [];
    var refs = API.getHandlerInstance().getApplicationsMetadata();

    function _createIcon(icon, appname) {
      return API.getIcon(icon, appname);
    }

    this.list.forEach(function(key, i) {
      var icon = null;
      var name = key;
      var iter;

      if ( refs[key] ) {
        iter = refs[key];
        if ( iter ) {
          name = Utils.format('{0} - {1}', (iter.name || name), (iter.description || name));
          icon = _createIcon(iter.icon, iter.path);

          if ( iter.type !== 'application' ) {
            return;
          }
        }
      }


      list.push({
        key:   key,
        image: icon,
        name:  name
      });
    });

    var listView = this._addGUIElement(new OSjs.GUI.ListView('ApplicationChooserDialogListView'), container);
    listView.setColumns([
      {key: 'image', title: '', type: 'image', domProperties: {width: '16'}},
      {key: 'name',  title: API._('Name')},
      {key: 'key',   title: 'Key', visible: false}
     ]);
    listView.onActivate = function(ev, el, item) {
      if ( item && item.key ) {
        self.selectedApp = item.key;
        self.buttonConfirm.setDisabled(false);
        self.end('ok', item.key, self.useDefault);
      }
    };
    listView.onSelect = function(ev, el, item) {
      if ( item && item.key ) {
        self.selectedApp = item.key;
        self.buttonConfirm.setDisabled(false);
      }
    };

    this.buttonConfirm.setDisabled(true);

    listView.setRows(list);
    listView.render();

    this._addGUIElement(new OSjs.GUI.Checkbox('ApplicationChooserDefault', {label: API._('DIALOG_APPCHOOSER_SET_DEFAULT', this.mime), value: this.useDefault, onChange: function(el, ev, value) {
      self.useDefault = value ? true : false;
    }}), container);

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.ApplicationChooser = ApplicationChooserDialog;

})(OSjs.API, OSjs.Utils, OSjs.Dialogs.StandardDialog);
