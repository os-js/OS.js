/**
 * OS.js Starter Template
 */

const path = require('path');
const {cli} = require('@osjs/cli');
const root = path.resolve(__dirname, '../');

cli(process.argv.slice(2), {
  root,
  packages: path.resolve(__dirname, 'packages')
});
