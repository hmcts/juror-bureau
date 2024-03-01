(function() {
  'use strict';

  const _ = require('lodash');
  const { getExpenseRecordsDAO } = require('../../../../objects/expense-record');

  const STATUSES = {
    'for-approval': 'FOR_APPROVAL',
    'for-reapproval': 'FOR_REAPPROVAL',
    'approved': 'APPROVED',
  };

  module.exports.getForApprovalExpenses = function(app) {
    return async function(req, res) {
      const { jurorNumber, poolNumber, status } = req.params;
      const submitUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.post', {
        jurorNumber,
        poolNumber,
        status,
      });

      try {
        const data = await getExpenseRecordsDAO.post(
          app,
          req,
          {
            'juror_number': jurorNumber,
            'pool_number': poolNumber,
          },
          STATUSES[status],
        );

        const setExpensesUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
          jurorNumber,
          poolNumber,
        });

        const tmpErrors = _.clone(req.session.errors);

        delete req.session.errors;

        return res.render('juror-management/expense-record/expense-record.njk', {
          backLinkUrl: app.namedRoutes.build('juror-management.unpaid-attendance.get'),
          submitUrl,
          setExpensesUrl,
          nav: 'unpaid-attendance',
          status,
          data,
          jurorNumber,
          poolNumber,
          counts: req.expensesCount,
          jurorDetails: req.jurorDetails,
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
            poolNumber,
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
      const { status, jurorNumber, poolNumber } = req.params;

      switch (status) {
      case 'for-approval':
        editForApproval();
        break;
      case 'for-reapproval':
        editForReapproval();
        break;
      case 'approved':
        editApproved();
        break;
      }

      return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
        jurorNumber,
        poolNumber,
        status,
      }));
    };
  };

  function editForApproval() {
    // TODO: implement
  }

  function editForReapproval() {
    // TODO: implement
  }

  function editApproved() {
    // TODO: implement
  }

})();
