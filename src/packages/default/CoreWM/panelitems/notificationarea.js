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

  var NotificationAreaItem = function(name, opts) {
    opts = opts || {};

    this.name           = name;
    this.opts           = opts;
    this.$container     = document.createElement('div');
    this.onCreated      = opts.onCreated     || function() {};
    this.onInited       = opts.onInited      || function() {};
    this.onDestroy      = opts.onDestroy     || function() {};
    this.onClick        = opts.onClick       || function() {};
    this.onContextMenu  = opts.onContextMenu || function() {};

    var classNames = ['NotificationArea', 'NotificationArea_' + name];
    if ( opts.className ) {
      classNames.push(opts.className);
    }

    this.$container.className = classNames.join(' ');
    if ( this.opts.tooltip ) {
      this.$container.title = this.opts.tooltip;
    }

    var self = this;
    this.$container.addEventListener('click', function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
      OSjs.API.blurMenu();
      self.onClick.apply(self, arguments);
      return false;
    });
    this.$container.addEventListener('contextmenu', function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
      OSjs.API.blurMenu();
      self.onContextMenu.apply(self, arguments);
      return false;
    });

    this.onCreated.call(this);
  };

  NotificationAreaItem.prototype.init = function(root) {
    root.appendChild(this.$container);

    this.onInited.call(this, this.$container);
  };

  NotificationAreaItem.prototype.destroy = function() {
    this.onDestroy.call(this);

    if ( this.$container ) {
      if ( this.$container.parentNode ) {
        this.$container.parentNode.removeChild(this.$container);
      }
      this.$container = null;
    }
  };

  /**
   * PanelItem: NotificationArea
   */
  var _restartFix = {}; // FIXME: This is a workaround for resetting items on panel change

  var PanelItemNotificationArea = function() {
    PanelItem.apply(this, ['PanelItemNotificationArea PanelItemFill PanelItemRight']);
    this.notifications = {};
  };

  PanelItemNotificationArea.prototype = Object.create(PanelItem.prototype);
  PanelItemNotificationArea.Name = 'NotificationArea'; // Static name
  PanelItemNotificationArea.Description = 'View notifications'; // Static description
  PanelItemNotificationArea.Icon = 'apps/gnome-panel-notification-area.png'; // Static icon

  PanelItemNotificationArea.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    var fix = Object.keys(_restartFix);
    var self = this;
    if ( fix.length ) {
      fix.forEach(function(k) {
        self.createNotification(k, _restartFix[k]);
      });
    }

    return root;
  };


  PanelItemNotificationArea.prototype.createNotification = function(name, opts) {
    if ( this._$root ) {
      if ( !this.notifications[name] ) {
        var item = new NotificationAreaItem(name, opts);
        item.init(this._$root);
        this.notifications[name] = item;
        _restartFix[name] = opts;

        return item;
      }
    }
    return null;
  };

  PanelItemNotificationArea.prototype.removeNotification = function(name) {
    if ( this._$root ) {
      if ( this.notifications[name] ) {
        this.notifications[name].destroy();
        delete this.notifications[name];
        if ( _restartFix[name] ) {
          delete _restartFix[name];
        }
        return true;
      }
    }

    return false;
  };


  PanelItemNotificationArea.prototype.destroy = function() {
    for ( var i in this.notifications ) {
      if ( this.notifications.hasOwnProperty(i) ) {
        if ( this.notifications[i] ) {
          this.notifications[i].destroy();
        }
        delete this.notifications[i];
      }
    }

    PanelItem.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.NotificationArea = PanelItemNotificationArea;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.VFS);
