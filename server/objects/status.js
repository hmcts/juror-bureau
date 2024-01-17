;(function(){
  'use strict';

  var _ = require('lodash')
    , utils = require('../lib/utils')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json'
      },
      json: true,
      transform: utils.basicDataTransform,
    }

    , responseObject = {
      resource: function(hasModAccess) {
        if (hasModAccess) return 'moj/juror-response/update-status';
        return 'bureau/status';
      },
      post: function(rp, app, jwtToken, jurorNumber, newStatus, version, hasModAccess) {
        var reqOptions = _.clone(options)
          , body = {
            status: newStatus,
            version: parseInt(version, 10),
          };

        if (hasModAccess) {
          body.jurorNumber = jurorNumber;
        }

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource(hasModAccess), jurorNumber);
        reqOptions.body = body;

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      }
    };

  module.exports.object = responseObject;

})();
