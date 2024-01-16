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

    , jurorDeceasedObject = {
      resource: 'moj/deceased-response/excuse-deceased-juror',
      post: function(rp, app, jwtToken, body, jurorNumber) {
        var reqOptions = _.clone(options)
          , tmpBody = {
            deceasedComment: body.jurorDeceased,
            jurorNumber: jurorNumber,
            thirdPartyDeceased: body.thirdPartyDeceased,
            paperResponseExists: false
          };

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: reqOptions.body,
        });

        return rp(reqOptions);
      },
    }

  module.exports.jurorDeceasedObject = jurorDeceasedObject;
})();
