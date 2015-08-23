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
    storage: {},
    defaults: {}
  };

  /**
   * Overridable Wrapper for loading
   */
  SettingsManager._load = function(callback) {
    var result = {};

    var key;
    for ( var i = 0; i < localStorage.length; i++ ) {
      key = localStorage.key(i);
      if ( key.match(/^OSjs\//) ) {
        try {
          result[key.replace(/^OSjs\//, '')] = JSON.parse(localStorage.getItem(key));
        } catch ( e ) {
          console.warn('SettingsManager::_load()', 'exception', e, e.stack);
        }
      }
    }

    callback(result);
  };

  /**
   * Overridable Wrapper for saving
   */
  SettingsManager._save = function(pool, callback) {
    var storage = this.storage;
    Object.keys(storage).forEach(function(key) {
      if ( pool && key !== pool ) {
        return;
      }

      try {
        localStorage.setItem('OSjs/' + key, JSON.stringify(storage[key]));
      } catch ( e ) {
        console.warn('SettingsManager::_save()', 'exception', e, e.stack);
      }
    });

    callback();
  };

  /**
   * Initialize SettingsManager.
   * This is run when a user logs in. It will give saved data here
   */
  SettingsManager.init = function(callback) {
    var self = this;
    this._load(function(storage) {
      self.storage = storage || {};
      callback();
    });
  };

  /**
   * Gets either the full tree or tree entry by key
   */
  SettingsManager.get = function(pool, key) {
    try {
      if ( this.storage[pool] && Object.keys(this.storage[pool]).length ) {
        return key ? this.storage[pool][key] : this.storage[pool];
      }

      return key ? this.defaults[pool][key] : this.defaults[pool];
    } catch ( e ) {
      console.warn('SettingsManager::get()', 'exception', e, e.stack);
    }

    return false;
  };

  /**
   * Sets either full tree or a tree entry by key
   */
  SettingsManager.set = function(pool, key, value, save) {
    try {
      if ( key ) {
        if ( typeof this.storage[pool] === 'undefined' ) {
          this.storage[pool] = {};
        }
        this.storage[pool][key] = value;
      } else {
        this.storage[pool] = value;
      }
    } catch ( e ) {} // TODO: Add behaviour

    if ( save ) {
      this.save(pool, save);
    }

    return true;
  };

  /**
   * Saves the storage to a location
   */
  SettingsManager.save = function(pool, callback) {
    callback = callback || function() {};
    if ( typeof callback !== 'function' ) {
      callback = function() {};
    }

    this._save(pool, callback);
  };

  /**
   * Sets the defaults for a spesific pool
   */
  SettingsManager.defaults = function(pool, defaults) {
    this.defaults[pool] = defaults;
  };

  /**
   * Creates a new proxy instance
   */
  SettingsManager.instance = function(pool, defaults) {
    if ( arguments.length > 1 ) {
      SettingsManager.defaults(pool, defaults);
    }

    return {
      get: function(key) { return SettingsManager.get(pool, key); },
      set: function(key, value, save) { return SettingsManager.set(pool, key, value, save); },
      save: function(callback) { return SettingsManager.save(pool, callback); }
    };
  };

  OSjs.Helpers.SettingsManager = SettingsManager;

})(OSjs.Utils, OSjs.VFS, OSjs.API);

