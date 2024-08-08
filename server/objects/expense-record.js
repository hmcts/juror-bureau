;(function(){
  'use strict';

  const _ = require('lodash');
  const urljoin = require('url-join');
  const config = require('../config/environment')();
  const rp = require('request-promise');
  const { DAO } = require('./dataAccessObject');

  const endpoint = config.apiEndpoint + '/moj/expenses/{locCode}';

  module.exports.getDraftExpensesDAO = {
    get: function(app, req, jurorNumber, locCode, etag = null) {
      const payload = {
        uri: urljoin(endpoint.replace('{locCode}', locCode), jurorNumber, 'DRAFT/view'),
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

  module.exports.submitDraftExpenses = new DAO(endpoint, {
    post: function(locCode, jurorNumber, attendanceDates) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'submit-for-approval'),
        body: {
          dates: attendanceDates,
        },
      };
    },
  });

  module.exports.getEnteredExpensesDAO = {
    post: function(app, req, locCode, jurorNumber, body) {
      const payload = {
        uri: urljoin(endpoint.replace('{locCode}', locCode), jurorNumber, 'entered'),
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

  module.exports.postEditedExpensesDAO = new DAO(endpoint, {
    put: function(locCode, jurorNumber, expenseType, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, expenseType, 'edit'),
        body,
      };
    },
  });

  module.exports.getExpenseRecordsDAO = {
    get: function(app, req, locCode, expenseType, jurorNumber) {
      const payload = {
        uri: urljoin(endpoint.replace('{locCode}', locCode), jurorNumber, expenseType, 'view/simplified'),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      app.logger.info('Sending API request to: ', payload);

      return rp(payload);
    },
  };

  module.exports.postRecalculateSummaryTotalsDAO = {
    post: function(app, req, locCode, jurorNumber, body) {
      const payload = {
        uri: urljoin(endpoint.replace('{locCode}', locCode), jurorNumber, 'calculate/totals'),
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
    patch: function(app, req, locCode, jurorNumber, body) {
      const payload = {
        uri: urljoin(endpoint.replace('{locCode}', locCode), jurorNumber, 'smartcard'),
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
      return async function(req, res, next) {
        const { jurorNumber, locCode } = req.params;

        const payload = {
          uri: urljoin(endpoint.replace('{locCode}', locCode), jurorNumber, 'counts'),
          headers: {
            'User-Agent': 'Request-Promise',
            'Content-Type': 'application/vnd.api+json',
            Authorization: req.session.authToken,
          },
          json: true,
        };

        app.logger.info('Sending request to API: ', payload);

        try {
          const response = await rp(payload);
          req.expensesCount = response;
          return next();
        } catch (err) {
          app.logger.crit('Failed to fetch expense counts', {
            auth: req.session.authentication,
            data: {
              jurorNumber,
              locCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        }
      };
    },
  };

  module.exports.getApprovalExpenseListDAO = {
    post: function(app, req, locCode, jurorNumber, body) {
      const payload = {
        uri: urljoin(endpoint.replace('{locCode}', locCode), jurorNumber, 'view'),
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

  module.exports.editApprovalExpenseListDAO = {
    post: function(app, req, locCode, jurorNumber, type, body) {
      const payload = {
        uri: urljoin(endpoint.replace('{locCode}', locCode), jurorNumber, 'edit', type),
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
