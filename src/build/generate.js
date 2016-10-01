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
(function(_fs, _path, _utils) {
  'use strict';

  var ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Reads given config template and replaces any required strings
   */
  function _createWebserverConfig(cfg, target, src, mimecb) {
    var mimes = mimecb(cfg.mime);
    var tpl = _fs.readFileSync(src).toString();
    tpl = tpl.replace(/%DISTDIR%/, _path.join(ROOT, target));
    tpl = tpl.replace(/%MIMES%/, mimes);
    return tpl;
  }

  /**
   * Reads given template file and replaces example strings
   */
  function _replaceInExample(name, file, dest) {
    var dest = dest ? dest : file;
    var c = _fs.readFileSync(file).toString();
    c = _utils.replaceAll(c, 'EXAMPLE', name);
    _fs.writeFileSync(dest, c);
  }

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var TYPES = {
    'apache-vhost': function(cfg, opts) {
      var src = _path.join(ROOT, 'src', 'templates', 'apache', 'vhost.conf');
      return _createWebserverConfig(cfg, opts.target, src, function(mime) {
        return '';
      });
    },

    'apache-htaccess': function(cfg, opts) {
      var mimes = [];
      var proxies = [];

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
        var src = _path.join(ROOT, 'src', 'templates', t);
        var dst = _path.join(ROOT, d, '.htaccess');
        var tpl = _fs.readFileSync(src).toString();
        tpl = tpl.replace(/%MIMES%/, mimes.join('\n'));
        tpl = tpl.replace(/%PROXIES%/, proxies.join('\n'));
        _fs.writeFileSync(dst, tpl);
      }

      if ( opts.target === 'dist' ) {
        generate_htaccess('apache/prod-htaccess.conf', opts.target);
      } else {
        generate_htaccess('apache/prod-htaccess.conf', 'dist');
        generate_htaccess('apache/dev-htaccess.conf', 'dist-dev');
      }
    },

    'lighttpd-config': function(cfg, opts) {
      var src = _path.join(ROOT, 'src', 'templates', 'lighttpd.conf');
      return _createWebserverConfig(cfg, opts.target, src, function(mime) {
        return Object.keys(mime.mapping).map(function(i) {
          return i.match(/^\./) ? '  "' + i + '" => "' + mime.mapping[i] + '"' : null;
        }).filter(function(i) {
          return !!i;
        }).join(',\n');
      });
    },

    'nginx-config': function(cfg, opts) {
      var src = _path.join(ROOT, 'src', 'templates', 'nginx.conf');
      return _createWebserverConfig(cfg, opts.target, src, function(mime) {
        return Object.keys(mime.mapping).map(function(i) {
          return i.match(/^\./) ? ('        ' + mime.mapping[i] + ' ' + i.replace(/^\./, '') + ';') : null;
        }).filter(function(i) {
          return !!i;
        }).join('\n');
      });
    },

    'package': function(cfg, opts) {
      var tmp  = opts.name.split('/');
      var repo = tmp.length > 1 ? tmp[0] : 'default';
      var name = tmp.length > 1 ? tmp[1] : opts.name;
      var type = opts.type || 'application';

      var typemap = {
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

      var src = _path.join(ROOT, 'src', 'templates', 'package', typemap[type].src);
      var dst = _path.join(ROOT, 'src', 'packages', repo, name);

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
        console.warn('The repository \'' + repo + '\' is not active.'['yellow']);
      }
    },

    'handler': function(cfg, opts) {
      var name = opts.name;
      var uname = name.replace(/[^A-z]/g, '').toLowerCase();

      var tpls = _path.join(ROOT, 'src', 'templates', 'handler');
      var jsd = _path.join(ROOT, 'src', 'client', 'javascript', 'handlers', uname);
      var phpd = _path.join(ROOT, 'src', 'server', 'php', 'handlers', uname);
      var noded = _path.join(ROOT, 'src', 'server', 'node', 'handlers', uname);

      if ( _fs.existsSync(jsd) || _fs.existsSync(phpd) || _fs.existsSync(noded) ) {
        throw new Error('Handler already exists');
      }

      _fs.mkdirSync(jsd);
      _replaceInExample(name, _path.join(tpls, 'client.js'), _path.join(jsd, 'handler.js'));

      _fs.mkdirSync(phpd);
      _replaceInExample(name, _path.join(tpls, 'php.php'), _path.join(phpd, 'handler.php'));

      _fs.mkdirSync(noded);
      _replaceInExample(name, _path.join(tpls, 'node.js'), _path.join(noded, 'handler.js'));
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * grunt generate:X
   *
   * Generates something using given template name
   */
  function generate(cfg, arg, opts, done) {
    if ( !TYPES[arg] ) {
      return done('No such template available.');
    }

    try {
      var result = TYPES[arg](cfg, opts);
      if ( result !== null ) {
        if ( opts.out ) {
          _fs.writeFileSync(opts.out, result);
        } else {
          console.log(result);
        }
      }
      done();
    } catch ( e ) {
      done(e);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  module.exports.generate = generate;

})(require('node-fs-extra'), require('path'), require('./utils.js'));
