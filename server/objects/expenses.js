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
    }

    , fetchUnpaidExpenses = {
      resource: 'moj/expenses/unpaid-summary/',
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
        reqOptions.uri = urljoin(reqOptions.uri, this.resource + locCode + '?' + parameters.join('&'));

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: opts,
        });

        return rp(reqOptions);
      },
    };

  module.exports.fetchUnpaidExpenses = fetchUnpaidExpenses;

  module.exports.expensesDAO = {
    get: function(app, req, jurors) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/expenses'),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body: jurors,
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
    get: function(app, req, jurorNumber) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/expenses/default-summary', jurorNumber),
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
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/expenses/set-default-expenses'),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body: utils.camelToSnake(body),
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
      const uri = dates
        ? urljoin(config.apiEndpoint, 'moj/expenses/approval', locCode, paymentMethod, `?from=${dates.from}&to=${dates.to}`)
        : urljoin(config.apiEndpoint, 'moj/expenses/approval', locCode, paymentMethod);
      const payload = {
        uri,
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
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/expenses/approve'),
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
