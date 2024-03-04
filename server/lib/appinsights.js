const appInsights = require('applicationinsights');
const secretsConfig = require('config');

module.exports.AppInsights = class AppInsights {

  constructor() {
    const appInsightsString = secretsConfig.get('secrets.juror.app-insights-connection-string')

    if (appInsightsString) {
      console.log('Starting Appinsights');

      appInsights.setup(secretsConfig.get('secrets.juror.app-insights-connection-string'))
        .setAutoCollectConsole(true, true)
        .setSendLiveMetrics(true)
        .start();

      appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] ='juror-bureau';
    }
  }

};
