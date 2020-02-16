const path = require('path');
const mode = process.env.NODE_ENV || 'development';
const minimize = mode === 'production';
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {DefinePlugin} = webpack;
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const npm = require('./package.json');
const plugins = [];

if (mode === 'production') {
  plugins.push(new OptimizeCSSAssetsPlugin({
    cssProcessorOptions: {
      discardComments: true,
      map: {
        inline: false
      }
    },
  }));
}

module.exports = {
  mode,
  devtool: 'source-map',
  entry: {
    osjs: path.resolve(__dirname, 'src/client/index.js')
  },
  performance: {
    maxEntrypointSize: 500 * 1024,
    maxAssetSize: 500 * 1024
  },
  optimization: {
    minimize,
    splitChunks: {
      chunks: 'all'
    }
  },
  plugins: [
    new DefinePlugin({
      OSJS_VERSION: npm.version
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/client/index.ejs'),
      favicon: path.resolve(__dirname, 'src/client/favicon.png'),
      title: 'OS.js'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    ...plugins
  ],
  module: {
    rules: [
      {
        test: /\.(svg|png|jpe?g|gif|webp)$/,
        use: [
          {
            loader: 'file-loader'
          }
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        include: /typeface/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[ext]'
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: {
          loader: 'source-map-loader'
        }
      }
    ]
  }
};
