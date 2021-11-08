const path = require('path');
const root = path.resolve(__dirname, '../../');

module.exports = {
  root,
  public: path.resolve(root, 'dist'),
  //port: process.env.PORT,
  port: 3000,
};
