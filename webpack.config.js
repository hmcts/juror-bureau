const path = require('path');

const sourcePath = path.resolve(__dirname, 'client/js');
const scss = require(path.resolve(__dirname, 'webpack/scss'));
const HtmlWebpack = require(path.resolve(__dirname, 'webpack/htmlWebpack'));

const devMode = process.env.NODE_ENV !== 'production';
const filename = 'js/bundle.js';

const outDir = devMode ? 'dev/client' : 'dist/client';

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
    extensions: ['.js'],
  },
  output: {
    path: path.resolve(__dirname, outDir),
    publicPath: '',
    filename,
  },
  optimization: {
    minimize: false,
  },
};
