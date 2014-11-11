/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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

  var readExif = function(data, cb) {
    cb(data); // TODO
  };

  var readPermission = function(mode) {
    return mode; // TODO
  };

  function getRealPath(path, config, request) {
    var fullPath = _path.join(config.publicdir, path);
    var protocol = '';
    if ( path.match(/^osjs\:\/\//) ) {
      path = path.replace(/^osjs\:\/\//, '');
      fullPath = _path.join(config.distdir, path);
      protocol = 'osjs://';
    } else if ( path.match(/^home\:\/\//) ) {
      path = path.replace(/^home\:\/\//, '');
      var userdir = request.cookies.get('username');
      if ( !userdir ) {
        throw "No user session was found";
      }
      fullPath = _path.join(config.vfsdir, userdir, path);
      protocol = 'home://';
    }
    return {root: fullPath, path: path, protocol: protocol};
  }

  var vfs = {
    getRealPath: getRealPath,

    getMime : function(file, config) {
      var i = file.lastIndexOf("."),
          ext = (i === -1) ? "default" : file.substr(i),
          mimeTypes = config.mimes;
      return mimeTypes[ext.toLowerCase()] || mimeTypes.default;
    },

    read : function(args, request, respond, config) {
      var path = args[0];
      var opts = typeof args[1] === 'undefined' ? {} : (args[1] || {});

      var realPath = getRealPath(path, config, request);
      path = realPath.path;

      _fs.exists(realPath.root, function(exists) {
        if ( exists ) {
          _fs.readFile(realPath.root, function(error, data) {
            if ( error ) {
              respond({result: null, error: 'Error reading file: ' + error});
            } else {
              if ( opts.dataSource ) {
                data = "data:" + vfs.getMime(realPath.root, config) + ";base64," + (new Buffer(data).toString('base64'));
              } else {
                data = (new Buffer(data).toString('base64'));
              }

              respond({result: data.toString(), error: null});
            }
          });
        } else {
          respond({result: null, error: 'File not found!'});
        }
      });
    },

    write : function(args, request, respond, config) {
      var path = args[0];
      var data = args[1] || '';
      var opts = typeof args[2] === 'undefined' ? {} : (args[2] || {});

      var realPath = getRealPath(path, config, request);
      path = realPath.path;

      if ( opts.dataSource ) {
        data = data.replace(/^data\:(.*);base64\,/, "") || '';
        data = new Buffer(data, 'base64').toString('ascii')
      }

      _fs.writeFile(realPath.root, data, function(error, data) {
        if ( error ) {
          respond({result: null, error: 'Error writing file: ' + error});
        } else {
          respond({result: true, error: null});
        }
      });
    },

    'delete' : function(args, request, respond, config) {
      var path = args[0];
      var opts = typeof args[1] === 'undefined' ? {} : (args[1] || {});

      var realPath = getRealPath(path, config, request);
      path = realPath.path;

      _fs.exists(realPath.root, function(exists) {
        if ( !exists ) {
          respond({result: null, error: 'Target does not exist!'});
        } else {
          _fs.remove(realPath.root, function(error, data) {
            if ( error ) {
              respond({result: false, error: 'Error deleting: ' + error});
            } else {
              respond({result: true, error: null});
            }
          });
        }
      });
    },

    copy : function(args, request, respond, config) {
      var src  = args[0];
      var dst  = args[1];
      var opts = typeof args[2] === 'undefined' ? {} : (args[2] || {});

      var realSrc = getRealPath(src, config, request);
      var realDst = getRealPath(dst, config, request);
      var srcPath = realSrc.root; //_path.join(realSrc.root, src);
      var dstPath = realDst.root; //_path.join(realDst.root, dst);
      _fs.exists(srcPath, function(exists) {
        if ( exists ) {
          _fs.exists(dstPath, function(exists) {
            if ( exists ) {
              respond({result: null, error: 'Target already exist!'});
            } else {
              _fs.copy(srcPath, dstPath, function(error, data) {
                if ( error ) {
                  respond({result: false, error: 'Error copying: ' + error});
                } else {
                  respond({result: true, error: null});
                }
              });
            }
          });
        } else {
          respond({result: null, error: 'Source does not exist!'});
        }
      });
    },

    move : function(args, request, respond, config) {
      var src  = args[0];
      var dst  = args[1];
      var opts = typeof args[2] === 'undefined' ? {} : (args[2] || {});

      var realSrc = getRealPath(src, config, request);
      var realDst = getRealPath(dst, config, request);
      var srcPath = realSrc.root; //_path.join(realSrc.root, src);
      var dstPath = realDst.root; //_path.join(realDst.root, dst);
      _fs.exists(srcPath, function(exists) {
        if ( exists ) {
          _fs.exists(dstPath, function(exists) {
            if ( exists ) {
              respond({result: null, error: 'Target already exist!'});
            } else {
              _fs.rename(srcPath, dstPath, function(error, data) {
                if ( error ) {
                  respond({result: false, error: 'Error renaming/moving: ' + error});
                } else {
                  respond({result: true, error: null});
                }
              });
            }
          });
        } else {
          respond({result: null, error: 'Source does not exist!'});
        }
      });
    },

    mkdir : function(args, request, respond, config) {
      var path = args[0];
      var opts = typeof args[1] === 'undefined' ? {} : (args[1] || {});

      var realPath = getRealPath(path, config, request);
      path = realPath.path;

      _fs.exists(realPath.root, function(exists) {
        if ( exists ) {
          respond({result: null, error: 'Target already exist!'});
        } else {
          _fs.mkdir(realPath.root, function(error, data) {
            if ( error ) {
              respond({result: false, error: 'Error creating directory: ' + error});
            } else {
              respond({result: true, error: null});
            }
          });
        }
      });
    },

    exists : function(args, request, respond, config) {
      var path = args[0];
      var opts = typeof args[1] === 'undefined' ? {} : (args[1] || {});

      var realPath = getRealPath(path, config, request);
      path = realPath.path;
      _fs.exists(realPath.root, function(exists) {
        respond({result: exists, error: null});
      });
    },

    fileinfo : function(args, request, respond, config) {
      var path = args[0];
      var opts = typeof args[1] === 'undefined' ? {} : (args[1] || {});

      var realPath = getRealPath(path, config, request);
      path = realPath.path;
      _fs.exists(realPath.root, function(exists) {
        if ( !exists ) {
          respond({result: null, error: 'No such file or directory!'});
        } else {
          _fs.stat(realPath.root, function(error, stat) {
            if ( error ) {
              respond({result: false, error: 'Error getting file information: ' + error});
            } else {
              var data = {
                path:         _path.dirname(realPath.root),
                filename:     _path.basename(realPath.root),
                size:         stat.size,
                mime:         vfs.getMime(realPath.root, config),
                permissions:  readPermission(stat.mode)
              };

              readExif(data, function(data) {
                respond({result: data, error: null});
              });

            }
          });
        }
      });
    },

    scandir : function(args, request, respond, config) {
      var path = args[0];

      var realPath = getRealPath(path, config, request);
      path = realPath.path;

      _fs.readdir(realPath.root, function(error, files) {
        if ( error ) {
          respond({result: null, error: 'Error reading directory: ' + error});
        } else {
          var result = [];
          var ofpath, fpath, ftype, fsize, fstat;
          for ( var i = 0; i < files.length; i++ ) {
            ofpath = _path.join(path, files[i]);
            fpath  = _path.join(realPath.root, files[i]);

            try {
              fsstat = _fs.statSync(fpath);
              ftype  = fsstat.isFile() ? 'file' : 'dir';
              fsize  = fsstat.size;
            } catch ( e ) {
              ftype = 'file';
              fsize = 0;
            }

            result.push({
              filename: files[i],
              path:     realPath.protocol + ofpath,
              size:     fsize,
              mime:     ftype === 'file' ? vfs.getMime(files[i], config) : '',
              type:     ftype
            });
          }

          respond({result: result, error: null});
        }
      });
    }
  };

  module.exports = vfs;
})(
  require("path"),
  require("node-fs-extra")
);
