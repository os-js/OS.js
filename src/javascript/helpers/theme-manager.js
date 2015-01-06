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
  // DEFAULT THEME MANAGER
  /////////////////////////////////////////////////////////////////////////////

  var ThemeManager = function(uri) {
    this.themes = [];
    this.uri = uri;
  };

  ThemeManager.prototype.load = function(callback) {
    var self = this;
    callback = callback || {};

    console.info('ThemeManager::load()');

    return Utils.ajax({
      url: this.uri,
      json: true,
      parse: true,
      onsuccess: function(response, request, url) {
        response = Utils.fixJSON(response);

        if ( response ) {
          self.themes = response;
          callback(true);
        } else {
          callback(false, 'No themes found!');
        }
      },
      onerror: function(error, response, request, url) {
        if ( request && request.status !== 200 ) {
          error = 'Failed to theme manifest from ' + url + ' - HTTP Error: ' + request.status;
        }
        callback(false, error);
      }
    });
  };

  ThemeManager.prototype.getTheme = function(name) {
    var result = null;
    this.themes.forEach(function(theme, i) {
      if ( theme.name === name ) {
        result = theme;
        return false;
      }
      return true;
    });
    return result;
  };

  ThemeManager.prototype.getThemes = function() {
    return this.themes;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.ThemeManager = ThemeManager;

})(OSjs.Utils, OSjs.VFS, OSjs.API);

