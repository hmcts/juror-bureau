;(function(){
  'use strict';

  const _ = require('lodash');
  const urljoin = require('url-join');
  const config = require('../config/environment')();
  const rp = require('request-promise');

  const endpoint = config.apiEndpoint + '/moj/expenses';

  module.exports.getDraftExpensesDAO = {
    get: function(app, req, jurorNumber, poolNumber, etag = null) {
      const payload = {
        uri: urljoin(endpoint, 'draft', jurorNumber, poolNumber),
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
        uri: urljoin(endpoint, 'submit-for-approval'),
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

  module.exports.getEnteredExpensesDAO = {
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(endpoint, 'entered'),
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
    post: function(app, req, jurorNumber, body, nonAttendance) {
      const resource = nonAttendance
        ? `${jurorNumber}/draft/non_attended_day`
        : `${jurorNumber}/draft/attended_day`;
      const payload = {
        uri: urljoin(endpoint, resource),
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
        uri: urljoin(endpoint, 'view', expenseType, 'simplified'),
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
        uri: urljoin(endpoint, 'calculate/totals'),
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
        uri: urljoin(endpoint, 'smartcard'),
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
          uri: urljoin(endpoint, 'counts', jurorNumber, poolNumber),
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

  module.exports.getApprovalExpenseListDAO = {
    post: function(app, req, jurorNumber, poolNumber, body) {
      const payload = {
        uri: urljoin(endpoint, jurorNumber, poolNumber),
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
    post: function(app, req, jurorNumber, type, body) {
      const payload = {
        uri: urljoin(endpoint, jurorNumber, 'edit', type),
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
