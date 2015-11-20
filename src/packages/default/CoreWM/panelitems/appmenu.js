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
   * PanelItem: AppMenu
   */
  var PanelItemAppMenu = function(settings) {
    PanelItem.apply(this, ['PanelItemAppMenu PanelItemFill', 'AppMenu', settings, {}]);
    this.$container = null;
  };

  PanelItemAppMenu.prototype = Object.create(PanelItem.prototype);
  PanelItemAppMenu.Name = 'AppMenu'; // Static name
  PanelItemAppMenu.Description = 'Application Menu'; // Static description
  PanelItemAppMenu.Icon = 'actions/stock_about.png'; // Static icon
  PanelItemAppMenu.HasOptions = false;

  PanelItemAppMenu.prototype.init = function() {
    var self = this;
    var root = PanelItem.prototype.init.apply(this, arguments);
    var wm = OSjs.Core.getWindowManager();

    this.$container = document.createElement('ul');
    root.appendChild(this.$container);

    var sel = document.createElement('li');
    sel.className = 'Button';
    sel.title = API._('LBL_APPLICATIONS');
    sel.innerHTML = '<img alt="" src="' + API.getIcon(wm.getSetting('icon') || 'osjs-white.png') + '" />';

    Utils.$bind(sel, 'click', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      OSjs.Applications.CoreWM.showMenu(ev);
    });
    Utils.$bind(sel, 'contextmenu', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
    });

    this.$container.appendChild(sel);

    return root;
  };

  PanelItemAppMenu.prototype.destroy = function() {
    this.$container = null;
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.AppMenu          = PanelItemAppMenu;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.VFS);
