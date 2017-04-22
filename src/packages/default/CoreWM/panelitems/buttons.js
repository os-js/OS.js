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

/*eslint valid-jsdoc: "off"*/
(function(CoreWM, Panel, PanelItem, Utils, API, GUI, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Buttons
   */
  function PanelItemButtons(settings) {
    PanelItem.apply(this, ['PanelItemButtons', 'Buttons', settings, {
      buttons: [
        {
          title: API._('LBL_SETTINGS'),
          icon: 'categories/applications-system.png',
          launch: 'ApplicationSettings'
        }
      ]
    }]);
  }

  PanelItemButtons.prototype = Object.create(PanelItem.prototype);
  PanelItemButtons.constructor = PanelItem;

  PanelItemButtons.prototype.init = function() {
    var self = this;
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.renderButtons();

    var ghost;
    var lastTarget;

    function clearGhost(inner) {
      ghost = Utils.$remove(ghost);
      if ( !inner ) {
        lastTarget = null;
      }
    }

    function createGhost(target) {
      var isUl = target.tagName === 'UL';
      if ( !target || lastTarget === target || isUl ) {
        return;
      }

      var ul = target.parentNode;
      lastTarget = target;

      clearGhost(true);

      ghost = document.createElement('li');
      ghost.className = 'Ghost';

      ul.insertBefore(ghost, target);
    }

    var counter = 0;
    GUI.Helpers.createDroppable(this._$container, {
      onOver: function(ev, el, args) {
        if ( ev.target ) {
          createGhost(ev.target);
        }
      },

      onEnter: function(ev) {
        ev.preventDefault();
        counter++;
      },

      onLeave: function(ev) {
        if ( counter <= 0 ) {
          clearGhost();
        }
      },

      onDrop: function() {
        counter = 0;
        clearGhost();
      },

      onItemDropped: function(ev, el, item, args) {
        if ( item && item.data ) {
          var newPosition = 0;
          if ( Utils.$hasClass(ev.target, 'Ghost') ) {
            newPosition = Utils.$index(ev.target);
          }

          if ( typeof item.data.position !== 'undefined' ) {
            self.moveButton(item.data.position, newPosition - 1);
          } else if ( item.data.mime === 'osjs/application' ) {
            var appName = item.data.path.split('applications:///')[1];
            self.createButton(appName, newPosition);
          }
        }
      }
    });

    return root;
  };

  PanelItemButtons.prototype.clearButtons = function() {
    Utils.$empty(this._$container);
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

      self.addButton(btn.title, btn.icon, menu, callback, idx);
    });
  };

  PanelItemButtons.prototype.removeButton = function(index) {
    var buttons = this._settings.get('buttons');
    buttons.splice(index, 1);
    this.renderButtons();

    this._settings.save();
  };

  PanelItemButtons.prototype.moveButton = function(from, to) {
    var self = this;
    var buttons = this._settings.get('buttons');

    if ( from === to || buttons.length <= 1 ) {
      return;
    }

    if ( to >= buttons.length ) {
      var k = to - buttons.length;
      while ( (k--) + 1 ) {
        buttons.push(window.undefined);
      }
    }

    buttons.splice(to, 0, buttons.splice(from, 1)[0]);

    this._settings.save(function() {
      self.renderButtons();
    });
  };

  PanelItemButtons.prototype.createButton = function(appName, position) {
    var pkg = OSjs.Core.getPackageManager().getPackage(appName);
    var buttons = this._settings.get('buttons');

    var iter = {
      title: appName,
      icon: pkg.icon,
      launch: appName
    };

    if ( !buttons.length ) {
      buttons.push(iter);
    } else {
      buttons.splice(position, 0, iter);
    }

    this.renderButtons();

    this._settings.save();
  };

  PanelItemButtons.prototype.addButton = function(title, icon, menu, callback, idx) {
    var img = document.createElement('img');
    img.alt = '';
    img.src = API.getIcon(icon);

    var sel = document.createElement('li');
    sel.title = title;
    sel.setAttribute('role', 'button');
    sel.setAttribute('aria-label', title);
    sel.appendChild(img);

    Utils.$bind(sel, 'mousedown', function(ev) {
      ev.stopPropagation();
    });
    Utils.$bind(sel, 'click', callback, true);
    Utils.$bind(sel, 'contextmenu', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if ( menu ) {
        API.createMenu(menu, ev);
      }
    });

    GUI.Helpers.createDraggable(sel, {
      data: {
        position: idx
      },
      onStart: function(ev, el) {
        setTimeout(function() {
          Utils.$addClass(el, 'Ghosting');
        }, 1);
      },
      onEnd: function(ev, el) {
        Utils.$removeClass(el, 'Ghosting');
      }
    });

    this._$container.appendChild(sel);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.CoreWM = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.Buttons = PanelItemButtons;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.GUI, OSjs.VFS);
