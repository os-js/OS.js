/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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

  var sortReaddir = function(list) {
    var tree = {dirs: [], files: []};
    for ( var i = 0; i < list.length; i++ ) {
      if ( list[i].type == 'dir' ) {
        tree.dirs.push(list[i]);
      } else {
        tree.files.push(list[i]);
      }
    }

    return tree.dirs.concat(tree.files);
  };


  var vfs = {
    getMime : function(file, config) {
      var i = file.lastIndexOf("."),
          ext = (i === -1) ? "default" : file.substr(i),
          mimeTypes = config.mimes;
      return mimeTypes[ext.toLowerCase()] || mimeTypes.default;
    },

    read : function(args, request, respond, config) {
      var path = args[0];
      var opts = typeof args[1] === 'undefined' ? {} : (args[1] || {});

      var fullPath = _path.join(config.vfsdir, path);
      _fs.exists(fullPath, function(exists) {
        if ( exists ) {
          _fs.readFile(fullPath, function(error, data) {
            if ( error ) {
              respond({result: null, error: 'Error reading file: ' + error});
            } else {
              if ( opts.dataSource ) {
                data = "data:" + vfs.getMime(fullPath, config) + ";base64," + (new Buffer(data).toString('base64'));
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

      var fullPath = _path.join(config.vfsdir, path);

      if ( opts.dataSource ) {
        data = data.replace(/^data\:(.*);base64\,/, "") || '';
        data = new Buffer(data, 'base64').toString('ascii')
      }

      _fs.writeFile(fullPath, data, function(error, data) {
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

      var fullPath = _path.join(config.vfsdir, path);
      _fs.exists(fullPath, function(exists) {
        if ( !exists ) {
          respond({result: null, error: 'Target does not exist!'});
        } else {
          _fs.remove(fullPath, function(error, data) {
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

      var srcPath = _path.join(config.vfsdir, src);
      var dstPath = _path.join(config.vfsdir, dst);
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

      var srcPath = _path.join(config.vfsdir, src);
      var dstPath = _path.join(config.vfsdir, dst);
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

      var fullPath = _path.join(config.vfsdir, path);
      _fs.exists(fullPath, function(exists) {
        if ( exists ) {
          respond({result: null, error: 'Target already exist!'});
        } else {
          _fs.mkdir(fullPath, function(error, data) {
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
      var fullPath = _path.join(config.vfsdir, path);
      _fs.exists(fullPath, function(exists) {
        respond({result: exists, error: null});
      });
    },

    fileinfo : function(args, request, respond, config) {
      var path = args[0];
      var opts = typeof args[1] === 'undefined' ? {} : (args[1] || {});
      var fullPath = _path.join(config.vfsdir, path);
      _fs.exists(fullPath, function(exists) {
        if ( !exists ) {
          respond({result: null, error: 'No such file or directory!'});
        } else {
          _fs.stat(fullPath, function(error, stat) {
            if ( error ) {
              respond({result: false, error: 'Error getting file information: ' + error});
            } else {
              var data = {
                path:         _path.dirname(fullPath),
                filename:     _path.basename(fullPath),
                size:         stat.size,
                mime:         vfs.getMime(fullPath, config),
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
      var opts = typeof args[1] === 'undefined' ? {} : (args[1] || {});

      var fullPath = _path.join(config.vfsdir, path);

      _fs.readdir(fullPath, function(error, files) {
        if ( error ) {
          respond({result: null, error: 'Error reading directory: ' + error});
        } else {
          var result = [];
          var ofpath, fpath, ftype, fsize, fstat;
          for ( var i = 0; i < files.length; i++ ) {
            ofpath = _path.join(path, files[i]);
            fpath  = _path.join(fullPath, files[i]);

            fsstat = _fs.statSync(fpath);
            ftype  = fsstat.isFile() ? 'file' : 'dir';
            fsize  = fsstat.size;

            result.push({
              filename: files[i],
              path:     ofpath,
              size:     fsize,
              mime:     ftype === 'file' ? vfs.getMime(files[i], config) : '',
              type:     ftype
            });
          }

          var tree = sortReaddir(result);
          respond({result: tree, error: null});
        }
      });
    }
  };

  module.exports = vfs;
})(
  require("path"),
  require("node-fs-extra")
);
