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
(function(_path, _fs) {
  var ISWIN   = /^win/.test(process.platform);
  var ISNW    = false;
  var CONFIG  = {};
  var ROOTDIR = __dirname;
  var DISTDIR = '';

  try {
    if ( typeof require('nw.gui') !== "undefined" ) {
      ISNW = true;
    }
  } catch ( e ) {}

  if ( !ISNW ) {
    ROOTDIR = _path.join(_path.dirname(__filename), '/../../../');
    DISTDIR = (process && process.argv.length > 2) ? process.argv[2] : 'dist';
    if ( (process.argv[1] || '').match(/(mocha|grunt)$/) ) {
      DISTDIR = 'dist-dev';
    }
  }

  function readConfig(filename) {
    var path = _path.join(ROOTDIR, filename);
    if ( _fs.existsSync(path) ) {
      try {
        var str = _fs.readFileSync(path).toString();
        var droot = ROOTDIR.replace(/\/$/, '');

        if ( ISWIN ) {
          str = str.replace(/%DROOT%/g,       droot.replace(/(["\s'$`\\])/g,'\\$1'));
        } else {
          str = str.replace(/%DROOT%/g,       droot);
        }

        return JSON.parse(str);
      } catch ( e ) {
        console.warn('!!!', 'Failed to parse configuration', filename, e);
      }
    } else {
      console.warn('!!!', 'Did not find configuration', path);
    }
    return false;
  }

  var CONFIG  = {
    port:       8000,
    directory:  null, // Automatic
    tmpdir:     '/tmp',
    handler:    'demo',
    vfs:        {
      'homes':   _path.join(ROOTDIR, 'vfs/home'),
      'tmp':     _path.join(ROOTDIR, 'vfs/tmp'),
      'public':  _path.join(ROOTDIR, 'vfs/public')
    },
    repodir:    _path.join(ROOTDIR, 'src/packages'),
    distdir:    _path.join(ROOTDIR, DISTDIR),
    rootdir:    ROOTDIR,
    iswin:      ISWIN,
    mimes:      {}
  };

  if ( !ISNW ) {
    var settConfig = readConfig("src/server/settings.json");
    if ( settConfig !== false ) {
      for ( var i in settConfig ) {
        if ( settConfig.hasOwnProperty(i) && CONFIG.hasOwnProperty(i) ) {
          CONFIG[i] = settConfig[i];
        }
      }
    }

    var tmpConfig = readConfig("src/conf/130-mime.json");
    if ( tmpConfig ) {
      CONFIG.mimes = tmpConfig.mime.mapping;
    }
  }

  if ( !CONFIG.directory ) {
    CONFIG.directory = _fs.realpathSync('.');
  }

  module.exports = CONFIG;
})(
  require("path"),
  require("node-fs-extra")
);
