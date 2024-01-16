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
    };

  module.exports.requestInfoObject = {
    resource: 'moj/letter/request-information',
    post: function(rp, app, jwtToken, jurorNumber, data, replyMethod) {
      var reqOptions = _.clone(options)
        , tmpBody = {
          informationRequired: data,
          jurorNumber: jurorNumber,
          replyMethod: replyMethod,
        };

      reqOptions.headers.Authorization = jwtToken;
      reqOptions.uri = urljoin(reqOptions.uri, this.resource);
      reqOptions.method = 'POST';
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

  module.exports.updateStatus = {
    resource: 'moj/juror-paper-response/update-status',
    put: function(rp, app, jwtToken, jurorNumber, key) {
      var reqOptions = _.clone(options);

      reqOptions.headers.Authorization = jwtToken;
      reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber, key);
      reqOptions.method = 'PUT';

      app.logger.info('Sending request to API: ', {
        uri: reqOptions.uri,
        headers: reqOptions.headers,
        method: reqOptions.method,
      });

      return rp(reqOptions);
    },
  };

  module.exports.summonsUpdate = {
    resource: {
      BASE: 'moj/juror-paper-response/juror/{}/details',
      PERSONAL: 'moj/juror-response/juror/{}/details/personal',
      ELIGIBILITY: 'eligibility',
      REPLYTYPE: 'reply-type',
      CJS: 'cjs',
      ADJUSTMENTS: 'special-needs',
      SIGNATURE: 'signature',
    },
    patch: function(rp, app, jwtToken, id, part, payload) {
      const reqOptions = _.cloneDeep(options); // clone deep for the etag trickery
      const tmpBody = _.clone(payload);

      reqOptions.headers.Authorization = jwtToken;

      if (part === 'PERSONAL') {
        reqOptions.uri = urljoin(reqOptions.uri, this.resource['PERSONAL'].replace('{}', id));
      } else {
        reqOptions.uri = urljoin(reqOptions.uri, this.resource['BASE'].replace('{}', id), this.resource[part]);
      }

      reqOptions.method = 'PATCH';
      reqOptions.body = tmpBody;

      app.logger.info('Sending request to API: ', {
        uri: reqOptions.uri,
        headers: reqOptions.headers,
        method: reqOptions.method,
        body: reqOptions.body,
      });

      return rp(reqOptions);
    },
  };

})();
