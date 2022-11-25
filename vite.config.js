// @ts-ignore
const npm = require('./package.json');

const assetsDir = '';

const outputDefaults = {
  // remove hashes from filenames
  entryFileNames: `${assetsDir}[name].js`,
  chunkFileNames: `${assetsDir}[name].js`,
  assetFileNames: `${assetsDir}[name].[ext]`,
};

/** @type {import("vite").UserConfig} */
module.exports = {
  clearScreen: false,
  root: "src/client",
  base: "./", // generate relative paths in html
  define: {
    OSJS_VERSION: JSON.stringify(npm.version),
  },
  worker: {
    rollupOptions: {
      output: {
        ...outputDefaults,
      }
    },
  },
  build: {
    outDir: "../../dist", // relative to root
    emptyOutDir: true,
    target: 'esnext',
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        ...outputDefaults,
      },
    },
  },
  plugins: [
  ],
};
