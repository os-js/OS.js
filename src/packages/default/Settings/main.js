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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  var DEFAULT_GROUP = 'misc';

  var _groups = {
    personal: {
      label: 'LBL_PERSONAL'
    },
    system: {
      label: 'LBL_SYSTEM'
    },
    user: {
      label: 'LBL_USER'
    },
    misc: {
      label: 'LBL_OTHER'
    }
  };

  var categoryMap = {
    'theme': 'Theme',
    'desktop': 'Desktop',
    'panel': 'Panel',
    'user': 'User',
    'fileview': 'VFS',
    'search': 'Search'
  };

  /////////////////////////////////////////////////////////////////////////////
  // DIALOGS
  /////////////////////////////////////////////////////////////////////////////

  function SettingsItemDialog(app, metadata, scheme, callback) {
    Window.apply(this, ['ApplicationSettingsGenericsWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 300
    }, app, scheme]);

    this.callback = callback;
    this.closed = false;
  }

  SettingsItemDialog.prototype = Object.create(Window.prototype);
  SettingsItemDialog.constructor = Window;

  SettingsItemDialog.prototype.init = function(wm, app, scheme) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    // Load and set up scheme (GUI) here
    scheme.render(this, 'SettingsItemWindow', root, null, null, {
      _: OSjs.Applications.ApplicationSettings._
    });

    scheme.find(this, 'ButtonItemOK').on('click', function() {
      self.closed = true;
      var selected = scheme.find(self, 'List').get('selected');
      self.callback('ok', selected.length ? selected[0] : null);
      self._close();
    });

    scheme.find(this, 'ButtonItemCancel').on('click', function() {
      self._close();
    });

    return root;
  };

  SettingsItemDialog.prototype._close = function() {
    if ( !this.closed ) {
      this.callback('cancel');
    }
    return Window.prototype._close.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationSettingsWindow(app, metadata, scheme, initialCategory) {
    Window.apply(this, ['ApplicationSettingsWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 500,
      height: 450,
      allow_resize: true
    }, app, scheme]);

    this.initialCategory = initialCategory;
  }

  ApplicationSettingsWindow.prototype = Object.create(Window.prototype);
  ApplicationSettingsWindow.constructor = Window.prototype;

  ApplicationSettingsWindow.prototype.init = function(wmRef, app, scheme) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    var wm = OSjs.Core.getWindowManager();
    var _ = OSjs.Applications.ApplicationSettings._;

    // Load and render `scheme.html` file
    scheme.render(this, 'SettingsWindow', root, null, null, {_: _});

    this._find('ButtonOK').son('click', this, this.onButtonOK);
    this._find('ButtonCancel').son('click', this, this.onButtonCancel);

    // Adds all groups and their respective entries
    var container = document.createElement('div');
    container.className = 'ListView gui-generic-zebra-container';

    var containers = {};
    var tmpcontent = document.createDocumentFragment();

    Object.keys(_groups).forEach(function(k) {
      var c = document.createElement('ul');
      var h = document.createElement('span');
      var d = document.createElement('div');

      d.className = 'gui-generic-double-padded';
      h.appendChild(document.createTextNode(_(_groups[k].label)));

      containers[k] = c;

      d.appendChild(h);
      d.appendChild(c);
      container.appendChild(d);
    });

    app.modules.forEach(function(m) {
      if ( containers[m.group] ) {
        var i = document.createElement('img');
        i.setAttribute('src', API.getIcon(m.icon, '32x32'));
        i.setAttribute('title', m.name);

        var s = document.createElement('span');
        s.appendChild(document.createTextNode(_(m.label || m.name)));

        var c = document.createElement('li');
        c.className = 'gui-generic-hoverable';
        c.setAttribute('data-module', String(m.name));
        c.appendChild(i);
        c.appendChild(s);

        containers[m.group].appendChild(c);

        root.querySelector('[data-module="' + m.name +  '"]').className  = 'gui-generic-padded';

        var settings = Utils.cloneObject(wm.getSettings());
        m.render(self, scheme, tmpcontent, settings, wm);
        m.update(self, scheme, settings, wm);
        m._inited = true;
      }
    });

    Object.keys(containers).forEach(function(k) {
      if ( !containers[k].children.length ) {
        containers[k].parentNode.style.display = 'none';
      }
    });

    Utils.$bind(container, 'click', function(ev) {
      var t = ev.isTrusted ? ev.target : (ev.relatedTarget || ev.target);
      if ( t && t.tagName === 'LI' && t.hasAttribute('data-module') ) {
        ev.preventDefault();
        var m = t.getAttribute('data-module');
        self.onModuleSelect(m);
      }
    }, true);

    root.querySelector('[data-id="ContainerSelection"]').appendChild(container);

    containers = {};
    tmpcontent = null;

    if ( this.initialCategory ) {
      this.onExternalAttention(this.initialCategory);
    }

    return root;
  };

  ApplicationSettingsWindow.prototype.destroy = function() {
    // This is where you remove objects, dom elements etc attached to your
    // instance. You can remove this if not used.
    if ( Window.prototype.destroy.apply(this, arguments) ) {
      this.currentModule = null;

      return true;
    }
    return false;
  };

  ApplicationSettingsWindow.prototype.onModuleSelect = function(name) {
    var _ = OSjs.Applications.ApplicationSettings._;
    var wm = OSjs.Core.getWindowManager();
    var root = this._$element;
    var self = this;

    function _d(d) {
      root.querySelector('[data-id="ContainerSelection"]').style.display = d ? 'block' : 'none';
      root.querySelector('[data-id="ContainerContent"]').style.display = d ? 'none' : 'block';
      root.querySelector('[data-id="ContainerButtons"]').style.display = d ? 'none' : 'block';
    }

    root.querySelectorAll('div[data-module]').forEach(function(mod) {
      mod.style.display = 'none';
    });

    _d(true);

    this._setTitle(null);

    var found;
    if ( name ) {
      this._app.modules.forEach(function(m) {
        if ( !found && m.name === name ) {
          found = m;
        }
      });
    }

    if ( found ) {
      var mod = root.querySelector('div[data-module="' + found.name +  '"]');
      if ( mod ) {
        mod.style.display = 'block';
        var settings = Utils.cloneObject(wm.getSettings());
        found.update(this, this._scheme, settings, wm, true);

        _d(false);
        this._setTitle(_(found.name), true);

        if ( found.button === false ) {
          this._find('ButtonOK').hide();
        } else {
          this._find('ButtonOK').show();
        }
      }
    } else {
      if ( !name ) { // Resets values to original (or current)
        var settings = Utils.cloneObject(wm.getSettings());
        this._app.modules.forEach(function(m) {
          if ( m._inited ) {
            m.update(self, self._scheme, settings, wm);
          }
        });
      }
    }

    this._app.setModule(found);
  };

  ApplicationSettingsWindow.prototype.onButtonOK = function() {
    var self = this;
    var settings = {};
    var wm = OSjs.Core.getWindowManager();

    this._app.modules.forEach(function(m) {
      if ( m._inited ) {
        var res = m.save(self, self._scheme, settings, wm);
        if ( typeof res === 'function' ) {
          res();
        }
      }
    });

    this._toggleLoading(true);
    this._app.saveSettings(settings, function() {
      self._toggleLoading(false);
    });
  };

  ApplicationSettingsWindow.prototype.onButtonCancel = function() {
    this.onModuleSelect(null);
  };

  ApplicationSettingsWindow.prototype.onExternalAttention = function(cat) {
    this.onModuleSelect(categoryMap[cat] || cat);
    this._focus();
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationSettings(args, metadata) {
    Application.apply(this, ['ApplicationSettings', args, metadata]);

    var self = this;
    var registered = OSjs.Applications.ApplicationSettings.Modules;

    this.watches = {};
    this.currentModule = null;

    this.modules = Object.keys(registered).map(function(name) {
      var opts = Utils.argumentDefaults(registered[name], {
        _inited: false,
        name: name,
        group: DEFAULT_GROUP,
        icon: 'status/error.png',
        init: function() {},
        update: function() {},
        render: function() {},
        save: function() {}
      });

      if ( Object.keys(_groups).indexOf(opts.group) === -1 ) {
        opts.group = DEFAULT_GROUP;
      }

      Object.keys(opts).forEach(function(k) {
        if ( typeof opts[k] === 'function' ) {
          opts[k] = opts[k].bind(opts);
        }
      });

      return opts;
    });

    this.modules.forEach(function(m) {
      m.init(self);

      if ( m.watch && m.watch instanceof Array ) {
        m.watch.forEach(function(w) {
          self.watches[m.name] = OSjs.Core.getSettingsManager().watch(w, function() {
            var win = self._getMainWindow();
            if ( m && win ) {
              if ( self.currentModule && self.currentModule.name === m.name ) {
                win.onModuleSelect(m.name);
              }
            }
          });
        });
      }
    });
  }

  ApplicationSettings.prototype = Object.create(Application.prototype);
  ApplicationSettings.constructor = Application;

  ApplicationSettings.prototype.destroy = function() {
    // This is where you remove objects, dom elements etc attached to your
    // instance. You can remove this if not used.
    if ( Application.prototype.destroy.apply(this, arguments) ) {

      var self = this;
      Object.keys(this.watches).forEach(function(k) {
        OSjs.Core.getSettingsManager().unwatch(self.watches[k]);
      });
      this.watches = {};

      return true;
    }
    return false;
  };

  ApplicationSettings.prototype.init = function(settings, metadata, scheme) {
    Application.prototype.init.apply(this, arguments);

    var category = this._getArgument('category') || settings.category;
    var win = this._addWindow(new ApplicationSettingsWindow(this, metadata, scheme, category));

    this._on('attention', function(args) {
      if ( win && args.category ) {
        win.onExternalAttention(args.category);
      }
    });
  };

  ApplicationSettings.prototype.saveSettings = function(settings, cb) {
    var wm = OSjs.Core.getWindowManager();
    wm.applySettings(settings);
    OSjs.Core.getSettingsManager().save(null, cb);
  };

  ApplicationSettings.prototype.setModule = function(m) {
    this.currentModule = m;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Class = Object.seal(ApplicationSettings);
  OSjs.Applications.ApplicationSettings.Modules = OSjs.Applications.ApplicationSettings.Modules || {};
  OSjs.Applications.ApplicationSettings.SettingsItemDialog = SettingsItemDialog;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
