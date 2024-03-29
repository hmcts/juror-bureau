const launchDarklySdk = require('launchdarkly-node-server-sdk');
const secretsConfig = require('config');

module.exports.LaunchDarkly = class LaunchDarkly {

  constructor (app) {
    app.logger.info('Opening a LaunchDarkly connection...');

    LaunchDarkly.instance = launchDarklySdk
      .init(secretsConfig.get('secrets.juror.launchDarklyKey'));

    LaunchDarkly.instance.once('ready', () => {
      app.logger.info('Launchdarkly is on and ready to read flag statuses.');
    });
  }

};
