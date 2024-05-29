;(function() {
  'use strict';

  const rp = require('request-promise');
  const _ = require('lodash');
  const urljoin = require('url-join');
  const config = require('../config/environment')();
  const utils = require('../lib/utils');
  const modUtils = require('../lib/mod-utils');
  const options = {
    uri: config.apiEndpoint,
    headers: {
      'User-Agent': 'Request-Promise',
      'Content-Type': 'application/vnd.api+json',
    },
    json: true,
    transform: utils.basicDataTransform,
  };

  module.exports.fetchUnpaidExpenses = {
    resource: 'moj/expenses/{locCode}/unpaid-summary/',
    get: function(app, jwtToken, locCode, opts) {
      var reqOptions = _.clone(options);

      var parameters = [];

      parameters.push('page_number=' + opts.pageNumber);
      parameters.push('sort_by=' + opts.sortBy);
      parameters.push('sort_order=' + opts.sortOrder);

      if (opts.minDate) {
        parameters.push('min_date=' + opts.minDate);
      }
      if (opts.maxDate) {
        parameters.push('max_date=' + opts.maxDate);
      }
      reqOptions.headers.Authorization = jwtToken;
      reqOptions.method = 'GET';
      reqOptions.uri = urljoin(
        reqOptions.uri,
        this.resource.replace('{locCode}', locCode) + '?' + parameters.join('&')
      );

      app.logger.debug('Sending request to API: ', {
        uri: reqOptions.uri,
        headers: reqOptions.headers,
        method: reqOptions.method,
        data: opts,
      });

      return rp(reqOptions);
    },
    post: function(app, req, locCode, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, `moj/expenses/${locCode}/unpaid-summary`),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body: modUtils.mapCamelToSnake(body),
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.jurorDetailsDAO = {
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/juror-record/details'),
        method: 'POST',
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

  module.exports.defaultExpensesDAO = {
    get: function(app, req, locCode, jurorNumber) {
      const payload = {
        uri: urljoin(config.apiEndpoint, `moj/expenses/${locCode}/${jurorNumber}/default-expenses`),
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
    post: function(app, req, locCode, jurorNumber, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, `moj/expenses/${locCode}/${jurorNumber}/default-expenses`),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body: modUtils.mapCamelToSnake(body),
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.jurorBankDetailsDAO = {
    get: function(app, req, jurorNumber, etag = null) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/juror-record', jurorNumber, 'bank-details'),
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
    patch: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/juror-record/update-bank-details'),
        method: 'PATCH',
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

  module.exports.approveExpensesDAO = {
    get: function(app, req, locCode, paymentMethod, dates, etag = null) {
      const payload = {
        uri: urljoin(config.apiEndpoint, `moj/expenses/${locCode}/${paymentMethod}/pending-approval`)
          + (dates ? `?from=${dates.from}&to=${dates.to}` : ''),
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
    post: function(app, req, locCode, paymentMethod, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, `moj/expenses/${locCode}/${paymentMethod}/approve`),
        method: 'POST',
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

})();
