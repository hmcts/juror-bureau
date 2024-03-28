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
    };

  module.exports.courtLocationsFromPostcodeObj = courtLocationsFromPostcode;

  // refactor above

  const rp = require('request-promise');

  module.exports.getCourtLocationRates = function(app, req) {
    const resource = 'moj/court-location/{loc_code}/rates'.replace('{loc_code}', req.session.authentication.owner);
    const payload = {
      uri: urljoin(config.apiEndpoint, resource),
      method: 'GET',
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
        Authorization: req.session.authToken,
      },
      json: true,
    };

    app.logger.info('Sending request to API: ', payload);

    return rp(payload);
  };

})();
