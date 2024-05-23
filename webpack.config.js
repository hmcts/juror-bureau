const path = require('path');

const sourcePath = path.resolve(__dirname, 'client/js');
const scss = require(path.resolve(__dirname, 'webpack/scss'));
const HtmlWebpack = require(path.resolve(__dirname, 'webpack/htmlWebpack'));

const devMode = process.env.NODE_ENV !== 'production';
const filename = 'js/bundle.js';

module.exports = {
  plugins: [...scss.plugins, ...HtmlWebpack.plugins],
  entry: path.resolve(sourcePath, 'main.js'),
  mode: devMode ? 'development' : 'production',
  module: {
    rules: [
      ...scss.rules,
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist/client'),
    publicPath: '',
    filename,
  },
  optimization: {
    minimize: false,
  },
};
