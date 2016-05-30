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
(function(WindowManager, Window, GUI, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // SHORTCUT DIALOG
  /////////////////////////////////////////////////////////////////////////////

  function IconViewShortcutDialog(item, scheme, closeCallback) {
    Window.apply(this, ['IconViewShortcutDialog', {
      title: 'Clock Settings',
      icon: 'status/appointment-soon.png',
      width: 400,
      height: 200,
      allow_maximize: false,
      allow_resize: false,
      allow_minimize: false
    }]);

    this.scheme = scheme;
    this.item = Utils.cloneObject(item);
    this.cb = closeCallback || function() {};
  }

  IconViewShortcutDialog.prototype = Object.create(Window.prototype);
  IconViewShortcutDialog.constructor = Window;

  IconViewShortcutDialog.prototype.init = function(wm, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    this.scheme.render(this, this._name);

    this.scheme.find(this, 'InputShortcutLaunch').set('value', this.item.data.launch);
    this.scheme.find(this, 'InputTooltipFormatString').set('value', JSON.stringify(this.item.data.args || {}));

    this.scheme.find(this, 'ButtonApply').on('click', function() {
      self.applySettings();
      self._close('ok');
    });

    this.scheme.find(this, 'ButtonCancel').on('click', function() {
      self._close();
    });

    return root;
  };

  IconViewShortcutDialog.prototype.applySettings = function() {
    this.item.data.launch = this.scheme.find(this, 'InputShortcutLaunch').get('value');
    this.item.data.args = JSON.parse(this.scheme.find(this, 'InputTooltipFormatString').get('value') || null);
  };

  IconViewShortcutDialog.prototype._close = function(button) {
    this.cb(button, this.item);
    return Window.prototype._close.apply(this, arguments);
  };

  IconViewShortcutDialog.prototype._destroy = function() {
    this.scheme = null;
    return Window.prototype._destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // ICON VIEW
  /////////////////////////////////////////////////////////////////////////////

  function DesktopIconView(wm) {
    var self = this;

    this.dialog = null;
    this.$element = document.createElement('gui-icon-view');
    this.$element.setAttribute('data-multiple', 'false');
    this.$element.setAttribute('no-selection', 'true');
    this.$element.id = 'CoreWMDesktopIconView';

    GUI.Elements['gui-icon-view'].build(this.$element);

    GUI.Helpers.createDroppable(this.$element, {
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

    var cel = new GUI.ElementDataView(this.$element);
    cel.on('activate', function(ev) {
      if ( ev && ev.detail ) {
        ev.detail.entries.forEach(function(entry) {
          var item = entry.data;
          if ( item.launch ) {
            API.launch(item.launch, item.args);
          } else {
            var file = new VFS.File(item);
            API.open(file);
          }
        });
      }
    });

    var defaults = [{
      icon: API.getIcon('places/folder_home.png', '32x32'),
      label: 'Home',
      value: {
        restricted: true,
        launch: 'ApplicationFileManager',
        args: {path: 'home:///'}
      }
    }];

    cel.on('contextmenu', function(ev) {
      if ( ev && ev.detail && ev.detail.entries ) {
        self.createContextMenu(ev.detail.entries[0], {x: ev.detail.x, y: ev.detail.y});
      }
    });

    cel.add(defaults);

    var icons = wm.getSetting('desktopIcons') || [];
    icons.forEach(function(icon) {
      self.addShortcut(icon, wm);
    });

    this.resize(wm);
  }

  DesktopIconView.prototype.destroy = function() {
    Utils.$remove(this.$element);
    this.$element = null;

    if ( this.dialog ) {
      this.dialog.destroy();
    }
    this.dialog = null;
  };

  DesktopIconView.prototype.blur = function() {
    var cel = new GUI.ElementDataView(this.$element);
    cel.set('value', null);
  };

  DesktopIconView.prototype.getRoot = function() {
    return this.$element;
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

  DesktopIconView.prototype._save = function() {
    var cel = new GUI.ElementDataView(this.$element);
    var icons = [];
    try {
      var entries = cel.querySelectorAll('gui-icon-view-entry');

      entries.forEach(function(e) {
        var val = e.getAttribute('data-value');
        var value = null;
        try {
          value = JSON.parse(val);
        } catch ( exc ) {
        }
        if ( value !== null && !value.restricted ) {
          icons.push(value);
        }
      });
    } catch ( e ) {
      console.warn(e.stack, e);
    }

    console.warn(icons);

    var wm = OSjs.Core.getWindowManager();
    wm.applySettings({
      desktopIcons: icons
    }, false, true);
  };

  DesktopIconView.prototype.updateShortcut = function(data) {
    var cel = new GUI.ElementDataView(this.$element);
    var entries = cel.querySelectorAll('gui-icon-view-entry');

    if ( entries[data.index] ) {
      entries[data.index].setAttribute('data-value', JSON.stringify(data.data));
      this._save();
    }
  };

  DesktopIconView.prototype.addShortcut = function(data, wm, save) {
    var cel = new GUI.ElementDataView(this.$element);
    var iter = {};

    // TODO: Check for duplicates

    try {
      if ( data.mime === 'osjs/application' || data.launch ) {
        var appname = data.launch || Utils.filename(data.path);
        var meta = OSjs.Core.getPackageManager().getPackage(appname);

        iter = {
          icon: API.getIcon(meta.icon, '32x32', appname),
          id: appname,
          label: meta.name,
          value: {
            launch: appname,
            args: data.args || {}
          }
        };
      } else {
        iter = {
          icon: API.getFileIcon(data, '32x32'),
          id: data.filename,
          label: data.filename,
          value: {
            filename: data.filename,
            path: data.path,
            type: data.type,
            mime: data.mime
          }
        };
      }

      cel.add(iter);

      if ( save ) {
        this._save();
      }
    } catch ( e ) {
      console.warn(e, e.stack);
    }
  };

  DesktopIconView.prototype.createContextMenu = function(item, ev) {
    var self = this;

    var menu = [{
      title: OSjs.Applications.CoreWM._('Remove shortcut'),
      disabled: item.data.restricted,
      onClick: function() {
        if ( !item.data.restricted ) {
          self.removeShortcut(item);
        }
      }
    }];

    if ( item.data.launch ) {
      menu.push({
        title: OSjs.Applications.CoreWM._('Edit shortcut'),
        disabled: item.data.restricted,
        onClick: function() {
          if ( !item.data.restricted ) {
            self.openShortcutEdit(item);
          }
        }
      });
    }

    if ( menu.length )  {
      API.createMenu(menu, ev);
    }
  };

  DesktopIconView.prototype.removeShortcut = function(data, wm) {
    var cel = new GUI.ElementDataView(this.$element);
    cel.remove(data.index);
    this._save();
  };

  DesktopIconView.prototype.removeShortcutByPath = function(path) {
    var cel = new GUI.ElementDataView(this.$element);
    var self = this;
    try {
      var entries = cel.querySelectorAll('gui-icon-view-entry');
      entries.forEach(function(e, idx) {
        var value = JSON.parse(e.getAttribute('data-value'));
        if ( value.path === path ) {
          self.removeShortcut({index: idx});
        }
      });
    } catch ( e ) {
      console.warn(e.stack, e);
    }
  };

  DesktopIconView.prototype.openShortcutEdit = function(item) {
    if ( this.dialog ) {
      this.dialog._close();
    }

    var self = this;
    var wm = OSjs.Core.getWindowManager();

    this.dialog = new IconViewShortcutDialog(item, wm.scheme, function(button, values) {
      if ( button === 'ok' ) {
        self.updateShortcut(values);
      }
      self.dialog = null;
    });

    wm.addWindow(this.dialog, true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.DesktopIconView   = DesktopIconView;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
