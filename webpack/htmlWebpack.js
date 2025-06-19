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
  'bulk-undeliverable.js',
  'multiple-tabs.js',
  'print-sortable.js',
  'summoning-progress.js',
  'loading-spinner.js',
];

const copyClientCode = new CopyWebpackPlugin({
  patterns: [
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

    { from: 'node_modules/chart.js/dist/Chart.bundle.js', to: '../client/js/chart.js' },
    { from: 'node_modules/chart.js/dist/Chart.min.css', to: '../client/css/chart.css' },
    { from: 'node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.js', to: '../client/js/govuk' },
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
    { from: 'Dockerfile', to: '../' },

    // copy fonts and images
    {
      context: 'client/assets/fonts/',
      from: '*.*',
      to: '../client/assets/fonts',
    },
    {
      context: 'client/assets/images/',
      from: '**/*.{png,jpg,jpeg,gif,svg}',
      to: '../client/assets/images',
    },
    {
      context: 'node_modules/govuk-frontend/dist/govuk/assets/images/',
      from: '*.*',
      to: '../client/assets/images',
    },
    {
      context: 'node_modules/@ministryofjustice/frontend/moj/assets/images/',
      from: 'icon-arrow*.*',
      to: '../client/assets/images',
    },
  ],
});

module.exports = {
  plugins: [copyClientCode],
};
