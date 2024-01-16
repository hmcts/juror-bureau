;(function(){
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json'
      },
      json: true,
      resolveWithFullResponse: true,
    }

    , responseObject = {
      resource: 'bureau/juror',
      post: function(rp, app, jwtToken, jurorNumber, newStatus, version) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber, 'response/status');
        reqOptions.body = {
          status: newStatus,
          version: parseInt(version, 10),
        };

        app.logger.debug('Sending request to API: ', {
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
