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

import MountManager from 'core/mount-manager';
import ServiceNotificationIcon from 'helpers/service-notification-icon';
import Preloader from 'utils/preloader';
import {_} from 'core/locales';
import {getConfig} from 'core/config';

const redirectURI = window.location.href.replace(/\/$/, '') + '/windows-live-oauth.html';

/////////////////////////////////////////////////////////////////////////////
// API
/////////////////////////////////////////////////////////////////////////////

let SingletonInstance = null;

/**
 * The WindowsLiveAPI wrapper class
 *
 * @desc Helper for communicating with Windows Live API.
 * <pre><b>
 * Generally you want to create an instance of this helper
 * and when successfully created use `window.WL`.
 * </b></pre>
 *
 * @link http://msdn.microsoft.com/en-us/library/hh826547.aspx
 * @link http://msdn.microsoft.com/en-us/library/hh826538.aspx
 * @link http://msdn.microsoft.com/en-us/library/hh550837.aspx
 * @link http://msdn.microsoft.com/en-us/library/dn631844.aspx
 * @link http://msdn.microsoft.com/en-us/library/dn631839.aspx
 * @link http://msdn.microsoft.com/en-us/library/hh243643.aspx
 * @link https://account.live.com/developers/applications/index
 */
class WindowsLiveAPI {

  /**
   * @param {String}  clientId    Client ID (key)
   */
  constructor(clientId) {
    this.hasSession = false;
    this.clientId = clientId;
    this.loaded = false;
    this.inited = false;
    this.accessToken = null;
    this.lastScope = null;
    this.preloads = [{
      type: 'javascript',
      src: '//js.live.net/v5.0/wl.js'
    }];
  }

  /*
   * Destroy the class
   */
  destroy() {
  }

  /*
   * Initializes (preloads) the API
   */
  init(callback) {
    callback = callback || function() {};
    if ( this.loaded ) {
      callback(false, true);
    } else {
      Preloader.preload(this.preloads).then((result) => {
        if ( !result.failed.length ) {
          this.loaded = true;
        }
        callback(result.failed.join('\n'));
      }).catch(() => callback());
    }
  }

  /*
   * Loads the API
   */
  load(scope, callback) {
    console.debug('WindowsLiveAPI::load()', scope);

    let WL = window.WL || {};

    const _login = () => {
      const lastScope = (this.lastScope || []).sort();
      const currScope = (scope || []).sort();

      if ( this.hasSession && (lastScope.toString() === currScope.toString()) ) {
        callback(false, true);
        return;
      }

      this.login(scope, (error, response) => {
        if ( error ) {
          callback(error);
          return;
        }

        setTimeout(() => {
          callback(false, true);
        }, 10);
      });
    };

    this.init((error) => {
      if ( error ) {
        callback(error);
        return;
      }

      if ( !window.WL ) {
        callback(_('WLAPI_LOAD_FAILURE'));
        return;
      }
      WL = window.WL || {};

      if ( this.inited ) {
        _login();
      } else {
        this.inited = true;
        WL.Event.subscribe('auth.login', (a, b, c, d) => {
          this.onLogin(a, b, c, d);
        });
        WL.Event.subscribe('auth.logout', (a, b, c, d) => {
          this.onLogout(a, b, c, d);
        });
        WL.Event.subscribe('wl.log', (a, b, c, d) => {
          this.onLog(a, b, c, d);
        });
        WL.Event.subscribe('auth.sessionChange', (a, b, c, d) => {
          this.onSessionChange(a, b, c, d);
        });

        WL.init({
          client_id: this.clientId,
          display: 'popup',
          redirect_uri: redirectURI
        }).then((result) => {
          console.debug('WindowsLiveAPI::load()', '=>', result);

          if ( result.session ) {
            this.accessToken = result.session.access_token || null;
          }

          if ( result.status === 'connected' ) {
            callback(false, true);
          } else if ( result.status === 'success' ) {
            _login();
          } else {
            callback(_('WLAPI_INIT_FAILED_FMT', result.status.toString()));
          }
        }, (result) => {
          console.error('WindowsLiveAPI::load()', 'init() error', result);
          callback(result.error_description);
        });
      }
    });
  }

  _removeRing() {
    ServiceNotificationIcon.remove('Windows Live API');
  }

  /**
   * Sign out of WindowsLiveAPI
   *
   * @param   {Function}    callback      Callback => fn(error, result)
   */
  logout(callback) {
    callback = callback || function() {};

    const WL = window.WL || {};

    if ( this.hasSession ) {
      callback(false, false);
    }

    WL.Event.unsubscribe('auth.logout');
    WL.Event.subscribe('auth.logout', () => {
      this._removeRing();

      WL.Event.unsubscribe('auth.logout');
      callback(false, true);
    });

    WL.logout();

    MountManager.remove('OneDrive');
  }

  /*
   * Authenticates the user
   */
  login(scope, callback) {
    const WL = window.WL || {};

    if ( this.hasSession ) {
      callback(false, true);
      return;
    }

    WL.login({
      scope: scope,
      redirect_uri: redirectURI
    }).then((result) => {
      if ( result.status === 'connected' ) {
        callback(false, true);
      } else {
        callback(_('WLAPI_LOGIN_FAILED'));
      }
    }, (result) => {
      callback(_('WLAPI_LOGIN_FAILED_FMT', result.error_description));
    });
  }

  /*
   * If the API session was changed
   */
  onSessionChange() {
    console.warn('WindowsLiveAPI::onSessionChange()', arguments);
    const WL = window.WL || {};
    const session = WL.getSession();
    if ( session ) {
      this.hasSession = true;
    } else {
      this.hasSession = false;
    }
  }

  /*
   * When user logged in
   */
  onLogin() {
    console.warn('WindowsLiveAPI::onLogin()', arguments);
    this.hasSession = true;

    ServiceNotificationIcon.add('Windows Live API', [{
      title: _('WLAPI_SIGN_OUT'),
      onClick: () => {
        this.logout();
      }
    }]);
  }

  /*
   * When user logs out
   */
  onLogout() {
    console.warn('WindowsLiveAPI::onLogout()', arguments);
    this.hasSession = false;
    this._removeRing();
  }

  /*
   * When API sends a log message
   */
  onLog() {
    console.debug('WindowsLiveAPI::onLog()', arguments);
  }

}

/////////////////////////////////////////////////////////////////////////////
// EXPORTS
/////////////////////////////////////////////////////////////////////////////

export function instance() {
  return SingletonInstance;
}

export function create(args, callback) {
  args = args || {};

  function _run() {
    const scope = args.scope;
    SingletonInstance.load(scope, (error) => {
      callback(error ? error : false, SingletonInstance);
    });
  }

  if ( SingletonInstance ) {
    _run();
    return;
  }

  let clientId = null;
  try {
    clientId = getConfig('WindowsLiveAPI.ClientId');
  } catch ( e ) {
    console.warn('getWindowsLiveAPI()', e, e.stack);
  }

  if ( !clientId ) {
    callback(_('WLAPI_DISABLED'));
    return;
  }

  SingletonInstance = new WindowsLiveAPI(clientId);
  _run();
}
