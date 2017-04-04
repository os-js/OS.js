/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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
const _fs = require('fs-extra');

const _utils = require('./utils.js');
const _logger = _utils.logger;

const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Reads given config template and replaces any required strings
 */
function _createWebserverConfig(cfg, src, mimecb) {
  const mimes = mimecb(cfg.mime);

  let tpl = _fs.readFileSync(src).toString();
  tpl = tpl.replace(/%DISTDIR%/, _path.join(ROOT, 'dist'));
  tpl = tpl.replace(/%MIMES%/, mimes);
  tpl = tpl.replace(/%PORT%/, cfg.server.http.port);
  return tpl;
}

/*
 * Reads given template file and replaces example strings
 */
function _replaceInExample(name, file, dest) {
  dest = dest ? dest : file;

  let c = _fs.readFileSync(file).toString();
  c = _utils.replaceAll(c, 'EXAMPLE', name);
  _fs.writeFileSync(dest, c);
}

///////////////////////////////////////////////////////////////////////////////
// TASKS
///////////////////////////////////////////////////////////////////////////////

const TASKS = {
  'apache_vhost': function(cli, cfg) {
    const src = _path.join(ROOT, 'src', 'templates', 'webserver', 'apache_vhost.conf');

    return Promise.resolve(_createWebserverConfig(cfg, src, (mime) => {
      return '';
    }));
  },

  'apache_htaccess': function(cli, cfg) {
    const mimes = [];
    const proxies = [];

    Object.keys(cfg.mime.mapping).forEach((i) => {
      if ( i.match(/^\./) ) {
        mimes.push('  AddType ' + cfg.mime.mapping[i] + ' ' + i);
      }
    });

    Object.keys(cfg.server.proxies).forEach((k) => {
      if ( k.substr(0, 1) !== '/' && typeof cfg.server.proxies[k] === 'string' ) {
        proxies.push('     RewriteRule ' + k + ' ' + cfg.server.proxies[k] + ' [P]');
      }
    });

    function generate_htaccess(t) {
      const src = _path.join(ROOT, 'src', 'templates', t);
      const dst = _path.join(ROOT, 'dist', '.htaccess');

      let tpl = _fs.readFileSync(src).toString();
      tpl = tpl.replace(/%MIMES%/, mimes.join('\n'));
      tpl = tpl.replace(/%PROXIES%/, proxies.join('\n'));
      _fs.writeFileSync(dst, tpl);
    }

    if ( cli.option('debug') ) {
      generate_htaccess('webserver/dev-htaccess.conf');
    } else {
      generate_htaccess('webserver/prod-htaccess.conf');
    }

    return Promise.resolve();
  },

  'apache_proxy': function(cli, cfg) {
    const src = _path.join(ROOT, 'src', 'templates', 'webserver', 'apache-proxy.conf');

    return Promise.resolve(_createWebserverConfig(cfg, '', src, function() {}));
  },

  'lighttpd_config': function(cli, cfg) {
    const src = _path.join(ROOT, 'src', 'templates', 'webserver', 'lighttpd.conf');

    return Promise.resolve(_createWebserverConfig(cfg, src, (mime) => {
      return Object.keys(mime.mapping).map((i) => {
        return i.match(/^\./) ? '  "' + i + '" => "' + mime.mapping[i] + '"' : null;
      }).filter((i) => {
        return !!i;
      }).join(',\n');
    }));
  },

  'nginx_config': function(cli, cfg) {
    const src = _path.join(ROOT, 'src', 'templates', 'webserver', 'nginx.conf');

    return Promise.resolve(_createWebserverConfig(cfg, src, (mime) => {
      return Object.keys(mime.mapping).map((i) => {
        return i.match(/^\./) ? ('        ' + mime.mapping[i] + ' ' + i.replace(/^\./, '') + ';') : null;
      }).filter((i) => {
        return !!i;
      }).join('\n');
    }));
  },

  'nginx_proxy': function(cli, cfg) {
    const src = _path.join(ROOT, 'src', 'templates', 'webserver', 'nginx-proxy.conf');

    return Promise.resolve(_createWebserverConfig(cfg, src, function() {}));
  },

  'package': function(cli, cfg) {
    let name = cli.option('name', '');
    const type = cli.option('type', 'application');

    const tmp  = name.split('/');
    const repo = tmp.length > 1 ? tmp[0] : 'default';
    name = tmp.length > 1 ? tmp[1] : name;

    const words = name.replace(/[^A-z0-9\._]/g, '').replace(/\s+/g, ' ').split(' ');
    name = [words[0]].concat(words.splice(1).map((w) => {
      return w.replace(/\b\w/g, (l) => l.toUpperCase());
    })).join('');

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
        cpy: ['server/main.php', 'server/main.js', 'main.js', 'main.css', 'metadata.json', 'scheme.html']
      },
      simple: {
        src: 'simple-application',
        cpy: ['server/main.php', 'server/main.js', 'main.js', 'main.css', 'metadata.json', 'scheme.html']
      },
      service: {
        src: 'service',
        cpy: ['server/main.php', 'server/main.js', 'main.js', 'metadata.json']
      },
      extension: {
        src: 'extension',
        cpy: ['server/main.php', 'server/main.js', 'main.js', 'metadata.json']
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

    typemap[type].cpy.forEach((c) => {
      _replaceInExample(name, _path.join(dst, c), false);
    });

    if ( (cfg.repositories || []).indexOf(repo) < 0 ) {
      _logger.warn(_logger.color('The repository \'' + repo + '\' is not active.', 'yellow'));
    }

    return Promise.resolve();
  }

};

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports = TASKS;
