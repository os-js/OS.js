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
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
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

import * as Events from 'utils/events';
import WindowManager from 'core/window-manager';

/**
 * Class for creating notifications
 */
class Notification {

  constructor() {
    this.$notifications = null;
    this.visibles = 0;
  }

  /**
   * Creates a new popup notification
   *
   * @param   {Object}    opts                   Notification options
   * @param   {String}    opts.icon              What icon to display
   * @param   {String}    opts.title             What title to display
   * @param   {String}    opts.message           What message to display
   * @param   {Number}    [opts.timeout=5000]    Timeout
   * @param   {Function}  opts.onClick           Event callback on click => fn(ev)
   */
  create(opts) {
    opts          = opts          || {};
    opts.icon     = opts.icon     || null;
    opts.title    = opts.title    || null;
    opts.message  = opts.message  || '';
    opts.onClick  = opts.onClick  || function() {};

    if ( !this.$notifications ) {
      this.$notifications = document.createElement('corewm-notifications');
      this.$notifications.setAttribute('role', 'log');
      document.body.appendChild(this.$notifications);
    }

    if ( typeof opts.timeout === 'undefined' ) {
      opts.timeout  = 5000;
    }

    console.debug('CoreWM::notification()', opts);

    const container  = document.createElement('corewm-notification');
    let classNames = [''];
    let timeout    = null;
    let animationCallback = null;

    const _remove = () => {
      if ( timeout ) {
        clearTimeout(timeout);
        timeout = null;
      }

      container.onclick = null;
      const _removeDOM = () => {
        Events.$unbind(container);
        if ( container.parentNode ) {
          container.parentNode.removeChild(container);
        }
        this.visibles--;
        if ( this.visibles <= 0 ) {
          this.$notifications.style.display = 'none';
        }
      };

      const anim = WindowManager.instance.getSetting('animations');
      if ( anim ) {
        container.setAttribute('data-hint', 'closing');
        animationCallback = () => _removeDOM();
      } else {
        container.style.display = 'none';
        _removeDOM();
      }
    };

    if ( opts.icon ) {
      const icon = document.createElement('img');
      icon.alt = '';
      icon.src = opts.icon;
      classNames.push('HasIcon');
      container.appendChild(icon);
    }

    if ( opts.title ) {
      const title = document.createElement('div');
      title.className = 'Title';
      title.appendChild(document.createTextNode(opts.title));
      classNames.push('HasTitle');
      container.appendChild(title);
    }

    if ( opts.message ) {
      const message = document.createElement('div');
      message.className = 'Message';
      const lines = opts.message.split('\n');
      lines.forEach(function(line, idx) {
        message.appendChild(document.createTextNode(line));
        if ( idx < (lines.length - 1) ) {
          message.appendChild(document.createElement('br'));
        }
      });
      classNames.push('HasMessage');
      container.appendChild(message);
    }

    this.visibles++;
    if ( this.visibles > 0 ) {
      this.$notifications.style.display = 'block';
    }

    container.setAttribute('aria-label', String(opts.title));
    container.setAttribute('role', 'alert');

    container.className = classNames.join(' ');
    container.onclick = function(ev) {
      _remove();

      opts.onClick(ev);
    };

    let preventTimeout;
    function _onanimationend(ev) {
      if ( typeof animationCallback === 'function') {
        clearTimeout(preventTimeout);
        preventTimeout = setTimeout(function() {
          animationCallback(ev);
          animationCallback = false;
        }, 10);
      }
    }

    Events.$bind(container, 'transitionend', _onanimationend);
    Events.$bind(container, 'animationend', _onanimationend);

    const space = WindowManager.instance.getWindowSpace(true);
    this.$notifications.style.marginTop = String(space.top) + 'px';
    this.$notifications.appendChild(container);

    if ( opts.timeout ) {
      timeout = setTimeout(function() {
        _remove();
      }, opts.timeout);
    }
  }

  /**
   * Creates a new Notification Icon
   * @param   {String}    name                      Internal name (unique)
   * @param   {Object}    opts                      Notification options
   * @param   {Object}    [opts.icon]               Icon to display
   * @param   {Object}    [opts.onCreated]          Event: when created
   * @param   {Object}    [opts.onInited]           Event: when inited
   * @param   {Object}    [opts.onDestroy]          Event: when destroyed
   * @param   {Object}    [opts.onClick]            Event: when clicked
   * @param   {Object}    [opts.onContextMenu]      Event: on context menu
   * @return {Boolean}
   */
  createIcon(name, opts) {
    const wm = WindowManager.instance;
    if ( wm && typeof wm.getNotificationArea === 'function' ) {
      const pitem = wm.getNotificationArea();
      if ( pitem ) {
        return pitem.createNotification(name, opts);
      }
    }
    return null;
  }

  /**
   * Removes a Notification Icon
   * @param   {String}    name      Internal name (unique)
   * @return {Boolean}
   */
  destroyIcon() {
    const wm = WindowManager.instance;
    if ( wm && typeof wm.getNotificationArea === 'function' ) {
      const pitem = wm.getNotificationArea();
      if ( pitem ) {
        pitem.removeNotification(name);
        return true;
      }
    }
    return false;
  }

  /**
   * Get a notification icon
   * @param   {String}    name      Internal name (unique)
   * @return {object}
   */
  getIcon(name) {
    const wm = WindowManager.instance;
    if ( wm && typeof wm.getNotificationArea === 'function' ) {
      const pitem = wm.getNotificationArea();
      if ( pitem ) {
        return pitem.getNotification(name);
      }
    }
    return null;
  }

}

export default (new Notification());
