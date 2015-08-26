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

(function(Utils) {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};

  /////////////////////////////////////////////////////////////////////////////
  // Settings Fragment.
  /////////////////////////////////////////////////////////////////////////////

  function SettingsFragment(obj, poolName) {
    this._pool = poolName;
    if ( obj.constructor !== {}.constructor ) {
      throw new Error('SettingsFragment will not work unless you give it a object to manage.');
    }

    this._settings = obj;
  }

  SettingsFragment.prototype.get = function(key) {
    if ( !key ) {
      return this._settings;
    }

    return this._settings[key];
  };

  SettingsFragment.prototype.set = function(key, value, save) {
    // Key here is actually the value
    // So you can update the whole object if you want.
    if ( key === null ) {
      Utils.mergeObject(this._settings, value);
    } else {
      this._settings[key] = value;
    }

    if (save) {
      OSjs.Core.getSettingsManager().save(this._pool);
    }

    return this;
  };

  SettingsFragment.prototype.save = function(callback) {
    return OSjs.Core.getSettingsManager().save(this._pool, callback);
  };

  SettingsFragment.prototype.getChained = function () {
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

  SettingsFragment.prototype.mergeDefaults = function(defaults) {
    Utils.mergeObject(this._settings, defaults, {overwrite: false});
    return this;
  };

  SettingsFragment.prototype.instance = function(key) {
    if (this._settings[key] === undefined) {
      throw new Error('The object doesn\'t contain that key. SettingsFragment will not work.');
    }

    return new OSjs.Helpers.SettingsFragment(this._settings[key], this._pool);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.SettingsFragment = SettingsFragment;

})(OSjs.Utils);
