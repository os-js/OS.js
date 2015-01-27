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
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationSettingsWindow = function(app, metadata) {
    Window.apply(this, ['ApplicationSettingsWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 500,
      height: 450,
      allow_drop: true,
      allow_maximize: false,
      allow_resize: false
    }, app]);

    this.$side = null;
    this.$content = null;
    this.$header = null;
    this.modules = {};
    this.settings = {};
  };

  ApplicationSettingsWindow.prototype = Object.create(Window.prototype);

  ApplicationSettingsWindow.prototype.init = function(wmRef, app) {
    var _ = OSjs.Applications.ApplicationSettings._;
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    function _createIcon(iter) {
      iter = iter || 'status/gtk-dialog-question.png';
      return OSjs.API.getIcon(iter, null, '32x32');
    }

    var columns = [
      {key: 'name', title: 'name', visible: false},
      {key: 'icon', title: 'Icon', type: 'image', domProperties: {width: 32}},
      {key: 'title', title: 'Title'}
    ];

    this.settings = Utils.cloneObject(wmRef.getSettings());
    delete this.settings.desktopIcons;
    delete this.settings.fullscreen;
    delete this.settings.moveOnResize;

    this.$side = document.createElement('div');
    this.$side.className = 'Side';

    this.$content = document.createElement('div');
    this.$content.className = 'Content';

    this.$header = document.createElement('div');
    this.$header.className = 'Header';

    var sidePanel = this._addGUIElement(new GUI.ListView('SettingsNewSideView', {
      singleClick: true,
      columns: columns,
      onSelect: function(ev, el, item) {
        self.setCategory(item);
      }
    }), this.$side);

    var modules = OSjs.Applications.ApplicationSettings.Modules;
    var rows = [];

    modules.forEach(function(m, i) {
      rows.push({
        name: m.name,
        title: m.title.match(/^[A-Z]*_/) ? API._(m.title) : _(m.title),
        icon: _createIcon(m.icon)
      });
      self.modules[m.name] = m.onCreate(self, self.$content, self.settings);
    });
    sidePanel.setRows(rows);
    sidePanel.render();

    root.appendChild(this.$side);
    root.appendChild(this.$header);
    root.appendChild(this.$content);

    this._addGUIElement(new GUI.Button('SettingsNewSave', {label: API._('LBL_SAVE'), onClick: function() {
      self.applySettings();
    }}), root);

    return root;
  };

  ApplicationSettingsWindow.prototype._inited = function() {
    Window.prototype._inited.apply(this, arguments);

    var sidePanel = this._getGUIElement('SettingsNewSideView');
    if ( sidePanel ) {
      var found = false;
      var set = this._appRef._getArgument('category');
      if ( set ) {
        var modules = OSjs.Applications.ApplicationSettings.Modules;
        modules.forEach(function(m, i) {
          if ( m.name === set ) {
            sidePanel.setSelectedIndex(i);
            found = true;
          }
          return found ? false : true;
        });
      }

      if ( !found ) {
        sidePanel.setSelectedIndex(0);
      }
    }
  };

  ApplicationSettingsWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) return;

    var self = this;
    OSjs.Applications.ApplicationSettings.Modules.forEach(function(m) {
      if ( m.onDnD ) {
        m.onDnD(self, ev, type, item, args);
      }
    });
  };

  ApplicationSettingsWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);

    this.$side = null;
    this.$content = null;
    this.$header = null;
    this.modules = [];
  };

  ApplicationSettingsWindow.prototype.applySettings = function() {
    var self = this;
    var modules = OSjs.Applications.ApplicationSettings.Modules;
    modules.forEach(function(m) {
      m.applySettings(self, self.settings);
    });

    var wm = OSjs.Core.getWindowManager();
    wm.applySettings(this.settings, false, true);
  };

  ApplicationSettingsWindow.prototype.createColorDialog = function(cur, callback) {
    var self = this;
    this._appRef._createDialog('Color', [{color: cur}, function(btn, rgb, hex) {
      self._focus();
      if ( btn !== 'ok' ) {return; }

      callback(hex);
    }], this);
  };

  ApplicationSettingsWindow.prototype.createFileDialog = function(cur, callback) {
    var curf = cur ? Utils.dirname(cur) : API.getDefaultPath('/');
    var curn = cur ? Utils.filename(cur) : '';

    var self = this;
    this._appRef._createDialog('File', [{type: 'open', path: curf, filename: curn, mimes: ['^image']}, function(btn, file) {
      self._focus();
      if ( btn !== 'ok' ) {return; }
      callback(file.path);
    }], this);
  };

  ApplicationSettingsWindow.prototype.createFontDialog = function(cur, callback) {
    var self = this;
    this._appRef._createDialog('Font', [{name: cur, minSize: 0, maxSize: 0}, function(btn, fontName, fontSize) {
      self._focus();
      if ( btn !== 'ok' ) {return; }
      callback(fontName);
    }], this);
  };

  ApplicationSettingsWindow.prototype.setCategory = function(item) {
    Utils.$empty(this.$header);
    this.$content.childNodes.forEach(function(node) {
      node.style.display = 'none';
    });

    if ( this.modules[item.name] ) {
      this.modules[item.name].style.display = 'block';
      var title = OSjs.Applications.ApplicationSettings._(item.title);
      this.$header.appendChild(document.createTextNode(title));
    }

    this._updateGUIElements();
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationSettings = function(args, metadata) {
    Application.apply(this, ['ApplicationSettings', args, metadata]);
  };

  ApplicationSettings.prototype = Object.create(Application.prototype);

  ApplicationSettings.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationSettings.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);
    this._addWindow(new ApplicationSettingsWindow(this, metadata));
  };

  ApplicationSettings.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);
    if ( msg === 'destroyWindow' && obj._name === 'ApplicationSettingsWindow' ) {
      this.destroy();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Class = ApplicationSettings;
  OSjs.Applications.ApplicationSettings.Modules = OSjs.Applications.ApplicationSettings.Modules || [];

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
