;(function(){
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
      transform: utils.basicDataTransform,
    }

    , manualPoliceCheck = {
      resource: 'moj/pnc/manual',
      patch: function(rp, app, jwtToken, jurorNumber) {
        let reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, '?juror_number=' + jurorNumber);

        reqOptions.method = 'PATCH';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        // Allows request to always succeed
        // return Promise.resolve(reqOptions);
        return rp(reqOptions);

      },
    };

  module.exports.manualPoliceCheck = manualPoliceCheck;
})();

