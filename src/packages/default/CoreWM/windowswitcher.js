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
const DOM = OSjs.require('utils/dom');

export default class WindowSwitcher {
  constructor() {
    this.$switcher      = null;
    this.showing        = false;
    this.index          = -1;
    this.winRef         = null;
  }

  destroy() {
    this._remove();
  }

  _remove() {
    if ( this.$switcher ) {
      if ( this.$switcher.parentNode ) {
        this.$switcher.parentNode.removeChild(this.$switcher);
      }
      this.$switcher = null;
    }
  }

  show(ev, win, wm) {
    win = win || wm.getLastWindow();

    ev.preventDefault();

    var height = 0;
    var items  = [];
    var index  = 0;

    // Render
    if ( !this.$switcher ) {
      this.$switcher = document.createElement('corewm-window-switcher');
    } else {
      DOM.$empty(this.$switcher);
    }

    var container, image, label, iter;
    for ( var i = 0; i < wm._windows.length; i++ ) {
      iter = wm._windows[i];
      if ( iter ) {
        container       = document.createElement('div');

        image           = document.createElement('img');
        image.src       = iter._icon;

        label           = document.createElement('span');
        label.innerHTML = iter._title;

        container.appendChild(image);
        container.appendChild(label);
        this.$switcher.appendChild(container);

        height += 32; // FIXME: We can automatically calculate this

        if ( win && win._wid === iter._wid ) {
          index = i;
        }

        items.push({
          element: container,
          win: iter
        });
      }
    }

    if ( !this.$switcher.parentNode ) {
      document.body.appendChild(this.$switcher);
    }

    this.$switcher.style.height    = height + 'px';
    this.$switcher.style.marginTop = (height ? -((height / 2) << 0) : 0) + 'px';

    // Select
    if ( this.showing ) {
      this.index++;
      if ( this.index > (items.length - 1) ) {
        this.index = -1;
      }
    } else {
      this.index = index;
      this.showing = true;
    }

    console.debug('WindowSwitcher::show()', this.index);

    if ( items[this.index] ) {
      items[this.index].element.className = 'Active';
      this.winRef = items[this.index].win;
    } else {
      this.winRef = null;
    }
  }

  hide(ev, win, wm) {
    if ( !this.showing ) {
      return;
    }

    ev.preventDefault();

    this._remove();

    win = this.winRef || win;
    if ( win ) {
      win._focus();
    }

    this.winRef  = null;
    this.index   = -1;
    this.showing = false;
  }

}
