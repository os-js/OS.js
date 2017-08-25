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
import PanelItem from '../panelitem';

const GUI = OSjs.require('utils/gui');
const DOM = OSjs.require('utils/dom');
const Events = OSjs.require('utils/events');
const WindowManager = OSjs.require('core/window-manager');

class WindowListEntry {

  constructor(win, className) {

    const el = document.createElement('li');
    el.className = className;
    el.title = win._title;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', win._title);

    const img = document.createElement('img');
    img.alt = win._title;
    img.src = win._icon;

    const span = document.createElement('span');
    span.appendChild(document.createTextNode(win._title));

    el.appendChild(img);
    el.appendChild(span);

    Events.$bind(el, 'click', function() {
      win._restore(false, true);
    });

    Events.$bind(el, 'contextmenu', function(ev) {
      /* eslint no-invalid-this: "off" */
      ev.preventDefault();

      if ( win ) {
        win._onWindowIconClick(ev, this);
      }

      return false;
    });

    let peeking = false;
    GUI.createDroppable(el, {
      onDrop: function(ev, el) {
        if ( win ) {
          win._focus();
        }
      },
      onLeave: function() {
        if ( peeking ) {
          peeking = false;
        }
      },
      onEnter: function(ev, inst, args) {
        if ( !peeking ) {
          if ( win ) {
            win._focus();
          }
          peeking = true;
        }
      },
      onItemDropped: function(ev, el, item, args) {
        if ( win ) {
          return win._onDndEvent(ev, 'itemDrop', item, args);
        }
        return false;
      },
      onFilesDropped: function(ev, el, files, args) {
        if ( win ) {
          return win._onDndEvent(ev, 'filesDrop', files, args);
        }
        return false;
      }
    });

    if ( win._state.focused ) {
      el.className += ' Focused';
    }

    this.$element = el;
    this.id = win._wid;
  }

  destroy() {
    if ( this.$element ) {
      Events.$unbind(this.$element, 'click');
      Events.$unbind(this.$element, 'contextmenu');
      this.$element = DOM.$remove(this.$element);
    }
  }

  event(ev, win, parentEl) {
    const cn = 'WindowList_Window_' + win._wid;

    function _change(cn, callback) {
      const els = parentEl.getElementsByClassName(cn);
      if ( els.length ) {
        for ( let i = 0, l = els.length; i < l; i++ ) {
          if ( els[i] && els[i].parentNode ) {
            callback(els[i]);
          }
        }
      }
    }

    if ( ev === 'focus' ) {
      _change(cn, function(el) {
        el.className += ' Focused';
      });
    } else if ( ev === 'blur' ) {
      _change(cn, function(el) {
        el.className = el.className.replace(/\s?Focused/, '');
      });
    } else if ( ev === 'title' ) {
      _change(cn, function(el) {
        el.setAttribute('aria-label', win._title);

        const span = el.getElementsByTagName('span')[0];
        if ( span ) {
          DOM.$empty(span);
          span.appendChild(document.createTextNode(win._title));
        }
        const img = el.getElementsByTagName('img')[0];
        if ( img ) {
          img.alt = win._title;
        }
      });
    } else if ( ev === 'icon' ) {
      _change(cn, function(el) {
        el.getElementsByTagName('img')[0].src = win._icon;
      });
    } else if ( ev === 'attention_on' ) {
      _change(cn, function(el) {
        if ( !el.className.match(/Attention/) ) {
          el.className += ' Attention';
        }
      });
    } else if ( ev === 'attention_off' ) {
      _change(cn, function(el) {
        if ( !el.className.match(/Attention/) ) {
          el.className = el.className.replace(/\s?Attention/, '');
        }
      });
    } else if ( ev === 'close' ) {
      return false;
    }

    return true;
  }
}

export default class PanelItemWindowList extends PanelItem {

  constructor() {
    super('PanelItemWindowList corewm-panel-expand');
    this.entries = [];
  }

  init() {
    const root = super.init(...arguments);

    const wm = WindowManager.instance;
    if ( wm ) {
      const wins = wm.getWindows();
      for ( let i = 0; i < wins.length; i++ ) {
        if ( wins[i] ) {
          this.update('create', wins[i]);
        }
      }
    }

    return root;
  }

  destroy() {
    this.entries.forEach(function(e) {
      try {
        e.destroy();
      } catch ( e ) {}
      e = null;
    });

    this.entries = [];

    return super.destroy(...arguments);
  }

  update(ev, win) {
    if ( !this._$container || (win && win._properties.allow_windowlist === false) ) {
      return;
    }

    let entry = null;
    if ( ev === 'create' ) {
      const className = 'corewm-panel-ellipsis WindowList_Window_' + win._wid;
      if ( this._$container.getElementsByClassName(className).length ) {
        return;
      }

      entry = new WindowListEntry(win, className);
      this.entries.push(entry);
      this._$container.appendChild(entry.$element);
    } else {
      let found = -1;
      this.entries.forEach(function(e, idx) {
        if ( e.id === win._wid ) {
          found = idx;
        }
        return found !== -1;
      });

      entry = this.entries[found];
      if ( entry ) {
        if ( entry.event(ev, win, this._$container) === false ) {
          entry.destroy();

          this.entries.splice(found, 1);
        }
      }
    }
  }
}

