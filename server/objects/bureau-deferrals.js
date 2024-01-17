(function() {
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

    , bureauDeferralsObject = {
      resource: 'moj/pool-create/bureau-deferrals',
      get: function(rp, app, jwtToken, locationCode, deferredDate) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri,
          this.resource,
          '?locationCode=' + locationCode,
          '&deferredTo=' + deferredDate
        );
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            locationCode: locationCode,
          }
        });

        return rp(reqOptions);
      }
    }

  module.exports.bureauDeferralsObject = bureauDeferralsObject;

})();
