/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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

import Promise from 'bluebird';
import {_, setLocale} from 'core/locales';
import {getConfig, getUserLocale} from 'core/config';
import Connection from 'core/connection';
import SettingsManager from 'core/settings-manager';
import PackageManager from 'core/package-manager';

let _instance;

/**
 * Authenticator Base Class
 *
 * @abstract
 */
export default class Authenticator {

  static get instance() {
    return _instance;
  }

  constructor() {
    /* eslint consistent-this: "off" */
    _instance = this;

    /**
     * User data
     * @type {Object}
     * @example
     * {
     *  id: -1,
     *  username: 'foo',
     *  groups: []
     * }
     */
    this.userData = {
      id: 0,
      username: 'root',
      name: 'root user',
      groups: ['admin']
    };

    /**
     * If user is logged in
     * @type {Boolean}
     */
    this.loggedIn = false;
  }

  /**
   * Initializes the Authenticator
   * @return {Promise}
   */
  init() {
    return this.onCreateUI();
  }

  /**
   * Destroys the Authenticator
   */
  destroy() {
    _instance = null;
  }

  /**
   * Get data for logged in user
   *
   * @return  {Object}      JSON With user data
   */
  getUser() {
    return Object.assign({}, this.userData);
  }

  /**
   * Gets if there is a user logged in
   *
   * @return {Boolean}
   */
  isLoggedIn() {
    return this.isLoggedIn;
  }

  /**
   * Log in user
   *
   * @param  {Object}   data            Login form data
   * @return {Promise<Object, Error>}
   */
  login(data) {
    return new Promise((resolve, reject) => {
      Connection.request('login', data).then((result) => {
        return resolve(result ? result : _('ERR_LOGIN_INVALID'));
      }).catch((error) => {
        reject(new Error(_('ERR_LOGIN_FMT', error)));
      });
    });
  }

  /**
   * Log out user
   * @return {Promise<Boolean, Error>}
   */
  logout() {
    return new Promise((resolve, reject) => {
      Connection.request('logout', {}).then((result) => {
        return resolve(!!result);
      }).catch((err) => {
        reject(new Error('An error occured: ' + err));
      });
    });
  }

  /**
   * Checks the given permission (groups) against logged in user
   *
   * @param   {String|String[]}     group         Either a string or array of groups
   *
   * @return {Boolean}
   */
  checkPermission(group) {
    const user = this.getUser();
    const userGroups = user.groups || [];

    if ( !(group instanceof Array) ) {
      group = [group];
    }

    if ( userGroups.indexOf('admin') === -1 ) {
      return !!group.every((g) => userGroups.indexOf(g) >= 0);
    }

    return true;
  }

  /**
   * When login is requested
   *
   * @param  {Object}               data            Login data
   * @return {Promise<Object, Error>}
   */
  onLoginRequest(data) {
    return new Promise((resolve, reject) => {
      this.login(data).then((res) => {
        return this.onLogin(res).then(resolve).catch(reject);
      }).catch(reject);
    });
  }

  /**
   * When login has occured
   *
   * @param   {Object}               data            User data
   * @return {Promise<Object, Error>}
   */
  onLogin(data) {
    let userSettings = data.userSettings;
    if ( !userSettings || userSettings instanceof Array ) {
      userSettings = {};
    }

    this.userData = data.userData;

    // Ensure we get the user-selected locale configured from WM
    function getLocale() {
      let curLocale = getConfig('Locale');
      let detectedLocale = getUserLocale();

      if ( getConfig('LocaleOptions.AutoDetect', true) && detectedLocale ) {
        console.info('Auto-detected user locale via browser', detectedLocale);
        curLocale = detectedLocale;
      }

      let result = SettingsManager.get('CoreWM');
      if ( !result ) {
        try {
          result = userSettings.CoreWM;
        } catch ( e )  {}
      }
      return result ? (result.language || curLocale) : curLocale;
    }

    document.getElementById('LoadingScreen').style.display = 'block';

    setLocale(getLocale());
    SettingsManager.init(userSettings);

    if ( data.blacklistedPackages ) {
      PackageManager.setBlacklist(data.blacklistedPackages);
    }

    this.loggedIn = true;

    return Promise.resolve(true);
  }

  /**
   * When login UI is requested
   * @return {Promise<Object, Error>}
   */
  onCreateUI() {
    const container = document.getElementById('Login');
    const login = document.getElementById('LoginForm');
    const u = document.getElementById('LoginUsername');
    const p = document.getElementById('LoginPassword');
    const s = document.getElementById('LoginSubmit');

    function _restore() {
      s.removeAttribute('disabled');
      u.removeAttribute('disabled');
      p.removeAttribute('disabled');
    }

    function _lock() {
      s.setAttribute('disabled', 'disabled');
      u.setAttribute('disabled', 'disabled');
      p.setAttribute('disabled', 'disabled');
    }

    container.style.display = 'block';
    _restore();

    return new Promise((resolve, reject) => {
      login.onsubmit = (ev) => {
        _lock();
        if ( ev ) {
          ev.preventDefault();
        }

        this.onLoginRequest({
          username: u.value,
          password: p.value
        }).then(() => {
          container.parentNode.removeChild(container);
          return resolve();
        }).catch((err) => {
          alert(err);
          _restore();
        });
      };
    });
  }

}

