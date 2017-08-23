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
const path = require('path');
const Settings = require('./settings.js');
const Modules = require('./modules.js');
const User = require('./user.js');

/**
 * Base VFS Class
 */
class VFS {

  /**
   * Parses a virtual path
   *
   * @param {String} query The virtual path
   * @param {Object} options Options
   * @throws {Error} On invalid real path
   * @return {Object}
   */
  parseVirtualPath(query, options) {
    let realPath = '';
    let virtual = false;
    if ( options instanceof User ) {
      virtual = options.virtual;
      options = options.toJson();
    }

    options = Object.assign({}, options);

    const mountpoints = Settings.get('vfs.mounts') || {};

    const parts = query.split(/([A-z0-9\-_]+)\:\/\/(.*)/);
    const protocol = parts[1];
    const pathname = path.normalize(String(parts[2]).replace(/^\/+?/, '/').replace(/^\/?/, '/'));

    const mount = mountpoints[protocol];
    if ( virtual === true && protocol === '$' ) {
      realPath = '/';
    } else {
      if ( typeof mount === 'object' ) {
        realPath = mount.destination;
      } else if ( typeof mount === 'string' ) {
        realPath = mount;
      }

      if ( !realPath ) {
        throw new Error('Failed to find real path');
      }
    }

    options.protocol = protocol;
    realPath = this.resolvePathArguments(realPath, options);
    query = protocol + '://' + pathname;

    return {
      transportName: this.getTransportName(query, mount),
      query: query,
      protocol: protocol,
      real: path.join(realPath, pathname),
      path: pathname
    };
  }

  /**
   * Gets transport name
   * @param {String} query The virtual path
   * @param {Object} [mount] The mountpoint
   * @return {String}
   */
  getTransportName(query, mount) {
    if ( typeof query === 'undefined' ) {
      return '__default__';
    }

    if ( typeof query !== 'string' ) {
      query = query.path || query.root || query.src || '';
    }

    if ( query.match(/^(https?|ftp):/) ) {
      return 'HTTP';
    }

    if ( !mount ) {
      const protocol = query.split(':')[0];
      const mountpoints = Settings.get('vfs.mounts') || {};
      mount = mountpoints[protocol];
    }

    if ( mount && typeof mount === 'object' ) {
      if ( typeof mount.transport === 'string' ) {
        return mount.transport;
      }
    }

    return '__default__';
  }

  /**
   * Resolve path arguments
   * @param {String} path A path
   * @param {Object} options Options
   * @return {String}
   */
  resolvePathArguments(path, options) {
    options = options || {};

    const rmap = {
      '%UID%': function() {
        return options.id;
      },
      '%USERNAME%': function() {
        return options.username;
      },
      '%DROOT%': function() {
        return Settings.option('ROOTDIR');
      },
      '%MOUNTPOINT%': function() {
        return options.protocol;
      }
    };

    Object.keys(rmap).forEach((k) => {
      path = path.replace(new RegExp(k, 'g'), rmap[k]());
    });

    return path;
  }

  /**
   * Gets the MIME of a filename
   * @param {String} filename Filename
   * @return {String}
   */
  getMime(filename) {
    const dotindex = filename.lastIndexOf('.');
    const ext = (dotindex === -1) ? null : filename.substr(dotindex);
    return Settings.get('mimes')[ext || 'default'];
  }

  /**
   * Convert a permission number to string
   * @param {Number} mode Mode
   * @return {String}
   */
  permissionToString(mode) {
    let str = '';
    let map = {
      0xC000: 's',
      0xA000: 'l',
      0x8000: '-',
      0x6000: 'b',
      0x4000: 'd',
      0x1000: 'p'
    };

    let type = 'u';
    Object.keys(map).forEach((k) => {
      if ( (mode & k) === k ) {
        type = map[k];
      }
      return type === 'u';
    });

    // Owner
    str += (() => {
      let ret = ((mode & 0x0100) ? 'r' : '-');
      ret += ((mode & 0x0080) ? 'w' : '-');
      ret += ((mode & 0x0040) ? ((mode & 0x0800) ? 's' : 'x' ) : ((mode & 0x0800) ? 'S' : '-'));
      return ret;
    })();

    // Group
    str += (() => {
      let ret = ((mode & 0x0020) ? 'r' : '-');
      ret += ((mode & 0x0010) ? 'w' : '-');
      ret += ((mode & 0x0008) ? ((mode & 0x0400) ? 's' : 'x' ) : ((mode & 0x0400) ? 'S' : '-'));
      return ret;
    })();

    // World
    str += (() => {
      let ret = ((mode & 0x0004) ? 'r' : '-');
      ret += ((mode & 0x0002) ? 'w' : '-');
      ret += ((mode & 0x0001) ? ((mode & 0x0200) ? 't' : 'x' ) : ((mode & 0x0200) ? 'T' : '-'));
      return ret;
    })();

    return str;
  }

  /**
   * Starts watching VFS mounts
   * @param {Function} callback Callback function
   * @return {String[]}
   */
  watch(callback) {
    const mountpoints = Settings.get('vfs.mounts', {});
    const watching = [];

    function _onWatch(name, mount, watch) {
      callback({
        name: name,
        mount: mount,
        watch: watch
      });
    }

    try {
      Object.keys(mountpoints).forEach((name) => {
        let mount = mountpoints[name];
        if ( typeof mount === 'string' ) {
          mount = {
            transport: '__default__',
            destination: mount
          };
        }

        const found = Modules.getVFS(mount.transport);
        if ( found ) {
          if ( typeof found.createWatch === 'function' ) {
            found.createWatch(name, mount, _onWatch);
            watching.push(name);
          }
        }
      });
    } catch ( e ) {
      console.warn(e, e.stack);
    }

    return watching;
  }

  /*
   * Wrapper for making stream
   */
  _createStream(method, vpath, options, streamOptions, transport) {
    if ( !transport ) {
      const transportName = this.getTransportName(vpath);
      transport = Modules.getVFS(transportName);
    }

    const resolved = this.parseVirtualPath(vpath, options);
    if ( !transport ) {
      return Promise.reject('Could not find any supported VFS module');
    }

    return transport[method](resolved.real, streamOptions);
  }

  /**
   * Creates a new Reade Stream
   * @param {String} vpath Virtual path
   * @param {Object} options Options
   * @param {Object} [streamOptions] Stream options
   * @return {Promise<ReadeableStream, Error>}
   */
  createReadStream(vpath, options, streamOptions) {
    return this._createStream('createReadStream', vpath, options, streamOptions);
  }

  /**
   * Creates a new Write Stream
   * @param {String} vpath Virtual path
   * @param {Object} options Options
   * @param {Object} [streamOptions] Stream options
   * @return {Promise<WriteableStream, Error>}
   */
  createWriteStream(vpath, options, streamOptions) {
    return this._createStream('createWriteStream', vpath, options, streamOptions);
  }

  /**
   * Perform a VFS request
   * @param {User} user The user making the request
   * @param {String} method VFS method
   * @param {Object} args VFS arguments
   * @param {Boolean} [root=false] Allow use of root features
   * @param {Object} [transport] Use given transport instead of auto-detection
   * @return {Promise<*, Error>}
   */
  request(user, method, args, root, transport) {
    args.options = args.options || {};

    if ( !transport ) {
      const transportName = this.getTransportName(args);
      transport = Modules.getVFS(transportName);
    }

    if ( !transport ) {
      return Promise.reject('Could not find any supported VFS module');
    }

    return transport.request(user, method, args);
  }

  /**
   * Perform a VFS response
   * @param {ServerObject} http The HTTP object
   * @param {String} method VFS method
   * @param {Object} args VFS arguments
   * @param {*} data Data
   */
  respond(http, method, args, data) {

    const getRanges = () => {
      let start, end, total;
      const range = args.download ? false : http.request.headers.range;
      if  ( range ) {
        const positions = range.replace(/bytes=/, '').split('-');
        total = data.size;
        start = parseInt(positions[0], 10);
        end = positions[1] ? parseInt(positions[1], 10) : total - 1;
      }
      return [range, start, end, total];
    };

    const respondRaw = () => {
      if ( data.options.raw === false  ) {
        const enc = 'data:' + data.mime + ';base64,' + (new Buffer(data.resource).toString('base64'));
        http.response.send(enc.toString());
      } else {
        http.response.setHeader('Content-Type', data.mime);
        http.response.send(data.resource);
      }
    };

    const respondRangedStream = (start, end, total) => {
      http.response.setHeader('Accept-Ranges', 'bytes');
      http.response.setHeader('Content-Range', 'bytes ' + start + '-' + end + '/' + total);
      http.response.setHeader('Content-Length', (end - start) + 1);

      if ( start > end || start > total - 1 || end >= total ) {
        http.response.status(416).end();
        return;
      }

      http.response.status(206);
    };

    const respondStream = () => {
      const [range, start, end, total] = getRanges();

      data.resource(range ? {
        start: start,
        end: end
      } : {}).then((stream) => {
        http.response.setHeader('Content-Type', data.mime);

        if ( range ) {
          respondRangedStream(start, end, total);
        }

        stream.pipe(http.response);
      }).catch((err) => {
        http.response.status(500).send(err);
      });
    };

    if ( method === 'read' && typeof data === 'object' ) {
      if ( args.download && data.filename ) {
        http.response.setHeader('Content-Disposition', 'attachment; filename=' + path.basename(data.filename));
      }

      if ( typeof data.resource === 'function' ) {
        respondStream();
      } else {
        respondRaw();
      }
      return;
    }

    http.response.json({result: data});
  }
}

module.exports = (new VFS());
