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

    , endTrial = {
      resource: 'moj/trial/end-trial',
      patch: function(rp, app, jwtToken, payload) {
        const reqOptions = _.clone(options);
        const tmpBody = _.clone(payload);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);

        reqOptions.method = 'PATCH';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: tmpBody,
        });

        return rp(reqOptions);

      },
    };

  module.exports.endTrialObject = endTrial;
})();

