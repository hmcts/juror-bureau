;(function(){
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , options = {
      uri: config.smartSurveyAPIEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json'
      },
      json: true,
      transform: utils.basicDataTransform,
    }

    , responseObject = {

      get: function(rp, app, surveyId, exportId, apiToken, apiTokenSecret, paramString) {
        var reqOptions = _.clone(options)

        reqOptions.method = 'get';
        reqOptions.uri = urljoin(reqOptions.uri, surveyId, 'exports', exportId, 'download', paramString);

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      }
    }

  module.exports.object = responseObject;
})();
