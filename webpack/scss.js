const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const miniCss = new MiniCssExtractPlugin({
  // Options similar to the same options in webpackOptions.output
  // both options are optional
  filename: 'css/style.css',
  ignoreOrder: true,
});

module.exports = {
  rules: [
    {
      test: /\.scss$/,
      include: path.resolve(__dirname, '../client/scss/main.scss'),
      use: [
        'style-loader',
        {
          loader: MiniCssExtractPlugin.loader,
          options: {
            esModule: false,
          },
        },
        {
          loader: 'css-loader',
          options: {
            url: false,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            sassOptions: {
              quietDeps: true,
            },
          },
        },
      ],
    },
  ],
  plugins: [miniCss],
};
