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

(function(Application, Window, Utils, VFS, API) {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};

  /////////////////////////////////////////////////////////////////////////////
  // SERVICERING
  /////////////////////////////////////////////////////////////////////////////

  function ServiceRing() {
    this.entries = {};
    this.size = 0;
    this.icon = null;
    this.element = null;

    this.init();
  }

  ServiceRing.prototype.init = function() {
    var wm = API.getWMInstance();
    var self = this;

    if ( wm ) {

      wm.createNotificationIcon('ServiceRing', {
        onContextMenu: function(ev) {
          self.displayMenu(ev);
          return false;
        },
        onClick: function(ev) {
          self.displayMenu(ev);
          return false;
        },
        onInited: function(el) {
          self.element = el;

          if ( el.firstChild ) {
            var img = document.createElement('img');
            img.src = API.getThemeResource('status/gtk-dialog-authentication.png', 'icon', '16x16');
            el.firstChild.appendChild(img);
            self.icon = img;
            self._updateIcon();
          }
        }
      });
    }
  };

  ServiceRing.prototype.destroy = function() {
    var wm = API.getWMInstance();
    if ( wm ) {
      wm.removeNotificationIcon('ServiceRing');
    }

    this.size = 0;
    this.entries = {};
    this.element = null;
    this.icon = null;
  };

  ServiceRing.prototype._updateIcon = function() {
    if ( this.element ) {
      this.element.style.display = this.size ? 'inline-block' : 'none';
    }
    if ( this.icon ) {
      this.icon.title = 'Logged into external services: ' + this.size.toString(); // FIXME: Translation
      this.icon.alt   = this.icon.title;
    }
  };

  ServiceRing.prototype.displayMenu = function(ev) {
    var menu = [];
    var entries = this.entries;

    Object.keys(entries).forEach(function(name) {
      menu.push({
        title: name,
        menu: entries[name]
      });
    });

    OSjs.API.createMenu(menu, {x: ev.clientX, y: ev.clientY});
  };

  ServiceRing.prototype.add = function(name, menu) {
    if ( !this.entries[name] ) {
      this.entries[name] = menu;

      this.size++;
      this._updateIcon();
    }
  };

  ServiceRing.prototype.remove = function(name) {
    if ( this.entries[name] ) {
      delete this.entries[name];
      this.size--;
      this._updateIcon();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.getServiceRing = (function() {
    var _instance;

    return function() {
      if ( !_instance ) {
        _instance = new ServiceRing();
      }
      return _instance;
    };
  })();

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.API);

