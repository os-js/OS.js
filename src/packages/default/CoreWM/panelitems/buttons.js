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
(function(CoreWM, Panel, PanelItem, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Buttons
   */
  var PanelItemButtons = function() {
    PanelItem.apply(this, ['PanelItemButtons PanelItemFill']);

    this.$container = null;
  };

  PanelItemButtons.prototype = Object.create(PanelItem.prototype);
  PanelItemButtons.Name = 'Buttons'; // Static name
  PanelItemButtons.Description = 'Button Bar'; // Static description
  PanelItemButtons.Icon = 'actions/stock_about.png'; // Static icon

  PanelItemButtons.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$container = document.createElement('ul');
    root.appendChild(this.$container);

    this.addButton(API._('LBL_APPLICATIONS'), 'osjs.png', function(ev) {
      ev.stopPropagation();

      OSjs.Applications.CoreWM.showMenu(ev);
      return false;
    });

    this.addButton(API._('LBL_SETTINGS'), 'categories/applications-system.png', function(ev) {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.showSettings();
      }
      return false;
    });

    this.addButton(API._('DIALOG_LOGOUT_TITLE'), 'actions/exit.png', function(ev) {
      OSjs.Session.signOut();
    });

    return root;
  };

  PanelItemButtons.prototype.destroy = function() {
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemButtons.prototype.addButton = function(title, icon, callback) {
    icon = API.getThemeResource(icon, 'icon');

    var sel = document.createElement('li');
    sel.className = 'Button';
    sel.title = title;
    sel.innerHTML = '<img alt="" src="' + icon + '" />';
    sel.onclick = callback;
    sel.oncontextmenu = function(ev) {
      ev.stopPropagation();
      return false;
    };

    this.$container.appendChild(sel);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.Buttons          = PanelItemButtons;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.VFS);
