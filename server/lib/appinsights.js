const appInsights = require('applicationinsights');
const secretsConfig = require('config');

module.exports.AppInsights = class AppInsights {

  constructor() {
    const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';

    if (isProd) {
      appInsights.setup(secretsConfig.get('secrets.juror.app-insights-connection-string'))
        .setAutoCollectConsole(true, true)
        .start();
    }
  }

};
