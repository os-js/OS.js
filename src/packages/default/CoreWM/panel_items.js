/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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
(function(CoreWM, Panel, PanelItem) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Buttons
   */
  var PanelItemButtons = function() {
    PanelItem.apply(this, ['PanelItemButtons PanelItemFill']);

    this.$container = null;
  };

  PanelItemButtons.prototype = Object.create(PanelItem.prototype);
  PanelItemButtons.Name = 'Buttons'; // Static name
  PanelItemButtons.Description = 'Button Bar'; // Static description
  PanelItemButtons.Icon = 'actions/stock_about.png'; // Static icon

  PanelItemButtons.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$container = document.createElement('ul');
    root.appendChild(this.$container);

    this.addButton(OSjs.API._('Applications'), 'categories/applications-other.png', function(ev) {
      ev.stopPropagation();
      var wm = OSjs.API.getWMInstance();
      if ( wm && wm.getSetting('menuCategories') ) {
        OSjs.Applications.CoreWM.BuildCategoryMenu(ev);
      } else {
        OSjs.Applications.CoreWM.BuildMenu(ev);
      }
      return false;
    });

    this.addButton(OSjs.API._('Settings'), 'categories/applications-system.png', function(ev) {
      var wm = OSjs.API.getWMInstance();
      if ( wm ) {
        wm.showSettings();
      }
      return false;
    });

    this.addButton(OSjs.API._('Log out (Exit)'), 'actions/exit.png', function(ev) {
      OSjs.Core.signOut();
    });

    return root;
  };

  PanelItemButtons.prototype.destroy = function() {
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemButtons.prototype.addButton = function(title, icon, callback) {
    icon = OSjs.API.getThemeResource(icon, 'icon');

    var sel = document.createElement('li');
    sel.className = 'Button';
    sel.title = title;
    sel.innerHTML = '<img alt="" src="' + icon + '" />';
    sel.onclick = callback;
    sel.oncontextmenu = function(ev) {
      ev.stopPropagation();
      return false;
    };

    this.$container.appendChild(sel);
  };

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

    var wm = OSjs.API.getWMInstance();
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

    if ( ev == 'create' ) {
      var className = className = 'Button WindowList_Window_' + win._wid;
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
      OSjs.GUI.createDroppable(el, {
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
    } else if ( ev == 'close' ) {
      _change(cn, function(el) {
        el.onclick = null;
        el.oncontextmenu = null;
        el.parentNode.removeChild(el);
      });
    } else if ( ev == 'focus' ) {
      _change(cn, function(el) {
        el.className += ' Focused';
      });
    } else if ( ev == 'blur' ) {
      _change(cn, function(el) {
        el.className = el.className.replace(/\s?Focused/, '');
      });
    } else if ( ev == 'title' ) {
      _change(cn, function(el) {
        el.getElementsByTagName('span')[0].innerHTML = win._title;
        el.title = win._title;
      });
    } else if ( ev == 'icon' ) {
      _change(cn, function(el) {
        el.getElementsByTagName('img')[0].src = win._icon;
      });
    } else if ( ev == 'attention_on' ) {
      _change(cn, function(el) {
        if ( !el.className.match(/Attention/) ) {
          el.className += ' Attention';
        }
      });
    } else if ( ev == 'attention_off' ) {
      _change(cn, function(el) {
        if ( !el.className.match(/Attention/) ) {
          el.className = el.className.replace(/\s?Attention/, '');
        }
      });
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Clock
   */
  var PanelItemClock = function() {
    PanelItem.apply(this, ['PanelItemClock PanelItemFill PanelItemRight']);
    this.clockInterval  = null;
  };

  PanelItemClock.prototype = Object.create(PanelItem.prototype);
  PanelItemClock.Name = 'Clock'; // Static name
  PanelItemClock.Description = 'View the time'; // Static description
  PanelItemClock.Icon = 'status/appointment-soon.png'; // Static icon

  PanelItemClock.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    var clock = document.createElement('div');
    clock.innerHTML = '00:00:00';
    clock.oncontextmenu = function(ev) {
      ev.stopPropagation();
      return false;
    };
    var _updateClock = function() {
      var d = new Date();
      var t = ([
        (d.getHours() < 10 ? ("0" + d.getHours()) : d.getHours()),
        (d.getMinutes() < 10 ? ("0" + d.getMinutes()) : d.getMinutes()),
        (d.getSeconds() < 10 ? ("0" + d.getSeconds()) : d.getSeconds())
      ]).join(":");

      clock.innerHTML = t;
      clock.title     = t;
    };
    this.clockInterval = setInterval(_updateClock, 1000);
    _updateClock();

    root.appendChild(clock);

    return root;
  };

  PanelItemClock.prototype.destroy = function() {
    if ( this.clockInterval ) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }

    PanelItem.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  var NotificationAreaItem = function(name, opts) {
    opts = opts || {};

    this.name           = name;
    this.opts           = opts;
    this.$container     = document.createElement("div");
    this.$inner         = document.createElement("div");
    this.onCreated      = opts.onCreated     || function() {};
    this.onInited       = opts.onInited      || function() {};
    this.onDestroy      = opts.onDestroy     || function() {};
    this.onClick        = opts.onClick       || function() {};
    this.onContextMenu  = opts.onContextMenu || function() {};

    var classNames = ["NotificationArea", "NotificationArea_" + name];
    if ( opts.className ) {
      classNames.push(opts.className);
    }

    this.$container.className = classNames.join(" ");
    if ( this.opts.tooltip ) {
      this.$container.title = this.opts.tooltip;
    }

    var self = this;
    this.$inner.addEventListener("click", function(ev) {
      self.onClick.apply(self, arguments);
    });
    this.$inner.addEventListener("contextmenu", function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
      self.onContextMenu.apply(self, arguments);
      return false;
    });

    this.$container.appendChild(this.$inner);

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
    this.$inner = null;
  };

  /**
   * PanelItem: NotificationArea
   */
  var PanelItemNotificationArea = function() {
    PanelItem.apply(this, ['PanelItemNotificationArea PanelItemFill PanelItemRight']);
    this.notifications = {};
  };

  PanelItemNotificationArea.prototype = Object.create(PanelItem.prototype);
  PanelItemNotificationArea.Name = 'NotificationArea'; // Static name
  PanelItemNotificationArea.Description = 'View notifications'; // Static description
  PanelItemNotificationArea.Icon = 'status/important.png'; // Static icon

  PanelItemNotificationArea.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    return root;
  };


  PanelItemNotificationArea.prototype.createNotification = function(name, opts) {
    if ( this._$root ) {
      if ( !this.notifications[name] ) {
        var item = new NotificationAreaItem(name, opts);
        item.init(this._$root);
        this.notifications[name] = item;

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
  OSjs.Applications.CoreWM.PanelItems.Buttons          = PanelItemButtons;
  OSjs.Applications.CoreWM.PanelItems.WindowList       = PanelItemWindowList;
  OSjs.Applications.CoreWM.PanelItems.Clock            = PanelItemClock;
  OSjs.Applications.CoreWM.PanelItems.NotificationArea = PanelItemNotificationArea;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem);

