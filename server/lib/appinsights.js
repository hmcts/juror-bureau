const appInsights = require('applicationinsights');
const secretsConfig = require('config');

module.exports.AppInsights = class AppInsights {

  constructor() {
    if (secretsConfig.get('secrets.juror.app-insights-connection-string')) {
      console.log('Starting Appinsights');

      appInsights.setup(secretsConfig.get('secrets.juror.app-insights-connection-string'))
        .setAutoCollectConsole(true, true)
        .start();
    }
  }

};
