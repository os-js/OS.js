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
const _fs = require('fs-extra');
const _nfs = require('fs');
const _path = require('path');
const _chokidar = require('chokidar');
const _diskspace = require('diskspace');

const _vfs = require('./../../vfs.js');

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Create a read stream
 */
function createReadStream(filename, options) {
  return new Promise((resolve, reject) => {
    /*eslint new-cap: "off"*/
    try {
      const stream = _fs.createReadStream(filename, Object.assign({
        bufferSize: 64 * 1024
      }, options));

      stream.on('error', (error) => {
        reject(error);
      });
      stream.on('open', () => {
        resolve(stream);
      });
    } catch ( e ) {
      reject(e);
    }
  });
}

/*
 * Create a write stream
 */
function createWriteStream(filename, options) {
  return new Promise((resolve, reject) => {
    /*eslint new-cap: "off"*/
    try {
      const stream = _fs.createWriteStream(filename);

      stream.on('error', (error) => {
        reject(error);
      });
      stream.on('open', () => {
        resolve(stream);
      });
    } catch ( e ) {
      reject(e);
    }
  });
}

/*
 * Creates watch
 */
function createWatch(name, mount, callback) {
  const watchMap = {
    add: 'write',
    change: 'write'
  };

  const configPath = _vfs.resolvePathArguments(mount.destination, {
    username: '%USERNAME%',
    uid: '%USERNAME%'
  });

  const parseWatch = (realPath) => {
    realPath = realPath.replace(/\\/g, '/');

    const tmpDir = configPath.replace(/\\/g, '/');
    const reps = (s) => s.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    const tmp = reps(tmpDir).replace(/%(.*)%/g, '([^\/]*)');

    const re = new RegExp('^' + tmp, 'g');
    const cfg = tmpDir.split(/([^\/]*)/g);
    const relPath = realPath.replace(re, '');
    const result = {};

    realPath.split(/([^\/]*)/g).forEach((s, idx) => {
      if ( String(cfg[idx]).match(/%(.*)%/)  ) {
        result[cfg[idx]] = s;
      }
    });

    return {
      virtual: relPath,
      args: result
    };
  };

  const found = configPath.indexOf('%');
  const dir = found > 0 ? configPath.substr(0, found) : configPath;

  _chokidar.watch(dir, {ignoreInitial: true, persistent: true}).on('all', (evname, wpath) => {
    if ( ['change', 'error'].indexOf(evname) === -1 ) {
      try {
        const parsed = parseWatch(wpath);
        if ( !parsed ) {
          return;
        }

        const virtual = name + '://' + parsed.virtual.replace(/^\/?/, '/');

        callback(name, mount, {
          event: watchMap[evname] || evname,
          real: wpath,
          path: virtual,
          args: parsed.args
        });
      } catch ( e ) {
        console.warn(e, e.stack);
      }
    }
  });
}

/*
 * Reads EXIF data
 */
function readExif(path, mime) {
  mime = mime || '';

  let _read = function defaultRead(resolve, reject) {
    resolve(null);
  };

  if ( mime.match(/^image/) ) {
    try {
      _read = function exifRead(resolve, reject) {
        /*eslint no-new: "off"*/
        new require('exif').ExifImage({image: path}, (err, result) => {
          if ( err ) {
            reject(err);
          } else {
            resolve(JSON.stringify(result, null, 4));
          }
        });
      };
    } catch ( e ) {}
  }

  return new Promise(_read);
}

/*
 * Creates file information in a format OS.js understands
 */
function createFileIter(query, real, iter, stat) {
  if ( !stat ) {
    try {
      stat = _fs.statSync(real);
    } catch ( e ) {
      stat = {
        isFile: function() {
          return true;
        }
      };
    }
  }

  let mime = '';
  const filename = iter ? iter : _path.basename(query);
  const type = stat.isFile() ? 'file' : 'dir';

  if ( type === 'file' ) {
    mime = _vfs.getMime(filename);
  }

  const perm = _vfs.permissionToString(stat.mode);
  const filepath = !iter ? query : (() => {
    const spl = query.split('://');
    const proto = spl[0];
    const ppath = (spl[1] || '').replace(/\/?$/, '/');
    return proto + '://' + _path.join(ppath, iter).replace(/\\/g, '/');
  })();

  return {
    filename: filename,
    path: filepath,
    size: stat.size || 0,
    mime: mime,
    type: type,
    permissions: perm,
    ctime: stat.ctime || null,
    mtime: stat.mtime || null
  };
}

/*
 * Check if given file exists or not
 */
function existsWrapper(checkFound, real, resolve, reject) {
  _fs.exists(real, (exists) => {
    if ( checkFound ) {
      if ( exists ) {
        reject('File or directory already exist.');
      } else {
        resolve(true);
      }
    } else {
      if ( exists ) {
        resolve(true);
      } else {
        reject('No such file or directory');
      }
    }
  });
}

/*
 * Reads a directory and returns in a format OS.js understands
 */
function readDir(query, real, filter) {
  filter = filter || function(iter) {
    return ['.', '..'].indexOf(iter) === -1;
  };

  return new Promise((resolve, reject) => {
    _fs.readdir(real, (err, list) => {
      if ( err ) {
        reject(err);
      } else {
        resolve(list.filter(filter).map((iter) => {
          return createFileIter(query, _path.join(real, iter), iter);
        }));
      }
    });
  });
}

///////////////////////////////////////////////////////////////////////////////
// VFS METHODS
///////////////////////////////////////////////////////////////////////////////

const VFS = {

  exists: function(user, args, resolve, reject) {
    const resolved = _vfs.parseVirtualPath(args.path, user);
    _fs.exists(resolved.real, (exists) => {
      resolve(exists);
    });
  },

  read: function(user, args, resolve, reject) {
    /*eslint new-cap: "off"*/
    const resolved = _vfs.parseVirtualPath(args.path, user);
    const options = args.options || {};
    const mime = _vfs.getMime(args.path);

    _fs.stat(resolved.real, (e, stat) => {
      if ( e ) {
        reject(e);
        return;
      }

      if ( options.stream !== false ) {
        resolve({
          resource: (options) => createReadStream(resolved.real, options),
          mime: mime,
          filename: resolved.real,
          size: stat.size,
          options: options
        });
      } else {
        _fs.readFile(resolved.real, (e, r) => {
          return e ? reject(e) : resolve({
            resource: r,
            mime: mime,
            filename: resolved.real,
            size: stat.size,
            options: options
          });
        });
      }
    });
  },

  upload: function(user, args, resolve, reject) {
    function _proceed(source, dest) {
      const streamIn = _fs.createReadStream(source);
      const streamOut = _fs.createWriteStream(dest, {flags: 'w'});

      function streamDone() {
        streamIn.destroy();
        streamOut.destroy();

        _fs.remove(source, () => {
          resolve(true);
        });
      }

      function streamError(err) {
        streamIn.destroy();
        streamOut.destroy();
        streamOut.removeListener('close', streamDone);
        reject(err);
      }

      streamIn.on('error', streamError);
      streamOut.on('error', streamError);
      streamOut.once('close', streamDone);
      streamIn.pipe(streamOut);
    }

    const httpData = args.fields || {};
    const httpUpload = args.files.upload || {};

    const vfsFilename = httpUpload.name || httpData.filename;
    const vfsDestination = httpData.path;
    const realDestination = _vfs.parseVirtualPath(vfsDestination, user);
    const destination = _path.join(realDestination.real, vfsFilename);
    const source = httpUpload.path;
    const overwrite = String(httpData.overwrite) === 'true';

    function _createEmpty() {
      _fs.writeFile(destination, '', 'utf8', (err) => {
        if ( err ) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    }

    function _checkDestination() {
      if ( overwrite ) {
        return Promise.resolve(true);
      }

      return new Promise((yes, no) => {
        existsWrapper(true, destination, yes, no);
      });
    }

    _checkDestination().then(() => {
      if ( !source ) {
        _createEmpty();
      } else {
        existsWrapper(false, source, () => {
          _proceed(source, destination);
        }, reject);
      }
    }).catch(reject);
  },

  write: function(user, args, resolve, reject) {
    const resolved = _vfs.parseVirtualPath(args.path, user);
    const options = args.options || {};
    let data = args.data || '';

    function writeFile(d, e) {
      _fs.writeFile(resolved.real, d, e || 'utf8', (error) => {
        if ( error ) {
          reject('Error writing file: ' + error);
        } else {
          resolve(true);
        }
      });
    }

    if ( options.raw === false ) {
      data = unescape(data.substring(data.indexOf(',') + 1));
      data = new Buffer(data, 'base64');
      writeFile(data);
    } else {
      writeFile(data, options.rawtype || 'binary');
    }
  },

  unlink: function(user, args, resolve, reject) {
    const resolved = _vfs.parseVirtualPath(args.path, user);
    if ( ['', '.', '/'].indexOf() !== -1 ) {
      reject('Permission denied');
      return;
    }

    existsWrapper(false, resolved.real, () => {
      _fs.remove(resolved.real, (err) => {
        if ( err ) {
          reject('Error deleting: ' + err);
        } else {
          resolve(true);
        }
      });
    }, reject);
  },

  copy: function(user, args, resolve, reject) {
    const sresolved = _vfs.parseVirtualPath(args.src, user);
    const dresolved = _vfs.parseVirtualPath(args.dest, user);

    existsWrapper(false, sresolved.real, () => {
      existsWrapper(true, dresolved.real, () => {
        _fs.access(_path.dirname(dresolved.real), _nfs.W_OK, (err) => {
          if ( err ) {
            reject('Cannot write to destination');
          } else {
            _fs.copy(sresolved.real, dresolved.real, (error, data) => {
              if ( error ) {
                reject('Error copying: ' + error);
              } else {
                resolve(true);
              }
            });
          }
        });
      }, reject);
    }, reject);
  },

  move: function(user, args, resolve, reject) {
    const sresolved = _vfs.parseVirtualPath(args.src, user);
    const dresolved = _vfs.parseVirtualPath(args.dest, user);

    _fs.access(sresolved.real, _nfs.R_OK, (err) => {
      if ( err ) {
        reject('Cannot read source');
      } else {
        _fs.access(_path.dirname(dresolved.real), _nfs.W_OK, (err) => {
          if ( err ) {
            reject('Cannot write to destination');
          } else {
            _fs.rename(sresolved.real, dresolved.real, (error, data) => {
              if ( error ) {
                reject('Error renaming/moving: ' + error);
              } else {
                resolve(true);
              }
            });
          }
        });
      }
    });
  },

  mkdir: function(user, args, resolve, reject) {
    const resolved = _vfs.parseVirtualPath(args.path, user);

    existsWrapper(true, resolved.real, () => {
      _fs.mkdirs(resolved.real, (err) => {
        if ( err ) {
          reject('Error creating directory: ' + err);
        } else {
          resolve(true);
        }
      });
    }, reject);
  },

  find: function(user, args, resolve, reject) {
    const qargs = args.args || {};
    const query = (qargs.query || '').toLowerCase();
    const resolved = _vfs.parseVirtualPath(args.path, user);

    if ( !qargs.recursive ) {
      readDir(resolved.path, resolved.real, (iter) => {
        if (  ['.', '..'].indexOf(iter) === -1 ) {
          return iter.toLowerCase().indexOf(query) !== -1;
        }
        return false;
      }).then(resolve).catch(reject);

      return;
    }

    let find;
    try {
      find = require('findit')(resolved.real);
    } catch ( e ) {
      reject('Failed to load findit node library: ' + e.toString());
      return;
    }

    let list = [];

    function addIter(file, stat) {
      const filename = _path.basename(file).toLowerCase();
      const fpath = resolved.path + file.substr(resolved.real.length).replace(/^\//, '');
      if ( filename.indexOf(query) !== -1 ) {
        const qpath = resolved.query + fpath.replace(/^\//, '');
        list.push(createFileIter(qpath, resolved.real, null, stat));
      }
    }

    find.on('path', () => {
      if ( qargs.limit && list.length >= qargs.limit ) {
        find.stop();
      }
    });

    find.on('directory', addIter);
    find.on('file', addIter);

    find.on('end', () => {
      resolve(list);
    });

    find.on('stop', () => {
      resolve(list);
    });
  },

  fileinfo: function(user, args, resolve, reject) {
    const resolved = _vfs.parseVirtualPath(args.path, user);

    existsWrapper(false, resolved.real, () => {
      const info = createFileIter(resolved.query, resolved.real, null);
      const mime = _vfs.getMime(resolved.real);

      readExif(resolved.real, mime).then((result) => {
        info.exif = result || 'No EXIF data available';
        resolve(info);
      }).catch((error) => {
        info.exif = error;
        resolve(info);
      });
    }, reject);
  },

  scandir: function(user, args, resolve, reject) {
    const resolved = _vfs.parseVirtualPath(args.path, user);
    const opts = args.options || {};

    readDir(resolved.query, resolved.real).then((list) => {

      if ( opts.shortcuts !== false ) {
        const filename = typeof opts.shortcuts === 'string' ? opts.shortcuts.replace(/\/+g/, '') : '.shortcuts.json';
        const path = args.path.replace(/\/?$/, '/' + filename);
        const realMeta = _vfs.parseVirtualPath(path, user);

        _fs.readJson(realMeta.real, (err, additions) => {
          if ( !(additions instanceof Array) ) {
            additions = [];
          }
          resolve(list.concat(additions));
        });
      } else {
        resolve(list);
      }

    }).catch(reject);
  },

  freeSpace: function(user, args, resolve, reject) {
    const resolved = _vfs.parseVirtualPath(args.root, user);

    if ( resolved.protocol === 'osjs' ) {
      reject('Not supported');
    } else {
      _diskspace.check(resolved.real, (err, result) => {
        resolve(result.free);
      });
    }
  }
};

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports.request = function(user, method, args) {
  return new Promise((resolve, reject) => {
    if ( typeof VFS[method] === 'function' ) {
      VFS[method](user, args, resolve, reject);
    } else {
      reject('No such VFS method: ' + method);
    }
  });
};

module.exports.createReadStream = createReadStream;
module.exports.createWriteStream = createWriteStream;
module.exports.createWatch = createWatch;
module.exports.name = '__default__';

