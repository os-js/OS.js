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
      width: 450,
      height: 400
    }, app, scheme]);
  }

  ApplicationArduinoPackageManagerWindow.prototype = Object.create(Window.prototype);
  ApplicationArduinoPackageManagerWindow.constructor = Window.prototype;

  ApplicationArduinoPackageManagerWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'ArduinoPackageManagerWindow', root);

    var packageView = scheme.find(this, 'PackageView');
    packageView.set('columns', [
      {label: 'Name', basis: '100px', grow: 1, shrink: 1},
      {label: 'Version', basis: '60px', grow: 0, shrink: 0, textalign: 'right'}
    ]);

    function callAPI(fn, args, cb) {
      var proc = API.getProcess('ArduinoService', true);
      if ( proc ) {
        self._toggleLoading(true);
        proc.externalCall(fn, args, function(err, response) {
          self._toggleLoading(false);
          return cb(err, response);
        });
      }
    }

    function renderView(data) {
      var rows = [];

      (data || []).forEach(function(iter) {
        var spl = iter.split(' - ');
        rows.push({
          columns: [
            {label: spl[0]},
            {label: spl[1], textalign: 'right'}
          ]
        });
      });

      packageView.clear();
      packageView.add(rows);
    }

    function callOpkg(args, cb) {
      var cmd = 'opkg ' + args.join(' ');
      callAPI('exec', {command: cmd}, function(err, stdout) {
        cb(err, (stdout || '').split('\n'));
      });
    }

    var currentView = 'all';
    function changeView(s) {
      var view = s || currentView;
      var arg = 'list';

      if ( s !== 'all' ) {
        arg += '-' + s;
      }

      callOpkg([arg], function(err, result) {
        renderView(result);
      });
    }

    scheme.find(this, 'SelectView').on('change', function(ev) {
      changeView(ev.detail);
    });
    scheme.find(this, 'ButtonRefresh').on('click', function() {
      changeView();
    });
    scheme.find(this, 'ButtonInstall').on('click', function() {
      changeView();
    });
    scheme.find(this, 'ButtonUpdate').on('click', function() {
      changeView();
    });
    scheme.find(this, 'ButtonRemove').on('click', function() {
      changeView();
    });
    scheme.find(this, 'ButtonRefresh').on('click', function() {
      changeView();
    });

    changeView();

    return root;
  };

  ApplicationArduinoPackageManagerWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationArduinoPackageManager(args, metadata) {
    Application.apply(this, ['ApplicationArduinoPackageManager', args, metadata]);
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
    });

    this._setScheme(scheme);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationArduinoPackageManager = OSjs.Applications.ApplicationArduinoPackageManager || {};
  OSjs.Applications.ApplicationArduinoPackageManager.Class = ApplicationArduinoPackageManager;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
