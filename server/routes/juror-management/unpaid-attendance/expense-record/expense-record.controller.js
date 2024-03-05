(function() {
  'use strict';

  const { jurorDetailsObject } = require('../../../../objects/juror-record');
  const modUtils = require('../../../../lib/mod-utils');
  const { getDraftExpensesDAO } = require('../../../../objects/expense-record');
  const { getDraftExpenses, postDraftExpenses } = require('./draft.controller');
  const { getForApprovalExpenses, postForApprovalExpenses } = require('./for-approval.controller');

  module.exports.getExpensesList = function(app) {
    return async function(req, res) {
      const { jurorNumber, poolNumber, status } = req.params;

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
        req.session.locCode = poolNumber.slice(0, 3);

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

      switch (status) {
      case 'draft':
        getDraftExpenses(app)(req, res);
        break;
      case 'for-approval':
        getForApprovalExpenses(app)(req, res);
        break;
      case 'for-reapproval':
        getForApprovalExpenses(app)(req, res);
        break;
      case 'approved':
        getForApprovalExpenses(app)(req, res);
        break;
      default:
        app.logger.crit('Invalid expense status entered', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            poolNumber,
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
      const { jurorNumber, poolNumber, status } = req.params;

      switch (status) {
      case 'draft':
        postDraftExpenses(app)(req, res);
        break;
      case 'for-approval':
        postForApprovalExpenses(app)(req, res);
        break;
      case 'for-reapproval':
        postForApprovalExpenses(app)(req, res);
        break;
      case 'approved':
        postForApprovalExpenses(app)(req, res);
        break;
      default:
        app.logger.crit('Invalid expense status entered', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber,
            poolNumber,
            status,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };











  module.exports.getExpenseRecordDetail = function(app) {
    return function(req, res) {
      getDraftExpensesDAO.get(
        app,
        req,
        req.params.jurorNumber,
        req.params.auditNumber,
      )
        .then(async(response) => {
          const expenseData = response[0];

          expenseData['audit_number'] = req.params.auditNumber;

          const jurorData = await fetchJurorDetails(
            app,
            req,
            res,
            expenseData.juror_number,
            expenseData.juror_version,
            ['PAYMENT_DETAILS', 'NAME_DETAILS', 'ADDRESS_DETAILS']
          );
          const page = req.query['page'] || 1;
          let status = 'forApproval';
          let firstDate = expenseData.expenses[0].appearance_date;
          let lastDate = expenseData.expenses[(expenseData.expenses.length) - 1].appearance_date;
          let backLinkUrl;
          let approveUrl;
          let pagination;

          if (expenseData.type === 'EXPENSE_AUTHORISED') {
            status = 'approved';
          }

          approveUrl = app.namedRoutes.build(
            'juror-management.unpaid-attendance.expense-record.approved.post', {
              auditNumber: req.params.auditNumber,
            }
          );
          if (status === 'forApproval') {
            backLinkUrl = app.namedRoutes.build(
              'juror-management.unpaid-attendance.expense-record.get', {
                jurorNumber: expenseData.juror_number,
                poolNumber: req.params.poolNumber,
                status: 'for-approval',
              }
            );
          } else if (status === 'approved') {
            backLinkUrl = app.namedRoutes.build(
              'juror-management.unpaid-attendance.expense-record.get', {
                jurorNumber: expenseData.juror_number,
                poolNumber: req.params.poolNumber,
                status: 'approved',
              }
            );
          }

          const expenses = await paginateExpensesList(expenseData.expenses, page);

          if (expenseData.expenses.length > modUtils.constants.PAGE_SIZE) {
            pagination = modUtils.paginationBuilder(expenseData.expenses.length, page, req.url);
          }

          expenseData.expenses = expenses;

          return res.render('juror-management/expense-record/expense-detail.njk', {
            backLinkUrl,
            approveUrl,
            nav: 'unpaid-attendance',
            jurorDetails: jurorData,
            expenseData: expenseData,
            attendanceDates: {
              firstDate,
              lastDate,
            },
            status: status,
            pagination,
            page,
          });
        })
        .catch((err) => {
          app.logger.crit('Failed to fetch expense data: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.jurorNumber,
              jurorVersion: null,
              details: ['PAYMENT_DETAILS', 'NAME_DETAILS', 'ADDRESS_DETAILS'],
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        });
    };
  };

  module.exports.getNotApproved = function(app) {
    return function(req, res){
      let backLinkUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.detail.get', {
        auditNumber: req.params.auditNumber,
      });

      return res.render('juror-management/_errors/approval-denied.njk', {backLinkUrl: backLinkUrl}
      );
    };
  };

  module.exports.postExpensesApproval = function(app) {
    return async function(req, res){
      const data = require('../../../../stores/expenses').detail;

      if (req.session.authentication.login === data.submittedBy){
        return res.redirect(app.namedRoutes.build('juror-management.not-approved.get', {
          auditNumber: req.params.auditNumber,
        }));
      }
      try {
        await approveExpensesResolver();
        req.session.bannerMessage = 'Expenses approved for '+ req.body.name + ' and sent to printer';

        return res.redirect(app.namedRoutes.build('juror-management.approve-expenses.get'));
      } catch (err) {
        app.logger.crit('Unable to approve expense', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
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

  //TODO delete resolver once backend is ready
  function approveExpensesResolver() {
    return new Promise(res => res(''));
  };

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
