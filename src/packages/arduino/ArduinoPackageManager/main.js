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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoPackageManagerWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationArduinoPackageManagerWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 500,
      height: 400
    }, app, scheme]);

    this.currentView = 'all';
    this.currentPackage = null;
  }

  ApplicationArduinoPackageManagerWindow.prototype = Object.create(Window.prototype);
  ApplicationArduinoPackageManagerWindow.constructor = Window.prototype;

  ApplicationArduinoPackageManagerWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'ArduinoPackageManagerWindow', root);

    scheme.find(this, 'SelectView').on('change', function(ev) {
      self.selectView(ev.detail);
    });

    scheme.find(this, 'PackageView').on('select', function(ev) {
      self.selectPackage(ev.detail.entries[0].data);
    });

    scheme.find(this, 'ButtonRefresh').on('click', function() {
      self.selectView();
    });

    scheme.find(this, 'ButtonInstall').on('click', function() {
      if ( self.currentPackage ) {
        app.callOpkg('install', {packagename: self.currentPackage}, function() {
          self.selectView();
        });
      }
    }).set('disabled', true);

    scheme.find(this, 'ButtonImport').on('click', function() {
      app.openDialog();
    });

    scheme.find(this, 'ButtonUpdate').on('click', function() {
      if ( self.currentPackage ) {
        app.callOpkg('upgrade', {packagename: self.currentPackage}, function() {
          self.selectView();
        });
      }
    }).set('disabled', true);

    scheme.find(this, 'ButtonRemove').on('click', function() {
      if ( self.currentPackage ) {
        app.callOpkg('remove', {packagename: self.currentPackage}, function() {
          self.selectView();
        });
      }
    }).set('disabled', true);

    scheme.find(this, 'ButtonRefresh').on('click', function() {
      self.selectView();
    });

    this.selectView();

    return root;
  };

  ApplicationArduinoPackageManagerWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationArduinoPackageManagerWindow.prototype.selectView = function(s) {
    var self = this;
    var view = s || this.currentView;

    this.currentView = view;
    this.currentPackage = null;

    this._app.callOpkg('list', {category: view}, function(err, result) {
      self.renderView(result);
    });
  };

  ApplicationArduinoPackageManagerWindow.prototype.selectPackage = function(pkg) {
    this.currentPackage = pkg;

    var buttonInstall = this._scheme.find(this, 'ButtonInstall').set('disabled', true);
    var buttonUpdate = this._scheme.find(this, 'ButtonUpdate').set('disabled', true);
    var buttonRemove = this._scheme.find(this, 'ButtonRemove').set('disabled', true);

    if ( this.currentView === 'all' ) {
      buttonInstall.set('disabled', false);
    } else if ( this.currentView === 'installed' ) {
      buttonUpdate.set('disabled', false);
      buttonRemove.set('disabled', false);
    } else {
      buttonUpdate.set('disabled', false);
      buttonRemove.set('disabled', false);
    }
  };

  ApplicationArduinoPackageManagerWindow.prototype.renderView = function(data) {
    var packageView = this._scheme.find(this, 'PackageView');
    var rows = [];

    (data || []).forEach(function(iter) {
      var spl = iter.split(' - ');
      rows.push({
        value: spl[0],
        columns: [
          {label: spl[0]},
          {label: spl[1], textalign: 'right'}
        ]
      });
    });

    packageView.clear();
    packageView.set('columns', [
      {label: 'Name', basis: '100px', grow: 1, shrink: 1},
      {label: 'Version', basis: '60px', grow: 0, shrink: 0, textalign: 'right'}
    ]);
    packageView.add(rows);

    var buttonInstall = this._scheme.find(this, 'ButtonInstall');
    buttonInstall.set('disabled', true);
    var buttonUpdate = this._scheme.find(this, 'ButtonUpdate');
    buttonUpdate.set('disabled', true);
    var buttonRemove = this._scheme.find(this, 'ButtonRemove');
    buttonRemove.set('disabled', true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoPackageManager(args, metadata) {
    Application.apply(this, ['ApplicationArduinoPackageManager', args, metadata]);

    this.startupArgs = args;
  }

  ApplicationArduinoPackageManager.prototype = Object.create(Application.prototype);
  ApplicationArduinoPackageManager.constructor = Application;

  ApplicationArduinoPackageManager.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationArduinoPackageManager.prototype.init = function(settings, metadata, onInited) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationArduinoPackageManagerWindow(self, metadata, scheme));
      onInited();
      self.checkArguments(self.startupArgs);
    });

    this._setScheme(scheme);
  };

  ApplicationArduinoPackageManager.prototype._onMessage = function(obj, msg, args) {
    if ( Application.prototype._onMessage.apply(this, arguments) ) {
      if ( msg === 'attention' && args ) {
        this.checkArguments(args);
      }
      return true;
    }
    return false;
  };

  ApplicationArduinoPackageManager.prototype.checkArguments = function(args) {
    if ( args ) {
      if ( args.install ) {
        this.callOpkg('install', {packagename: args.install}, function() {});
      } else if ( args.remove ) {
        this.callOpkg('remove', {packagename: args.install}, function() {});
      } else if ( args.upgrade ) {
        this.callOpkg('upgrade', {packagename: args.install}, function() {});
      }
    }
  };

  ApplicationArduinoPackageManager.prototype.openDialog = function(cb) {
    var self = this;
    var win = this._getMainWindow();

    win._toggleDisabled(true);

    API.createDialog('File', {
      path: 'home:///',
      filter: self.__metadata.mime
    }, function(ev, button, result) {
      win._toggleDisabled(false);

      if ( button === 'ok' && result ) {
        self.openPackage(result);
      }
    }, win);
  };

  ApplicationArduinoPackageManager.prototype.callAPI = function(fn, args, cb) {
    var win = this._getMainWindow();
    win._toggleLoading(true);
    API.call(fn, args, function(response) {
      win._toggleLoading(false);
      return cb(response.error, response.result);
    });
  };

  ApplicationArduinoPackageManager.prototype.callOpkg = function(name, args, cb) {
    var wm = OSjs.Core.getWindowManager();
    var win = this._getMainWindow();
    var dialog;

    if ( (['install', 'upgrade', 'remove', 'update']).indexOf(name) >= 0 ) {
      dialog = API.createDialog('FileProgress', {
        title: 'Performing opkg ' + name,
        message: 'Please wait...'
      }, function(btn) {
      });
    }

    this.callAPI('opkg', {command: name, args: args}, function(err, stdout) {
      if ( dialog ) {
        try {
          dialog.setProgress(100);
          dialog._close();
        } catch ( e ) {}

        if ( wm ) {
          wm.notification({
            icon: 'apps/update-manager.png',
            title: 'opkg result',
            message: stdout.replace('\n', '\n\n')
          });
        }
      }

      dialog = null;

      cb(err, (stdout || '').split('\n'));
    });
  };

  ApplicationArduinoPackageManager.prototype.openPackage = function(file) {
    var win = this._getMainWindow();
    this.callOpkg('install', {filename: file.path}, function(err, result) {
      console.warn(result);
      win.selectView();
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationArduinoPackageManager = OSjs.Applications.ApplicationArduinoPackageManager || {};
  OSjs.Applications.ApplicationArduinoPackageManager.Class = ApplicationArduinoPackageManager;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
