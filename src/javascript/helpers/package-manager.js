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
  // DEFAULT PACKAGE MANAGER
  /////////////////////////////////////////////////////////////////////////////

  var PackageManager = function(uri) {
    this.packages = {};
    this.uri = uri;
  };

  /**
   * Load Metadata from server and set packages
   */
  PackageManager.prototype.load = function(callback) {
    var self = this;
    callback = callback || {};

    console.info('PackageManager::load()');

    return Utils.ajax({
      url: this.uri,
      json: true,
      onsuccess: function(response, request, url) {
        response = Utils.fixJSON(response);

        if ( response ) {
          self._setPackages(response);
          callback(true);
        } else {
          callback(false, 'No packages found!');
        }
      },
      onerror: function(error, response, request, url) {
        if ( request && request.status !== 200 ) {
          error = 'Failed to load package manifest from ' + self.uri + ' - HTTP Error: ' + request.status;
        }
        callback(false, error);
      }
    });
  };

  /**
   * Set package list (does some corrections for locale)
   */
  PackageManager.prototype._setPackages = function(result) {
    console.debug('PackageManager::_setPackages()', result);
    var currLocale = API.getLocale();
    var resulted = {};

    Object.keys(result).forEach(function(i) {
      var newIter = result[i];
      if ( typeof newIter.names !== 'undefined' ) {
        if ( newIter.names[currLocale] ) {
          newIter.name = newIter.names[currLocale];
        }
      }
      if ( typeof newIter.descriptions !== 'undefined' ) {
        if ( newIter.descriptions[currLocale] ) {
          newIter.description = newIter.descriptions[currLocale];
        }
      }

      if ( !newIter.description ) {
        newIter.description = newIter.name;
      }

      resulted[i] = newIter;
    });

    this.packages = resulted;
  };

  /**
   * Get package by name
   */
  PackageManager.prototype.getPackage = function(name) {
    if ( typeof this.packages[name] !== 'undefined' ) {
      return this.packages[name];
    }
    return false;
  };

  /**
   * Get all packages
   */
  PackageManager.prototype.getPackages = function() {
    return this.packages;
  };

  /**
   * Get packages by Mime support type
   */
  PackageManager.prototype.getPackagesByMime = function(mime) {
    var list = [];
    var self = this;
    Object.keys(this.packages).forEach(function(i) {
      var a = self.packages[i];
      if ( a && a.mime ) {
        if ( Utils.checkAcceptMime(mime, a.mime) ) {
          list.push(i);
        }
      }
    });
    return list;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.PackageManager = PackageManager;

})(OSjs.Utils, OSjs.VFS, OSjs.API);

