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
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
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
import * as Locales from 'core/locales';
import MountManager from 'core/mount-manager';
import SettingsManager from 'core/settings-manager';
import PackageManager from 'core/package-manager';
import SearchEngine from 'core/search-engine';
import Authenticator from 'core/authenticator';
import WindowManager from 'core/window-manager';
import DialogWindow from 'core/dialog';
import Storage from 'core/storage';
import Process from 'core/process';
import Theme from 'core/theme';
import Connection from 'core/connection';
import {triggerHook} from 'helpers/hooks';
import {getConfig} from 'core/config';
import SplashScreen from 'gui/splash';
import * as Utils from 'utils/misc';
import * as Menu from 'gui/menu';
import Preloader from 'utils/preloader';

import AlertDialog from 'dialogs/alert';
import ApplicationChooserDialog from 'dialogs/applicationchooser';
import ColorDialog from 'dialogs/color';
import ConfirmDialog from 'dialogs/confirm';
import ErrorDialog from 'dialogs/error';
import FileInfoDialog from 'dialogs/fileinfo';
import FileDialog from 'dialogs/file';
import FileProgressDialog from 'dialogs/fileprogress';
import FileUploadDialog from 'dialogs/fileupload';
import FontDialog from 'dialogs/font';
import InputDialog from 'dialogs/input';

let hasBooted = false;
let hasShutDown = false;

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

function onError(title, message, error, exception, bugreport) {
  bugreport = (() => {
    if ( getConfig('BugReporting.enabled') ) {
      return typeof bugreport === 'undefined' ? false : (bugreport ? true : false);
    }
    return false;
  })();

  function _dialog() {
    const wm = WindowManager.instance;
    if ( wm && wm._fullyLoaded ) {
      try {
        DialogWindow.create('Error', {
          title: title,
          message: message,
          error: error,
          exception: exception,
          bugreport: bugreport
        });

        return true;
      } catch ( e ) {
        console.warn('An error occured while creating Error Dialog', e);
        console.warn('stack', e.stack);
      }
    }

    return false;
  }

  Menu.blur();

  if ( (exception instanceof Error) && (exception.message.match(/^Script Error/i) && String(exception.lineNumber).match(/^0/)) ) {
    console.error('VENDOR ERROR', {
      title: title,
      message: message,
      error: error,
      exception: exception
    });
    return;
  } else {
    console.error(title, message, error, exception);
  }

  const testMode = OSJS_DEBUG && window.location.hash.match(/mocha=true/);
  if ( !testMode ) {
    if ( !_dialog() ) {
      window.alert(title + '\n\n' + message + '\n\n' + error);
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
// INITIALIZERS
///////////////////////////////////////////////////////////////////////////////

/**
 * Initialize: Preloading
 * @param {Object} config Configuration
 * @return {Promise}
 */
const initPreloading = (config) => new Promise((resolve, reject) => {
  const flatten = (list) => list.reduce((a, b) =>
    a.concat(Array.isArray(b) ? flatten(b) : b), []);

  Preloader.preload(flatten(config.Preloads)).then((result) => {
    return resolve();
  }).catch(reject);
});

/**
 * Initialize: Handlers
 * @param {Object} config Configuration
 * @return {Promise}
 */
const initHandlers = (config) => new Promise((resolve, reject) => {
  const options = config.Connection;
  console.log({
    authenticator: options.Authenticator,
    connection: options.Connection,
    storage: options.Storage
  });

  let Authenticator, Connection, Storage;
  try {
    Authenticator = require('core/auth/' + options.Authenticator + '.js').default;
    Connection = require('core/connections/' + options.Connection + '.js').default;
    Storage = require('core/storage/' + options.Storage + '.js').default;
  } catch ( e ) {
    reject(e);
    return;
  }

  const connection = new Connection();
  const authenticator = new Authenticator();
  const storage = new Storage();

  Promise.each([connection, storage, authenticator], (iter) => {
    return iter.init();
  }).then(resolve).catch(reject);
});

/**
 * Initialize: VFS
 * @param {Object} config Configuration
 * @return {Promise}
 */
const initVFS = (config) => new Promise((resolve, reject) => {
  const mountPoints = SettingsManager.instance('VFS').get('mounts', []);

  MountManager.init().then((res) => {
    return MountManager.addList(mountPoints).then((res) => {
      return resolve(res);
    }).catch((e) => {
      console.warn('A module failed to load!', e);
      resolve();
    });
  }).catch(reject);
});

/**
 * Initialize: Settings Manager
 * @param {Object} config Configuration
 * @return {Promise}
 */
const initSettingsManager = (config) => new Promise((resolve, reject) => {
  const pools = config.SettingsManager || {};

  Object.keys(pools).forEach(function(poolName) {
    console.debug('initSettingsManager()', 'initializes pool', poolName, pools[poolName]);
    SettingsManager.instance(poolName, pools[poolName] || {});
  });

  resolve();
});

/**
 * Initialize: Package Manager
 * @param {Object} config Configuration
 * @return {Promise}
 */
const initPackageManager = (config) => new Promise((resolve, reject) => {
  const list = config.PreloadOnBoot || [];

  let metadata = {};
  try {
    // In case of standalone
    metadata = OSjs.getManifest();
  } catch ( e ) {}

  PackageManager.init(metadata).then(() => {
    return Promise.each(list, (iter) => {
      return new Promise((next) => {
        var pkg = PackageManager.getPackage(iter);
        if ( pkg && pkg.preload ) {
          Preloader.preload(pkg.preload).then(next).catch(() => next());
        } else {
          next();
        }
      });
    }).then(resolve).catch(reject);
  }).catch(reject);
});

/**
 * Initialize: Extensions
 * @param {Object} config Configuration
 * @return {Promise}
 */
const initExtensions = (config) => new Promise((resolve, reject) => {
  const packages = PackageManager.getPackages();

  const preloadExtensions = () => new Promise((resolve, reject) => {
    let preloads = [];
    Object.keys(packages).forEach((k) => {
      const iter = packages[k];
      if ( iter.type === 'extension' && iter.preload ) {
        preloads = preloads.concat(iter.preload);
      }
    });

    if ( preloads.length ) {
      Preloader.preload(preloads).then(resolve).catch(() => resolve());
    } else {
      resolve();
    }
  });

  const launchExtensions = () => new Promise((resolve, reject) => {
    const exts = Object.keys(OSjs.Extensions);

    Promise.each(exts, (entry) => {
      return new Promise((yes, no) => {
        try {
          const m = packages[entry];
          let promise = OSjs.Extensions[entry].init(m);
          if ( !(promise instanceof Promise) ) {
            promise = Promise.resolve(true);
          }

          promise.then(yes).catch((err) => {
            console.error(err);
            return yes(false);
          });
        } catch ( e ) {
          console.warn('Extension init failed', e.stack, e);
          yes(false);
        }
      });
    }).then(resolve).catch((err) => {
      console.warn(err);
      reject(new Error(err));
    });
  });

  preloadExtensions().then(() => {
    return launchExtensions().then(resolve).catch(reject);
  }).catch(() => resolve());
});

/**
 * Initialize: Search Engine
 * @param {Object} config Configuration
 * @return {Promise}
 */
const initSearchEngine = (config) => new Promise((resolve, reject) => {
  SearchEngine.init().then(resolve).catch(reject);
});

/**
 * Initialize: GUI
 * @param {Object} config Configuration
 * @return {Promise}
 */
const initGUI = (config) => new Promise((resolve, reject) => {

  const guiElements = ['containers', 'visual', 'tabs', 'richtext', 'misc', 'inputs', 'treeview', 'listview', 'iconview', 'fileview', 'menus'];
  guiElements.forEach((f) => {
    const gel = require('gui/elements/' + f + '.js').default;
    Object.keys(gel).forEach((name) => {
      gel[name].register();
    });
  });

  OSjs.error = onError;
  OSjs.Dialogs.Alert = AlertDialog;
  OSjs.Dialogs.ApplicationChooser = ApplicationChooserDialog;
  OSjs.Dialogs.Color = ColorDialog;
  OSjs.Dialogs.Confirm = ConfirmDialog;
  OSjs.Dialogs.Error = ErrorDialog;
  OSjs.Dialogs.File = FileDialog;
  OSjs.Dialogs.FileInfo = FileInfoDialog;
  OSjs.Dialogs.FileProgress = FileProgressDialog;
  OSjs.Dialogs.FileUpload = FileUploadDialog;
  OSjs.Dialogs.Font = FontDialog;
  OSjs.Dialogs.Input = InputDialog;

  Theme.init();

  resolve();
});

/**
 * Initialize: Window Manager
 * @param {Object} config Configuration
 * @return {Promise}
 */
const initWindowManager = (config) => new Promise((resolve, reject) => {
  const wmConfig = config.WindowManager;

  if ( !wmConfig || !wmConfig.exec ) {
    reject(new Error(Locales._('ERR_CORE_INIT_NO_WM')));
  } else {
    Process.create(wmConfig.exec, (wmConfig.args || {})).then((app) => {
      return app.setup().then(resolve).catch(reject);
    }).catch((error) => {
      reject(new Error(Locales._('ERR_CORE_INIT_WM_FAILED_FMT', error)));
    });
  }
});

/**
 * Initialize: Mocha
 * @param {Object} config Configuration
 * @return {Promise}
 */
const initMocha = (config) => new Promise((resolve, reject) => {

  const div = document.createElement('div');
  div.id = 'mocha';
  document.body.appendChild(div);
  document.body.style.overflow = 'auto';
  document.body.style.backgroundColor = '#ffffff';

  Preloader.preload([
    '/test.css',
    '/test.js'
  ]).then(() => {
    OSjs.runTests();
  });

  resolve(true);
});

///////////////////////////////////////////////////////////////////////////////
// MISC
///////////////////////////////////////////////////////////////////////////////

/*
 * Initializes the user session
 */
function initSession(config) {
  console.debug('initSession()');

  var list = [];

  // In this case we merge the Autostart and the previous session together.
  // This ensures that items with autostart are loaded with correct
  // session data on restore. This is much better than relying on the internal
  // event/message system which does not trigger until after everything is loaded...
  // this does everything beforehand! :)
  //
  try {
    list = config.AutoStart;
  } catch ( e ) {
    console.warn('initSession()->autostart()', 'exception', e, e.stack);
  }

  var checkMap = {};
  var skipMap = [];
  list.forEach(function(iter, idx) {
    if ( typeof iter === 'string' ) {
      iter = list[idx] = {name: iter};
    }
    if ( skipMap.indexOf(iter.name) === -1 ) {
      if ( !checkMap[iter.name] ) {
        checkMap[iter.name] = idx;
        skipMap.push(iter.name);
      }
    }
  });

  return new Promise((resolve) => {
    Storage.instance.getLastSession().then((adds) => {
      adds.forEach(function(iter) {
        if ( typeof checkMap[iter.name] === 'undefined' ) {
          list.push(iter);
        } else {
          if ( iter.args ) {
            var refid = checkMap[iter.name];
            var ref = list[refid];
            if ( !ref.args ) {
              ref.args = {};
            }
            ref.args = Utils.mergeObject(ref.args, iter.args);
          }
        }
      });

      console.info('initSession()->autostart()', list);
      return Process.createFromArray(list).then(resolve).catch(resolve);
    }).catch((err) => {
      console.warn(err);
      resolve();
    });
  });
}

/*
 * When window gets an external message
 */
function onMessage(ev) {
  if ( ev && ev.data && typeof ev.data.message !== 'undefined' && typeof ev.data.pid === 'number' ) {
    console.debug('window::message()', ev.data);
    var proc = Process.getProcess(ev.data.pid);
    if ( proc ) {
      if ( typeof proc.onPostMessage === 'function' ) {
        proc.onPostMessage(ev.data.message, ev);
      }

      if ( typeof proc._getWindow === 'function' ) {
        var win = proc._getWindow(ev.data.wid, 'wid');
        if ( win ) {
          win.onPostMessage(ev.data.message, ev);
        }
      }
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
// API
///////////////////////////////////////////////////////////////////////////////

/**
 * Starts OS.js
 */
export function start() {
  if ( hasBooted || hasShutDown ) {
    return;
  }
  hasBooted = true;

  console.info('Starting OS.js');

  const config = OSjs.getConfig();
  const testMode = OSJS_DEBUG && window.location.hash.match(/mocha=true/);
  const total = 9;

  Locales.init(config.Locale, config.LocaleOptions, config.Languages);

  SplashScreen.watermark(config);
  SplashScreen.show();

  triggerHook('initialize');

  Promise.each([
    initPreloading,
    initHandlers,
    initVFS,
    initSettingsManager,
    initPackageManager,
    initExtensions,
    initSearchEngine,
    initGUI,
    testMode ? initMocha : initWindowManager
  ], (fn, index) => {
    return new Promise((resolve, reject) => {
      console.group('Initializing', index + 1, 'of', total);
      SplashScreen.update(index, total);

      return fn(config).then((res) => {
        console.groupEnd();
        return resolve(res);
      }).catch((err) => {
        console.groupEnd();
        return reject(new Error(err));
      });
    });
  }).then(() => {
    console.info('Done!');

    window.addEventListener('message', onMessage, false);

    triggerHook('initialized');
    SplashScreen.hide();

    if ( !testMode ) {
      Theme.playSound('LOGIN');

      var wm = WindowManager.instance;
      if ( wm ) {
        wm._fullyLoaded = true;
      }

      initSession(config).then(() => {
        return triggerHook('sessionLoaded');
      });
    }

    return true;
  }).catch((err) => {
    const title = Locales._('ERR_CORE_INIT_FAILED');
    const message = Locales._('ERR_CORE_INIT_FAILED_DESC');
    alert(title + '\n\n' + message);
    console.error(title, message, err);
  });
}

/**
 * Stops OS.js
 * @param {Boolean} [restart=false] Restart instead of full stop
 */
export function stop(restart = false) {
  if ( hasShutDown || !hasBooted ) {
    return;
  }

  hasShutDown = true;
  hasBooted = false;

  window.removeEventListener('message', onMessage, false);

  const wm = WindowManager.instance;
  if ( wm ) {
    wm.toggleFullscreen();
  }

  Preloader.clear();
  Menu.blur();
  Process.killAll();
  SearchEngine.destroy();
  PackageManager.destroy();
  Authenticator.instance.destroy();
  Storage.instance.destroy();
  Connection.instance.destroy();

  triggerHook('shutdown');

  console.warn('OS.js was shut down!');

  if ( !restart && getConfig('ReloadOnShutdown') === true ) {
    window.location.reload();
  }
}

/**
 * Restarts OS.js
 * @param {Boolean} [save=false] Save session
 */
export function restart(save = false) {
  const lout = (cb) => Authenticator.instance.logout().then(cb).catch(cb);

  const saveFunction = save && Storage.instance ? function(cb) {
    Storage.instance.saveSession()
      .then(() => lout(cb))
      .catch(() => lout(cb));
  } : lout;

  saveFunction(function() {
    console.clear();
    stop(true);
    start();
  });
}

/**
 * Perfors a log out of OS.js
 */
export function logout() {
  const storage = Storage.instance;
  const wm = WindowManager.instance;

  function signOut(save) {
    Theme.playSound('LOGOUT');

    const lout = (cb) => Authenticator.instance.logout().then(cb).catch(cb);

    if ( save ) {
      storage.saveSession()
        .then(() => lout(stop))
        .catch(() => lout(stop));
    } else {
      lout(stop);
    }
  }

  if ( wm ) {
    const user = Authenticator.instance.getUser() || {name: Locales._('LBL_UNKNOWN')};
    DialogWindow.create('Confirm', {
      title: Locales._('DIALOG_LOGOUT_TITLE'),
      message: Locales._('DIALOG_LOGOUT_MSG_FMT', user.name)
    }, function(ev, btn) {
      if ( ['no', 'yes'].indexOf(btn) !== -1 ) {
        signOut(btn === 'yes');
      }
    });
  } else {
    signOut(true);
  }
}

/**
 * Checks if OS.js is running
 * @return {Boolean}
 */
export function running() {
  return !hasShutDown;
}
