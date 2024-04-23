(function() {
  'use strict';

  const _ = require('lodash');
  const { getExpenseRecordsDAO } = require('../../../../objects/expense-record');
  const { jurorOverviewDAO } = require('../../../../objects/juror-record');

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

      try {
        const promiseArr = [];

        promiseArr.push(getExpenseRecordsDAO.get(
          app,
          req,
          locCode,
          STATUSES[status],
          jurorNumber,
        ));
        promiseArr.push(jurorOverviewDAO.get(req, jurorNumber, locCode));

        const [data, jurorDetails] = await Promise.all(promiseArr);

        const setExpensesUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
          jurorNumber,
          locCode,
        });

        const tmpErrors = _.clone(req.session.errors);
        const bannerMessage = req.session.submitExpensesBanner;

        delete req.session.errors;
        delete req.session.submitExpensesBanner;

        return res.render('juror-management/expense-record/expense-record.njk', {
          backLinkUrl: app.namedRoutes.build('juror-management.unpaid-attendance.get'),
          submitUrl,
          setExpensesUrl,
          nav: 'unpaid-attendance',
          status,
          data,
          jurorNumber,
          locCode,
          poolNumber: jurorDetails.commonDetails.poolNumber,
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

        return res.render('_errors/generic.njk');
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

      switch (status) {
      case 'for-approval':
        return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', {
          jurorNumber,
          locCode,
          status,
        }));
      case 'for-reapproval':
        return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', {
          jurorNumber,
          locCode,
          status,
        }));
      case 'approved':
        return res.redirect(app.namedRoutes.build('juror-management.edit-expense.get', {
          jurorNumber,
          locCode,
          status,
        }));
      }

      return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
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
