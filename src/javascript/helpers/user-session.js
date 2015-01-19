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

(function(Utils, VFS, API) {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT USER MANAGER
  /////////////////////////////////////////////////////////////////////////////

  var UserSession = function(cfg) {
    this.userData = {
      id      : 0,
      username: 'root',
      name    : 'root user',
      groups  : ['root']
    };
  };

  UserSession.prototype.getSession = function() {
    var procs = API.getProcesses();

    function getSessionSaveData(app) {
      var args = app.__args;
      var wins = app.__windows;
      var data = {name: app.__name, args: args, windows: []};

      wins.forEach(function(win, i) {
        if ( win && win._properties.allow_session ) {
          data.windows.push({
            name      : win._name,
            dimension : win._dimension,
            position  : win._position,
            state     : win._state
          });
        }
      });

      return data;
    }

    var data = [];
    procs.forEach(function(proc, i) {
      if ( proc && (proc instanceof OSjs.Core.Application) ) {
        data.push(getSessionSaveData(proc));
      }
    });
    return data;
  };

  UserSession.prototype.loadSession = function(res, callback) {
    var list = [];
    res.forEach(function(iter, i) {
      list.push({name: iter.name, args: iter.args, data: {windows: iter.windows || []}});
    });

    API.launchList(list, function(app, metadata, appName, appArgs, queueData) {
      var data = ((queueData || {}).windows) || [];
      data.forEach(function(r, i) {
        var w = app._getWindow(r.name);
        if ( w ) {
          w._move(r.position.x, r.position.y, true);

          if ( w._properties.allow_resize ) {
            w._resize(r.dimension.w, r.dimension.h, true);
          }

          console.info('UserSession::loadSession()->onSuccess()', 'Restored window \'' + r.name + '\' from session');
        }
      });
    }, null, callback);
  };

  UserSession.prototype.setUserData = function(d) {
    this.userData = d || {};
  };

  UserSession.prototype.getUserData = function() {
    return this.userData;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.UserSession = UserSession;

})(OSjs.Utils, OSjs.VFS, OSjs.API);

