(function() {
  'use strict';

  var _ = require('lodash')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , urljoin = require('url-join')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json'
      },
      json: true,
      transform: utils.basicDataTransform,
    },

    editNoRequested = {
      resource: 'moj/manage-pool/edit-pool',
      put: function(rp, app, jwtToken, body, owner) {
        var reqOptions = _.clone(options)
          , tmpBody = _.clone(body);

        (owner === '400')
          ? tmpBody['noRequested'] = tmpBody.noOfJurors
          : tmpBody['totalRequired'] = tmpBody.noOfJurors

        delete tmpBody._csrf;
        delete tmpBody.noRequired;
        delete tmpBody.noOfJurors;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'PUT';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: tmpBody,
        });

        return rp(reqOptions);
      }
    };

  module.exports.editNoRequested = editNoRequested;

})();
