(function() {
  'use strict';

  const { jurorDetailsObject } = require('../../../../objects/juror-record');
  const modUtils = require('../../../../lib/mod-utils');
  const { getDraftExpensesDAO } = require('../../../../objects/expense-record');
  const { getDraftExpenses, postDraftExpenses } = require('./draft.controller');
  const { getForApprovalExpenses, postForApprovalExpenses } = require('./for-approval.controller');

  module.exports.getExpensesList = function(app) {
    return async function(req, res) {
      const { jurorNumber, locCode, status } = req.params;

      try {
        const jurorDetails = await fetchJurorDetails(
          app,
          req,
          res,
          jurorNumber,
          null,
          ['NAME_DETAILS']
        );

        req.jurorDetails = jurorDetails;

        // we need to store the location code because we need it to be able to visit the juror record page
        req.session.locCode = locCode;

      } catch (err) {
        app.logger.crit('Failed to fetch juror details', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            claims: ['NAME_DETAILS'],
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.redirect('_errors/generic');
      }

      // always clear the list of edited expenses
      delete req.session.editedExpenses;

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
          jwt: req.session.authToken,
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
          jwt: req.session.authToken,
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

  function fetchJurorDetails(app, req, res, jurorNumber, jurorVersion, details){
    return new Promise(function(resolve, reject) {
      jurorDetailsObject.post(
        require('request-promise'),
        app,
        req.session.authToken,
        jurorNumber,
        jurorVersion,
        details
      )
        .then((jurorDetailsResponse) => {
          app.logger.info('Fetched juror details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorDetailsResponse,
            },
          });
          resolve(jurorDetailsResponse[0]);
        })
        .catch((err) => {
          app.logger.crit('Failed to fetch juror details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.jurorNumber,
              auditNumber: req.params.auditNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          reject(res.render('_errors/generic'));
        });
    });
  }

  function paginateExpensesList(expenses, currentPage) {
    return new Promise((resolve) => {
      let start = 0;
      let end = expenses.length;

      if (currentPage > 1) {
        start = (currentPage - 1) * modUtils.constants.PAGE_SIZE;
      }
      if (expenses.length > modUtils.constants.PAGE_SIZE) {
        end = start + modUtils.constants.PAGE_SIZE;
      }

      resolve(expenses.slice(start, end));
    });
  }

})();
