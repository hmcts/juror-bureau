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
    }

    , responseObject = {
      resource: 'bureau/juror/court/catchment/',

      getCatchmentStatus: function(rp, app, jwtToken, id) {
        var reqOptions = _.clone(options);
        
        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'GET';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, id);

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

    }

  module.exports.object = responseObject;
})();
