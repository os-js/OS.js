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
(function(Utils, API) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.API    = OSjs.API    || {};
  OSjs.Core   = OSjs.Core   || {};

  /////////////////////////////////////////////////////////////////////////////
  // GLOBALS
  /////////////////////////////////////////////////////////////////////////////

  var _PROCS = [];        // Running processes

  function _kill(pid, force) {
    if ( pid >= 0 ) {
      if ( _PROCS[pid] ) {
        console.warn('Killing application', pid);
        if ( _PROCS[pid].destroy(true, force) === false ) {
          return;
        }
        _PROCS[pid] = null;
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // API METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Kills all processes
   *
   * @param   Mixed     match     String/RegExp to match with (optional)
   * @param   boolean   force     Force killing (optional, default=false)
   *
   * @return  void
   * @api     OSjs.API.killAll()
   */
  function doKillAllProcesses(match, force) {
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
            _kill(p.__pid, force);
          }
        });
      }
      return;
    }

    _PROCS.forEach(function(proc, i) {
      if ( proc ) {
        proc.destroy(false, true);
      }
      _PROCS[i] = null;
    });
    _PROCS = [];
  }

  /**
   * Kills a process
   *
   * @param   int     pid       Process ID
   *
   * @return  void
   * @api     OSjs.API.kill()
   */
  function doKillProcess(pid) {
    _kill(pid, false);
  }

  /**
   * Sends a message to all processes
   *
   * Example: VFS uses this to signal file changes etc.
   *
   * @param   String    msg     Message name
   * @param   Object    opts    Options
   *
   * @return  void
   * @see     Process::_onMessage()
   * @api     OSjs.API.message()
   */
  function doProcessMessage(msg, opts) {
    console.info('doProcessMessage', msg, opts);
    _PROCS.forEach(function(p, i) {
      if ( p && (p instanceof OSjs.Core.Application || p instanceof Process) ) {
        p._onMessage(null, msg, opts);
      }
    });
  }

  /**
   * Get a process by name
   *
   * @param   String    name    Process Name (or by number)
   * @param   boolean   first   Return the first found
   *
   * @return  Process           Or an Array of Processes
   * @api     OSjs.API.getProcess()
   */
  function doGetProcess(name, first) {
    var p;
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
   * @return  Array
   *
   * @api     OSjs.API.getProcesses()
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
   * @param   String    name    Process Name
   *
   * @api     OSjs.Core.Process
   * @class
   */
  function Process(name, args, metadata) {
    this.__pid        = _PROCS.push(this) - 1;
    this.__pname      = name;
    this.__args       = args || {};
    this.__metadata   = metadata || {};
    this.__started    = new Date();
    this.__destroyed  = false;

    this.__label    = this.__metadata.name;
    this.__path     = this.__metadata.path;
    this.__scope    = this.__metadata.scope || 'system';
    this.__iter     = this.__metadata.className;

    console.group('Process::constructor()');
    console.log('pid', this.__pid);
    console.log('pname', this.__pname);
    console.log('started', this.__started);
    console.log('args', this.__args);
    console.groupEnd();
  }

  /**
   * Destroys the process
   *
   * @param   boolean   kill    Force kill ?
   *
   * @return  boolean
   *
   * @method  Process::destroy()
   */
  Process.prototype.destroy = function(kill) {
    kill = (typeof kill === 'undefined') ? true : (kill === true);
    if ( !this.__destroyed ) {

      console.log('OSjs::Core::Process::destroy()', this.__pid, this.__pname);

      if ( kill ) {
        if ( this.__pid >= 0 ) {
          _PROCS[this.__pid] = null;
        }
      }

      this.__destroyed = true;

      return true;
    }
    return false;
  };

  /**
   * Placeholder for messages sendt via API
   *
   * @return  void
   *
   * @method  Process::_onMessage()
   */
  Process.prototype._onMessage = function(obj, msg, args) {
  };

  /**
   * Call the ApplicationAPI
   *
   * This is used for calling 'api.php' or 'api.js' in your Application.
   *
   * On Lua or Arduino it is called 'server.lua'
   *
   * @param   String      method      Name of method
   * @param   Object      args        Arguments in JSON
   * @param   Function    callback    Callback method => fn(error, result)
   * @param   boolean     showLoading Show loading indication (default=true)
   *
   * @return  boolean
   *
   * @method  Process::_api()
   */
  Process.prototype._api = function(method, args, callback, showLoading) {
    var self = this;

    function cb(err, res) {
      if ( self.__destroyed ) {
        console.warn('Process::_api()', 'INGORED RESPONSE: Process was closed');
        return;
      }
      callback(err, res);
    }

    return OSjs.API.call('application', {
      application: this.__iter,
      path: this.__path,
      method: method,
      'arguments': args, __loading: showLoading
    }, cb);
  };

  /**
   * Call the ApplicationAPI
   *
   * This is used for calling 'api.php' or 'api.js' in your Application.
   *
   * On Lua or Arduino it is called 'server.lua'
   *
   * WARNING: THIS METHOD WILL BE DEPRECATED
   *
   * @param   String      method      Name of method
   * @param   Object      args        Arguments in JSON
   * @param   Function    onSuccess   When request is done callback fn(result)
   * @param   Function    onError     When an error occured fn(error)
   * @param   boolean     showLoading Show loading indication (default=true)
   *
   * @return  boolean
   *
   * @method  Process::_call()
   */
  Process.prototype._call = function(method, args, onSuccess, onError, showLoading) {
    var self = this;

    function _defaultError(err) {
      err = err || 'Unknown error';
      OSjs.API.error(OSjs.API._('ERR_APP_API_ERROR'),
                     OSjs.API._('ERR_APP_API_ERROR_DESC_FMT', self.__pname, method),
                     err);
    }

    console.warn('********************************* WARNING *********************************');
    console.warn('THE METHOD Process:_call() IS DEPRECATED AND WILL BE REMOVED IN THE FUTURE');
    console.warn('PLEASE USE Process::_api() INSTEAD!');
    console.warn('***************************************************************************');

    this._api(method, args, function(err, res) {
      if ( err ) {
        (onError || _defaultError)(err);
      } else {
        (onSuccess || function() {})(res);
      }
    }, showLoading);
  };

  /**
   * Get a launch/session argument
   *
   * @return  Mixed     Argument value or null
   *
   * @method  Process::_getArgument()
   */
  Process.prototype._getArgument = function(k) {
    return typeof this.__args[k] === 'undefined' ? null : this.__args[k];
  };

  /**
   * Get all launch/session argument
   *
   * @return  Array
   *
   * @method  Process::_getArguments()
   */
  Process.prototype._getArguments = function() {
    return this.__args;
  };

  /**
   * Get full path to a resorce belonging to this process (package)
   *
   * This is a shortcut for API.getApplicationResource()
   *
   * @param   String      src       Resource name (path)
   *
   * @return  String
   *
   * @method  Process::_getResource()
   * @see     API::getApplicationResource()
   */
  Process.prototype._getResource = function(src) {
    return API.getApplicationResource(this, src);
  };

  /**
   * Set a launch/session argument
   *
   * @param   String    k             Key
   * @param   String    v             Value
   *
   * @return  void
   *
   * @method  Process::_setArgument()
   */
  Process.prototype._setArgument = function(k, v) {
    this.__args[k] = v;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Process          = Process;

  OSjs.API.killAll           = doKillAllProcesses;
  OSjs.API.kill              = doKillProcess;
  OSjs.API.message           = doProcessMessage;
  OSjs.API.getProcess        = doGetProcess;
  OSjs.API.getProcesses      = doGetProcesses;

})(OSjs.Utils, OSjs.API);
