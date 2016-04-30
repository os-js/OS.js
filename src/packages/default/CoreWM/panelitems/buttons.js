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
(function(CoreWM, Panel, PanelItem, Utils, API, GUI, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Buttons
   */
  function PanelItemButtons(settings) {
    PanelItem.apply(this, ['PanelItemButtons PanelItemFill', 'Buttons', settings, {
      buttons: [
        {
          title: API._('LBL_SETTINGS'),
          icon: 'categories/applications-system.png',
          launch: 'ApplicationSettings'
        }
      ]
    }]);

    this.$container = null;
  }

  PanelItemButtons.prototype = Object.create(PanelItem.prototype);
  PanelItemButtons.constructor = PanelItem;

  PanelItemButtons.Name = 'Buttons'; // Static name
  PanelItemButtons.Description = 'Button Bar'; // Static description
  PanelItemButtons.Icon = 'actions/stock_about.png'; // Static icon

  PanelItemButtons.prototype.init = function() {
    var self = this;
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$container = document.createElement('ul');
    this.$container.setAttribute('role', 'toolbar');
    root.appendChild(this.$container);

    this.renderButtons();

    var ghost;
    var lastTarget;
    var removeTimeout;
    var lastPadding = null;

    function clearGhost() {
      removeTimeout = clearTimeout(removeTimeout);
      ghost = Utils.$remove(ghost);
      lastTarget = null;
      if ( lastPadding !== null ) {
        self.$container.style.paddingRight = lastPadding;
      }
    }

    function createGhost(target) {
      if ( !target || !target.parentNode ) {
        return;
      }
      if ( target.tagName !== 'LI' && target.tagName !== 'UL' ) {
        return;
      }

      if ( lastPadding === null ) {
        lastPadding = self.$container.style.paddingRight;
      }

      if ( target !== lastTarget ) {
        clearGhost();

        ghost = document.createElement('li');
        ghost.className = 'Button Ghost';

        if ( target.tagName === 'LI' ) {
          try {
            target.parentNode.insertBefore(ghost, target);
          } catch ( e ) {}
        } else {
          target.appendChild(ghost);
        }
      }
      lastTarget = target;

      self.$container.style.paddingRight = '16px';
    }

    GUI.Helpers.createDroppable(this.$container, {
      onOver: function(ev, el, args) {
        if ( ev.target && !Utils.$hasClass(ev.target, 'Ghost') ) {
          createGhost(ev.target);
        }
      },

      onLeave : function() {
        clearTimeout(removeTimeout);
        removeTimeout = setTimeout(function() {
          clearGhost();
        }, 1000);

        //        clearGhost();
      },

      onDrop : function() {
        clearGhost();
      },

      onItemDropped: function(ev, el, item, args) {
        if ( item && item.data && item.data.mime === 'osjs/application' ) {
          var appName = item.data.path.split('applications:///')[1];
          self.createButton(appName);
        }
        clearGhost();
      },

      onFilesDropped: function(ev, el, files, args) {
        clearGhost();
      }
    });

    return root;
  };

  PanelItemButtons.prototype.destroy = function() {
    this.$container = null;
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemButtons.prototype.clearButtons = function() {
    Utils.$empty(this.$container);
  };

  PanelItemButtons.prototype.renderButtons = function() {
    var self = this;
    var systemButtons = {
      applications: function(ev) {
        OSjs.Applications.CoreWM.showMenu(ev);
      },
      settings: function(ev) {
        var wm = OSjs.Core.getWindowManager();
        if ( wm ) {
          wm.showSettings();
        }
      },
      exit: function(ev) {
        OSjs.API.signOut();
      }
    };

    this.clearButtons();

    (this._settings.get('buttons') || []).forEach(function(btn, idx) {
      var menu = [{
        title: 'Remove button',
        onClick: function() {
          self.removeButton(idx);
        }
      }];
      var callback = function() {
        API.launch(btn.launch);
      };

      if ( btn.system ) {
        menu = null; //systemMenu;
        callback = function(ev) {
          ev.stopPropagation();
          systemButtons[btn.system](ev);
        };
      }

      self.addButton(btn.title, btn.icon, menu, callback);
    });
  };

  PanelItemButtons.prototype.removeButton = function(index) {
    var buttons = this._settings.get('buttons');
    buttons.splice(index, 1);
    this.renderButtons();

    this._settings.save();
  };

  PanelItemButtons.prototype.createButton = function(appName) {
    var pkg = OSjs.Core.getPackageManager().getPackage(appName);
    var buttons = this._settings.get('buttons');
    buttons.push({
      title: appName,
      icon: pkg.icon,
      launch: appName
    });

    this.renderButtons();

    this._settings.save();
  };

  PanelItemButtons.prototype.addButton = function(title, icon, menu, callback) {
    var sel = document.createElement('li');
    sel.className = 'Button';
    sel.title = title;
    sel.innerHTML = '<img alt="" src="' + API.getIcon(icon) + '" />';
    sel.setAttribute('role', 'button');
    sel.setAttribute('aria-label', title);

    Utils.$bind(sel, 'click', callback);
    Utils.$bind(sel, 'contextmenu', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if ( menu ) {
        API.createMenu(menu, ev);
      }
    });

    this.$container.appendChild(sel);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.Buttons          = PanelItemButtons;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.GUI, OSjs.VFS);
