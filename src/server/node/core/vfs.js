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
/*eslint strict:["error", "global"]*/
'use strict';

/**
 * @namespace core.vfs
 */

const _path = require('path');
const _instance = require('./instance.js');

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

function createRequest(http, method, args) {
  return new Promise(function(resolve, reject) {
    function _nullResponder(arg) {
      resolve(arg);
    }

    var newHttp = Object.assign({}, http);
    newHttp._virtual = true;
    newHttp.endpoint = method;
    newHttp.data = args;
    newHttp.request.method = 'POST';
    newHttp.respond = {
      raw: _nullResponder,
      error: _nullResponder,
      file: _nullResponder,
      stream: _nullResponder,
      json: _nullResponder
    };

    module.exports.request(newHttp, method, args).then(resolve).catch(reject);
  });
}

function getTransportName(query, mount) {
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
    const config = _instance.getConfig();
    const mountpoints = config.vfs.mounts || {};
    mount = mountpoints[protocol];
  }

  if ( mount && typeof mount === 'object' ) {
    if ( typeof mount.transport === 'string' ) {
      return mount.transport;
    }
  }

  return '__default__';
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

/**
 * Performs a VFS request
 *
 * This function can actually interrupt the promise flow and make a HTTP
 * response directly.
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {String}           method        VFS Method name
 * @param   {Object}           args          VFS Method arguments
 *
 * @function request
 * @memberof core.vfs
 */
module.exports.request = function(http, method, args) {
  const transportName = getTransportName(args);
  const transport = module.exports.getTransport(transportName);
  const opts = args.options || {};

  return new Promise(function(resolve, reject) {
    if ( !transport ) {
      return reject('Could not find any supported VFS module');
    }

    transport.request(http, method, args).then(function(data) {
      if ( method === 'read' && opts.stream !== false ) {
        return http.respond.stream(data.path, data);
      }
      resolve(data);
    }).catch(reject);
  });

  return transport.request(http, method, args);
};

/**
 * Performs a VFS request (for internal usage).
 *
 * This does not make any actual HTTP responses, but rather always resolves.
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {String}           method        API Call Name
 * @param   {Object}           args          API Call Arguments
 *
 * @return  {Promise}
 *
 * @function _request
 * @memberof core.vfs
 */
module.exports._request = function(http, method, args) {
  return createRequest(http, method, args);
};

/**
 * Performs a VFS request, but for non-HTTP usage.
 *
 * This method supports usage of a special `$:///` mountpoint that points to the server root.
 *
 * @param   {String}           method        API Call Name
 * @param   {Object}           args          API Call Arguments
 * @param   {Object}           options       A map of options used to resolve paths internally
 *
 * @return  {Promise}
 *
 * @function _vrequest
 * @memberof core.vfs
 */
module.exports._vrequest = function(method, args, options) {
  return createRequest({
    _virtual: true,
    request: {},
    session: {
      get: function(k) {
        return options[k];
      }
    }
  }, method, args);
};

/**
 * Creates a new Readable stream
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {String}           path          Virtual path
 *
 * @return  {Promise}
 *
 * @function createReadStream
 * @memberof core.vfs
 */
module.exports.createReadStream = function(http, path) {
  const transportName = getTransportName(path);
  const transport = module.exports.getTransport(transportName);
  return transport.createReadStream(http, path);
};

/**
 * Creates a new Writeable stream
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {String}           path          Virtual path
 *
 * @return  {Promise}
 *
 * @function createWriteStream
 * @memberof core.vfs
 */
module.exports.createWriteStream = function(http, path) {
  const transportName = getTransportName(path);
  const transport = module.exports.getTransport(transportName);
  return transport.createWriteStream(http, path);
};

/**
 * Gets file MIME type
 *
 * @param   {String}           iter          The filename or path
 *
 * @return {String}
 * @function getMime
 * @memberof core.vfs
 */
module.exports.getMime = function getMime(iter) {
  const dotindex = iter.lastIndexOf('.');
  const ext = (dotindex === -1) ? null : iter.substr(dotindex);
  const config = _instance.getConfig();
  return config.mimes[ext || 'default'];
};

/**
 * Gets a transport by name
 *
 * @param   {String}    transportName     Name to query
 *
 * @return {Object}
 * @function getTransport
 * @memberof core.vfs
 */
module.exports.getTransport = function(transportName) {
  return _instance.getVFS().find(function(module) {
    return module.name === transportName;
  });
};

/**
 * Parses a virtual path
 *
 * @param   {String}    query     A virtual path
 * @param   {Object}    options   A map used in resolution of path
 *
 * @example
 *
 *  .parseVirtualPath('home:///foo', {username: 'demo'})
 *
 * @return {Object}
 * @function parseVirtualPath
 * @memberof core.vfs
 */
module.exports.parseVirtualPath = function(query, options) {
  var realPath = '';

  const config = _instance.getConfig();
  const mountpoints = config.vfs.mounts || {};

  const parts = query.split(/([A-z0-9\-_]+)\:\/\/(.*)/);
  const protocol = parts[1];
  const path = _path.normalize(String(parts[2]).replace(/^\/+?/, '/').replace(/^\/?/, '/'));

  const mount = mountpoints[protocol];
  if ( !options._virtual && protocol === '$' ) {
    realPath = '/';
  } else {
    if ( typeof mount === 'object' ) {
      realPath = mount.destination;
    } else if ( typeof mount === 'string' ) {
      realPath = mount;
    }
  }

  if ( typeof options.request !== 'undefined' ) { // via `http` object
    options = {
      username: options.session.get('username')
    };
  }

  options.protocol = protocol;
  realPath = module.exports.resolvePathArguments(realPath, options);
  query = protocol + '://' + path;

  return {
    transportName: getTransportName(query, mount),
    query: query,
    protocol: protocol,
    real: _path.join(realPath, path),
    path: path
  };
};

/**
 * Resolves a path with special arguments
 *
 * @param   {String}    path              The query path
 * @param   {Object}    options           Object that maps the arguments and values
 *
 * @return {String}
 * @function resolvePathArguments
 * @memberof core.vfs
 */
module.exports.resolvePathArguments = function(path, options) {
  options = options || {};

  const env = _instance.getEnvironment();
  const rmap = {
    '%DIST%': function() {
      return env.DIST;
    },
    '%UID%': function() {
      return options.username;
    },
    '%USERNAME%': function() {
      return options.uid || options.username;
    },
    '%DROOT%': function() {
      return env.ROOTDIR;
    },
    '%MOUNTPOINT%': function() {
      return options.protocol;
    }
  };

  Object.keys(rmap).forEach(function(k) {
    path = path.replace(new RegExp(k, 'g'), rmap[k]());
  });

  return path;
};

/**
 * Resolves a path with special arguments
 *
 * @param   {String}    path              The query path
 * @param   {Object}    options           Object that maps the arguments and values
 *
 * @return {String}
 * @function resolvePathArguments
 * @memberof core.vfs
 */
module.exports.initWatch = function(callback) {
  const config = _instance.getConfig();
  const mountpoints = config.vfs.mounts || {};
  const watching = [];

  function _onWatch(name, mount, watch) {
    callback({
      name: name,
      mount: mount,
      watch: watch
    });
  }

  Object.keys(config.vfs.mounts).forEach(function(name) {
    var mount = mountpoints[name];
    if ( typeof mount === 'string' ) {
      mount = {
        transport: '__default__',
        destination: mount
      };
    }

    const found = _instance.getVFS().find(function(iter) {
      return iter.name === mount.transport;
    });

    if ( found ) {
      if ( typeof found.createWatch === 'function' ) {
        found.createWatch(name, mount, _onWatch);
        watching.push(name);
      }
    }
  });

  return watching;
};
