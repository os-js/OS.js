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

import Notification from 'gui/notification';
import Theme from 'core/theme';
import * as Menu from 'gui/menu';
import {_} from 'core/locales';

/*
 * Service Notification Icon Class
 */
class ServiceNotificationIcon {

  constructor() {
    this.entries = {};
    this.size = 0;
    this.notif = null;
  }

  init() {
    const show = (ev) => {
      this.displayMenu(ev);
      return false;
    };

    this.notif = Notification.createIcon('ServiceNotificationIcon', {
      image: Theme.getIcon('status/dialog-password.png'),
      onContextMenu: show,
      onClick: show,
      onInited: (el, img) => {
        this._updateIcon();
      }
    });

    this._updateIcon();
  }

  /*
   * Destroys the notification icon
   */
  destroy() {
    Notification.destroyIcon('ServiceNotificationIcon');

    this.size = 0;
    this.entries = {};
    this.notif = null;
  }

  _updateIcon() {
    if ( this.notif ) {
      if ( this.notif.$container ) {
        this.notif.$container.style.display = this.size ? 'inline-block' : 'none';
      }
      this.notif.setTitle(_('SERVICENOTIFICATION_TOOLTIP', this.size.toString()));
    }
  }

  displayMenu(ev) {
    const menu = [];
    const entries = this.entries;

    Object.keys(entries).forEach((name) => {
      menu.push({
        title: name,
        menu: entries[name]
      });
    });

    Menu.create(menu, ev);
  }

  /*
   * Adds an entry
   */
  add(name, menu) {
    if ( !this.entries[name] ) {
      this.entries[name] = menu;

      this.size++;
      this._updateIcon();
    }
  }

  /*
   * Removes an entry
   */
  remove(name) {
    if ( this.entries[name] ) {
      delete this.entries[name];
      this.size--;
      this._updateIcon();
    }
  }

}

export default (new ServiceNotificationIcon());

