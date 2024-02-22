;(function(){
  'use strict';

  const urljoin = require('url-join');
  const config = require('../config/environment')();
  const rp = require('request-promise');

  module.exports.getDraftExpensesDAO = {
    get: function(app, req, jurorNumber, poolNumber) {
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

      app.logger.info('Sending request to API: ', payload);

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

})();
