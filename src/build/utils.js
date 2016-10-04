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
(function(_fs, _path, _less) {
  'use strict';

  var ROOT = _path.dirname(_path.dirname(_path.join(__dirname)));
  var ISWIN = /^win/.test(process.platform);

  function _filter(path, iter, fn) {
    if ( !iter.match(/^\./) ) {
      var s = _fs.lstatSync(_path.join(path, iter));
      return fn(s);
    }
    return false;
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  module.exports.readTemplate = function readTemplate(name) {
    var tpls = _path.join(ROOT, 'src', 'templates');
    return _fs.readFileSync(_path.join(tpls, name)).toString();
  };

  /**
   * Wrapper for setting color
   */
  module.exports.color = function(str, color) {
    color.split(',').forEach(function(key) {
      str = str[key.trim()] || str;
    });
    return str;
  };

  /**
   * Internal for logging
   */
  module.exports.log = function() {
    var str = Array.prototype.slice.call(arguments).join(' ');
    console.log(module.exports.replaceAll(str, ROOT + '/', ''));
  };

  /**
   * Make a dictionary from array
   */
  module.exports.makedict = function(list, fn) {
    var result = {};
    list.forEach(function(iter, idx) {
      var data = fn(iter, idx);
      result[data[0]] = data[1];
    });
    return result;
  };

  /**
   * Replace all occurences of something
   */
  module.exports.replaceAll = function replaceAll(temp, stringToFind, stringToReplace) {
    var index = temp.indexOf(stringToFind);
    while (index !== -1) {
      temp = temp.replace(stringToFind,stringToReplace);
      index = temp.indexOf(stringToFind);
    }
    return temp;
  };

  /**
   * Fix window paths
   */
  module.exports.fixWinPath = function fixWinPath(str) {
    if ( typeof str === 'string' && ISWIN ) {
      return str.replace(/(["\s'$`\\])/g,'\\$1').replace(/\\+/g, '/');
    }
    return str;
  };

  /**
   * Enumerate all directories in given location
   */
  module.exports.enumDirectories = function enumDirectories(path, done) {
    _fs.readdir(path, function(err, result) {
      done(err ? [] : result.filter(function(iter) {
        return _filter(path, iter, function(s) {
          return ( s.isDirectory() || s.isSymbolicLink() );
        });
      }));
    });
  };

  /**
   * Enumerate all files in given location
   */
  module.exports.enumFiles = function enumFiles(path, done) {
    _fs.readdir(path, function(err, result) {
      done(err ? [] : result.filter(function(iter) {
        return _filter(path, iter, function(s) {
          return !s.isDirectory();
        });
      }));
    });
  };

  /**
   * Loop over a list asynchronously
   */
  module.exports.iterate = function iterate(list, entry, done) {
    (function _next(i) {
      if ( i >= list.length ) {
        return done();
      }
      entry(list[i], i, function() {
        _next(i + 1);
      });
    })(0);
  };

  /**
   * Read file as JSON
   */
  module.exports.readJSON = function readJSON(path, done) {
    _fs.readFile(path, function(err, result) {
      var data = result.toString();

      try {
        done(err, err ? false : JSON.parse(data));
      } catch ( e ) {
        done(e);
      }
    });
  };

  /**
   * Merge two objects
   */
  module.exports.mergeObject = function mergeObject(into, from) {
    function mergeJSON(obj1, obj2) {
      for ( var p in obj2 ) {
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

  /**
   * Comile LESS file
   */
  module.exports.compileLess = function compileLess(src, dest, opts, cb, onRead) {
    console.log('$ less', src.replace(ROOT + '/', ''), dest.replace(ROOT + '/', ''))
    try {
      var css = _fs.readFileSync(src).toString();
      if ( typeof onRead === 'function' ) {
        css = onRead(css);
      }

      _less.render(css, opts).then(function(result) {
        _fs.writeFileSync(dest, result.css);
        _fs.writeFileSync(dest + '.map', result.map);
        cb(false, true);
      }, function(error) {
        console.warn(error);
        cb(error);
      });
    } catch ( e ) {
      console.warn(e, e.stack);
      cb(e);
    }
  };

  module.exports.createStandaloneScheme = function createStandaloneScheme(src, name, dest) {
    var data = module.exports.addslashes(_fs.readFileSync(src).toString().replace(/\n/g, ''));

    var tpl = module.exports.readTemplate('dist/schemes.js');
    tpl = tpl.replace('%DATA%', data);
    tpl = tpl.replace('%NAME%', name);

    _fs.writeFileSync(dest, tpl);
  };

  module.exports.addslashes = function addslashes(str) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  };

})(require('node-fs-extra'), require('path'), require('less'));
