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
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
      transform: utils.basicDataTransform,
    }

    , expenseRecordObject = {
      resource: 'moj/expenses',
      get: function(rp, app, jwtToken, jurorNumber, identifier) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);

        reqOptions.body = [
          {
            'juror_number': jurorNumber,
            identifier: identifier,
          },
        ];

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },
    }

    , submitDraftExpenses = {
      resource: 'moj/expenses/submit-for-approval',
      post: function(rp, app, jwtToken, jurorNumber, poolNumber, attendanceDates) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';

        reqOptions.body = {
          'juror_number': jurorNumber,
          'pool_number': poolNumber,
          'attendance_dates': attendanceDates,
        };

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },
    };


  module.exports.expenseRecordObject = expenseRecordObject;
  module.exports.submitDraftExpenses = submitDraftExpenses;
})();
