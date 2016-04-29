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
(function(_path, _fs) {
  'use strict';

  var ISWIN = /^win/.test(process.platform);

  function getConfig(setup) {
    var config  = {
      logging:    setup.logging === true,
      port:       8000,
      directory:  null, // Automatic
      tmpdir:     '/tmp',
      handler:    'demo',
      vfs:        {
        'homes':   _path.join(setup.root, 'vfs/home'),
        'tmp':     _path.join(setup.root, 'vfs/tmp'),
        'public':  _path.join(setup.root, 'vfs/public')
      },
      repodir:    setup.repodir,
      distdir:    setup.distdir,
      rootdir:    setup.root,
      iswin:      ISWIN,
      isnw:       !!setup.nw,
      mimes:      {},
      api:        {},
      proxies:    {}
    };

    if ( !config.directory ) {
      config.directory = _fs.realpathSync('.');
    }

    return config;
  }

  function readConfig(root, path) {
    try {
      var str = _fs.readFileSync(path).toString();
      var droot = root.replace(/\/$/, '');

      if ( ISWIN ) {
        str = str.replace(/%DROOT%/g,       droot.replace(/(["\s'$`\\])/g,'\\$1'));
      } else {
        str = str.replace(/%DROOT%/g,       droot);
      }

      return JSON.parse(str);
    } catch ( e ) {
      console.warn('!!!', 'Failed to parse configuration', path, e);
    }

    return false;
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Initializes OS.js configuration
   *
   * @param   Object    setup       Configuration (see osjs.js)
   *
   * @return  Object                The built configuration
   *
   * @api     config.init
   */
  module.exports.init = function(setup) {
    var config = getConfig(setup);

    if ( setup.settings ) {
      var settConfig = typeof setup.settings === 'object' ? setup.settings : readConfig(setup.root, setup.settings);
      if ( settConfig !== false ) {
        Object.keys(settConfig).forEach(function(k) {
          config[k] = settConfig[k];
        });
      }
    }

    return config;
  };

})(
  require('path'),
  require('node-fs-extra')
);
