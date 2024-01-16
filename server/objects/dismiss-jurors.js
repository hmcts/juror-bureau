/* eslint-disable strict */
'use strict';

const _ = require('lodash');
const config = require('../config/environment')();
const utils = require('../lib/utils');
const urljoin = require('url-join');
const options = {
  uri: config.apiEndpoint,
  headers: {
    'User-Agent': 'Request-Promise',
    'Content-Type': 'application/vnd.api+json',
  },
  json: true,
  transform: utils.basicDataTransform,
};

module.exports.getPoolsObject = {
  resource: 'moj/juror-management/dismiss-jurors/pools',
  get: function(rp, app, jwtToken) {
    const reqOptions = _.clone(options);

    reqOptions.headers.Authorization = jwtToken;
    reqOptions.uri = urljoin(reqOptions.uri, this.resource);
    reqOptions.method = 'GET';

    app.logger.info('Sending request to API: ', {
      uri: reqOptions.uri,
      headers: reqOptions.headers,
      method: reqOptions.method,
    });

    // I will leave this here for testing but will remove when backend is ready
    if (jwtToken === 'test-token') return reqOptions;

    // this is temp
    const { pools } = require('../stores/dismiss-jurors');

    return Promise.resolve(pools);
    // return rp(reqOptions);
  },
};

module.exports.getJurorsObject = {
  resource: 'moj/juror-management/dismiss-jurors/jurors',
  get: function(rp, app, jwtToken, params) {
    const reqOptions = _.clone(options);

    reqOptions.headers.Authorization = jwtToken;
    reqOptions.uri = urljoin(reqOptions.uri, this.resource);
    reqOptions.method = 'GET';

    app.logger.info('Sending request to API: ', {
      uri: reqOptions.uri,
      headers: reqOptions.headers,
      method: reqOptions.method,
    });

    // this is temp for testing only... will remove when backend is ready
    if (jwtToken === 'test-token') return reqOptions;

    // some temp code for filtering and find the correct jurors we need
    const { jurors } = require('../stores/dismiss-jurors');
    let _jurors = jurors.filter(juror => juror['attending'] === 'In attendance');

    if (params['jurors-to-include'] &&
      (params['jurors-to-include'] === 'on-call'
        || params['jurors-to-include'].includes('on-call'))) {
      _jurors.push(...jurors.filter(juror => juror['attending'] === 'On call'));
    }

    if (params['jurors-to-include'] &&
      (params['jurors-to-incldue'] === 'not-in-attendance'
        || params['jurors-to-include'].includes('not-in-attendance'))) {
      _jurors.push(...jurors.filter(juror => juror['attending'] === 'Other'));
    }

    _jurors = randomizer(_jurors, _jurors.length);

    return Promise.resolve(_jurors.slice(0, params.jurorsToDismiss));
    // return rp(reqOptions);
  },
};

// This is temp for randomizing my list of jurors. the backend will do this when ready
function randomizer(arr, length) {
  const crypto = require('crypto');
  const randomized = [];

  for (let i = 0; i < length; i++) {
    const random = crypto.randomInt(arr.length);

    randomized.push(arr[random]);
    arr.splice(random, 1);
  }

  return randomized;
}
