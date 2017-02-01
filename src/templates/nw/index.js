/*eslint strict:["error", "global"]*/
'use strict';

module.exports.init = function(args, cb) {
  cb();
};

module.exports.request = function(method, args, resolve, reject) {
  reject('Not implemented');
};
