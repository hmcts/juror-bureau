(function() {
  'use strict';

  const _ = require('lodash');
  const { getExpenseRecordsDAO } = require('../../../../objects/expense-record');
  const { jurorRecordDetailsDAO } = require('../../../../objects');

  const STATUSES = {
    'for-approval': 'FOR_APPROVAL',
    'for-reapproval': 'FOR_REAPPROVAL',
    'approved': 'APPROVED',
  };

  module.exports.getForApprovalExpenses = function(app) {
    return async function(req, res) {
      const { jurorNumber, locCode, status } = req.params;
      const submitUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.post', {
        jurorNumber,
        locCode,
        status,
      });
      const bankDetailsUrl = app.namedRoutes.build('juror-management.bank-details.get', {
        jurorNumber,
        locCode,
      }) + `?status=${status}`;

      try {
        const promiseArr = [];

        promiseArr.push(getExpenseRecordsDAO.get(
          req,
          locCode,
          STATUSES[status],
          jurorNumber,
        ));
        promiseArr.push(jurorRecordDetailsDAO.post(req, [{
          'juror_number': jurorNumber,
          'juror_version': null,
          'include': ['ACTIVE_POOL'],
        }]));

        const [data, jurorDetails] = await Promise.all(promiseArr);

        const setExpensesUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
          jurorNumber,
          locCode,
        });

        const tmpErrors = _.clone(req.session.errors);
        const bannerMessage = req.session.submitExpensesBanner;

        delete req.session.errors;
        delete req.session.submitExpensesBanner;

        let backLinkUrl;

        if (req.session.historyStack.length > 1) {
          backLinkUrl = req.session.historyStack[req.session.historyStack.length - 2]
        } else {
          backLinkUrl = app.namedRoutes.build('juror-management.approve-expenses.get');
          if (req.session.approveExpensesTab){
            backLinkUrl += `?tab=${req.session.approveExpensesTab}`;
          }
        }
        
        return res.render('juror-management/expense-record/expense-record.njk', {
          backLinkUrl: backLinkUrl,
          submitUrl,
          setExpensesUrl,
          bankDetailsUrl,
          nav: 'unpaid-attendance',
          status,
          data,
          jurorNumber,
          locCode,
          poolNumber: jurorDetails['0'].active_pool.pool_number,
          counts: req.expensesCount,
          jurorDetails: req.jurorDetails,
          bannerMessage,
          errors: {
            title: '',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Unable to view expenses', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            jurorNumber,
            locCode,
            status,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postForApprovalExpenses = function(app) {
    return function(req, res) {
      const { status, jurorNumber, locCode } = req.params;

      const validationErrors = validateIFHasCheckedDates(status, req.body['checked-expenses']);

      if (validationErrors) {
        req.session.errors = {
          checkedExpenses: [{
            summary: validationErrors,
            details: validationErrors,
          }],
        };

        return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber,
          locCode,
          status,
        }));
      }

      // always rewrite this
      req.session.editApprovalDates = (req.body['checked-expenses'] instanceof Array)
        ? req.body['checked-expenses']
        : [req.body['checked-expenses']];

      return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', {
        jurorNumber,
        locCode,
        status,
      }));
    };
  };

  function validateIFHasCheckedDates(status, body) {
    const messages = {
      'for-approval': 'Select at least one day to edit expenses for approval',
      'for-reapproval': 'Select at least one day to edit expenses for reapproval',
      'approved': 'Select at least one day to edit approved expenses',
    };

    if (!body) {
      return messages[status];
    }

    return;
  }

})();
