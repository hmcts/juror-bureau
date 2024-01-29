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

module.exports.getJurorsObject = {
  resource: 'moj/juror-management/jurors-to-dismiss',
  get: function(rp, app, jwtToken, params, locCode) {
    const reqOptions = _.clone(options);

    reqOptions.headers.Authorization = jwtToken;
    reqOptions.uri = urljoin(reqOptions.uri, this.resource);
    reqOptions.method = 'GET';

    const jurorsToInclude = params['jurors-to-include'] instanceof Array
      ? params['jurors-to-include']
      : [params['jurors-to-include']];

    reqOptions.body = {
      'pool_numbers': params['checked-pools'] instanceof Array
        ? params['checked-pools']
        : [params['checked-pools']],
      'location_code': locCode,
      'number_of_jurors_to_dismiss': params['jurorsToDismiss'],
      'include_jurors_on_call': jurorsToInclude.includes('on-call') ? true : false,
      'include_jurors_not_in_attendance': jurorsToInclude.includes('not-in-attendance') ? true : false,
    };

    app.logger.info('Sending request to API: ', {
      uri: reqOptions.uri,
      headers: reqOptions.headers,
      method: reqOptions.method,
    });

    return rp(reqOptions);
  },
};

module.exports.dismissJurorsObject = {
  resource: 'moj/complete-service/dismissal',
  patch: function(rp, app, jwtToken, payload) {
    const reqOptions = _.clone(options);

    reqOptions.headers.Authorization = jwtToken;
    reqOptions.uri = urljoin(reqOptions.uri, this.resource);
    reqOptions.method = 'PATCH';

    reqOptions.body = payload;

    app.logger.info('Sending request to API: ', {
      uri: reqOptions.uri,
      headers: reqOptions.headers,
      method: reqOptions.method,
    });

    return rp(reqOptions);
  },
};
