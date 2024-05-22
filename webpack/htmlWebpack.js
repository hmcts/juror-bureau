const CopyWebpackPlugin = require('copy-webpack-plugin');

const clientJs = [
  'jquery.min.js',
  'html5shiv.min.js',
  'respond.min.js',
  'svgxuse.min.js',
  'ds-datepicker.js',
  'ds-datepicker-helper.js',
  'show-hide-content.js',
  'attendance.js',
  'deferral-maintenance.js',
  'dismiss-jurors.js',
  'pool-overview.js',
  'uncomplete-service.js',
  'document-letters.js',
  'messaging-juror-select.js',
  'expenses-summary.js',
  'certificate-of-exemption-list.js',
  'export-contact-details.js',
];

const copyClientCode = new CopyWebpackPlugin({
  patterns: [
    // { from: 'client/**/*.html', to: 'dist' },
    { from: 'client/**/*.njk', to: '../' },
    { from: 'server/**/*.js', to: '../' },
    {
      from: 'client/js/*.js',
      to: '../',
      filter: (file) => {
        const parts = file.split('/');
        return clientJs.includes(parts[parts.length - 1]);
      },
    },
    { from: 'client/js/i18n/cy/PDF.json', to: '../client/js/i18n/cy' },
    { from: 'client/js/i18n/en/PDF.json', to: '../client/js/i18n/en' },

    // eslint-disable-next-line max-len
    // { from: 'client/assets/fonts/', src: ['boldFont.ttf', 'lightFont.ttf', 'OpenSans-Regular.ttf', 'OpenSans-Bold.ttf', 'LibreBarcode39-Regular.ttf'], dest: 'dist/client/assets/fonts' },
    { from: 'node_modules/chart.js/dist/*.js', to: '../client/js/chart.js' },
    { from: 'node_modules/chart.js/dist/Chart.min.css', to: '../client/css' },
    { from: 'node_modules/govuk-frontend/govuk/all.js', to: '../client/js/govuk' },
    { from: 'node_modules/@ministryofjustice/frontend/moj/all.js', to: '../client/js/moj' },
    {
      from: 'node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.js',
      to: '../client/js',
    },
    {
      from: 'node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.css',
      to: '../client/css',
    },
    { from: 'config/', to: '../config' },
    { from: 'package.json', to: '../' },
  ],
});

module.exports = {
  paths: { template: '.' },
  plugins: [copyClientCode],
};
