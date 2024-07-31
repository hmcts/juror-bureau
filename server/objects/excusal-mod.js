(function() {
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , modUtils = require('../lib/mod-utils')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
      transform: utils.basicDataTransform,
    }

    , excusalObject = {
      resource: 'moj/excusal-response/juror/{}',
      put: function(rp, app, jwtToken, body, jurorNumber, replyMethod) {

        var reqOptions = _.clone(options)
          , tmpBody = {};

        tmpBody.excusalDecision = body.excusalDecision;
        tmpBody.excusalReasonCode = body.excusalCode;

        if (replyMethod) {
          tmpBody.replyMethod = modUtils.toReplyMethod(replyMethod);
        }

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource.replace('{}', jurorNumber));
        reqOptions.method = 'PUT';
        reqOptions.body = tmpBody;

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: reqOptions.body,
        });

        return rp(reqOptions);
      },
    };

  module.exports.excusalObject = excusalObject;
})();
