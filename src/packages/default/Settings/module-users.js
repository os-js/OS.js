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
import Translations from './locales';
const Locales = OSjs.require('core/locales');
const Dialog = OSjs.require('core/dialog');
const Config = OSjs.require('core/config');
const Connection = OSjs.require('core/connection');
const Window = OSjs.require('core/window');
const _ = Locales.createLocalizer(Translations);

function renderUsers(win, scheme) {
  Connection.request('users', {command: 'list'}).then((users) => {
    if ( users instanceof Array ) {
      win._find('UsersList').clear().add(users.map(function(iter, idx) {
        return {
          value: iter,
          columns: [
            {label: iter.id},
            {label: iter.username},
            {label: iter.name}
          ]
        };
      }));
    }
  });
}

function showDialog(win, scheme, data, id) {
  win._toggleDisabled(true);

  if ( id ) {
    Dialog.create('Input', {
      message: _('Set user password'),
      type: 'password'
    }, function(ev, button, value) {
      if ( !value ) {
        win._toggleDisabled(false);
        return;
      }

      Connection.request('users', {command: 'passwd', user: {password: value, id: id}}).then(() => {
        win._toggleDisabled(false);
        renderUsers(win, scheme);
      }).catch((err) => {
        win._toggleDisabled(false);
        OSjs.error('Settings', _('Error while managing users'), err);
      });
    });
    return;
  }

  const action = data === null ? 'add' : 'edit';
  data = data || {};

  const nwin = new Window('SettingsUserWindow', {
    icon: win._app.__metadata.icon,
    title: win._app.__metadata.name,
    width: 400,
    height: 250
  }, win._app);

  nwin._on('destroy', function(root) {
    win._toggleDisabled(false);
  });

  nwin._on('init', function(root) {
    scheme.render(nwin, nwin._name);

    if ( Object.keys(data).length ) {
      nwin._find('UserUsername').set('value', data.username);
      nwin._find('UserName').set('value', data.name);
      nwin._find('UserGroups').set('value', (data.groups || []).join(','));
    }

    nwin._find('ButtonClose').on('click', function() {
      nwin._close();
    });

    nwin._find('ButtonOK').on('click', function() {
      data.username = nwin._find('UserUsername').get('value');
      data.name = nwin._find('UserName').get('value') || data.username;
      data.groups = nwin._find('UserGroups').get('value').replace(/\s/g, '').split(',');

      if ( !data.username || !data.groups ) {
        nwin._close();
        return;
      }

      Connection.request('users', {command: action, user: data}).then(() => {
        renderUsers(win, scheme);
        nwin._close();
      }).catch((err) => {
        OSjs.error('Settings', _('Error while managing users'), err);
      });
    });
  });

  win._addChild(nwin, true, true);
}

function removeUser(win, scheme, data) {
  Connection.request('users', {command: 'remove', user: data}).then((users) => {
    renderUsers(win, scheme);
  }).catch((err) => {
    OSjs.error('Settings', _('Error while managing users'), err);
  });
}

/////////////////////////////////////////////////////////////////////////////
// MODULE
/////////////////////////////////////////////////////////////////////////////

export default {
  group: 'system',
  name: 'Users',
  label: 'LBL_USERS',
  icon: 'apps/system-users.png',
  button: false,

  compatible: function() {
    const cfg = Config.getConfig('Connection.Authenticator');
    return ['demo', 'pam', 'shadow'].indexOf(cfg) === -1;
  },

  init: function() {
  },

  update: function(win, scheme, settings, wm) {
    renderUsers(win, scheme);
  },

  render: function(win, scheme, root, settings, wm) {
    function _action(cb, te) {
      const sel = win._find('UsersList').get('selected');
      if ( sel && sel.length ) {
        const data = sel[0].data;
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
        showDialog(win, scheme, null, data.id);
      });
    });
  },

  save: function(win, scheme, settings, wm) {
  }
};

