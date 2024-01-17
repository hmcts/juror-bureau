(function() {
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

  module.exports.jurorsAttending = {
    resource: 'moj/juror-management/appearance',
    get: function(rp, app, jwtToken, locationCode, attendanceDate) {
      const reqOptions = _.clone(options);

      reqOptions.headers.Authorization = jwtToken;
      reqOptions.uri = urljoin(reqOptions.uri,
        this.resource,
        `?locationCode=${locationCode}`,
        `&attendanceDate=${attendanceDate}`);
      reqOptions.method = 'GET';

      app.logger.info('Sending request to API: ', {
        uri: reqOptions.uri,
        headers: reqOptions.headers,
        method: reqOptions.method,
      });

      return rp(reqOptions);
    },
    put: function(rp, app, jwtToken, data) {
      const reqOptions = _.clone(options);

      reqOptions.headers.Authorization = jwtToken;
      reqOptions.uri = urljoin(reqOptions.uri, this.resource);
      reqOptions.method = 'PUT';
      reqOptions.body = data;

      app.logger.info('Sending request to API: ', {
        uri: reqOptions.uri,
        headers: reqOptions.headers,
        method: reqOptions.method,
        data,
      });

      return rp(reqOptions);
    },
  };

})();
