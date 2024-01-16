(function() {
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

    , jurorList = {
      resource: 'moj/juror-record/pending-jurors',
      get: function(rp, app, jwtToken, locCode, status) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource,
          locCode,
        );
        if (typeof status !== 'undefined') {
          reqOptions.uri = urljoin(reqOptions.uri, '?status=' + status);
        }
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            locationCode: locCode,
            status: status,
          },
        });

        return rp(reqOptions);
      },
    }

    , processPendingJuror = {
      resource: 'moj/juror-record/process-pending-juror',
      post: function(rp, app, jwtToken, jurorNumber, decision, comments) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource,
        );
        reqOptions.body = {
          jurorNumber: jurorNumber,
          decision: decision,
          comments,
        };
        reqOptions.method = 'POST';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: reqOptions.body,
        });

        return rp(reqOptions);
      },
    };

  module.exports.jurorList = jurorList;
  module.exports.processPendingJuror = processPendingJuror;

})();
