; (function() {
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

    , jurorTransfer = {
      resource: 'moj/manage-pool/transfer',
      put: function(rp, app, jwtToken, jurorNumbers, receivingCourtLocCode, newServiceStartDate, sourcePoolNumber) {

        var reqOptions = _.clone(options)
          , tmpBody
          , jurorsArr
          , sourceLocCode;

        if (!Array.isArray(jurorNumbers)) {
          jurorsArr = [jurorNumbers];
        } else {
          jurorsArr = jurorNumbers;
        }

        sourceLocCode = sourcePoolNumber.slice(0, 3);

        tmpBody = {
          jurorNumbers: jurorsArr,
          receivingCourtLocCode: receivingCourtLocCode,
          targetServiceStartDate: newServiceStartDate,
          sendingCourtLocCode: sourceLocCode,
          sourcePoolNumber: sourcePoolNumber,
        }

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'PUT';
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

  module.exports.jurorTransfer = jurorTransfer;
})();
