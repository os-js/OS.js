const osjs = require('osjs-build');

module.exports = new Promise((resolve, reject) => {
  osjs.webpack.createThemeConfiguration().then((result) => {
    resolve(result.config);
  }).catch(reject);
});

