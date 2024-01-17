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
      resource: 'bureau/responses/reassign',
      post: function(rp, app, jwtToken, staffToDeactivate, assignPending, assignTodo, assignUrgents) {

        var reqOptions = _.clone(options)

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = {
          staffToDeactivate: staffToDeactivate,
          pendingLogin: assignPending,
          todoLogin: assignTodo,
          urgentsLogin: assignUrgents,
          // version: parseInt(version, 10)
        };

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
