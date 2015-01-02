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
(function(WindowManager, Window, GUI, Utils, API, VFS) {
  'use strict';

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
          title: OSjs.Applications.CoreWM._('Remove shortcut'),
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

  DesktopIconView.prototype.setForegroundColor = function(hex) {
    hex = hex || 'inherit';
    if ( this.$element ) {
      this.$element.style.color = hex;
    }
  };


  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.DesktopIconView   = DesktopIconView;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
