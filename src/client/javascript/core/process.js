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
import Connection from 'core/connection';
import EventHandler from 'helpers/event-handler';
import Theme from 'core/theme';
import * as FS from 'utils/fs';
import * as Config from 'core/config';
import * as Compability from 'utils/compability';
import {_} from 'core/locales';
import {triggerHook} from 'helpers/hooks';
import Loader from 'helpers/loader';
import FileMetadata from 'vfs/file';
import Preloader from 'utils/preloader';
import SettingsManager from 'core/settings-manager';
import PackageManager from 'core/package-manager';

/**
 * The predefined events are as follows:
 * <pre><code>
 *  message       All events                               => (msg, object, options)
 *  attention     When application gets attention signal   => (args)
 *  hashchange    When URL hash has changed                => (args)
 *  api           API event                                => (method)
 *  destroy       Destruction event                        => (killed)
 *  destroyWindow Attached window destruction event        => (win)
 *  initedWindow  Attached window event                    => (win)
 *  vfs           For all VFS events                       => (msg, object, options)
 *  vfs:mount     VFS mount event                          => (module, options, msg)
 *  vfs:unmount   VFS unmount event                        => (module, options, msg)
 *  vfs:write     VFS write event                          => (dest, options, msg)
 *  vfs:mkdir     VFS mkdir event                          => (dest, options, msg)
 *  vfs:move      VFS move event                           => ({src,dest}, options, msg)
 *  vfs:delete    VFS delete event                         => (dest, options, msg)
 *  vfs:upload    VFS upload event                         => (file, options, msg)
 *  vfs:update    VFS update event                         => (dir, options, msg)
 * </code></pre>
 * @typedef ProcessEvent
 */

/////////////////////////////////////////////////////////////////////////////
// GLOBALS
/////////////////////////////////////////////////////////////////////////////

let alreadyLaunching = [];
let runningProcesses = [];

function _kill(pid, force) {
  if ( pid >= 0 && runningProcesses[pid] ) {
    try {
      const res = runningProcesses[pid].destroy(force);
      console.warn('Killing application', pid, res);
      if ( res !== false ) {
        runningProcesses[pid] = null;
        return true;
      }
    } catch ( e ) {
      console.warn(e);
    }
  }
  return false;
}

function getLaunchObject(s) {
  if ( typeof s === 'string' ) {
    const spl = s.split('@');
    const name = spl[0];

    let args = {};
    if ( typeof spl[1] !== 'undefined' ) {
      try {
        args = JSON.parse(spl[1]);
      } catch ( e ) {}
    }

    s = {
      name: name,
      args: args
    };
  }

  return s;
}

/////////////////////////////////////////////////////////////////////////////
// PROCESS
/////////////////////////////////////////////////////////////////////////////

/**
 * Process Base Class
 *
 * @desc The basis for an Application or Service
 *
 * @abstract
 * @mixes EventHandler
 */
export default class Process {

  /**
   * @param   {string}  name        Process Name
   * @param   {Object}  args        Process Arguments
   * @param   {Object}  metadata    Package Metadata
   */
  constructor(name, args, metadata) {
    console.group('Process::constructor()', runningProcesses.length, arguments);

    /**
     * Process ID
     * @type {Number}
     */
    this.__pid = runningProcesses.push(this) - 1;

    /**
     * Process Name
     * @type {String}
     */
    this.__pname = name;

    /**
     * Process Arguments
     * @type {Object}
     */
    this.__args = args || {};

    /**
     * Package Metadata
     * @type {Metadata}
     */
    this.__metadata = metadata || {};

    /**
     * Started timestamp
     * @type {Date}
     */
    this.__started = new Date();

    /**
     * If process was destroyed
     * @type {Boolean}
     */
    this.__destroyed = false;

    this.__evHandler = new EventHandler(name, [
      'message', 'attention', 'hashchange', 'api', 'destroy', 'destroyWindow', 'vfs',
      'vfs:mount', 'vfs:unmount', 'vfs:mkdir', 'vfs:write', 'vfs:move',
      'vfs:copy', 'vfs:delete', 'vfs:upload', 'vfs:update'
    ]);

    this.__label    = this.__metadata.name;
    this.__path     = this.__metadata.path;
    this.__scope    = this.__metadata.scope || 'system';
    this.__iter     = this.__metadata.className;

    console.groupEnd();
  }

  /**
   * Destroys the process
   *
   * @return  {Boolean}
   */
  destroy() {
    if ( !this.__destroyed ) {
      this.__destroyed = true;

      console.group('Process::destroy()', this.__pid, this.__pname);

      this._emit('destroy', []);

      if ( this.__evHandler ) {
        this.__evHandler = this.__evHandler.destroy();
      }

      if ( this.__pid >= 0 ) {
        runningProcesses[this.__pid] = null;
      }

      console.groupEnd();

      return true;
    }

    return false;
  }

  /**
   * Method for handling internal messaging system
   *
   * @param   {string}    msg       Message type
   * @param   {Object}    obj       Message object
   * @param   {Object}    [opts]    Message options
   */
  _onMessage(msg, obj, opts) {
    opts = opts || {};

    let sourceId = opts.source;
    if ( sourceId && (typeof sourceId === 'object') ) {
      if ( sourceId instanceof Process ) {
        sourceId = sourceId.__pid;
      } else if ( sourceId._app ) {
        sourceId = sourceId._app ? sourceId._app.__pid : -1;
      }
    }

    if ( this.__evHandler && sourceId !== this.__pid ) {
      console.debug('Process::_onMessage()', msg, obj, opts, this.__pid, this.__pname);

      // => fn('message', msg, obj, opts)
      this.__evHandler.emit('message', [msg, obj, opts]);

      // Emit another message for VFS events
      if ( msg.substr(0, 3) === 'vfs' ) {
        this.__evHandler.emit('vfs', [msg, obj, opts]);
      }

      // => fn(msg, obj, opts)
      // for custom events bound with _on(evname)
      this.__evHandler.emit(msg, [obj, opts, msg]);
    }
  }

  /**
   * Fire a hook to internal event
   *
   * @see Process#on
   * @see EventHandler#emit
   *
   * @param   {ProcessEvent}    k       Event name
   * @param   {Array}           args    Send these arguments (fn.apply)
   *
   * @return {*} Result (last) from bound function(s)
   */
  _emit(k, args) {
    return this.__evHandler ? this.__evHandler.emit(k, args) : null;
  }

  /**
   * Adds a hook to internal event
   *
   * @see EventHandler#on
   *
   * @param   {ProcessEvent}    k       Event name
   * @param   {Function}        func    Callback function
   *
   * @return  {Number}
   */
  _on(k, func) {
    return this.__evHandler ? this.__evHandler.on(k, func, this) : null;
  }

  /**
   * Removes a hook to an internal even
   *
   * @see Process#_on
   * @see EventHandler#off
   *
   * @param   {ProcessEvent}    k       Event name
   * @param   {Number}          idx     The hook index returned from _on()
   */
  _off(k, idx) {
    if ( this.__evHandler ) {
      this.__evHandler.off(k, idx);
    }
  }

  /**
   * Call the ApplicationAPI
   *
   * This is used for calling 'api.php' or 'api.js' in your Application.
   *
   * On Lua or Arduino it is called 'server.lua'
   *
   * @param   {String}      method                      Name of method
   * @param   {Object}      args                        Arguments in JSON
   * @param   {Object}      [options]                   Options (See API::call)
   * @return  {Promise}
   */
  _api(method, args, options) {

    // NOTE: Backward compability
    if ( typeof options === 'boolean' ) {
      options = {
        indicator: options
      };
    } else if ( typeof options !== 'object' ) {
      options = {};
    }

    this._emit('api', [method]);

    return new Promise((resolve, reject) => {
      Connection.request('application', {
        application: this.__iter,
        path: this.__path,
        method: method,
        args: args
      }, options).then((res) => {
        if ( !this.__destroyed ) {
          resolve(res);
          return true;
        }
        console.warn('Process::_api()', 'INGORED RESPONSE: Process was closed');
        return false;
      }).catch((err) => {
        if ( !this.__destroyed ) {
          reject(err instanceof Error ? err : new Error(err));
        }
      });
    });
  }

  /**
   * Get a launch/session argument
   *
   * @param   {String}  [k]     Argument
   *
   * @return  {*}     Argument value or null
   */
  _getArgument(k) {
    return typeof this.__args[k] === 'undefined' ? null : this.__args[k];
  }

  /**
   * Get all launch/session argument
   *
   * @return  {Object}
   */
  _getArguments() {
    return this.__args;
  }

  /**
   * Get full path to a resorce belonging to this process (package)
   *
   * @param   {String}      src       Resource name (path)
   * @param   {Boolean}     [vfspath] Return a valid VFS path
   *
   * @return  {String}
   */
  _getResource(src, vfspath) {
    return PackageManager.getPackageResource(this, src, vfspath);
  }

  /**
   * Set a launch/session argument
   *
   * @param   {String}    k             Key
   * @param   {String}    v             Value
   */
  _setArgument(k, v) {
    this.__args[k] = v;
  }

  /**
   * Kills a process
   *
   * @param   {Number}  pid       Process ID
   *
   * @return  {Boolean}           Success or not
   */
  static kill(pid) {
    return _kill(pid);
  }

  /**
   * Kills all processes
   *
   * @param   {(String|RegExp)}     match     Kill all matching this
   */
  static killAll(match) {
    let matcher = () => true;

    if ( match ) {
      matcher = match instanceof RegExp
        ? (p) => p.__pname.match(match)
        : (p) => p.__pname === match;
    }

    this.getProcesses()
      .filter((p) => matcher(p))
      .forEach((p) => _kill(p.__pid, true));

    runningProcesses = [];
  }

  /**
   * Sends a message to all processes
   *
   * Example: VFS uses this to signal file changes etc.
   *
   * @param   {String}                    msg             Message name
   * @param   {Object}                    obj             Message object
   * @param   {Object}                    opts            Options
   * @param   {Process|Window|Number}    [opts.source]    Source Process, Window or ID
   * @param   {String|Function}          [opts.filter]    Filter by string or fn(process)
   *
   * @see Process#_onMessage
   */
  static message(msg, obj, opts) {
    opts = opts || {};

    console.debug('Process::message()', msg, obj, opts);

    let filter = opts.filter || (() => true);
    if ( typeof filter === 'string' ) {
      const s = filter;
      filter = (p) => {
        return p.__pname === s;
      };
    }

    this.getProcesses()
      .filter(filter)
      .forEach((p) => p._onMessage(msg, obj, opts));
  }

  /**
   * Get a process by name
   *
   * @param   {String}    name    Process Name (or by number)
   * @param   {Boolean}   first   Return the first found
   *
   * @return  {(Process[]|Process)}  Array of Processes or a Process depending on arguments
   */
  static getProcess(name, first) {
    if ( typeof name === 'number' ) {
      return runningProcesses[name];
    }

    const found = this.getProcesses().filter((p) => {
      return p.__pname === name;
    });

    return first ? found[0] : found;
  }

  /**
   * Get all processes
   *
   * @return  {Process[]}
   */
  static getProcesses() {
    return runningProcesses.filter((p) => !!p);
  }

  /**
   * Reloads a process
   * @param {String|String[]} n  Process name(s)
   */
  static reload(n) {
    if ( !(n instanceof Array) ) {
      n = [n];
    }

    n.map((name) => this.getProcess(name, true)).filter((p) => !!p).forEach((p) => {
      let promise = null;
      let data = p._getSessionData();
      let args = {};
      let name;

      try {
        name = p.__pname;
        promise = p.destroy(); // kill
      } catch ( e ) {
        console.warn('Process::reload()', e.stack, e);
      }

      if ( data !== null ) {
        args = data.args;
        args.__resume__ = true;
        args.__windows__ = data.windows || [];
      }
      args.__preload__ = {force: true};

      if ( !(promise instanceof Promise) ) {
        promise = Promise.resolve(true);
      }

      if ( name ) {
        promise.then(() => {
          return setTimeout(() => {
            this.create(name, args);
          }, 500);
        });
      }
    });
  }

  /**
   * Launch a Process
   *
   * @param   {String}      name          Application Name
   * @param   {Object}      [args]          Launch arguments
   * @param   {Function}    [onconstruct]   Callback on application init
   * @return  {Promise<Process, Error>}
   */
  static create(name, args, onconstruct) {
    args = args || {};
    onconstruct = onconstruct || function() {};

    const hash = name + JSON.stringify(args);
    if ( alreadyLaunching.indexOf(hash) !== -1 )  {
      return Promise.resolve(null);
    }
    alreadyLaunching.push(hash);

    const init = () => {
      if ( !name ) {
        throw new Error('Cannot Process::create() witout a application name');
      }

      const compability = Compability.getCompability();
      const metadata = PackageManager.getPackage(name);
      const alreadyRunning = Process.getProcess(name, true);

      //
      // Pre-checks
      //

      if ( !metadata ) {
        throw new Error(_('ERR_APP_LAUNCH_MANIFEST_FAILED_FMT', name));
      }

      const compabilityFailures = (metadata.compability || []).filter((c) => {
        if ( typeof compability[c] !== 'undefined' ) {
          return !compability[c];
        }
        return false;
      });

      if ( compabilityFailures.length ) {
        throw new Error(_('ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT', name, compabilityFailures.join(', ')));
      }

      if ( metadata.singular === true && alreadyRunning ) {
        console.warn('Process::create()', 'detected that this application is a singular and already running...');
        alreadyRunning._onMessage('attention', args);

        //throw new Error(_('ERR_APP_LAUNCH_ALREADY_RUNNING_FMT', name));
        return Promise.resolve(alreadyRunning);
      }

      triggerHook('processStart', [name, args]);

      // Create loading ui
      Loader.create('Main.launch.' + name, {
        title: _('LBL_STARTING') + ' ' + metadata.name,
        icon: Theme.getIcon(metadata.icon, '16x16')
      });

      // Preload
      let pargs = {
        max: metadata.preloadParallel === true
          ? Config.getConfig('Connection.PreloadParallel')
          : metadata.preloadParallel/*,

        progress: (index, total) => {
        }*/
      };

      if ( args.__preload__ ) { // This is for Process.reload()
        pargs = Object.assign(pargs, args.__preload__);
        delete args.__preload__;
      }

      return new Promise((resolve, reject) => {
        const onerror = (e) => {
          console.warn(e);
          return reject(new Error(e));
        };

        Preloader.preload(metadata.preload, pargs).then((result) => {
          if ( result.failed.length ) {
            return onerror(_('ERR_APP_PRELOAD_FAILED_FMT', name, result.failed.join(',')));
          }

          if ( typeof OSjs.Applications[name] === 'undefined' ) {
            return onerror(new Error(_('ERR_APP_RESOURCES_MISSING_FMT', name)));
          }

          // Run
          let instance;

          try {
            const ResolvedPackage = OSjs.Applications[name];
            instance = new ResolvedPackage(args, metadata);

            onconstruct(instance, metadata);
          } catch ( e ) {
            return onerror(e);
          }

          try {
            const settings = SettingsManager.get(instance.__pname) || {};
            instance.init(settings, metadata);

            triggerHook('processStarted', [{
              application: instance,
              name: name,
              args: args,
              settings: settings,
              metadata: metadata
            }]);
          } catch ( e ) {
            return onerror(e);
          }

          return resolve(instance);
        }).catch(onerror);
      });
    };

    const onerror = (err) => {
      OSjs.error(_('ERR_APP_LAUNCH_FAILED'),
                 _('ERR_APP_LAUNCH_FAILED_FMT', name),
                 err, err, true);
    };

    return new Promise((resolve, reject) => {
      console.group('Process::create()', name, args);

      const remove = () => {
        console.groupEnd();
        const i = alreadyLaunching.indexOf(hash);
        if ( i >= 0 ) {
          alreadyLaunching.splice(i, 1);
        }
        Loader.destroy('Main.launch.' + name);
      };

      const fail = (e) => {
        Loader.destroy('Main.launch.' + name);
        remove();
        onerror(e);
        return reject(e);
      };

      try {
        init().then(resolve).catch(fail).finally(remove);
      } catch ( e ) {
        fail(e);
      }
    });
  }

  /**
   * Launch Processes from a List
   *
   * @param   {Array}         list        List of launch application arguments
   * @param   {Function}      onconstruct Callback on success => fn(app, metadata, appName, appArgs)
   * @return  {Promise<Process[], Error>}
   */
  static createFromArray(list, onconstruct) {
    list = list || [];
    onconstruct = onconstruct || function() {};

    console.info('Process::createFromArray()', list);

    return Promise.each(list, (s) => {
      return new Promise((resolve, reject) => {
        s = getLaunchObject(s);
        if ( s.name ) {
          try {
            this.create(s.name, s.args, (instance, metadata) => {
              onconstruct(instance, metadata, s.name, s.args);
            }).then(resolve).catch(reject);
          } catch ( e ) {
            reject(e);
          }
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Open a file
   *
   * @param   {FileMetadata}   file    The File reference (can also be a tuple with 'path' and 'mime')
   * @param   {Object}         args    Arguments to send to process launch function
   * @return  {Promise<Process, Error>}
   */
  static createFromFile(file, args) {
    file = new FileMetadata(file);

    args = Object.assign({
      file: file
    }, args || {});

    if ( args.args ) {
      Object.keys(args.args).forEach((i) => {
        args[i] = args.args[i];
      });
    }

    if ( !file.path ) {
      throw new Error('Cannot open file without a path');
    }

    console.info('Process::createFromFile()', file, args);

    if ( file.mime === 'osjs/application' ) {
      return this.create(FS.filename(file.path));
    } else if ( file.type === 'dir' ) {
      const fm = SettingsManager.instance('DefaultApplication').get('dir', 'ApplicationFileManager');
      return this.create(fm, {path: file.path});
    }

    return new Promise((resolve, reject) => {
      const val = SettingsManager.get('DefaultApplication', file.mime);
      let pack = PackageManager.getPackagesByMime(file.mime);
      if ( !args.forceList && val ) {
        if ( PackageManager.getPackage(val) ) {
          console.debug('Process::createFromFile()', 'default application', val);
          pack = [val];
        }
      }

      if ( pack.length === 0 ) {
        OSjs.error(_('ERR_FILE_OPEN'),
                   _('ERR_FILE_OPEN_FMT', file.path),
                   _('ERR_APP_MIME_NOT_FOUND_FMT', file.mime) );

        reject(new Error(_('ERR_APP_MIME_NOT_FOUND_FMT', file.mime)));
      } else if ( pack.length === 1 ) {
        this.create(pack[0], args).then(resolve).catch(reject);
      } else {
        const DialogWindow = require('core/dialog');
        DialogWindow.default.create('ApplicationChooser', {
          file: file,
          list: pack
        }, (ev, btn, result) => {
          if ( btn === 'ok' ) {
            this.create(result.name, args);

            SettingsManager.set('DefaultApplication', file.mime, result.useDefault ? result.name : null, true)
              .then(resolve)
              .catch((err) => {
                reject(typeof err === 'string' ? new Error(err) : err);
              });
          }
        });
      }
    });

  }

}

