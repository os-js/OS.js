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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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
(function(_path, _nfs, _fs) {
  'use strict';

  /**
   * @namespace VFS
   */

  function readExif(path, mime, cb) {
    /*eslint no-new: "warn"*/

    if ( mime.match(/^image/) ) {
      try {
        var CR = require('exif').ExifImage;
        new CR({image: path}, function(err, result) {
          cb(err, JSON.stringify(result, null, 4));
        });
        return;
      } catch ( e ) {
      }
      return;
    }

    cb(false, null);
  }

  function readPermission(mode) {
    var str = '';
    var map = {
      0xC000: 's',
      0xA000: 'l',
      0x8000: '-',
      0x6000: 'b',
      0x4000: 'd',
      0x1000: 'p'
    };

    var type = 'u';
    Object.keys(map).forEach(function(k) {
      if ( (mode & k) === k ) {
        type = map[k];
      }
      return type === 'u';
    });

    // Owner
    str += (function() {
      var ret = ((mode & 0x0100) ? 'r' : '-');
      ret += ((mode & 0x0080) ? 'w' : '-');
      ret += ((mode & 0x0040) ? ((mode & 0x0800) ? 's' : 'x' ) : ((mode & 0x0800) ? 'S' : '-'));
      return ret;
    })();

    // Group
    str += (function() {
      var ret = ((mode & 0x0020) ? 'r' : '-');
      ret += ((mode & 0x0010) ? 'w' : '-');
      ret += ((mode & 0x0008) ? ((mode & 0x0400) ? 's' : 'x' ) : ((mode & 0x0400) ? 'S' : '-'));
      return ret;
    })();

    // World
    str += (function() {
      var ret = ((mode & 0x0004) ? 'r' : '-');
      ret += ((mode & 0x0002) ? 'w' : '-');
      ret += ((mode & 0x0001) ? ((mode & 0x0200) ? 't' : 'x' ) : ((mode & 0x0200) ? 'T' : '-'));
      return ret;
    })();

    return str;
  }

  function pathJoin() {
    var s = _path.join.apply(null, arguments);
    return s.replace(/\\/g, '/');
  }

  function getRealPath(server, path) {
    var fullPath = null;
    var protocol = '';
    var fprotocol = '';

    if ( path.match(/^osjs\:\/\//) ) {
      path = path.replace(/^osjs\:\/\//, '');
      fullPath = _path.join(server.config.distdir, path);
      protocol = 'osjs://';
    } else if ( path.match(/^home\:\/\//) ) {
      path = path.replace(/^home\:\/\//, '');
      fullPath = _path.join(server.handler.getHomePath(server), path);
      protocol = 'home://';
    } else {
      var tmp = path.split(/^(\w+)\:\/\//);

      if ( tmp.length === 3 ) {
        fprotocol = tmp[1];

        if ( server.config.vfs.mounts && server.config.vfs.mounts[fprotocol] ) {
          protocol = fprotocol + '://';
          path = path.replace(/^(\w+)\:\/\//, '');
          fullPath = _path.join(server.config.vfs.mounts[fprotocol], path);
        }
      }
    }

    if ( !fullPath ) {
      var found = (function() {
        var rmap = {
          '%UID%': function() {
            return server.request.session.get('username');
          },
          '%USERNAME%': function() {
            return server.request.session.get('username');
          },
          '%DROOT%': function() {
            return server.config.rootdir;
          },
          '%MOUNTPOINT%': function() {
            return fprotocol;
          }
        };

        function _createDir(s) {
          Object.keys(rmap).forEach(function(k) {
            s = s.replace(new RegExp(k, 'g'), rmap[k]());
          });
          return s;
        }

        if ( fprotocol && server.config.vfs.mounts['*'] ) {
          protocol = fprotocol + '://';
          path = path.replace(/^(\w+)\:\/\//, '');
          fullPath = _path.join(_createDir(server.config.vfs.mounts['*']), path.replace(/\/+/g, '/'));

          return true;
        }

        return false;
      })();

      if ( !found ) {
        throw new Error('Invalid mountpoint');
      }
    }

    return {root: fullPath, path: path, protocol: protocol};
  }

  function getMime(file, config) {
    var i = file.lastIndexOf('.');
    var ext = (i === -1) ? 'default' : file.substr(i);
    var mimeTypes = config.mimes;

    return mimeTypes[ext.toLowerCase()] || mimeTypes.default;
  }

  function getFileIters(files, realPath, request, config) {
    var result = [];
    var ofpath, fpath, ftype, fsize, fsstat, ctime, mtime;

    var tmp = realPath.path.replace(/^\/+?/, '');
    if ( tmp.length && tmp.split('/').length ) {
      tmp = tmp.split('/');
      tmp.pop();
      tmp = tmp.join('/');

      result.push({
        filename: '..',
        path:     realPath.protocol + _path.join('/', tmp),
        size:     0,
        mime:     '',
        type:     'dir',
        ctime:    null,
        mtime:    null
      });
    }

    for ( var i = 0; i < files.length; i++ ) {
      ofpath = pathJoin(realPath.path, files[i]);
      fpath  = _path.join(realPath.root, files[i]);

      try {
        fsstat = _fs.statSync(fpath);
        ftype  = fsstat.isFile() ? 'file' : 'dir';
        fsize  = fsstat.size;
        mtime  = fsstat.mtime;
        ctime  = fsstat.ctime;
      } catch ( e ) {
        ftype = 'file';
        fsize = 0;
        ctime = null;
        mtime = null;
      }

      result.push({
        filename: files[i],
        path:     realPath.protocol + ofpath,
        size:     fsize,
        mime:     ftype === 'file' ? getMime(files[i], config) : '',
        type:     ftype,
        ctime:    ctime,
        mtime:    mtime
      });
    }

    return result;
  }

  function checkProtectedPath(dst) {
    if ( dst.match(/osjs\:/) ) {
      throw new Error('Access denied');
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get real filesystem path
   *
   * NOT AVAILABLE FROM CLIENT
   *
   * @param   {ServerObject}    server      Server object
   * @param   {String}          file        File path
   *
   * @return  {Object}                With `root` (real path), `path` (virtual path), `protocol` (virtual protocol)
   *
   * @function getRealPath
   * @memberof VFS
   */
  module.exports.getRealPath = getRealPath;

  /**
   * Get file MIME
   *
   * NOT AVAILABLE FROM CLIENT
   *
   * @param   {String}    file        File path
   * @param   {Object}    config      Server configuration object
   *
   * @return  {String}
   *
   * @function getMime
   * @memberof VFS
   */
  module.exports.getMime = getMime;

  /**
   * Read a file
   *
   * @param  {ServerObject}    server                   Server object
   * @param  {Object}          args                     API Call Arguments
   * @param  {String}          args.path                Request path
   * @param  {Object}          [args.options]           Request options
   * @param  {Boolean}         [args.options.raw=false] Return raw/binary data
   * @param  {Function}        callback                 Callback function => fn(error, result)
   *
   * @function read
   * @memberof VFS
   */
  module.exports.read = function(server, args, callback) {
    var realPath = getRealPath(server, args.path);
    var path = realPath.path;
    var opts = typeof args.options === 'undefined' ? {} : (args.options || {});

    _fs.exists(realPath.root, function(exists) {
      if ( exists ) {
        _fs.readFile(realPath.root, function(error, data) {
          if ( error ) {
            callback('Error reading file: ' + error);
          } else {
            if ( opts.raw ) {
              callback(false, data);
            } else {
              data = 'data:' + getMime(realPath.root, server.config) + ';base64,' + (new Buffer(data).toString('base64'));
              callback(false, data.toString());
            }
          }
        });
      } else {
        callback('File not found!');
      }
    });
  };

  /**
   * Write a file
   *
   * @param  {ServerObject}    server                         Server object
   * @param  {Object}          args                           API Call Arguments
   * @param  {String}          args.path                      Request path
   * @param  {Mixed}           args.data                      Request payload
   * @param  {Object}          [args.options]                 Request options
   * @param  {Boolean}         [args.options.raw=false]       Write raw/binary data
   * @param  {String}          [args.options.rawtype=binary]  If raw, what type
   * @param  {Function}        callback                       Callback function => fn(error, result)
   *
   * @function write
   * @memberof VFS
   */
  module.exports.write = function(server, args, callback) {
    var data = args.data || '';
    var opts = typeof args.options === 'undefined' ? {} : (args.options || {});
    var realPath = getRealPath(server, args.path);
    var path = realPath.path;

    checkProtectedPath(args.path);

    function writeFile(d, e) {
      _fs.writeFile(realPath.root, d, e || 'utf8', function(error, data) {
        if ( error ) {
          callback('Error writing file: ' + error);
        } else {
          callback(false, true);
        }
      });
    }

    if ( opts.raw ) {
      writeFile(data, opts.rawtype || 'binary');
    } else {
      data = unescape(data.substring(data.indexOf(',') + 1));
      data = new Buffer(data, 'base64');
      writeFile(data);
    }
  };

  /**
   * Delete a file
   *
   * @param  {ServerObject}    server                   Server object
   * @param  {Object}          args                     API Call Arguments
   * @param  {String}          args.path                Request path
   * @param  {Object}          [args.options]           Request options
   * @param  {Function}        callback                 Callback function => fn(error, result)
   *
   * @function delete
   * @memberof VFS
   */
  module.exports.delete = function(server, args, callback) {
    var opts = typeof args.options === 'undefined' ? {} : (args.options || {});
    var realPath = getRealPath(server, args.path);
    var path = realPath.path;

    checkProtectedPath(args.path);

    if ( (realPath.path || '/') === '/' ) {
      callback('Permission denied');
      return;
    }

    _fs.exists(realPath.root, function(exists) {
      if ( !exists ) {
        callback('Target does not exist!');
      } else {
        _fs.remove(realPath.root, function(error, data) {
          if ( error ) {
            callback('Error deleting: ' + error);
          } else {
            callback(false, true);
          }
        });
      }
    });
  };

  /**
   * Copy a file
   *
   * @param  {ServerObject}    server         Server object
   * @param  {Object}          args           API Call Arguments
   * @param  {String}          args.src       Request source path
   * @param  {String}          args.dest      Request destination path
   * @param  {Object}          [args.options] Request options
   * @param  {Function}        callback       Callback function => fn(error, result)
   *
   * @function copy
   * @memberof VFS
   */
  module.exports.copy = function(server, args, callback) {
    var src  = args.src;
    var dst  = args.dest;
    var opts = typeof args.options === 'undefined' ? {} : (args.options || {});

    checkProtectedPath(dst);

    var realSrc = getRealPath(server, src);
    var realDst = getRealPath(server, dst);
    var srcPath = realSrc.root; //_path.join(realSrc.root, src);
    var dstPath = realDst.root; //_path.join(realDst.root, dst);
    _fs.exists(srcPath, function(exists) {
      if ( exists ) {
        _fs.exists(dstPath, function(exists) {
          if ( exists ) {
            callback('Target already exist!');
          } else {
            _fs.access(_path.dirname(dstPath), _nfs.W_OK, function(err) {
              if ( err ) {
                callback('Cannot write to destination');
              } else {
                _fs.copy(srcPath, dstPath, function(error, data) {
                  if ( error ) {
                    callback('Error copying: ' + error);
                  } else {
                    callback(false, true);
                  }
                });
              }
            });
          }
        });
      } else {
        callback('Source does not exist!');
      }
    });
  };

  /**
   * Uploads a file
   *
   * @param  {ServerObject}    server                   Server object
   * @param  {Object}          args                     API Call Arguments
   * @param  {String}          args.src                 Uploaded file path
   * @param  {String}          args.name                Destination filename
   * @param  {String}          args.path                Destination path
   * @param  {Boolean}         [args.overwrite=false]   Overwrite if already exists
   * @param  {Function}        callback                 Callback function => fn(error, result)
   *
   * @function upload
   * @memberof VFS
   */
  module.exports.upload = function(server, args, callback) {
    var tmpPath = args.path;
    if ( !tmpPath.match(/\/$/) ) {
      tmpPath += '/';
    }
    tmpPath += args.name;

    checkProtectedPath(args.path);

    var dstPath = getRealPath(server, tmpPath).root;
    var overwrite = args.overwrite === true;

    function _rename(source, dest, cb) {
      var ins = _fs.createReadStream(source);
      var outs = _fs.createWriteStream(dest, {flags: 'w'});

      function _done() {
        _fs.unlink(source, cb);
      }

      function _error(err) {
        ins.destroy();
        outs.destroy();
        outs.removeListener('close', _done);
        cb(err);
      }

      ins.on('error', _error);
      outs.on('error', _error);
      outs.once('close', _done);
      ins.pipe(outs);
    }

    _fs.exists(args.src, function(exists) {
      if ( exists ) {
        _fs.exists(dstPath, function(exists) {
          if ( exists && !overwrite ) {
            callback('Target already exist!');
          } else {
            //_fs.rename(args.src, dstPath, function(error, data) {
            _rename(args.src, dstPath, function(error, data) {
              if ( error ) {
                callback('Error renaming/moving: ' + error);
              } else {
                callback(false, '1');
              }
            });
          }
        });
      } else {
        callback('Source does not exist!');
      }
    });
  };

  /**
   * Move a file
   *
   * @param  {ServerObject}    server         Server object
   * @param  {Object}          args           API Call Arguments
   * @param  {String}          args.src       Request source path
   * @param  {String}          args.dest      Request destination path
   * @param  {Object}          [args.options] Request options
   * @param  {Function}        callback       Callback function => fn(error, result)
   *
   * @function move
   * @memberof VFS
   */
  module.exports.move = function(server, args, callback) {
    var src  = args.src;
    var dst  = args.dest;
    var opts = typeof args.options === 'undefined' ? {} : (args.options || {});

    checkProtectedPath(dst);

    var realSrc = getRealPath(server, src);
    var realDst = getRealPath(server, dst);
    var srcPath = realSrc.root; //_path.join(realSrc.root, src);
    var dstPath = realDst.root; //_path.join(realDst.root, dst);

    _fs.access(srcPath, _nfs.R_OK, function(err) {
      if ( err ) {
        callback('Cannot read source');
      } else {
        _fs.access(_path.dirname(dstPath), _nfs.W_OK, function(err) {
          if ( err ) {
            callback('Cannot write to destination');
          } else {
            _fs.rename(srcPath, dstPath, function(error, data) {
              if ( error ) {
                callback('Error renaming/moving: ' + error);
              } else {
                callback(false, true);
              }
            });
          }
        });
      }
    });
  };

  /**
   * Creates a directory
   *
   * @param  {ServerObject}    server                   Server object
   * @param  {Object}          args                     API Call Arguments
   * @param  {String}          args.src                 Request path
   * @param  {Object}          [args.options]           Request options
   * @param  {Function}        callback                 Callback function => fn(error, result)
   *
   * @function mkdir
   * @memberof VFS
   */
  module.exports.mkdir = function(server, args, callback) {
    var opts = typeof args.options === 'undefined' ? {} : (args.options || {});
    var realPath = getRealPath(server, args.path);
    var path = realPath.path;

    checkProtectedPath(args.path);

    _fs.exists(realPath.root, function(exists) {
      if ( exists ) {
        callback('Target already exist!');
      } else {
        _fs.mkdir(realPath.root, function(error, data) {
          if ( error ) {
            callback('Error creating directory: ' + error);
          } else {
            callback(false, true);
          }
        });
      }
    });
  };

  /**
   * Check if file exists
   *
   * @param  {ServerObject}    server                   Server object
   * @param  {Object}          args                     API Call Arguments
   * @param  {String}          args.src                 Request path
   * @param  {Object}          [args.options]           Request options
   * @param  {Function}        callback                 Callback function => fn(error, result)
   *
   * @function exists
   * @memberof VFS
   */
  module.exports.exists = function(server, args, callback) {
    var opts = typeof args.options === 'undefined' ? {} : (args.options || {});
    var realPath = getRealPath(server, args.path);
    _fs.exists(realPath.root, function(exists) {
      callback(false, exists);
    });
  };

  /**
   * Search for file(s)
   *
   * @param  {ServerObject}    server                   Server object
   * @param  {Object}          args                     API Call Arguments
   * @param  {String}          args.src                 Request path
   * @param  {Object}          args.query               Query object
   * @param  {Function}        callback                 Callback function => fn(error, result)
   *
   * @function find
   * @memberof VFS
   */
  module.exports.find = function(server, args, callback) {
    var opts = typeof args.options === 'undefined' ? {} : (args.options || {});
    var qargs = args.args || {};
    var query = (qargs.query || '').toLowerCase();
    var realPath = getRealPath(server, args.path);

    if ( !qargs.recursive ) {
      _fs.readdir(realPath.root, function(error, files) {
        if ( error ) {
          callback('Error reading directory: ' + error);
        } else {
          callback(false, getFileIters(files.filter(function(f) {
            return f.toLowerCase().indexOf(query) !== -1;
          }), realPath, server.request, server.config));
        }
      });

      return;
    }

    var find;
    try {
      find = require('findit')(realPath.root);
    } catch ( e ) {
      callback('Failed to load findit node library: ' + e.toString());
      return;
    }

    var list = [];

    find.on('path', function() {
      if ( qargs.limit && list.length >= qargs.limit ) {
        find.stop();
      }
    });

    find.on('directory', function(dir, stat) {
      var filename = _path.basename(dir).toLowerCase();
      if ( filename.indexOf(query) !== -1 ) {
        list.push({
          filename: filename,
          path: realPath.protocol + '/' + dir.substr(realPath.root.length).replace(/^\//, ''),
          mime: '',
          size: 0,
          mtime: '',
          ctime: stat.ctime,
          type: 'dir'
        });
      }
    });

    find.on('file', function(file, stat) {
      var filename = _path.basename(file).toLowerCase();
      if ( filename.indexOf(query) !== -1 ) {
        var ftype = stat.isFile() ? 'file' : 'dir';

        list.push({
          filename: filename,
          path: realPath.protocol + '/' + file.substr(realPath.root.length).replace(/^\//, ''),
          mime: ftype === 'file' ? getMime(file, server.config) : '',
          size: ftype === 'file' ? stat.size : 0,
          mtime: stat.mtime,
          ctime: stat.ctime,
          type: ftype
        });
      }
    });

    find.on('end', function() {
      callback(false, list);
    });
    find.on('stop', function() {
      callback(false, list);
    });
  };

  /**
   * Get metadata about a file
   *
   * @param  {ServerObject}    server                   Server object
   * @param  {Object}          args                     API Call Arguments
   * @param  {String}          args.src                 Request path
   * @param  {Object}          [args.options]           Request options
   * @param  {Function}        callback                 Callback function => fn(error, result)
   *
   * @function fileinfo
   * @memberof VFS
   */
  module.exports.fileinfo = function(server, args, callback) {
    var opts = typeof args.options === 'undefined' ? {} : (args.options || {});
    var realPath = getRealPath(server, args.path);
    var path = realPath.path;
    _fs.exists(realPath.root, function(exists) {
      if ( !exists ) {
        callback('No such file or directory!');
      } else {
        _fs.stat(realPath.root, function(error, stat) {
          if ( error ) {
            callback('Error getting file information: ' + error);
          } else {

            var mime = getMime(realPath.root, server.config);
            var data = {
              path:         realPath.protocol + realPath.path,
              filename:     _path.basename(realPath.root),
              size:         stat.size,
              mime:         mime,
              permissions:  readPermission(stat.mode),
              ctime:        stat.ctime || null,
              mtime:        stat.mtime || null
            };

            readExif(realPath.root, mime, function(error, result) {
              if ( !error && result ) {
                data.exif = result || error || 'No EXIF data available';
              }
              callback(result ? null : error, data);
            });

          }
        });
      }
    });
  };

  /**
   * Scans given directory
   *
   * @param  {ServerObject}    server                   Server object
   * @param  {Object}          args                     API Call Arguments
   * @param  {String}          args.src                 Request path
   * @param  {Object}          [args.options]           Request options
   * @param  {Function}        callback                 Callback function => fn(error, result)
   *
   * @function scandir
   * @memberof VFS
   */
  module.exports.scandir = function(server, args, callback) {
    var opts = typeof args.options === 'undefined' ? {} : (args.options || {});
    var realPath = getRealPath(server, args.path);

    _fs.readdir(realPath.root, function(error, files) {
      if ( error ) {
        callback('Error reading directory: ' + error);
      } else {
        callback(false, getFileIters(files, realPath, server.request, server.config));
      }
    });
  };

  /**
   * Checks given root path for free space
   *
   * @param  {ServerObject}    server                   Server object
   * @param  {Object}          args                     API Call Arguments
   * @param  {String}          args.root                Request root path
   * @param  {Object}          [args.options]           Request options
   * @param  {Function}        callback                 Callback function => fn(error, result)
   *
   * @function freeSpace
   * @memberof VFS
   */
  module.exports.freeSpace = function(server, args, callback) {
    var opts = typeof args.options === 'undefined' ? {} : (args.options || {});
    var realPath = getRealPath(server, args.root);

    try {
      var ds = require('diskspace');
      ds.check(realPath.root, function(err, total, free, stat) {
        callback(err, free);
      });
    } catch ( e ) {
      callback('Failed to load diskspace node library: ' + e.toString());
      return;
    }

  };

})(
  require('path'),
  require('fs'),
  require('node-fs-extra')
);
