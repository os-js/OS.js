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
const _less = require('less');
const _fs = require('fs-extra');
const _os = require('os');

const ISWIN = /^win/.test(process.platform);
const ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));

const _ugly = require('uglify-js');
const Cleancss = require('clean-css');

require('colors');

/*
 * Filter a file reference by string
 */
function _filter(i, debug) {
  if ( i.match(/^dev:/) && !debug ) {
    return false;
  }
  if ( i.match(/^prod:/) && debug ) {
    return false;
  }
  return true;
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

/*
 * Fixes Windows paths
 */
module.exports.fixWinPath = function fixWinPath(str) {
  if ( typeof str === 'string' && ISWIN ) {
    return str.replace(/(["\s'$`\\])/g,'\\$1').replace(/\\+/g, '/');
  }
  return str;
};

/*
 * Logging proxy
 */
module.exports.log = function log() {
  const str = Array.prototype.slice.call(arguments).join(' ');
  console.log(module.exports.replaceAll(str, ROOT + '/', ''));
};

/*
 * Reads a template
 */
module.exports.readTemplate = function readTemplate(name) {
  const tpls = _path.join(ROOT, 'src', 'templates');
  return _fs.readFileSync(_path.join(tpls, name)).toString();
};

/*
 * Replace all occurences of something
 */
module.exports.replaceAll = function replaceAll(temp, stringToFind, stringToReplace) {
  let index = temp.indexOf(stringToFind);
  while (index !== -1) {
    temp = temp.replace(stringToFind,stringToReplace);
    index = temp.indexOf(stringToFind);
  }
  return temp;
};

/*
 * Supresses errors while removing files
 */
module.exports.removeSilent = function removeSilent(file) {
  try {
    _fs.removeSync(file);
  } catch (e) {}
};

/*
 * Supresses errors while making directories
 */
module.exports.mkdirSilent = function mkdirSilent(file) {
  try {
    _fs.mkdirSync(file);
  } catch (e) {}
};

/*
 * Make a dictionary from list
 */
module.exports.makedict = function makedict(list, fn) {
  let result = {};
  list.forEach((iter, idx) => {
    let data = fn(iter, idx);
    result[data[0]] = data[1];
  });
  return result;
};

/*
 * Merges given objects together
 */
module.exports.mergeObject = function mergeObject(into, from) {
  function mergeJSON(obj1, obj2) {
    for ( let p in obj2 ) {
      if ( obj2.hasOwnProperty(p) ) {
        try {
          if ( obj2[p].constructor === Object ) {
            obj1[p] = mergeJSON(obj1[p], obj2[p]);
          } else {
            obj1[p] = obj2[p];
          }
        } catch (e) {
          obj1[p] = obj2[p];
        }
      }
    }
    return obj1;
  }
  return mergeJSON(into, from);
};

/*
 * Compiles given less file
 */
module.exports.compileLess = function compileLess(debug, src, dest, opts, cb, onRead) {
  try {
    let css = _fs.readFileSync(src).toString();
    if ( typeof onRead === 'function' ) {
      css = onRead(css);
    }

    _less.render(css, opts).then((result) => {
      _fs.writeFileSync(dest, result.css);
      _fs.writeFileSync(dest + '.map', result.map);

      const footer = '\n/*# sourceMappingURL=' + _path.basename(dest.replace(/\.css$/, '.min.css.map')) + ' */';

      try {
        const minified = new Cleancss({
          sourceMapInlineSources: debug,
          sourceMap: true
        }).minify(_fs.readFileSync(dest), _fs.readJsonSync(dest + '.map'));

        _fs.writeFileSync(dest.replace(/\.css$/, '.min.css'), minified.styles + footer);
        _fs.writeFileSync(dest.replace(/\.css$/, '.min.css.map'), minified.sourceMap);
      } catch ( e ) {
        console.warn(e);
      }

      module.exports.removeSilent(dest, result.css);
      module.exports.removeSilent(dest + '.map', result.map);

      cb(false, true);
    }, (error) => {
      console.warn(error);
      cb(error);
    });
  } catch ( e ) {
    console.warn(e, e.stack);
    cb(e);
  }
};

/*
 * Creates standalone scheme files
 */
module.exports.createStandaloneScheme = function createStandaloneScheme(src, name, dest) {
  let data = module.exports.addslashes(_fs.readFileSync(src).toString().replace(/\n/g, ''));

  let tpl = module.exports.readTemplate('dist/schemes.js');
  tpl = tpl.replace('%DATA%', data);
  tpl = tpl.replace('%NAME%', name);

  _fs.writeFileSync(dest, tpl);
};

/*
 * Escapes given string
 */
module.exports.addslashes = function addslashes(str) {
  return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
};

/*
 * Helper for running promises in sequence
 */
module.exports.eachp = function(list, onentry) {
  onentry = onentry || function() {};

  return new Promise((resolve, reject) => {
    (function next(i) {
      if ( i >= list.length ) {
        return resolve();
      }

      const iter = list[i]();
      iter.then((arg) => {
        onentry(arg);
        next(i + 1);
      }).catch(reject);
    })(0);
  });
};

/*
 * Logging helper
 */
module.exports.logger = {
  log: function() {
    console.log.apply(console, arguments);
  },
  warn: function() {
    console.warn.apply(console, arguments);
  },
  info: function() {
    console.info.apply(console, arguments);
  },
  error: function() {
    console.error.apply(console, arguments);
  },
  color: (str, color) => {
    str = String(str);
    color.split(',').forEach((key) => {
      str = str[key.trim()] || str;
    });
    return str;
  }
};

/*
 * Helper for compiling scripts
 */
module.exports.writeScripts = function writeScripts(out, list, debug, verbose) {
  const outm = out.replace(/\.min\.js$/, '.min.js.map');
  const header = module.exports.readTemplate('dist/header.js');
  const headerFile = _path.join(_os.tmpdir(), '__header.js');
  const finalList = [headerFile].concat(list.filter((i) => {
    return _filter(i, debug);
  }).map((i) => {
    if ( verbose ) {
      console.log(i);
    }

    if ( i.match(/^(dev|prod):/) ) {
      return _path.join(ROOT, i.replace(/^(dev|prod):/, ''));
    }

    return i;
  }));

  _fs.writeFileSync(headerFile, header);

  const pureFuncs = debug ? [] : ['console.log', 'console.group', 'console.groupEnd', 'console.warn', 'console.info', 'console.dir'];

  const minified = _ugly.minify(finalList, {
    sourceMapIncludeSources: debug,
    outSourceMap: _path.basename(outm),
    compress: {
      pure_funcs: pureFuncs
    },
    output: {
      comments: /\*!/
    }
  });

  _fs.writeFileSync(out, minified.code);
  _fs.writeFileSync(outm, minified.map);
  module.exports.removeSilent(headerFile);
};

/*
 * Helper for compiling stylesheets
 */
module.exports.writeStyles = function writeStyles(out, list, debug, verbose) {
  const outm = out.replace(/\.min\.css$/, '.min.css.map');
  const header = module.exports.readTemplate('dist/header.css');
  const headerFile = _path.join(_os.tmpdir(), '__header.css');
  const finalList = [headerFile].concat(list.filter((i) => {
    return _filter(i, debug);
  }).map((i) => {
    if ( verbose ) {
      console.log(i);
    }
    return i.substr(0, 1) === '/' ? i : _path.join(ROOT, i.replace(/^(dev|prod):/, ''));
  }));

  _fs.writeFileSync(headerFile, header);

  const minified = new Cleancss({
    rebase: false,
    sourceMapInlineSources: debug,
    sourceMap: true
  }).minify(finalList);

  const footer = '\n/*# sourceMappingURL=' + _path.basename(outm) + ' */';
  _fs.writeFileSync(out, minified.styles + footer);
  _fs.writeFileSync(outm, minified.sourceMap);
  module.exports.removeSilent(headerFile);
};

/*
 * Helper for enumerating overlay paths
 */
module.exports.enumOverlayPaths = function enumOverlayPaths(cfg, key, onentry) {
  const overlays = cfg.build.overlays;
  const paths = [];

  if ( overlays ) {
    Object.keys(overlays).forEach((n) => {
      const overlay = overlays[n];
      if ( overlay[key] instanceof Array ) {
        overlay[key].forEach(onentry);
      }
    });
  }

  return paths;
};
