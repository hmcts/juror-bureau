(function() {
  'use strict';

  let _ = require('lodash')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , urljoin = require('url-join')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
      transform: utils.basicDataTransform,
    },

    deferralObject = {
      resource: 'moj/deferral-response/juror',
      postresource: 'moj/deferral-maintenance/juror/defer',
      put: function(rp, app, jwtToken, body, jurorNumber) {
        var reqOptions = _.clone(options)
          , tmpBody = _.clone(body);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber);
        reqOptions.method = 'PUT';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: tmpBody,
        });

        return rp(reqOptions);
      },

      post: function(rp, app, jwtToken, jurorNumber, poolNumber, deferralDate, deferralReason, replyMethod) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(reqOptions.uri, this.postresource, jurorNumber);

        if (poolNumber) {
          reqOptions.body = {
            deferralDate: deferralDate,
            excusalReasonCode: deferralReason,
            poolNumber: poolNumber,
            replyMethod: replyMethod.toUpperCase(),
          };
        } else {
          reqOptions.body = {
            'deferralDate': deferralDate,
            'excusalReasonCode': deferralReason,
            'replyMethod': replyMethod.toUpperCase(),
          };
        }

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },
    },

    changeDeferralObject = {
      resource: 'moj/deferral-maintenance/deferrals/change-deferral-date',
      post: function(rp, app, jwtToken, jurorNumber, deferralDate, poolNumber, excusalReasonCode) {
        let reqOptions = _.clone(options)
          , tmpBody = {};

        tmpBody.deferralDate = deferralDate;
        tmpBody.poolNumber = poolNumber;
        tmpBody.excusalReasonCode = excusalReasonCode;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: tmpBody,
        });

        return rp(reqOptions);
      },
    },

    deferralPoolsObject = {
      resource: 'moj/deferral-maintenance/available-pools',
      post: function(rp, app, jwtToken, deferralDates, jurorNumber) {
        let reqOptions = _.clone(options)
          , tmpBody = {};

        tmpBody.deferralDates = deferralDates;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },
    },

    deleteDeferralObject = {
      resource: 'moj/deferral-maintenance/delete-deferral',
      delete: function(rp, app, jwtToken, jurorNumber) {
        let reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber);
        reqOptions.method = 'DELETE';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    };

  module.exports.deferralObject = deferralObject;
  module.exports.changeDeferralObject = changeDeferralObject;
  module.exports.deferralPoolsObject = deferralPoolsObject;
  module.exports.deleteDeferralObject = deleteDeferralObject;
})();
