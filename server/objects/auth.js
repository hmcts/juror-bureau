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
        'Content-Type': 'application/vnd.api+json'
      },
      json: true,
      transform: utils.basicDataTransform,
      resolveWithFullResponse: true,
    };

  module.exports.object = {
    resource: 'auth/bureau',
    post: function(rp, app, jwtToken, body) {
      // Deep clone object to make changes in only this scope.
      var reqOptions = _.clone(options)
        , logDetails = _.clone(body)

      // Custom request options for this request

      reqOptions.headers.Authorization = jwtToken;
      reqOptions.method = 'POST';
      reqOptions.uri = urljoin(reqOptions.uri, this.resource);
      reqOptions.body = body;

      //JDB-4851 Remove password from logged credentials
      if (logDetails['password']){
        delete logDetails.password;
      }

      app.logger.info('Sending request to API: ', {
        uri: reqOptions.uri,
        headers: reqOptions.headers,
        method: reqOptions.method,
        body: logDetails,
      });

      // Will return a promise
      return rp(reqOptions);
    }
  };

})();
