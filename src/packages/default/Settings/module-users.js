/*!
 * OS.js - JavaScript Cloud/Web User Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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

/*eslint valid-jsdoc: "off"*/
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

        API.call('users', {command: 'passwd', user: {password: value, username: passwd}}, function(err, users) {
          win._toggleDisabled(false);
          if ( err ) {
            API.error('Settings', _('Error while managing users'), err);
          }
          renderUsers(win, scheme);
        });
      });
      return;
    }

    var action = data === null ? 'add' : 'edit';
    data = data || {};

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
      nwin._render(nwin._name);

      if ( Object.keys(data).length ) {
        nwin._find('UserUsername').set('value', data.username);
        nwin._find('UserName').set('value', data.name);
        nwin._find('UserGroups').set('value', JSON.stringify(data.groups));
      }

      nwin._find('ButtonClose').on('click', function() {
        nwin._close();
      });

      nwin._find('ButtonOK').on('click', function() {
        data.username = nwin._find('UserUsername').get('value');
        data.name = nwin._find('UserName').get('value') || data.username;
        data.groups = [];

        var groupString = nwin._find('UserGroups').get('value');
        if ( groupString.substr(0, 1) === '[' ) {
          try {
            data.groups = JSON.parse(groupString);
          } catch ( e ) {
          }
        } else {
          data.groups = groupString.replace(/\s/, '').split(',');
        }

        if ( !data.username || !data.groups ) {
          nwin._close();
          return;
        }

        API.call('users', {command: action, user: data}, function(err, users) {
          if ( err ) {
            API.error('Settings', _('Error while managing users'), err);
          }
          renderUsers(win, scheme);

          nwin._close();
        });
      });
    });

    win._addChild(nwin, true, true);
  }

  function removeUser(win, scheme, data) {
    var _ = OSjs.Applications.ApplicationSettings._;

    API.call('users', {command: 'remove', user: data}, function(err, users) {
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

    compatible: function() {
      var cfg = API.getConfig('Connection.Authenticator');
      return ['demo', 'pam', 'shadow'].indexOf(cfg) === -1;
    },

    init: function() {
    },

    update: function(win, scheme, settings, wm) {
      renderUsers(win, scheme);
    },

    render: function(win, scheme, root, settings, wm) {
      function _action(cb, te) {
        var sel = win._find('UsersList').get('selected');
        if ( sel && sel.length ) {
          var data = sel[0].data;
          data._username = data.username;
          cb(data);
        } else {
          if ( te ) {
            cb(null);
          }
        }
      }
      win._find('UsersAdd').on('click', function() {
        showDialog(win, scheme, null);
      });
      win._find('UsersRemove').on('click', function() {
        _action(function(data) {
          removeUser(win, scheme, data);
        });
      });
      win._find('UsersEdit').on('click', function() {
        _action(function(data) {
          showDialog(win, scheme, data);
        });
      });
      win._find('UsersPasswd').on('click', function() {
        _action(function(data) {
          showDialog(win, scheme, null, data.username);
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
