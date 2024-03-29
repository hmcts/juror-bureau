const appInsights = require('applicationinsights');
const secretsConfig = require('config');

module.exports.AppInsights = class AppInsights {

  constructor (app) {
    const appInsightsString = secretsConfig.get('secrets.juror.app-insights-connection-string');

    if (appInsightsString) {
      app.logger.info('Starting Appinsights');

      appInsights.setup(appInsightsString)
        .setAutoCollectConsole(true, true)
        .setSendLiveMetrics(true)
        .start();

      appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = 'juror-bureau';
    }
  }

};
