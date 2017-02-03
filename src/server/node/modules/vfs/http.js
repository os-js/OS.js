/*eslint strict:["error", "global"]*/
'use strict';

const _request = require('request');

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

function createReadStream(http, path) {
  return new Promise((resolve, reject) => {
    resolve(_request.get(path));
  });
}

function createWriteStream(http, path) {
  return new Promise((resolve, reject) => {
    reject('Unavailable');
  });
}

///////////////////////////////////////////////////////////////////////////////
// VFS METHODS
///////////////////////////////////////////////////////////////////////////////

const VFS = {
  read: function(http, args, resolve, reject) {
    const options = args.options || {};

    function _read(path, encode) {
      _request(path).on('response', (response) => {
        const mime = response.headers['content-type'];
        const data = response.body;

        if ( encode ) {
          const enc = 'data:' + mime + ';base64,' + (new Buffer(data).toString('base64'));
          resolve(enc.toString());
        } else {
          resolve(data);
        }
      }).on('error', (err) => {
        reject(err);
      });
    }

    if ( options.raw !== false ) {
      if ( options.stream !== false ) {
        createReadStream(http, args.path).then(resolve).catch(reject);
      } else {
        _read(args.path, false);
      }
    } else {
      _read(args.path, true);
    }
  }
};

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports.request = function(http, method, args) {
  return new Promise((resolve, reject) => {
    if ( typeof VFS[method] === 'function' ) {
      VFS[method](http, args, resolve, reject);
    } else {
      reject('No such VFS method');
    }
  });
};

module.exports.createReadStream = createReadStream;
module.exports.createWriteStream = createWriteStream;
module.exports.name = 'HTTP';

