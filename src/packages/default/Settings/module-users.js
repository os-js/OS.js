/*!
 * OS.js - JavaScript Cloud/Web User Platform
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
(function(Application, Window, Utils, API, User, GUI) {
  'use strict';

  function renderUsers(win, scheme) {
    API.call('users', {command: 'list'}, function(err, users) {
      if ( users instanceof Array ) {
        win._find('UsersList').clear().add(users.map(function(iter, idx) {
          return {
            value: iter,
            columns: [
              {label: iter.username},
              {label: iter.name}
            ]
          };
        }));
      }
    });
  }

  function showDialog(win, scheme, data, passwd) {
    var _ = OSjs.Applications.ApplicationSettings._;

    data = data || {};
    win._toggleDisabled(true);

    if ( passwd ) {
      API.createDialog('Input', {
        message: _('Set user password'),
        type: 'password'
      }, function(ev, button, value) {
        if ( !value ) {
          win._toggleDisabled(false);
          return;
        }

        API.call('users', {command: 'passwd', user: {password: value}}, function(err, users) {
          win._toggleDisabled(false);
          if ( err ) {
            API.error('Settings', _('Error while managing users'), err);
          }
          renderUsers(win, scheme);
        });
      });
      return;
    }

    var nwin = new Window('SettingsUserWindow', {
      icon: win._app.__metadata.icon,
      title: win._app.__metadata.name,
      width: 400,
      height: 250
    }, win._app, scheme);

    nwin._on('destroy', function(root) {
      win._toggleDisabled(false);
    });

    nwin._on('init', function(root) {
      var self = this;

      scheme.render(this, this._name, root)

      if ( Object.keys(data).length ) {
        scheme.find(self, 'UserUsername').set('value', data.username);
        scheme.find(self, 'UserName').set('value', data.name);
        scheme.find(self, 'UserGroups').set('value', JSON.stringify(data.groups));
      }

      scheme.find(this, 'ButtonClose').on('click', function() {
        self._close();
      });

      scheme.find(this, 'ButtonOK').on('click', function() {
        data.username = scheme.find(self, 'UserUsername').get('value');
        data.name = scheme.find(self, 'UserName').get('value') || data.username;
        data.groups = [];

        try {
          data.groups = JSON.parse(scheme.find(self, 'UserGroups').get('value'));
        } catch ( e ) {
        }

        if ( !data.username || !data.groups ) {
          return self._close();
        }

        API.call('users', {command: 'edit', user: data}, function(err, users) {
          if ( err ) {
            API.error('Settings', _('Error while managing users'), err);
          }
          renderUsers(win, scheme);

          self._close();
        });
      });
    });

    return win._addChild(nwin, true, true);
  }

  function removeUser(win, scheme, data) {
    var _ = OSjs.Applications.ApplicationSettings._;

    API.call('users', {command: 'remove', user: {id: data.id}}, function(err, users) {
      if ( err ) {
        API.error('Settings', _('Error while managing users'), err);
      }
      renderUsers(win, scheme);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // MODULE
  /////////////////////////////////////////////////////////////////////////////

  var module = {
    group: 'system',
    name: 'Users',
    label: 'LBL_USERS',
    icon: 'apps/system-users.png',
    button: false,

    init: function() {
    },

    update: function(win, scheme, settings, wm) {
      renderUsers(win, scheme);
    },

    render: function(win, scheme, root, settings, wm) {
      function _action(cb, te) {
        var sel = win._find('UsersList').get('selected');
        if ( sel && sel.length ) {
          cb(sel[0].data)
        } else {
          if ( te ) {
            cb(null);
          }
        }
      }
      win._find('UsersAdd').on('click', function() {
        _action(function(data) {
          showDialog(win, scheme, data)
        }, true);
      });
      win._find('UsersRemove').on('click', function() {
        _action(function(data) {
          removeUser(win, scheme, data);
        });
      });
      win._find('UsersEdit').on('click', function() {
        _action(function(data) {
          showDialog(win, scheme, data)
        });
      });
      win._find('UsersPasswd').on('click', function() {
        _action(function(data) {
          showDialog(win, scheme, null, true)
        });
      });
    },

    save: function(win, scheme, settings, wm) {
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Modules = OSjs.Applications.ApplicationSettings.Modules || {};
  OSjs.Applications.ApplicationSettings.Modules.Users = module;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.User, OSjs.GUI);
