/*eslint strict:["error", "global"]*/
'use strict';

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

/*
 * Create a read stream
 */
function createReadStream(http, path) {
  return new Promise((resolve, reject) => {
    reject('Unavailable');
  });
}

/*
 * Create a write stream
 */
function createWriteStream(http, path) {
  return new Promise((resolve, reject) => {
    reject('Unavailable');
  });
}

/*
 * Creates a new filesystem watch
 */
function createWatch(name, mount, callback) {
  // Do nothing by default
}

///////////////////////////////////////////////////////////////////////////////
// VFS METHODS
///////////////////////////////////////////////////////////////////////////////

const VFS = {

  read: function(http, args, resolve, reject) {
    reject('Not implemented');
  },

  upload: function(http, args, resolve, reject) {
    reject('Not implemented');
  },

  write: function(http, args, resolve, reject) {
    reject('Not implemented');
  },

  delete: function(http, args, resolve, reject) {
    reject('Not implemented');
  },

  copy: function(http, args, resolve, reject) {
    reject('Not implemented');
  },

  move: function(http, args, resolve, reject) {
    reject('Not implemented');
  },

  mkdir: function(http, args, resolve, reject) {
    reject('Not implemented');
  },

  find: function(http, args, resolve, reject) {
    reject('Not implemented');
  },

  fileinfo: function(http, args, resolve, reject) {
    reject('Not implemented');
  },

  scandir: function(http, args, resolve, reject) {
    reject('Not implemented');
  },

  freeSpace: function(http, args, resolve, reject) {
    reject('Not implemented');
  }
};

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

/**
 * Performs a VFS request
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {String}           method        VFS Method name
 * @param   {Object}           args          VFS Method arguments
 *
 * @return {Promise}
 */
module.exports.request = function(http, method, args) {
  return new Promise((resolve, reject) => {
    if ( typeof VFS[method] === 'function' ) {
      VFS[method](http, args, resolve, reject);
    } else {
      reject('No such VFS method');
    }
  });
};

/**
 * Creates a new Readable stream
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {String}           path          Virtual path
 *
 * @return  {Promise}
 */
module.exports.createReadStream = createReadStream;

/**
 * Creates a new Writeable stream
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {String}           path          Virtual path
 *
 * @return  {Promise}
 */
module.exports.createWriteStream = createWriteStream;

/**
 * Creates a new filesystem watch
 *
 * @param   {String}           name          Mountpoint name
 * @param   {Object}           mount         Mountpoint options (parsed from config)
 * @param   {Function}         callback      Callback function => fn(name, mount, watch)
 *
 * @return  {Promise}
 */
module.exports.createWatch = createWatch;

/*
 * The name of your module
 */
module.exports.name = 'EXAMPLE';

