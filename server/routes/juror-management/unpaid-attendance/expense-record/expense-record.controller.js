(function() {
  'use strict';

  const _ = require('lodash');
  const { getDraftExpensesDAO, submitDraftExpenses } = require('../../../../objects/expense-record');
  const { jurorDetailsObject } = require('../../../../objects/juror-record');
  const modUtils = require('../../../../lib/mod-utils');

  module.exports.getExpenseRecord = function(app) {
    return function(req, res) {
      let data;
      const currentTab = req.query['status'] || 'draft';

      // STUBBED till BE is ready, calls will be replaced
      if (currentTab === 'draft') {
        return getDraftExpenses(app)(req, res);
      } else if (currentTab === 'forApproval') {
        data = require('../../../../stores/expenses').forApproval;
      } else if (currentTab === 'approved') {
        data = require('../../../../stores/expenses').approved;
      }

      const { jurorNumber, poolNumber } = req.params;
      const setExpensesUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
        jurorNumber,
      });

      return res.render('juror-management/expense-record/expense-record.njk', {
        backLinkUrl: app.namedRoutes.build('juror-management.unpaid-attendance.get'),
        setExpensesUrl,
        nav: 'unpaid-attendance',
        jurorApprovalCount: req.session.jurorApprovalCount,
        currentTab: currentTab,
        data: data,
        jurorNumber,
        poolNumber,
      });
    };
  };

  function getDraftExpenses(app) {
    return function(req, res) {
      const { jurorNumber, poolNumber } = req.params;
      const tmpErrors = _.clone(req.session.errors);
      const bannerMessage = _.clone(req.session.bannerMessage);
      const currentTab = 'draft';
      const setExpensesUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
        jurorNumber,
      });
      const submitUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.submit.post', {
        jurorNumber,
        poolNumber,
      });
      const enterExpensesUrl = app.namedRoutes.build('juror-management.enter-expenses.get', {
        jurorNumber,
        poolNumber,
      });
      const backLinkUrl = app.namedRoutes.build('juror-management.unpaid-attendance.get');

      delete req.session.errors;
      delete req.session.bannerMessage;

      getDraftExpensesDAO.get(
        app,
        req,
        jurorNumber,
        poolNumber,
      )
        .then(async(expenseData) => {

          app.logger.info('Fetched draft expenses for juror: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              expenseData,
            },
          });

          const jurorData = await fetchJurorDetails(
            app,
            req,
            res,
            jurorNumber,
            null,
            ['NAME_DETAILS']
          );

          const totalExpenses = expenseData.expense_details.length;

          req.session.expensesData = {
            total: totalExpenses,
            dates: expenseData.expense_details.reduce((prev, expense) => {
              prev.push(expense.attendance_date);
              return prev;
            }, []),
          };

          return res.render('juror-management/expense-record/expense-record.njk', {
            backLinkUrl,
            setExpensesUrl,
            submitUrl,
            enterExpensesUrl,
            nav: 'unpaid-attendance',
            jurorApprovalCount: req.session.jurorApprovalCount,
            currentTab: currentTab,
            expenseData: expenseData,
            jurorDetails: jurorData,
            jurorNumber,
            poolNumber,
            totalExpenses,
            bannerMessage,
            errors: {
              title: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        })
        .catch(async(err) => {

          if (err.statusCode === 404){
            app.logger.info('Fetched draft expenses for juror: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
            });

            const jurorData = await fetchJurorDetails(
              app,
              req,
              res,
              req.params.jurorNumber,
              null,
              ['NAME_DETAILS']
            );

            return res.render('juror-management/expense-record/expense-record.njk', {
              backLinkUrl,
              setExpensesUrl,
              submitUrl,
              nav: 'unpaid-attendance',
              jurorApprovalCount: req.session.jurorApprovalCount,
              currentTab: currentTab,
              jurorDetails: jurorData,
              jurorNumber,
              poolNumber,
              bannerMessage,
              errors: {
                title: '',
                count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
                items: tmpErrors,
              },
            });
          }

          app.logger.crit('Failed to fetch draft expense data: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.jurorNumber,
              poolNumber: req.params.poolNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        });
    };
  };

  module.exports.postSubmitExpenses = function(app) {
    return function(req, res) {
      const { jurorNumber, poolNumber } = req.params;

      if (!req.body['checked-expenses']) {
        req.session.errors = {
          checkedExpenses: [{
            summary: 'Select at least one day',
            details: 'Select at least one day',
          }],
        };

        return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber,
          poolNumber,
        }));
      }

      submitDraftExpenses.post(
        app,
        req,
        jurorNumber,
        poolNumber,
        req.body['checked-expenses']
      )
        .then(() => {
          req.session.bannerMessage = 'Expenses submitted for approval';

          return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
            jurorNumber,
            poolNumber,
          }));
        })
        .catch((err) => {
          app.logger.crit('Failed to fetch draft expense data: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber,
              poolNumber,
              dates: req.body['checked-expenses'],
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        });
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
              }
            ) + '?status=forApproval';
          } else if (status === 'approved') {
            backLinkUrl = app.namedRoutes.build(
              'juror-management.unpaid-attendance.expense-record.get', {
                jurorNumber: expenseData.juror_number,
                poolNumber: req.params.poolNumber,
              }
            ) + '?status=approved';
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
            jurorApprovalCount: req.session.jurorApprovalCount,
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
