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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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
(function(_path, _fs) {
  'use strict';

  /**
   * @namespace Handler
   */

  var ignorePrivilegesAPI = ['login'];
  var ignorePrivilegesVFS = ['getMime', 'getRealPath'];

  function getSettingsPath(cfg, username) {
    if ( username === 'root' ) {
      return '/root';
    }
    return cfg.settings.replace('%USERNAME%', username);
  }

  /**
   * Internal for registering a API method. This wraps the methods so that
   * privilege checks etc are performed
   */
  function registerAPIMethod(handler, instance, fn, fref) {
    if ( !instance.api[fn] ) {
      if ( ignorePrivilegesAPI.indexOf(fn) < 0 ) {
        instance.api[fn] = function(server, args, callback) {
          handler.checkAPIPrivilege(server, fn, function(err) {
            if ( err ) {
              callback(err);
              return;
            }

            try {
              fref.apply(fref, [server, args, callback]);
            } catch ( e ) {
              callback(e);
            }
          });
        };
      } else {
        instance.api[fn] = fref;
      }
    }
  }

  /**
   * Internal for registering a VFS method. This wraps the methods so that
   * privilege checks etc are performed
   */
  function registerVFSMethod(handler, instance, fn, fref) {
    if ( !instance.vfs[fn] ) {
      if ( ignorePrivilegesVFS.indexOf(fn) < 0 ) {
        instance.vfs[fn] = function(server, args, callback) {
          handler.checkAPIPrivilege(server, 'fs', function(err) {
            if ( err ) {
              callback(err);
              return;
            }

            handler.checkVFSPrivilege(server, fn, args, function(err) {
              if ( err ) {
                callback(err);
                return;
              }

              handler.onVFSRequest(server, fn, args, function(err, resp) {
                if ( arguments.length === 2 ) {
                  callback(err, resp);
                } else {
                  fref.apply(fref, [server, args, callback]);
                }
              });
            });
          });
        };
      } else {
        instance.vfs[fn] = fref;
      }
    }
  }

  /**
   * Internal for registerin lists of API method(s)
   */
  function registerMethods(handler, instance, api, vfs) {
    Object.keys(vfs || {}).forEach(function(fn) {
      registerVFSMethod(handler, instance, fn, vfs[fn]);
    });
    Object.keys(api || {}).forEach(function(fn) {
      registerAPIMethod(handler, instance, fn, api[fn]);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // DEFAULT HANDLER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Server Handler Instance
   *
   * This is what is responsible for all API and VFS communication and user
   * session(s).
   *
   * @param   {Object}      instance      Current server instance
   * @param   {Object}      applyAPI      Apply these API methods
   * @param   {Object}      applyVFS      Apply these VFS methods
   *
   * @constructor Class
   * @memberof Handler
   */
  function DefaultHandler(instance, applyAPI, applyVFS) {
    registerMethods(this, instance, applyAPI, applyVFS);
    this.instance = instance;
  }

  /**
   * Creates the user home path from
   *
   * @param   {Object}      server        Server object
   *
   * @return  {String}
   *
   * @function getHomePath
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.getHomePath = function(server) {
    var userdir = server.request.session.get('username');
    if ( !userdir ) {
      throw 'No user session was found';
    }
    return _path.join(server.config.vfs.homes, userdir);
  };

  /**
   * Gets the username of currently active user
   *
   * @param   {Object}      server        Server object
   *
   * @function getUserName
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.getUserName = function(server) {
    return server.request.session.get('username');
  };

  /**
   * Gets the groups of currently active user
   *
   * @param   {Object}      server        Server object
   *
   * @function getUserGroups
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.getUserGroups = function(server) {
    var groups = [];
    try {
      groups = JSON.parse(server.request.session.get('groups'));
    } catch ( e ) {
      groups = [];
    }
    return groups;
  };

  /**
   * Gets the blacklisted packages of active user
   *
   * @param   {Object}      server        Server object
   * @param   {Function}    callback      Callback function => fn(error, result)
   *
   * @function getUserBlacklistedPackages
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.getUserBlacklistedPackages = function(server, callback) {
    callback(false, []);
  };

  /**
   * Sets the user data of active user
   *
   * @param   {Object}      server        Server object
   * @param   {Object}      data          Session data
   * @param   {Function}    callback      Callback function => fn(error, result)
   *
   * @function setUserData
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.setUserData = function(server, data, callback) {
    if ( data === null ) {
      server.request.session.set('username', null);
      server.request.session.set('groups', null);
    } else {
      server.request.session.set('username', data.username);
      server.request.session.set('groups', JSON.stringify(data.groups));
    }

    callback(false, true);
  };

  /**
   * Check if request has access to given API request
   *
   * <pre><code>
   * THIS IS THE METHOD CALLED FROM THE SERVER
   * </pre></code>
   *
   * @param   {Object}      server        Server object
   * @param   {Mixed}       privilege     Check against given privilege(s)
   * @param   {Function}    callback      Callback function => fn(err, result)
   *
   * @return  {Boolean}                   Return true for normal, false for custom callback
   *
   * @function checkAPIPrivilege
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.checkAPIPrivilege = function(server, privilege, callback) {
    var self = this;
    this._checkHasSession(server, function(err) {
      if ( err ) {
        callback(err);
        return;
      }
      self._checkHasAPIPrivilege(server, privilege, callback);
    });
  };

  /**
   * Check if request has access to given VFS request
   *
   * <pre><code>
   * THIS IS THE METHOD CALLED FROM THE SERVER
   * </pre></code>
   *
   * @param   {Object}      server        Server object
   * @param   {String}      method        VFS Method name
   * @param   {Object}      args          VFS Method arguments
   * @param   {Function}    callback      Callback function => fn(err, result)
   *
   * @return  {Boolean}                   Return true for normal, false for custom callback
   *
   * @function checkVFSPrivilege
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.checkVFSPrivilege = function(server, method, args, callback) {
    var self = this;
    this._checkHasSession(server, function(err) {
      if ( err ) {
        callback(err);
        return;
      }
      self._checkHasVFSPrivilege(server, method, args, callback);
    });
  };

  /**
   * Check if request has access to given Package
   *
   * <pre><code>
   * THIS IS THE METHOD CALLED FROM THE SERVER
   * </pre></code>
   *
   * @param   {Object}      server        Server object
   * @param   {String}      packageName   Name of Package (ex: repo/name)
   * @param   {Function}    callback      Callback function => fn(err, result)
   *
   * @return  {Boolean}                   Return true for normal, false for custom callback
   *
   * @function checkPackagePrivilege
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.checkPackagePrivilege = function(server, packageName, callback) {
    var self = this;
    this._checkHasSession(server, function(err) {
      if ( err ) {
        callback(err);
        return;
      }
      self._checkHasPackagePrivilege(server, packageName, callback);
    });
  };

  /**
   * Event fired when server starts
   *
   * @function onServerStart
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.onServerStart = function(cb) {
    cb();
  };

  /**
   * Event fired when server ends
   *
   * @function onServerEnd
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.onServerEnd = function(cb) {
    cb();
  };

  /**
   * Event fired when server gets a login
   *
   * @param     {Object}        server        Server object
   * @param     {Object}        data          The login data
   * @param     {Function}      callback      Callback fuction
   *
   * @function onLogin
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.onLogin = function(server, data, callback) {
    var self = this;

    function finished() {
      if ( data.blacklistedPackages ) {
        callback(false, data);
      } else {
        self.getUserBlacklistedPackages(server, function(error, blacklist) {
          if ( error ) {
            callback(error);
          } else {
            data.blacklistedPackages = blacklist || [];
          }
          callback(false, data);
        });
      }
    }

    data.userSettings = data.userSettings || {};

    this.setUserData(server, data.userData, function() {
      finished();
    });
  };

  /**
   * Event fired when server gets a logout
   *
   * @param     {Object}        server        Server object
   * @param     {Function}      callback      Callback fuction
   *
   * @function onLogout
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.onLogout = function(server, callback) {
    this.setUserData(server, null, function() {
      callback(false, true);
    });
  };

  /**
   * Event fired when client requests a VFS event
   *
   * @param     {Object}        server        Server object
   * @param     {String}        vfsMethod     VFS Method
   * @param     {Object}        vfsArguments  VFS Arguments
   * @param     {Function}      callback      Callback fuction
   *
   * @function onVFSRequest
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.onVFSRequest = function(server, vfsMethod, vfsArguments, callback) {
    // If you want to interrupt or modify somehow, just send the two arguments to the
    // callback: (error, result)
    callback(/* continue normal behaviour */);
  };

  /**
   * Default method for checking if User has given group(s)
   *
   * <pre><code>
   * If the user has group 'admin' it will automatically granted full access
   * </pre></code>
   *
   * @param   {Object}      server        Server object
   * @param   {String}      groupname     Group name(s) (can also be an array)
   * @param   {Function}    callback      Callback function => fn(err, result)
   *
   * @return  {Boolean}
   *
   * @function _checkHasGroup
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype._checkHasGroup = function(server, groupnames, callback) {
    groupnames = groupnames || [];
    if ( !(groupnames instanceof Array) && groupnames ) {
      groupnames = [groupnames];
    }

    var self = this;
    var allowed = (function() {
      if ( typeof groupnames !== 'boolean' ) {
        var groups = self.getUserGroups(server);
        if ( groups.indexOf('admin') < 0 ) {
          var allowed = true;
          groupnames.forEach(function(p) {
            if ( groups.indexOf(p) < 0 ) {
              allowed = false;
            }
            return allowed;
          });
          return allowed;
        }
      }

      return true;
    })();

    callback(false, allowed);
  };

  /**
   * Default method for checking if user has a session
   *
   * @param   {Object}      server        Server object
   * @param   {Function}    callback      Callback function => fn(err, result)
   *
   * @function _checkHasSession
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype._checkHasSession = function(server, callback) {
    if ( !this.instance.setup.nw && !this.getUserName(server) ) {
      callback('You have no OS.js Session, please log in!');
      return;
    }
    callback(false, true);
  };

  /**
   * Default method for checking blacklisted package permissions
   *
   * @param   {Object}      server        Server object
   * @param   {String}      packageName   Name of the package
   * @param   {Function}    callback      Callback function => fn(err, result)
   *
   * @function _checkHasBlacklistedPackage
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype._checkHasBlacklistedPackage = function(server, packageName, callback) {
    this.getUserBlacklistedPackages(server, function(error, list) {
      if ( error ) {
        callback(error, false);
      } else {
        callback(false, (list || []).indexOf(packageName) >= 0);
      }
    });
  };

  /**
   * Check if active user has given API privilege
   *
   * @function _checkHasAPIPrivilege
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype._checkHasAPIPrivilege = function(server, privilege, callback) {
    var map = this.instance.config.api.groups;
    if ( map && privilege && map[privilege] ) {
      this._checkHasGroup(server, privilege, function(err, res) {
        if ( !res && !err ) {
          err = 'You are not allowed to use this API function!';
        }
        callback(err, res);
      });
      return;
    }

    callback(false, true);
  };

  /**
   * Check if active user has given VFS privilege
   *
   * <pre><code>
   * This method only checks for the 'mount' location. You can
   * override this to make it check for given method name as well
   * </pre></code>
   *
   * @function _checkHasVFSPrivilege
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype._checkHasVFSPrivilege = function(server, method, args, callback) {
    var mount = this.instance.vfs.getRealPath(server, args.path || args.src);
    var cfg = this.instance.config.vfs.groups;
    var against;

    try {
      against = cfg[mount.protocol.replace(/\:\/\/$/, '')];
    } catch ( e ) {}

    if ( against ) {
      this._checkHasGroup(server, against, function(err, res) {
        if ( !res && !err ) {
          err = 'You are not allowed to use this VFS function!';
        }
        callback(err, res);
      });
      return;
    }

    callback(false, true);
  };

  /**
   * Check if active user has given Package privilege
   *
   * <pre><code>
   * This method checks user groups against the ones defined in package metadata
   * </pre></code>
   *
   * @function _checkHasPackagePrivilege
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype._checkHasPackagePrivilege = function(server, packageName, callback) {
    var packages = this.instance.metadata;
    var self = this;

    function notallowed(err) {
      callback(err || 'You are not allowed to load this Package');
    }

    if ( packages && packages[packageName] && packages[packageName].groups ) {
      this._checkHasGroup(server, packages[packageName].groups, function(err, res) {
        if ( err ) {
          notallowed(err);
        } else {
          if ( res ) {
            self._checkHasBlacklistedPackage(server, packageName, function(err, res) {
              if ( err || !res ) {
                notallowed(err);
              } else {
                callback(false, true);
              }
            });
          } else {
            notallowed();
          }
        }
      });
      return;
    }

    callback(false, true);
  };

  /**
   * Perform a system-type login event.
   *
   * <pre><code>
   * Used for PAM and Shadow handler.
   *
   * This method will:
   * - Fetch user settings from the home directory
   * - Get the user groups from etc file
   * - Get user-blacklisted packages from home directory
   * - Gets user-id (external event)
   * </pre></code>
   *
   * @param     {Object}        server        Server object
   * @param     {Object}        config        Handler config object
   * @param     {Object}        login         The login object
   * @param     {Function}      getUserId     Function for getting userid
   * @param     {Function}      callback      Callback fuction
   *
   * @function onSystemLogin
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.onSystemLogin = function(server, config, login, getUserId, callback) {
    var self = this;

    function getUserGroups(cb) {
      _fs.readFile(config.groups, function(err, gdata) {
        var list = {};
        var defaultGroups = config.defaultGroups || [];

        if ( !err ) {
          try {
            list = JSON.parse(gdata.toString());
          } catch ( e ) {}
        }

        cb(list[login.username] || defaultGroups);
      });
    }

    function getUserSettings(cb) {
      _fs.readFile(getSettingsPath(config, login.username), function(err, sdata) {
        var settings = {};
        if ( !err && sdata ) {
          try {
            settings = JSON.parse(sdata.toString());
          } catch ( e ) {}
        }
        cb(settings);
      });
    }

    function getUserBlacklist(cb) {
      _fs.readFile(config.blacklist, function(err, bdata) {
        var blacklist = [];

        if ( !err && bdata ) {
          try {
            blacklist = JSON.parse(bdata)[login.username] || [];
          } catch ( e ) {}
        }

        cb(blacklist);
      });
    }

    function done(data, settings, blacklist) {
      self.onLogin(server, {
        userData: {
          id:       data.id,
          username: login.username,
          name:     data.name,
          groups:   data.groups
        },

        userSettings: settings,
        blacklistedPackages: blacklist
      }, callback);
    }

    getUserSettings(function(settings) {
      getUserGroups(function(groups) {
        getUserBlacklist(function(blacklist) {
          getUserId(function(uid) {
            done({
              id: uid,
              groups: groups,
              name: login.username
            }, settings, blacklist);
          });
        });
      });
    });
  };

  /**
   * Stores the user setings into the home directory of user
   *
   * @param     {Object}        server        Server object
   * @param     {Object}        config        Handler config object
   * @param     {Object}        settings      The settings object
   * @param     {Function}      getUserId     Function for getting userid
   * @param     {Function}      callback      Callback fuction
   *
   * @function onSystemSettings
   * @memberof Handler.Class#
   */
  DefaultHandler.prototype.onSystemSettings = function(server, config, settings, callback) {
    var uname = this.getUserName(server);
    var data  = JSON.stringify(settings);
    var spath = getSettingsPath(config, uname);

    // Make sure directory exists before writing
    _fs.mkdir(_path.dirname(spath), function() {
      _fs.writeFile(spath, data,  function(err) {
        callback(err || false, !!err);
      });
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // NW HANDLER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @constructor NWClass
   * @memberof Handler
   */
  function NWHandler(instance) {
    DefaultHandler.call(this, instance, {
      login: function(server, args, callback) {
        server.handler.onLogin(server, {
          userData: {
            id: 0,
            username: 'nw',
            name: 'NW.js User',
            groups: ['admin']
          }
        }, callback);
      },
      logout: function(server, args, callback) {
        server.handler.onLogout(server, callback);
      }
    });
  }

  NWHandler.prototype = Object.create(DefaultHandler.prototype);
  NWHandler.constructor = DefaultHandler;

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Initializes the handler
   *
   * @param   {Object}      instance      Current server instance
   *
   * @return  {Handler.Handler}
   *
   * @function init
   * @memberof Handler
   */
  module.exports.init = function(instance) {

    // Register 'handler' API methods
    var handler;

    if ( instance.setup.nw ) {
      handler = new NWHandler(instance);
    } else {
      var hs = _path.join(instance.setup.dirname, 'handlers', instance.config.handler, 'handler.js');
      instance.logger.lognt(instance.logger.INFO, '+++', '{Handler}', hs.replace(instance.setup.root, '/'));
      handler = require(hs).register(instance, DefaultHandler);
    }

    registerMethods(handler, instance, instance._api, instance._vfs);

    return handler;
  };
})(require('path'), require('node-fs-extra'));
