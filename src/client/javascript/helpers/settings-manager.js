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
  // DEFAULT SETTINGS MANAGER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Settings Manager
   */
  function SettingsManager(defaults, defaultMerge) {
    this.defaults = {};
    this.settings = {};
    this.defaultMerge = (typeof defaultMerge === 'undefined' || defaultMerge === true);

    this.load(defaults);
  }

  SettingsManager.prototype.load = function(obj) {
    this.defaults = {};
    this.settings = {};

    if ( obj ) {
      this.defaults = JSON.parse(JSON.stringify(obj));
      this.reset();
    }
  };

  SettingsManager.prototype.reset = function() {
    this.settings = JSON.parse(JSON.stringify(this.defaults));
  };

  SettingsManager.prototype.set = function(category, name, value, merge) {
    if ( !name ) {
      return this.setCategory(category, value, merge);
    }
    return this.setCategoryItem(category, name, value, merge);
  };

  SettingsManager.prototype.get = function(category, name, defaultValue) {
    if ( !category ) {
      return this.settings;
    }
    if ( !name ) {
      return this.getCategory(category, defaultValue);
    }
    return this.getCategoryItem(category, name, defaultValue);
  };

  SettingsManager.prototype._mergeSettings = function(obj1, obj2) {
    if ( ((typeof obj2) !== (typeof obj1)) && (!obj2 && obj1) ) {
      return obj1;
    }
    if ( (typeof obj2) !== (typeof obj1) ) {
      return obj2;
    }
    return Utils.mergeObject(obj1, obj2);
  };

  SettingsManager.prototype.setCategory = function(category, value, merge) {
    console.debug('SettingsManager::setCategory()', category, value);
    if ( typeof merge === 'undefined' ) { merge = this.defaultMerge; }

    if ( merge ) {
      this.settings[category] = this._mergeSettings(this.settings[category], value);
    } else {
      this.settings[category] = value;
    }
  };

  SettingsManager.prototype.setCategoryItem = function(category, name, value, merge) {
    console.debug('SettingsManager::setCategoryItem()', category, name, value);
    if ( typeof merge === 'undefined' ) { merge = this.defaultMerge; }

    if ( !this.settings[category] ) {
      this.settings[category] = {};
    }

    if ( merge ) {
      this.settings[category][name] = this._mergeSettings(this.settings[category][name], value);
    } else {
      this.settings[category][name] = value;
    }
  };

  SettingsManager.prototype.getCategory = function(category, defaultValue) {
    if ( typeof this.settings[category] !== 'undefined' ) {
      return this.settings[category];
    }
    return defaultValue;
  };

  SettingsManager.prototype.getCategoryItem = function(category, name, defaultValue) {
    if ( typeof this.settings[category] !== 'undefined' ) {
      if ( typeof this.settings[category][name] !== 'undefined' ) {
        return this.settings[category][name];
      }
    }
    return defaultValue;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.SettingsManager = SettingsManager;

})(OSjs.Utils, OSjs.VFS, OSjs.API);

