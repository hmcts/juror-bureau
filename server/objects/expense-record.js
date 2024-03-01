;(function(){
  'use strict';

  const _ = require('lodash');
  const urljoin = require('url-join');
  const config = require('../config/environment')();
  const rp = require('request-promise');

  module.exports.getDraftExpensesDAO = {
    get: function(app, req, jurorNumber, poolNumber, etag = null) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/expenses/draft', jurorNumber, poolNumber),
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

  module.exports.submitDraftExpenses = {
    post: function(app, req, jurorNumber, poolNumber, attendanceDates) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/expenses/submit-for-approval'),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body: {
          'juror_number': jurorNumber,
          'pool_number': poolNumber,
          'attendance_dates': attendanceDates,
        },
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.getDraftExpenseDAO = {
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/expenses/entered'),
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

  module.exports.postDraftExpenseDAO = {
    post: function(app, req, jurorNumber, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, `moj/expenses/${jurorNumber}/draft/attended_day`),
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

  module.exports.getExpenseRecordsDAO = {
    post: function(app, req, body, expenseType) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/expenses/view', expenseType),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body,
      };

      app.logger.info('Sending API request to: ', payload);

      return rp(payload);
    },
  };

  module.exports.postRecalculateSummaryTotalsDAO = {
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/expenses/calculate/totals'),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body,
      };

      app.logger.info('Sending API request to: ', payload);

      return rp(payload);
    },
  };

  module.exports.addSmartcardSpend = {
    patch: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/expenses/smartcard'),
        method: 'PATCH',        headers: {
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

  module.exports.getExpenseCountDAO = {
    get: function(app) {
      return function(req, res, next) {
        const { jurorNumber, poolNumber } = req.params;

        const payload = {
          uri: urljoin(config.apiEndpoint, 'moj/expenses/counts', jurorNumber, poolNumber),
          headers: {
            'User-Agent': 'Request-Promise',
            'Content-Type': 'application/vnd.api+json',
            Authorization: req.session.authToken,
          },
          json: true,
        };

        app.logger.info('Sending request to API: ', payload);

        rp(payload)
          .then((response) => {
            req.expensesCount = response;
            next();
          });
      };
    },
  };

})();
