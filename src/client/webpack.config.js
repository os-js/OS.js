const osjs = require('osjs-build');

module.exports = new Promise((resolve, reject) => {
  osjs.webpack.createCoreConfiguration().then((result) => {
    resolve(result.config);
  }).catch(reject);
});
