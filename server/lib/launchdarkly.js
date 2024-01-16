/* eslint-disable strict */
'use strict';

const launchDarklySdk = require('launchdarkly-node-server-sdk');
const secretsConfig = require('config');

module.exports.LaunchDarkly = class LaunchDarkly {

  constructor() {
    console.log('Opening a LaunchDarkly connection...');

    LaunchDarkly.instance = launchDarklySdk
      .init(secretsConfig.get('secrets.juror-digital-vault.launchDarklyKey'));

    LaunchDarkly.instance.once('ready', () => {
      console.log('Launchdarkly is on and ready to read flag statuses.');
    });
  }

};
