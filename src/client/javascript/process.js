/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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
   * @param   String    name    Process Name
   * @param   boolean   first   Return the first found
   *
   * @return  Process           Or an Array of Processes
   * @api     OSjs.API.getProcess()
   */
  function doGetProcess(name, first) {
    var p;
    var result = first ? null : [];

    _PROCS.forEach(function(p, i) {
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
  var Process = (function() {
    var _PID = 0;

    return function(name, args, metadata) {
      metadata = metadata || {};
      args = args || {};

      this.__pid      = _PID;
      this.__pname    = name;
      this.__sname    = name; // Used internall only
      this.__args     = args;
      this.__metadata = metadata;
      this.__state    = 0;
      this.__started  = new Date();
      this.__index    = _PROCS.push(this) - 1;

      this.__label    = metadata.name;
      this.__path     = metadata.path;
      this.__scope    = metadata.scope || 'system';
      this.__iter     = metadata.className;

      console.group('Process::constructor()');
      console.log('pid',    this.__pid);
      console.log('pname',  this.__pname);
      console.log('started',this.__started);
      console.log('args',   this.__args);
      console.groupEnd();

      _PID++;
    };
  })();

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
    this.__state = -1;
    console.log('OSjs::Core::Process::destroy()', this.__pid, this.__pname);
    if ( kill ) {
      if ( this.__index >= 0 ) {
        _PROCS[this.__index] = null;
      }
    }
    return true;
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
   * @param   Function    onSuccess   When request is done callback fn(result)
   * @param   Function    onError     When an error occured fn(error)
   *
   * @return  boolean
   *
   * @method  Process::_call()
   */
  Process.prototype._call = function(method, args, onSuccess, onError) {
    var self = this;
    onSuccess = onSuccess || function() {};
    onError = onError || function(err) {
      err = err || 'Unknown error';
      OSjs.API.error(OSjs.API._('ERR_APP_API_ERROR'),
                     OSjs.API._('ERR_APP_API_ERROR_DESC_FMT', self.__pname, method),
                     err);
    };
    return OSjs.API.call('application', {'application': this.__iter, 'path': this.__path, 'method': method, 'arguments': args}, onSuccess, onError);
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
