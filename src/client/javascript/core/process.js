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
(function(Utils, API) {
  'use strict';

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

  var _PROCS = [];        // Running processes

  function _kill(pid) {
    if ( pid >= 0 && _PROCS[pid] ) {
      var res = _PROCS[pid].destroy();
      console.warn('Killing application', pid, res);
      if ( res !== false ) {
        _PROCS[pid] = null;
        return true;
      }
    }
    return false;
  }

  /////////////////////////////////////////////////////////////////////////////
  // API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Kills all processes
   *
   * @param   {(String|RegExp)}     match     Kill all matching this
   *
   * @function killAll
   * @memberof OSjs.API
   */
  function doKillAllProcesses(match) {
    if ( match ) {
      var isMatching;
      if ( match instanceof RegExp && _PROCS ) {
        isMatching = function(p) {
          return p.__pname && p.__pname.match(match);
        };
      } else if ( typeof match === 'string' ) {
        isMatching = function(p) {
          return p.__pname === match;
        };
      }

      if ( isMatching ) {
        _PROCS.forEach(function(p) {
          if ( p && isMatching(p) ) {
            _kill(p.__pid);
          }
        });
      }
      return;
    }

    _PROCS.forEach(function(proc, i) {
      if ( proc ) {
        proc.destroy(true);
      }
      _PROCS[i] = null;
    });
    _PROCS = [];
  }

  /**
   * Kills a process
   *
   * @param   {Number}  pid       Process ID
   *
   * @return  {Boolean}           Success or not
   *
   * @function kill
   * @memberof OSjs.API
   */
  function doKillProcess(pid) {
    return _kill(pid);
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
   * @see OSjs.Core.Process#_onMessage
   *
   * @function message
   * @memberof OSjs.API
   */
  function doProcessMessage(msg, obj, opts) {
    opts = opts || {};

    console.debug('doProcessMessage', msg, opts);

    var filter = opts.filter || function() {
      return true;
    };

    if ( typeof filter === 'string' ) {
      var s = filter;
      filter = function(p) {
        return p.__pname === s;
      };
    }

    _PROCS.forEach(function(p, i) {
      if ( p && (p instanceof OSjs.Core.Application || p instanceof OSjs.Core.Process) ) {
        if ( filter(p) ) {
          p._onMessage(msg, obj, opts);
        }
      }
    });
  }

  /**
   * Get a process by name
   *
   * @param   {String}    name    Process Name (or by number)
   * @param   {Boolean}   first   Return the first found
   *
   * @return  {(OSjs.Core.Process[]|OSjs.Core.Process)}  Array of Processes or a Process depending on arguments
   *
   * @function getProcess
   * @memberof OSjs.API
   */
  function doGetProcess(name, first) {
    var result = first ? null : [];

    if ( typeof name === 'number' ) {
      return _PROCS[name];
    }

    _PROCS.every(function(p, i) {
      if ( p ) {
        if ( p.__pname === name ) {
          if ( first ) {
            result = p;
            return false;
          }
          result.push(p);
        }
      }

      return true;
    });

    return result;
  }

  /**
   * Get all processes
   *
   * @function getProcesses
   * @memberof OSjs.API
   *
   * @return  {OSjs.Core.Process[]}
   */
  function doGetProcesses() {
    return _PROCS;
  }

  /////////////////////////////////////////////////////////////////////////////
  // PROCESS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Process Template Class
   *
   * <pre><b>
   * YOU CANNOT CANNOT USE THIS VIA 'new' KEYWORD.
   * </b></pre>
   *
   * @summary Class used for basis as a Process.
   *
   * @param   {string}    name        Process Name
   * @param   {Object}    args        Process Arguments
   * @param   {Metadata}  metadata    Package Metadata
   *
   * @abstract
   * @constructor
   * @memberof OSjs.Core
   * @mixes OSjs.Helpers.EventHandler
   */
  function Process(name, args, metadata) {
    console.group('Process::constructor()', _PROCS.length, arguments);

    /**
     * Process ID
     * @name __pid
     * @memberof OSjs.Core.Process#
     * @type {Number}
     */
    this.__pid = _PROCS.push(this) - 1;

    /**
     * Process Name
     * @name __pname
     * @memberof OSjs.Core.Process#
     * @type {String}
     */
    this.__pname = name;

    /**
     * Process Arguments
     * @name __args
     * @memberof OSjs.Core.Process#
     * @type {Object}
     */
    this.__args = args || {};

    /**
     * Package Metadata
     * @name __metadata
     * @memberof OSjs.Core.Process#
     * @type {Metadata}
     */
    this.__metadata = metadata || {};

    /**
     * Started timestamp
     * @name __started
     * @memberof OSjs.Core.Process#
     * @type {Date}
     */
    this.__started = new Date();

    /**
     * If process was destroyed
     * @name __destroyed
     * @memberof OSjs.Core.Process#
     * @type {Boolean}
     */
    this.__destroyed = false;

    this.__evHandler = new OSjs.Helpers.EventHandler(name, [
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
   * @function destroy
   * @memberof OSjs.Core.Process#
   *
   * @return  {Boolean}
   */
  Process.prototype.destroy = function() {
    if ( !this.__destroyed ) {
      this.__destroyed = true;

      console.group('Process::destroy()', this.__pid, this.__pname);

      this._emit('destroy', []);

      if ( this.__evHandler ) {
        this.__evHandler = this.__evHandler.destroy();
      }

      if ( this.__pid >= 0 ) {
        _PROCS[this.__pid] = null;
      }

      console.groupEnd();

      return true;
    }

    return false;
  };

  /**
   * Method for handling internal messaging system
   *
   * @function _onMessage
   * @memberof  OSjs.Core.Process#
   *
   * @param   {string}    msg       Message type
   * @param   {Object}    obj       Message object
   * @param   {Object}    [opts]    Message options
   */
  Process.prototype._onMessage = function(msg, obj, opts) {
    opts = opts || {};

    var sourceId = opts.source;
    if ( sourceId instanceof Process ) {
      sourceId = sourceId.__pid;
    } else if ( sourceId instanceof OSjs.Core.Window ) {
      sourceId = sourceId._app ? sourceId._app.__pid : -1;
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
  };

  /**
   * Fire a hook to internal event
   *
   * @function _emit
   * @memberof OSjs.Core.Process#
   * @see OSjs.Core.Process#on
   * @see OSjs.Helpers.EventHandler#emit
   *
   * @param   {ProcessEvent}    k       Event name
   * @param   {Array}           args    Send these arguments (fn.apply)
   *
   * @return {Mixed} Result (last) from bound function(s)
   */
  Process.prototype._emit = function(k, args) {
    return this.__evHandler ? this.__evHandler.emit(k, args) : null;
  };

  /**
   * Adds a hook to internal event
   *
   * @function _on
   * @memberof OSjs.Core.Process#
   * @see OSjs.Helpers.EventHandler#on
   *
   * @param   {ProcessEvent}    k       Event name
   * @param   {Function}        func    Callback function
   *
   * @return  {Number}
   */
  Process.prototype._on = function(k, func) {
    return this.__evHandler ? this.__evHandler.on(k, func, this) : null;
  };

  /**
   * Removes a hook to an internal even
   *
   * @function _off
   * @memberof OSjs.Core.Process#
   * @see OSjs.Core.Process#_on
   * @see OSjs.Helpers.EventHandler#off
   *
   * @param   {ProcessEvent}    k       Event name
   * @param   {Number}          idx     The hook index returned from _on()
   */
  Process.prototype._off = function(k, idx) {
    if ( this.__evHandler ) {
      this.__evHandler.off(k, idx);
    }
  };

  /**
   * Call the ApplicationAPI
   *
   * This is used for calling 'api.php' or 'api.js' in your Application.
   *
   * On Lua or Arduino it is called 'server.lua'
   *
   * @function _api
   * @memberof OSjs.Core.Process#
   *
   * @param   {String}      method                      Name of method
   * @param   {Object}      args                        Arguments in JSON
   * @param   {Function}    callback                    Callback method => fn(error, result)
   * @param   {Boolean}     [showLoading=true]          Show loading indication
   * @param   {Object}      [options]                   Options (See API::call)
   * @return  {Boolean}
   */
  Process.prototype._api = function(method, args, callback, options) {
    var self = this;

    // NOTE: Backward compability
    if ( typeof options === 'boolean' ) {
      options = {
        indicator: options
      };
    } else if ( typeof options !== 'object' ) {
      options = {};
    }

    function cb(err, res) {
      if ( self.__destroyed ) {
        console.warn('Process::_api()', 'INGORED RESPONSE: Process was closed');
        return;
      }
      callback(err, res);
    }

    this._emit('api', [method]);

    return OSjs.API.call('application', {
      application: this.__iter,
      path: this.__path,
      method: method,
      args: args
    }, cb, options);
  };

  /**
   * Get a launch/session argument
   *
   * @function _getArgument
   * @memberof OSjs.Core.Process#
   *
   * @param   {String}  [k]     Argument
   *
   * @return  {Mixed}     Argument value or null
   */
  Process.prototype._getArgument = function(k) {
    return typeof this.__args[k] === 'undefined' ? null : this.__args[k];
  };

  /**
   * Get all launch/session argument
   *
   * @function _getArguments
   * @memberof OSjs.Core.Process#
   *
   * @return  {Object}
   */
  Process.prototype._getArguments = function() {
    return this.__args;
  };

  /**
   * Get full path to a resorce belonging to this process (package)
   *
   * This is a shortcut for API.getApplicationResource()
   *
   * @function _getResource
   * @memberof OSjs.Core.Process#
   * @see API.getApplicationResource()
   *
   * @param   {String}      src       Resource name (path)
   * @param   {Boolean}     [vfspath] Return a valid VFS path
   *
   * @return  {String}
   */
  Process.prototype._getResource = function(src, vfspath) {
    return API.getApplicationResource(this, src, vfspath);
  };

  /**
   * Set a launch/session argument
   *
   * @function _setArgument
   * @memberof OSjs.Core.Process#
   *
   * @param   {String}    k             Key
   * @param   {String}    v             Value
   */
  Process.prototype._setArgument = function(k, v) {
    this.__args[k] = v;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Process          = Object.seal(Process);

  OSjs.API.killAll           = doKillAllProcesses;
  OSjs.API.kill              = doKillProcess;
  OSjs.API.message           = doProcessMessage;
  OSjs.API.getProcess        = doGetProcess;
  OSjs.API.getProcesses      = doGetProcesses;

})(OSjs.Utils, OSjs.API);
