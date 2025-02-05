(function() {
  'use strict';

  const { jurorRecordDetailsDAO } = require('../../../../objects');
  const { getDraftExpenses, postDraftExpenses } = require('./draft.controller');
  const { getForApprovalExpenses, postForApprovalExpenses } = require('./for-approval.controller');

  module.exports.getExpensesList = function(app) {
    return async function(req, res) {
      const { jurorNumber, locCode, status } = req.params;

      try {
        const jurorDetails = await jurorRecordDetailsDAO.post(req, [{
          'jurorNumber': jurorNumber,
          'jurorVersion': null,
          'include': ['NAME_DETAILS', 'ACTIVE_POOL'],
        }]);

        req.jurorDetails = jurorDetails['0'];

        // we need to store the location code because we need it to be able to visit the juror record page
        req.session.locCode = locCode;

      } catch (err) {
        app.logger.crit('Failed to fetch juror details', {
          auth: req.session.authentication,
          data: {
            jurorNumber,
            claims: ['NAME_DETAILS', 'ACTIVE_POOL'],
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }

      // always clear the list of edited expenses
      delete req.session.editedExpenses;
      delete req.session.editExpenseTravelOverLimit;

      switch (status) {
      case 'draft':
        getDraftExpenses(app)(req, res);
        break;
      case 'for-approval':
      case 'for-reapproval':
      case 'approved':
        getForApprovalExpenses(app)(req, res);
        break;
      default:
        app.logger.crit('Invalid expense status entered', {
          auth: req.session.authentication,
          data: {
            jurorNumber,
            locCode,
            status,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.postExpensesList = function(app) {
    return async function(req, res) {
      const { jurorNumber, locCode, status } = req.params;

      switch (status) {
      case 'draft':
        postDraftExpenses(app)(req, res);
        break;
      case 'for-approval':
      case 'for-reapproval':
      case 'approved':
        postForApprovalExpenses(app)(req, res);
        break;
      default:
        app.logger.crit('Invalid expense status entered', {
          auth: req.session.authentication,
          data: {
            jurorNumber,
            locCode,
            status,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

})();
