/*!
 * OS.js - JavaScript Operating System
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

(function(Utils, API, GUI, Window) {
  'use strict';

  var OSjs = window.OSjs = window.OSjs || {};

  OSjs.Helpers = OSjs.Helpers || {};

  var URL_FMT = 'https://marketplace.firefox.com/api/';

  function buildURL(path, args) {
    var str = [];
    Object.keys(args).forEach(function(i) {
      str.push(i + '=' + args[i]);
    });
    return URL_FMT + path + (str.length ? '?' : '') + str.join('&');
  }

  function apiCall(url, callback) {
    API.curl({
      body: {
        url: url,
        binary: false,
        mime: 'application/json',
        method: 'GET'
      }
    }, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }

      if ( !response.body ) {
        callback('Response was empty');
        return;
      }

      var data = JSON.parse(response.body);
      callback(false, data);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var SingletonInstance = null;

  /**
   * The FirefoxMarketplace wrapper class
   *
   * This is a private class and can only be aquired through
   * OSjs.Helpers.FirefoxMarketplace.createInsatance()
   *
   * @link http://firefox-marketplace-api.readthedocs.org/en/latest
   *
   * @see OSjs.Helpers.FirefoxMarketplace.createInsatance()
   * @api OSjs.Helpers.FirefoxMarketplace.FirefoxMarketplace
   *
   * @private
   * @class
   */
  function FirefoxMarketplace(clientId) {
  }

  /**
   * Destroy the class
   */
  FirefoxMarketplace.prototype.destroy = function() {
  };

  /**
   * Initializes (preloads) the API
   */
  FirefoxMarketplace.prototype.init = function(callback) {
    callback = callback || function() {};
    callback();
  };

  /**
   * Call the Marketplace API
   *
   * @param   String      func          The URI (function)
   * @param   Object      data          Tuple with arguments
   * @param   Function    callback      Callback => fn(error, result, url)
   *
   * @return  void
   *
   * @method  FirefoxMarketplace::_call()
   */
  FirefoxMarketplace.prototype._call = function(func, data, callback) {
    var url = buildURL(func, data);
    apiCall(url, callback);
  };

  /**
   * Get metadata for application by id
   *
   * @param   int         id            Application ID
   * @param   Function    callback      Callback => fn(error, result, url)
   *
   * @return  void
   *
   * @method  FirefoxMarketplace::_metadata()
   */
  FirefoxMarketplace.prototype._metadata = function(appId, callback) {
    var func = 'v2/apps/app/' + appId.toString() + '/';
    var data = {};

    callback = callback || function() {};

    this._call(func, data, function(error, response) {
      if ( error ) { callback(error); return; }

      var url = response.manifest_url;

      apiCall(url, function(error, metadata) {
        if ( error ) { callback(error); }

        callback(false, metadata, url);
      });

    });
  };

  /**
   * Search for an application
   *
   * If no query is given, the featured list is retrieved
   *
   * @param   String      q             Query string (optional)
   * @param   Function    callback      Callback => fn(error, result)
   *
   * @return  void
   *
   * @method  FirefoxMarketplace::search()
   */
  FirefoxMarketplace.prototype.search = function(q, callback) {
    var func = 'v1/fireplace/search/featured/';
    var data = {
      type: 'app',
      app_type: 'hosted'
    };

    if ( q ) {
      func = 'v1/apps/search/';
      data.q = q;
    }

    callback = callback || function() {};

    this._call(func, data, function(error, response) {
      if ( error ) { callback(error); return; }

      callback(false, response.objects);
    });
  };

  /**
   * Launch an application by Id
   *
   * @param   int         id            Application ID
   * @param   Function    callback      Callback => fn(error, result)
   *
   * @return  void
   *
   * @method  FirefoxMarketplace::launch()
   */
  FirefoxMarketplace.prototype.launch = function(id, callback) {
    callback = callback || function() {};

    this._metadata(id, function(error, metadata, url) {
      if ( error ) { callback(error); return; }

      metadata = metadata || {};

      var resolve = document.createElement('a');
      resolve.href = url;

      var launcher = resolve.host + (metadata.launch_path ? ('/' + metadata.launch_path) : '');
      launcher = resolve.protocol + '//' + launcher.replace(/\/+/g, '/');

      var wm = OSjs.Core.getWindowManager();
      var icon = metadata.icons ? metadata.icons['128'] : null;
      if ( icon && icon.match(/^\//) ) {
        icon = resolve.protocol + '//' + resolve.host + icon;
      }

      var name = 'FirefoxMarketplace' + id.toString();
      var win = new OSjs.Helpers.IFrameApplicationWindow(name, {
        width: 300,
        height: 155,
        title: metadata.name,
        icon: icon,
        src: launcher
      });
      wm.addWindow(win);

      callback(false, win);
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.FirefoxMarketplace = OSjs.Helpers.FirefoxMarketplace || {};

  /**
   * Gets the currently running instance
   *
   * @api OSjs.Helpers.FirefoxMarketplace.getInstance()
   *
   * @return  FirefoxMarketplace       Can also be null
   */
  OSjs.Helpers.FirefoxMarketplace.getInstance = function() {
    return SingletonInstance;
  };

  /**
   * Create an instance of FirefoxMarketplace
   *
   * @param   Object    args      Arguments
   * @param   Function  callback  Callback function => fn(error, instance)
   *
   * @option  args    Array     scope     What scope to load
   *
   * @api OSjs.Helpers.FirefoxMarketplace.createInstance()
   *
   * @return  void
   */
  OSjs.Helpers.FirefoxMarketplace.createInstance = function(args, callback) {
    args = args || {};

    if ( !SingletonInstance ) {
      SingletonInstance = new FirefoxMarketplace();
      SingletonInstance.init(function() {
        callback(false, SingletonInstance);
      });
      return;
    }

    callback(false, SingletonInstance);
  };

})(OSjs.Utils, OSjs.API, OSjs.GUI, OSjs.Core.Window);
