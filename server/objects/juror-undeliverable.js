;(function() {
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json'
      },
      json: true,
      transform: utils.basicDataTransform,
    }

    , jurorUndeliverableObject = {
      resource: 'moj/undeliverable-response',
      put: function(rp, app, jwtToken, jurorNumber) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber);
        reqOptions.method = 'PUT';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: reqOptions.jurorNumber,
        });

        return rp(reqOptions);
      },
    }

  module.exports.jurorUndeliverableObject = jurorUndeliverableObject;
})();
