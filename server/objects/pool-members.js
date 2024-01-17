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

    , poolMemebersObject = {
      resource: 'moj/pool-create/members',
      get: function(rp, app, jwtToken, poolNumber) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri,
          this.resource,
          '?poolNumber=' + poolNumber
        );
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method
        });

        return rp(reqOptions);
      }
    }

  module.exports.poolMemebersObject = poolMemebersObject;

})();
