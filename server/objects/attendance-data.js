(function() {
  'use strict';

  let _ = require('lodash')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , urljoin = require('url-join')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
      transform: utils.basicDataTransform,
    },

    attendanceData = {
      resource: 'moj/juror_management/attendance',
      get: function(rp, app, jwtToken, tag, attendanceDate, locationCode, jurorNumbers) {
        let reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'GET';

        reqOptions.body = {
          commonData: {
            tag: tag,
            attendanceDate: attendanceDate,
            locationCode: locationCode,
          },
          juror: jurorNumbers,
        };

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },
    };

  module.exports.attendanceData = attendanceData;
})();
