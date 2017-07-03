const webpack = require('webpack');
const path = require('path');
const buildPath = path.resolve(__dirname, '../html/app');
const nodeModulesPath = path.resolve(__dirname, 'node_modules');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const config = {
  devtool: 'source-map',
  entry: [
    path.join(__dirname, '/source/index.jsx'),
  ],
  output: {
    path: buildPath,
    filename: 'app.js',
  },
  resolve: {
    extensions: ['', '.scss', '.css', '.js', '.jsx', '.json'],
    modulesDirectories: [
      'node_modules',
      nodeModulesPath
    ]
  },
  module: {
    loaders: [
      {
        test: [/\.jsx$/, /\.js$/, /\.es6$/], // Handles .js, .jsx, .es6
        loader: 'babel',
        exclude: [nodeModulesPath],
        query: {
          presets: ['es2015', 'stage-0', 'react']
        }
      },
      {
        test: /(\.scss|\.css)$/,
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap&modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss!sass')
      }
    ],
  },
  postcss: [autoprefixer],
  sassLoader: {
    data: '@import "theme/_config.scss";',
    includePaths: [path.resolve(__dirname, './source')]
  },
  plugins: [
    new ExtractTextPlugin('app.css', { allChunks: true })
  ]
};

module.exports = config;
