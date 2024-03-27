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

    courtLocationsFromPostcode = {
      resource: 'moj/court-location/catchment-areas',
      get: function(rp, app, jwtToken, postcode) {
        let reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource + '?postcode=' + postcode);
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    },

    courtRatesFromLocation = {
      get: function(rp, app, req, locCode, etag = null) {
        const payload = {
          uri: urljoin(config.apiEndpoint, 'moj/court-location', locCode, 'rates'),
          method: 'GET',
          headers: {
            'User-Agent': 'Request-Promise',
            'Content-Type': 'application/vnd.api+json',
            Authorization: req.session.authToken,
          },
          json: true,
        };

        if (etag) {
          payload.headers['If-None-Match'] = `${etag}`;
        }

        app.logger.info('Sending request to API: ', payload);

        payload.transform = (response, incomingRequest) => {
          const headers = _.cloneDeep(incomingRequest.headers);

          return { response, headers };
        };

        return rp(payload);
      },
    };

  module.exports.courtLocationsFromPostcodeObj = courtLocationsFromPostcode;
  module.exports.courtRatesFromLocation = courtRatesFromLocation;
})();
