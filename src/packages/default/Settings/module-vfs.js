/*!
 * OS.js - JavaScript Cloud/Web VFS Platform
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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  function MountWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationFileManagerMountWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 440
    }, app, scheme]);
  }

  MountWindow.prototype = Object.create(Window.prototype);
  MountWindow.constructor = Window.prototype;

  MountWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'MountWindow', root, null, null, {
      _: OSjs.Applications.ApplicationSettings._
    });

    win._find('ButtonClose').on('click', function() {
      self._close();
    });

    win._find('ButtonOK').on('click', function() {
      var conn = {
        type: scheme.find(self, 'MountType').get('value'),
        name: scheme.find(self, 'MountName').get('value'),
        description: scheme.find(self, 'MountDescription').get('value'),
        options: {
          host: scheme.find(self, 'MountHost').get('value'),
          ns: scheme.find(self, 'MountNamespace').get('value'),
          username: scheme.find(self, 'MountUsername').get('value'),
          password: scheme.find(self, 'MountPassword').get('value'),
          cors: scheme.find(self, 'MountCORS').get('value')
        }
      };

      try {
        VFS.Helpers.createMountpoint(conn);
      } catch ( e ) {
        API.error(self._title, 'An error occured while trying to mount', e);
        console.warn(e.stack, e);
        return;
      }

      self._close();
    });

    return root;
  };

  MountWindow.prototype.destroy = function() {
    return Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  var module = {
    group: 'system',
    name: 'VFS',
    icon: 'devices/harddrive.png',
    watch: ['VFS'],

    init: function(app) {
    },

    update: function(win, scheme, settings, wm) {
      var vfsOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
      var scandirOptions = vfsOptions.scandir || {};

      win._find('ShowFileExtensions').set('value', scandirOptions.showFileExtensions === true);
      win._find('ShowHiddenFiles').set('value', scandirOptions.showHiddenFiles === true);
    },

    render: function(win, scheme, root, settings, wm) {
    },

    save: function(win, scheme, settings, wm) {
      var vfsSettings = {
        scandir: {
          showHiddenFiles: win._find('ShowHiddenFiles').get('value'),
          showFileExtensions: win._find('ShowFileExtensions').get('value')
        }
      };

      return function(cb) {
        var sm = OSjs.Core.getSettingsManager();
        sm.instance('VFS').set(null, vfsSettings, cb, false);
      };
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Modules = OSjs.Applications.ApplicationSettings.Modules || {};
  OSjs.Applications.ApplicationSettings.Modules.VFS = module;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
