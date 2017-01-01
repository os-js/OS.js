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

(function(API, Utils) {
  'use strict';

  var _storageInstance;

  /**
   * Storage Base Class
   *
   * @abstract
   * @constructor Storage
   * @memberof OSjs.Core
   */
  function Storage() {
    this.saveTimeout = null;

    /*eslint consistent-this: "off"*/
    _storageInstance = this;
  }

  /**
   * Initializes the Storage
   *
   * @function init
   * @memberof OSjs.Core.Storage#
   *
   * @param   {CallbackHandler}      callback        Callback function
   */
  Storage.prototype.init = function(callback) {
    callback(null, true);
  };

  /**
   * Destroys the Storage
   *
   * @function destroy
   * @memberof OSjs.Core.Storage#
   */
  Storage.prototype.destroy = function() {
  };

  /**
   * Internal for saving settings
   *
   * @function _settings
   * @memberof OSjs.Core.Storage#
   *
   * @param   {String}               [pool]          Settings pool
   * @param   {Object}               storage         Settings storage data
   * @param   {CallbackHandler}      callback        Callback function
   */
  Storage.prototype._settings = function(pool, storage, callback) {
    API.call('settings', {pool: pool, settings: Utils.cloneObject(storage)}, callback);
  };

  /**
   * Default method to save given settings pool
   *
   * @function saveSettings
   * @memberof OSjs.Core.Storage#
   *
   * @param   {String}           [pool]        Pool Name
   * @param   {Mixed}            storage       Storage data
   * @param   {CallbackHandler}  callback      Callback function
   */
  Storage.prototype.saveSettings = function(pool, storage, callback) {
    var self = this;
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(function() {
      self._settings(pool, storage, callback);
      clearTimeout(self.saveTimeout);
    }, 250);
  };

  /**
   * Default method for saving current sessions
   *
   * @function saveSession
   * @memberof OSjs.Core.Storage#
   *
   * @param   {CallbackHandler}  callback      Callback function
   */
  Storage.prototype.saveSession = function(callback) {
    var data = [];
    API.getProcesses().forEach(function(proc, i) {
      if ( proc && (proc instanceof OSjs.Core.Application) ) {
        data.push(proc._getSessionData());
      }
    });
    OSjs.Core.getSettingsManager().set('UserSession', null, data, callback);
  };

  /**
   * Get last saved sessions
   *
   * @function getLastSession
   * @memberof OSjs.Core.Storage#
   *
   * @param   {CallbackHandler}  callback      Callback function
   */
  Storage.prototype.getLastSession = function(callback) {
    callback = callback || function() {};

    var res = OSjs.Core.getSettingsManager().get('UserSession');
    var list = [];
    (res || []).forEach(function(iter, i) {
      var args = iter.args;
      args.__resume__ = true;
      args.__windows__ = iter.windows || [];

      list.push({name: iter.name, args: args});
    });

    callback(false, list);
  };

  /**
   * Default method to restore last running session
   *
   * @function loadSession
   * @memberof OSjs.Core.Storage#
   *
   * @param   {Function}  callback      Callback function => fn()
   */
  Storage.prototype.loadSession = function(callback) {
    callback = callback || function() {};

    console.info('Storage::loadSession()');

    this.getLastSession(function onGetLastSession(err, list) {
      if ( err ) {
        callback();
      } else {
        API.launchList(list, null, null, callback);
      }
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Storage = Storage;

  /**
   * Get running 'Storage' instance
   *
   * @function getStorage
   * @memberof OSjs.Core
   *
   * @return {OSjs.Core.Storage}
   */
  OSjs.Core.getStorage = function Core_getStorage() {
    return _storageInstance;
  };

})(OSjs.API, OSjs.Utils);

