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
(function(WindowManager, Window, GUI, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      'Development' : 'Utvikling',
      'Education' : 'Utdanning',
      'Games' : 'Spill',
      'Graphics' : 'Grafikk',
      'Network' : 'Nettverk',
      'Multimedia' : 'Multimedia',
      'Office' : 'Kontor',
      'System' : 'System',
      'Utilities' : 'Verktøy',
      'Other' : 'Andre'
    },
    de_DE : {
      'Development' : 'Entwicklung',
      'Education' : 'Bildung',
      'Games' : 'Spiele',
      'Graphics' : 'Grafik',
      'Network' : 'Netzwerk',
      'Multimedia' : 'Multimedia',
      'Office' : 'Büro',
      'System' : 'System',
      'Utilities' : 'Zubehör',
      'Other' : 'Andere'
    },
    fr_FR : {
    },
    ru_RU : {
      'Development' : 'Разработка',
      'Education' : 'Образование',
      'Games' : 'Игры',
      'Graphics' : 'Графика',
      'Network' : 'Интернет',
      'Multimedia' : 'Мультимедиа',
      'Office' : 'Офис',
      'System' : 'Система',
      'Utilities' : 'Утилиты',
      'Other' : 'Другое'
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return API.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // SETTINGS
  /////////////////////////////////////////////////////////////////////////////

  var DefaultCategories = {
    development : {icon: 'categories/package_development.png', title: 'Development'},
    education   : {icon: 'categories/applications-sience.png', title: 'Education'},
    games       : {icon: 'categories/package_games.png',       title: 'Games'},
    graphics    : {icon: 'categories/package_graphics.png',    title: 'Graphics'},
    network     : {icon: 'categories/package_network.png',     title: 'Network'},
    multimedia  : {icon: 'categories/package_multimedia.png',  title: 'Multimedia'},
    office      : {icon: 'categories/package_office.png',      title: 'Office'},
    system      : {icon: 'categories/package_system.png',      title: 'System'},
    utilities   : {icon: 'categories/package_utilities.png',   title: 'Utilities'},
    unknown     : {icon: 'categories/applications-other.png',  title: 'Other'}
  };

  /////////////////////////////////////////////////////////////////////////////
  // Window Switcher
  /////////////////////////////////////////////////////////////////////////////

  var WindowSwitcher = function() {
    this.$switcher      = null;
    this.showing        = false;
    this.index          = -1;
    this.winRef         = null;
  };

  WindowSwitcher.prototype.destroy = function() {
    this._remove();
  };

  WindowSwitcher.prototype._remove = function() {
    if ( this.$switcher ) {
      if ( this.$switcher.parentNode ) {
        this.$switcher.parentNode.removeChild(this.$switcher);
      }
      this.$switcher = null;
    }
  }

  WindowSwitcher.prototype.show = function(ev, win, wm) {
    ev.preventDefault();

    var height = 0;
    var items  = [];
    var total  = 0;
    var index  = -1;

    // Render
    if ( !this.$switcher ) {
      this.$switcher = document.createElement('div');
      this.$switcher.id = 'WindowSwitcher';
    } else {
      Utils.$empty(this.$switcher);
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

        if ( win && win._wid == iter._wid ) {
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
    this.$switcher.style.marginTop = (height ? -((height/2) << 0) : 0) + 'px';

    // Select
    if ( this.showing ) {
      this.index++;
      if ( this.index > (items.length-1) ) {
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
  };

  WindowSwitcher.prototype.hide = function(ev, win, wm) {
    if ( !this.showing ) { return; }

    ev.preventDefault();

    this._remove();

    win = this.winRef || win;
    if ( win ) {
      win._focus();
    }

    this.winRef  = null;
    this.index   = -1;
    this.showing = false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // PANELS
  /////////////////////////////////////////////////////////////////////////////

  var PANEL_SHOW_TIMEOUT = 150;
  var PANEL_HIDE_TIMEOUT = 600;

  var Panel = function(name, options) {
    options = options || {};

    this._name = name;
    this._$element = null;
    this._$container = null;
    this._items = [];
    this._outtimeout = null;
    this._intimeout = null;
    this._options = {
      position: options.position || 'top',
      ontop:    options.ontop === true,
      autohide: options.autohide === true
    };
  };

  Panel.prototype.init = function(root) {
    var self = this;

    this._$container = document.createElement('ul');

    this._$element = document.createElement('div');
    this._$element.className = 'WMPanel';

    this._$element.onmousedown = function(ev) {
      ev.preventDefault();
      return false;
    };
    this._$element.onmouseover = function(ev) {
      self.onMouseOver(ev);
    };
    this._$element.onmouseout = function(ev) {
      self.onMouseOut(ev);
    };
    this._$element.onclick = function(ev) {
      OSjs.GUI.blurMenu();
    };
    this._$element.oncontextmenu = function(ev) {
      OSjs.GUI.createMenu([{title: _('Open Panel Settings'), onClick: function(ev) {
        var wm = API.getWMInstance();
        if ( wm ) {
          wm.showSettings('Panels');
        }
      }}], {x: ev.clientX, y: ev.clientY});
      return false;
    };

    document.addEventListener('mouseout', function(ev) {
      self.onMouseLeave(ev);
    }, false);

    this._$element.appendChild(this._$container);
    root.appendChild(this._$element);

    setTimeout(function() {
      self.update();
    }, 0);
  };

  Panel.prototype.destroy = function() {
    this._clearTimeouts();

    var self = this;
    document.removeEventListener('mouseout', function(ev) {
      self.onMouseLeave(ev);
    }, false);

    for ( var i = 0; i < this._items.length; i++ ) {
      this._items[i].destroy();
    }
    this._items = [];

    if ( this._$element && this._$element.parentNode ) {
      this._$element.onmousedown = null;
      this._$element.onclick = null;
      this._$element.oncontextmenu = null;
      this._$element.parentNode.removeChild(this._$element);
      this._$element = null;
    }
  };

  Panel.prototype.update = function(options) {
    options = options || this._options;

    var cn = ['WMPanel'];
    if ( options.ontop ) {
      cn.push('Ontop');
    }
    if ( options.position ) {
      cn.push(options.position == 'top' ? 'Top' : 'Bottom');
    }
    if ( options.autohide ) {
      this.onMouseOut();
    }
    if ( this._$element ) {
      this._$element.className = cn.join(' ');
    }
    this._options = options;
  };

  Panel.prototype.autohide = function(hide) {
    if ( !this._options.autohide || !this._$element ) {
      return;
    }

    if ( hide ) {
      this._$element.className = this._$element.className.replace(/\s?Visible/, '');
      if ( !this._$element.className.match(/Autohide/) ) {
        this._$element.className += ' Autohide';
      }
    } else {
      this._$element.className = this._$element.className.replace(/\s?Autohide/, '');
      if ( !this._$element.className.match(/Visible/) ) {
        this._$element.className += ' Visible';
      }
    }
  };

  Panel.prototype._clearTimeouts = function() {
    if ( this._outtimeout ) {
      clearTimeout(this._outtimeout);
      this._outtimeout = null;
    }
    if ( this._intimeout ) {
      clearTimeout(this._intimeout);
      this._intimeout = null;
    }
  };

  Panel.prototype.onMouseLeave = function(ev) {
    var from = ev.relatedTarget || ev.toElement;
    if ( !from || from.nodeName == "HTML" ) {
      this.onMouseOut(ev);
    }
  };

  Panel.prototype.onMouseOver = function() {
    var self = this;
    this._clearTimeouts();
    this._intimeout = setTimeout(function() {
      self.autohide(false);
    }, PANEL_SHOW_TIMEOUT);
  };

  Panel.prototype.onMouseOut = function() {
    var self = this;
    this._clearTimeouts();
    this._outtimeout = setTimeout(function() {
      self.autohide(true);
    }, PANEL_HIDE_TIMEOUT);
  };

  Panel.prototype.addItem = function(item) {
    if ( !(item instanceof OSjs.Applications.CoreWM.PanelItem) ) {
      throw "Expected a PanelItem in Panel::addItem()";
    }

    this._items.push(item);
    this._$container.appendChild(item.init());
  };

  Panel.prototype.getItemByType = function(type) {
    return this.getItem(type);
  };

  Panel.prototype.getItemsByType = function(type) {
    return this.getItem(type, true);
  };

  Panel.prototype.getItem = function(type, multiple) {
    var result = multiple ? [] : null;
    for ( var i = 0; i < this._items.length; i++ ) {
      if ( this._items[i] instanceof type ) {
        if ( multiple ) {
          result.push(this._items[i]);
        } else {
          result = this._items[i];
          break;
        }
      }
    }
    return result;
  };

  Panel.prototype.getOntop = function() {
    return this._options.ontop;
  };

  Panel.prototype.getPosition = function(pos) {
    return pos ? (this._options.position == pos) : this._options.position;
  };

  Panel.prototype.getAutohide = function() {
    return this._options.autohide;
  };

  Panel.prototype.getRoot = function() {
    return this._$element;
  };

  Panel.prototype.getHeight = function() {
    return this._$element ? this._$element.offsetHeight : 0;
  };

  /////////////////////////////////////////////////////////////////////////////
  // PANEL ITEM
  /////////////////////////////////////////////////////////////////////////////

  var PanelItem = function(className) {
    this._$root = null;
    this._className = className || 'Unknown';
  };

  PanelItem.Name = 'PanelItem'; // Static name
  PanelItem.Description = 'PanelItem Description'; // Static description
  PanelItem.Icon = 'actions/stock_about.png'; // Static icon

  PanelItem.prototype.init = function() {
    this._$root = document.createElement('li');
    this._$root.className = 'PanelItem ' + this._className;

    return this._$root;
  };

  PanelItem.prototype.destroy = function() {
    if ( this._$root ) {
      if ( this._$root.parentNode ) {
        this._$root.parentNode.removeChild(this._$root);
      }
      this._$root = null;
    }
  };

  PanelItem.prototype.getRoot = function() {
    return this._$root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function _createIcon(aiter, aname) {
    return API.getIcon(aiter.icon, aiter);
  }

  /**
   * Create default application menu
   */
  function BuildMenu(ev) {
    var apps = API.getHandlerInstance().getApplicationsMetadata();
    var list = [];
    for ( var a in apps ) {
      if ( apps.hasOwnProperty(a) ) {
        if ( apps[a].type !== "application" ) { continue; }
        list.push({
          title: apps[a].name,
          icon: _createIcon(apps[a], a),
          tooltip : iter.description,
          onClick: (function(name, iter) {
            return function() {
              API.launch(name);
            };
          })(a, apps[a])
        });
      }
    }
    GUI.createMenu(list, {x: ev.clientX, y: ev.clientY});
  }

  /**
   * Create default application menu with categories (sub-menus)
   */
  function BuildCategoryMenu(ev) {
    var apps = API.getHandlerInstance().getApplicationsMetadata();
    var list = [];
    var cats = {};

    var c, a, iter, cat, submenu;

    for ( c in DefaultCategories ) {
      if ( DefaultCategories.hasOwnProperty(c) ) {
        cats[c] = [];
      }
    }

    for ( a in apps ) {
      if ( apps.hasOwnProperty(a) ) {
        iter = apps[a];
        if ( iter.type !== "application" ) { continue; }
        cat = iter.category && cats[iter.category] ? iter.category : 'unknown';
        cats[cat].push({name: a, data: iter})
      }
    }

    for ( c in cats ) {
      if ( cats.hasOwnProperty(c) ) {
        submenu = [];
        for ( a = 0; a < cats[c].length; a++ ) {
          iter = cats[c][a];
          submenu.push({
            title: iter.data.name,
            icon: _createIcon(iter.data, iter.name),
            tooltip : iter.data.description,
            onClick: (function(name, iter) {
              return function() {
                API.launch(name);
              };
            })(iter.name, iter.data)
          });
        }

        if ( submenu.length ) {
          list.push({
            title: _(DefaultCategories[c].title),
            icon:  API.getThemeResource(DefaultCategories[c].icon, 'icon', '16x16'),
            menu:  submenu
          });
        }
      }
    }

    GUI.createMenu(list, {x: ev.clientX, y: ev.clientY});
  }

  /////////////////////////////////////////////////////////////////////////////
  // ICON VIEW
  /////////////////////////////////////////////////////////////////////////////

  var DesktopIconView = function(wm) {
    var self = this;
    var opts = {
      data : [{
        icon: API.getThemeResource('places/folder_home.png', 'icon', '32x32'),
        label: 'Home',
        launch: 'ApplicationFileManager',
        index: 0,
        args: {path: '/'}
      }],
      onActivate : function(ev, el, item) {
        if ( typeof item.launch === 'undefined' ) {
          API.open(item.args);
        } else {
          API.launch(item.launch, item.args);
        }
      },
      onViewContextMenu : function(ev) {
        if ( wm ) {
          wm.openDesktopMenu(ev);
        }
      },
      onContextMenu : function(ev, el, item) {
        var pos = {x: ev.clientX, y: ev.clientY};
        OSjs.GUI.createMenu([{
          title: _('Remove shortcut'),
          disabled: item.index === 0,
          onClick: function() {
            if ( item.launch ) { return; }

            self.removeShortcut(item, wm);
          }
        }], pos)
      }
    };
    GUI.IconView.apply(this, ['CoreWMDesktopIconView', opts]);

    // IMPORTANT
    this._addHook('blur', function() {
      self.setSelected(null, null);
    });
  };

  DesktopIconView.prototype = Object.create(GUI.IconView.prototype);

  DesktopIconView.prototype.update = function(wm) {
    GUI.IconView.prototype.update.apply(this, arguments);

    var el = this.getRoot();
    if ( el ) {
      // IMPORTANT Make sure we trigger the default events
      this._addEventListener(el, 'mousedown', function(ev) {
        ev.preventDefault();
        OSjs.GUI.blurMenu();
        API._onMouseDown(ev);
        return false;
      });
      this._addEventListener(el, 'contextmenu', function(ev) {
        ev.preventDefault();
        if ( wm ) {
          wm.openDesktopMenu(ev);
        }
        return false;
      });

      // Make DnD work just like a desktop without iconview
      OSjs.GUI.createDroppable(el, {
        onOver: function(ev, el, args) {
          wm.onDropOver(ev, el, args);
        },

        onLeave : function() {
          wm.onDropLeave();
        },

        onDrop : function() {
          wm.onDrop();
        },

        onItemDropped: function(ev, el, item, args) {
          wm.onDropItem(ev, el, item, args);
        },

        onFilesDropped: function(ev, el, files, args) {
          wm.onDropFile(ev, el, files, args);
        }
      });

      // Restore settings
      var icons = wm.getSetting('desktopIcons') || [];
      if ( icons.length ) {
        for ( var i = 0; i < icons.length; i++ ) {
          this._addShortcut(icons[i])
        }
        this.refresh();
      }
    };
  };

  DesktopIconView.prototype.resize = function(wm) {
    var el = this.getRoot();
    var s  = wm.getWindowSpace();

    if ( el ) {
      el.style.top    = (s.top) + 'px';
      el.style.left   = (s.left) + 'px';
      el.style.width  = (s.width) + 'px';
      el.style.height = (s.height) + 'px';
    }
  };

  DesktopIconView.prototype._save = function(wm) {
    var icons = [];
    for ( var i = 1; i < this.data.length; i++ ) {
      icons.push(this.data[i].args);
    }
    wm.setSetting('desktopIcons', icons);
    wm.saveSettings();
  };

  DesktopIconView.prototype._addShortcut = function(data) {
    this.data.push({
      icon: OSjs.GUI.getFileIcon(data.path, data.mime, null, null, '32x32'),
      label: data.filename,
      index: this.data.length,
      args: data
    });
  };

  DesktopIconView.prototype.addShortcut = function(data, wm) {
    this._addShortcut(data);

    if ( wm ) {
      this._save(wm);
    }

    this.refresh();
  };

  DesktopIconView.prototype.removeShortcut = function(data, wm) {
    var iter;
    for ( var i = 1; i < this.data.length; i++ ) {
      iter = this.data[i];
      if ( iter.index == data.index ) {
        this.data.splice(i, 1);
        break;
      }
    }

    if ( wm ) {
      this._save(wm);
    }

    this.refresh();
  };

  DesktopIconView.prototype.removeShortcutByPath = function(path) {
    var self = this;
    this.data.forEach(function(iter) {
      if ( iter.args.path === path ) {
        self.removeShortcut(iter);
        return false;
      }
      return true;
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems        = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.BuildMenu         = BuildMenu;
  OSjs.Applications.CoreWM.BuildCategoryMenu = BuildCategoryMenu;
  OSjs.Applications.CoreWM.Panel             = Panel;
  OSjs.Applications.CoreWM.PanelItem         = PanelItem;
  OSjs.Applications.CoreWM.WindowSwitcher    = WindowSwitcher;
  OSjs.Applications.CoreWM.DesktopIconView   = DesktopIconView;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
