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

(function(Utils) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // Settings Fragment.
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Settings Fragment Class
   *
   * <pre><b>
   * This is the object returned when manipulating with SettingsManager.
   * </b></pre>
   *
   * @summary This is the class returned from SettingsManager getters.
   * @throws {Error} If an invalid object was given
   *
   * @param   {Object}        obj         Settings tree
   * @param   {String}        poolName    Name of the pool
   *
   * @constructor
   * @memberof OSjs.Helpers
   * @see OSjs.Core.SettingsManager
   */
  function SettingsFragment(obj, poolName) {
    this._pool = poolName;
    if ( obj.constructor !== {}.constructor ) {
      throw new Error('SettingsFragment will not work unless you give it a object to manage.');
    }

    this._settings = obj;
  }

  /**
   * Gets setting(s) by key
   *
   * @function get
   * @memberof OSjs.Helpers.SettingsFragment#
   *
   * @param   {String}        [key]              Name of key
   * @param   {Mixed}         [defaultValue]     Default value if result is undefined
   *
   * @return  {Mixed}                   Either an entry or entire tree
   */
  SettingsFragment.prototype.get = function(key, defaultValue) {
    var ret = key ? this._settings[key] : this._settings;
    return (typeof ret === 'undefined') ? defaultValue : ret;
  };

  /**
   * Sets setting(s) by key/value
   *
   * If you set `key` to `null` you will write to the tree root.
   *
   * @function set
   * @memberof OSjs.Helpers.SettingsFragment#
   *
   * @param   {Mixed}      key                   The key
   * @param   {Mixed}      value                 The value
   * @param   {Mixed}      save                  Saves the pool (either boolean or callback function)
   * @param   {Boolean}    [triggerWatch=true]   Trigger change event for watchers
   *
   * @return  {OSjs.Helpers.SettingsFragment}  Itself `this`
   */
  SettingsFragment.prototype.set = function(key, value, save, triggerWatch) {
    // Key here is actually the value
    // So you can update the whole object if you want.
    if ( key === null ) {
      Utils.mergeObject(this._settings, value);
    } else {
      if ( (['number', 'string']).indexOf(typeof key) >= 0 ) {
        this._settings[key] = value;
      } else {
        console.warn('SettingsFragment::set()', 'expects key to be a valid iter, not', key);
      }
    }

    if (save) {
      OSjs.Core.getSettingsManager().save(this._pool, save);
    }

    if ( typeof triggerWatch === 'undefined' || triggerWatch === true ) {
      OSjs.Core.getSettingsManager().changed(this._pool);
    }

    return this;
  };

  /**
   * Saves the pool
   *
   * @function save
   * @memberof OSjs.Helpers.SettingsFragment#
   * @see OSjs.Core.SettingsManager#save
   *
   * @param   {Function}      [callback]        Callback function
   *
   * @return  Boolean
   */
  SettingsFragment.prototype.save = function(callback) {
    return OSjs.Core.getSettingsManager().save(this._pool, callback);
  };

  SettingsFragment.prototype.getChained = function() {
    var nestedSetting = this._settings;
    arguments.every(function(key) {
      if (nestedSetting[key]) {
        nestedSetting = nestedSetting[key];
        return true;
      }

      return false;
    });

    return nestedSetting;
  };

  /**
   * Merges given tree with current one
   *
   * @function mergeDefaults
   * @memberof OSjs.Helpers.SettingsFragment#
   *
   * @param     {Object}        defaults        The tree
   *
   * @return  {OSjs.Helpers.SettingsFragment}  Itself `this`
   */
  SettingsFragment.prototype.mergeDefaults = function(defaults) {
    Utils.mergeObject(this._settings, defaults, {overwrite: false});
    return this;
  };

  /**
   * Creates a new SettingsFragment instance from given key
   *
   * @function instance
   * @memberof OSjs.Helpers.SettingsFragment#
   * @throws {Error} If the given key does not exist
   *
   * @param     {String}        key     Key name
   *
   * @return  {OSjs.Helpers.SettingsFragment}  New instance
   */
  SettingsFragment.prototype.instance = function(key) {
    if (typeof this._settings[key] === 'undefined') {
      throw new Error('The object doesn\'t contain that key. SettingsFragment will not work.');
    }

    return new OSjs.Helpers.SettingsFragment(this._settings[key], this._pool);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.SettingsFragment = SettingsFragment;

})(OSjs.Utils);
