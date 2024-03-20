;(function() {
  'use strict';

  const rp = require('request-promise');

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


  module.exports.systemCodesDAO = {
    get: function(app, req, codeType) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/codes', codeType),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.expenseRatesAndLimitsDAO = {
    get: function(app, req, etag = null) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/expenses/rates'),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      if (etag) {
        payload.headers['If-None-Match'] = `${etag}`;
      }

      app.logger.info('Sending request to API: ', payload);

      payload.transform = (response, incomingRequest) => {
        const headers = _.cloneDeep(incomingRequest.headers);

        return { response, headers };
      };

      return rp(payload);
    },
    put: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/expenses/rates'),
        method: 'PUT',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.bankHolidaysDAO = {
    get: function(app, req, etag = null) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/bank-holidays'),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      if (etag) {
        payload.headers['If-None-Match'] = `${etag}`;
      }

      app.logger.info('Sending request to API: ', payload);

      payload.transform = (response, incomingRequest) => {
        const headers = _.cloneDeep(incomingRequest.headers);

        return { response, headers };
      };

      return rp(payload);
    },
  };

  module.exports.nonSittingDayDAO = {
    get: function(app, req, locCode) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/non-sitting-days', locCode),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

})();
