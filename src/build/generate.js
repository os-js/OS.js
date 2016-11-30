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

/*eslint strict:["error", "global"]*/
'use strict';

const _path = require('path');
const _fs = require('node-fs-extra');

const _utils = require('./utils.js');

const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Reads given config template and replaces any required strings
 */
function _createWebserverConfig(cfg, target, src, mimecb) {
  const mimes = mimecb(cfg.mime);

  var tpl = _fs.readFileSync(src).toString();
  tpl = tpl.replace(/%DISTDIR%/, _path.join(ROOT, target));
  tpl = tpl.replace(/%MIMES%/, mimes);
  return tpl;
}

/*
 * Reads given template file and replaces example strings
 */
function _replaceInExample(name, file, dest) {
  dest = dest ? dest : file;

  var c = _fs.readFileSync(file).toString();
  c = _utils.replaceAll(c, 'EXAMPLE', name);
  _fs.writeFileSync(dest, c);
}

///////////////////////////////////////////////////////////////////////////////
// TASKS
///////////////////////////////////////////////////////////////////////////////

const TASKS = {
  'apache_vhost': function(cli, cfg) {
    const src = _path.join(ROOT, 'src', 'templates', 'apache', 'vhost.conf');
    const target = cli.option('target', 'dist');

    return Promise.resolve(_createWebserverConfig(cfg, target, src, function(mime) {
      return '';
    }));
  },

  'apache_htaccess': function(cli, cfg) {
    const target = cli.option('target', 'dist');

    const mimes = [];
    const proxies = [];

    Object.keys(cfg.mime.mapping).forEach(function(i) {
      if ( i.match(/^\./) ) {
        mimes.push('  AddType ' + cfg.mime.mapping[i] + ' ' + i);
      }
    });

    Object.keys(cfg.server.proxies).forEach(function(k) {
      if ( k.substr(0, 1) !== '/' && typeof cfg.server.proxies[k] === 'string' ) {
        proxies.push('     RewriteRule ' + k + ' ' + cfg.server.proxies[k] + ' [P]');
      }
    });

    function generate_htaccess(t, d) {
      const src = _path.join(ROOT, 'src', 'templates', t);
      const dst = _path.join(ROOT, d, '.htaccess');

      var tpl = _fs.readFileSync(src).toString();
      tpl = tpl.replace(/%MIMES%/, mimes.join('\n'));
      tpl = tpl.replace(/%PROXIES%/, proxies.join('\n'));
      _fs.writeFileSync(dst, tpl);
    }

    if ( target === 'dist' ) {
      generate_htaccess('apache/prod-htaccess.conf', target);
    } else {
      generate_htaccess('apache/prod-htaccess.conf', 'dist');
      generate_htaccess('apache/dev-htaccess.conf', 'dist-dev');
    }

    return Promise.resolve();
  },

  'lighttpd_config': function(cli, cfg) {
    const target = cli.option('target', 'dist');

    const src = _path.join(ROOT, 'src', 'templates', 'lighttpd.conf');

    return Promise.resolve(_createWebserverConfig(cfg, target, src, function(mime) {
      return Object.keys(mime.mapping).map(function(i) {
        return i.match(/^\./) ? '  "' + i + '" => "' + mime.mapping[i] + '"' : null;
      }).filter(function(i) {
        return !!i;
      }).join(',\n');
    }));
  },

  'nginx_config': function(cli, cfg) {
    const target = cli.option('target', 'dist');

    const src = _path.join(ROOT, 'src', 'templates', 'nginx.conf');

    return Promise.resolve(_createWebserverConfig(cfg, target, src, function(mime) {
      return Object.keys(mime.mapping).map(function(i) {
        return i.match(/^\./) ? ('        ' + mime.mapping[i] + ' ' + i.replace(/^\./, '') + ';') : null;
      }).filter(function(i) {
        return !!i;
      }).join('\n');
    }));
  },

  'package': function(cli, cfg) {
    const type = cli.option('type', 'application');

    var name = cli.option('name', '');

    const tmp  = name.split('/');
    const repo = tmp.length > 1 ? tmp[0] : 'default';
    name = tmp.length > 1 ? tmp[1] : name;

    const typemap = {
      iframe: {
        src: 'iframe-application',
        cpy: ['main.js', 'metadata.json']
      },
      dummy: {
        src: 'dummy',
        cpy: ['main.js', 'metadata.json']
      },
      application: {
        src: 'application',
        cpy: ['api.js', 'main.js', 'main.css', 'metadata.json', 'scheme.html']
      },
      simple: {
        src: 'simple-application',
        cpy: ['api.js', 'main.js', 'main.css', 'metadata.json', 'scheme.html']
      },
      service: {
        src: 'service',
        cpy: ['api.js', 'main.js', 'metadata.json']
      },
      extension: {
        src: 'extension',
        cpy: ['api.js', 'extension.js', 'metadata.json']
      }
    };

    if ( !name ) {
      throw new Error('You have to specify a name');
    }

    const src = _path.join(ROOT, 'src', 'templates', 'package', typemap[type].src);
    const dst = _path.join(ROOT, 'src', 'packages', repo, name);

    if ( !_fs.existsSync(src) ) {
      throw new Error('Template not found');
    }

    if ( _fs.existsSync(dst) ) {
      throw new Error('Package already exists');
    }

    _fs.copySync(src, dst);

    typemap[type].cpy.forEach(function(c) {
      _replaceInExample(name, _path.join(dst, c), false);
    });

    if ( (cfg.repositories || []).indexOf(repo) < 0 ) {
      console.warn(String.color('The repository \'' + repo + '\' is not active.', 'yellow'));
    }

    return Promise.resolve();
  }

};

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports = TASKS;
