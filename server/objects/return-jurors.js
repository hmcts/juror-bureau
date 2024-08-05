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

    returnsObject = {
      resource: 'moj/trial/return-',

      post: function(rp, app, jwtToken, type, trialNumber, locCode, payload) {
        var reqOptions = _.clone(options);
        const params = new URLSearchParams({ trial_number: trialNumber, location_code: locCode });

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource + type,
          `?${params.toString()}`,
        );

        reqOptions.body = payload;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },
    };

  module.exports.returnsObject = returnsObject;
})();
