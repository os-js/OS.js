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
(function(CoreWM, Panel, PanelItem, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: WindowList
   */
  var PanelItemWindowList = function() {
    PanelItem.apply(this, ['PanelItemWindowList PanelItemWide']);

    this.$element = null;
  };

  PanelItemWindowList.prototype = Object.create(PanelItem.prototype);
  PanelItemWindowList.Name = 'Window List'; // Static name
  PanelItemWindowList.Description = 'Toggle between open windows'; // Static description
  PanelItemWindowList.Icon = 'apps/xfwm4.png'; // Static icon

  PanelItemWindowList.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$element = document.createElement('ul');
    root.appendChild(this.$element);

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      var wins = wm.getWindows();
      for ( var i = 0; i < wins.length; i++ ) {
        if ( wins[i] ) {
          this.update('create', wins[i]);
        }
      }
    }

    return root;
  };

  PanelItemWindowList.prototype.destroy = function() {
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemWindowList.prototype.update = function(ev, win) {
    var self = this;
    if ( !this.$element || (win && win._properties.allow_windowlist === false) ) {
      return;
    }

    var cn = 'WindowList_Window_' + win._wid;
    var _change = function(cn, callback) {
      var els = self.$element.getElementsByClassName(cn);
      if ( els.length ) {
        for ( var i = 0, l = els.length; i < l; i++ ) {
          if ( els[i] && els[i].parentNode ) {
            callback(els[i]);
          }
        }
      }
    };

    if ( ev === 'create' ) {
      var className = 'Button WindowList_Window_' + win._wid;
      if ( this.$element.getElementsByClassName(className).length ) { return; }

      var el = document.createElement('li');
      el.innerHTML = '<img alt="" src="' + win._icon + '" /><span>' + win._title + '</span>';
      el.className = className;
      el.title = win._title;
      el.onclick = function() {
        win._restore(false, true);
      };
      el.oncontextmenu = function(ev) {
        ev.stopPropagation();
        return false;
      };

      var peeking = false;
      OSjs.API.createDroppable(el, {
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
      this.$element.appendChild(el);
    } else if ( ev === 'close' ) {
      _change(cn, function(el) {
        el.onclick = null;
        el.oncontextmenu = null;
        el.parentNode.removeChild(el);
      });
    } else if ( ev === 'focus' ) {
      _change(cn, function(el) {
        el.className += ' Focused';
      });
    } else if ( ev === 'blur' ) {
      _change(cn, function(el) {
        el.className = el.className.replace(/\s?Focused/, '');
      });
    } else if ( ev === 'title' ) {
      _change(cn, function(el) {
        el.getElementsByTagName('span')[0].innerHTML = win._title;
        el.title = win._title;
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
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.WindowList       = PanelItemWindowList;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.VFS);
