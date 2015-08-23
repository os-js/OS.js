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

  var SettingsManager = {
    storage: {}
  };

  /**
   * Initialize SettingsManager.
   * This is run when a user logs in. It will give saved data here
   */
  SettingsManager.init = function(storage, callback) {
    this.storage = storage || {};

    callback();
  };

  /**
   * Gets either the full tree or tree entry by key
   */
  SettingsManager.get = function(pool, key) {
    try {
      return key ? this.storage[pool][key] : this.storage[pool];
    } catch ( e ) {} // TODO: Add behaviour
    return null;
  };

  /**
   * Sets either full tree or a tree entry by key
   */
  SettingsManager.set = function(pool, key, value, save) {
    try {
      this.storage[key] = value;
    } catch ( e ) {} // TODO: Add behaviour

    if ( save ) {
      this.save(pool, typeof save === 'function' ? save : function() {});
    }

    return true;
  };

  /**
   * Saves the storage to a location
   */
  SettingsManager.save = function(pool, callback) {
    callback = callback || function() {};

    callback();
  };

  /**
   * Loads actual data from store location
   * Uses defaults as fallback
   */
  SettingsManager.load = function(pool, defaults, callback) {
    callback = callback || function() {};

    this.storage[pool] = defaults;

    // TODO: Actual loading

    callback(this.storage[pool]);
  };

  /**
   * Creates a new proxy instance
   */
  SettingsManager.instance = function(pool, defaults) {
    SettingsManager.set(pool, defaults);

    return {
      get: function() { return null; },
      set: function() { return null; },
      load: function(defaults, callback) { return SettingsManager.load(pool, defaults, callback); },
      save: function(callback) { return SettingsManager.save(pool, callback); }
    };
  };

  OSjs.Helpers.SettingsManager = SettingsManager;

})(OSjs.Utils, OSjs.VFS, OSjs.API);

