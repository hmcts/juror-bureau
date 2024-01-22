const { dateFilter } = require('../../../../components/filters');

(function() {
  'use strict';

  const _ = require('lodash'),
    { expenseRecordObject, submitDraftExpenses } = require('../../../../objects/expense-record'),
    { jurorDetailsObject } = require('../../../../objects/juror-record'),
    modUtils = require('../../../../lib/mod-utils');

  module.exports.getExpenseRecord = function(app) {
    return function(req, res) {
      let data;
      const currentTab = req.query['status'] || 'draft';

      // STUBBED till BE is ready, calls will be replaced
      if (currentTab === 'draft') {
        return getDraftExpenses(app, req, res);
      } else if (currentTab === 'forApproval') {
        delete req.session.expensesList;
        data = require('../../../../stores/expenses').forApproval;
      } else if (currentTab === 'approved') {
        delete req.session.expensesList;
        data = require('../../../../stores/expenses').approved;
      }

      const setExpensesUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
          jurorNumber: req.params.jurorNumber}),
        jurorNumber = req.params.jurorNumber,
        poolNumber = req.params.poolNumber;

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

  function getDraftExpenses(app, req, res) {
    const tmpErrors = _.clone(req.session.errors),
      bannerMessage = _.clone(req.session.bannerMessage),
      currentTab = 'draft',
      setExpensesUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
        jurorNumber: req.params.jurorNumber,
      }),
      submitUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.submit.post', {
        jurorNumber: req.params.jurorNumber,
        poolNumber: req.params.poolNumber,
      }),
      enterExpensesUrl = app.namedRoutes.build('juror-management.enter-expenses.get', {
        jurorNumber: req.params.jurorNumber,
        poolNumber: req.params.poolNumber,
      }),
      jurorNumber = req.params.jurorNumber,
      poolNumber = req.params.poolNumber,
      backLinkUrl = app.namedRoutes.build('juror-management.unpaid-attendance.get'),
      page = req.query['page'] || 1;

    delete req.session.errors;
    delete req.session.bannerMessage;

    expenseRecordObject.get(
      require('request-promise'),
      app,
      req.session.authToken,
      jurorNumber,
      poolNumber,
    )
      .then(async(response) => {

        app.logger.info('Fetched draft expenses for juror: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            response,
          },
        });

        const expenseData = response[0];

        const jurorData = await fetchJurorDetails(
          app,
          req,
          res,
          expenseData.juror_number,
          expenseData.juror_version,
          ['NAME_DETAILS']
        );

        if (!req.session.expensesList) {
          req.session.expensesList = expenseData.expenses;
        }

        const dailyExpenses = _.clone(req.session.expensesList);
        const expenses = await paginateExpensesList(dailyExpenses, page);
        const totalExpenses = dailyExpenses.length;
        const totalCheckedExpenses = dailyExpenses.filter(expense => expense.checked).length;
        let pagination;

        if (dailyExpenses.length > modUtils.constants.PAGE_SIZE) {
          pagination = modUtils.paginationBuilder(dailyExpenses.length, page, req.url);
        }

        expenseData.expenses = expenses;

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
          totalCheckedExpenses,
          pagination,
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

  module.exports.postCheckExpense = function(app) {
    return function(req, res) {
      const { expenseDate, action } = req.query;

      if (expenseDate === 'check-all-expenses') {
        req.session.expensesList.forEach(e => {
          e.checked = action === 'check';
        });
      } else {
        const expense = req.session.expensesList.find(
          e => e.appearance_date === dateFilter(expenseDate, 'YYYYMMDD', 'YYYY-MM-DD')
        );

        expense.checked = !expense.checked;
      }

      app.logger.info('Checked or unchecked one or more expenses: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          expenseDate,
          action,
        },
      });

      return res.send();
    };
  };

  module.exports.postSubmitExpenses = function(app) {
    return function(req, res) {
      const expenseList = _.clone(req.session.expensesList);

      delete req.session.expensesList;

      const selectedExpenseDates = expenseList.filter(
        expense => expense.checked
      ).map(expense => expense.appearance_date);

      if (!selectedExpenseDates.length) {
        req.session.errors = {
          checkedExpenses: [{
            summary: 'Select at least one day',
            details: 'Select at least one day',
          }],
        };

        return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber: req.params.jurorNumber,
          poolNumber: req.params.poolNumber,
        }));
      }

      submitDraftExpenses.post(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params.jurorNumber,
        req.params.poolNumber,
        selectedExpenseDates
      )
        .then(() => {
          req.session.bannerMessage = 'Expenses submitted for approval';

          return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
            jurorNumber: req.params.jurorNumber,
            poolNumber: req.params.poolNumber,
          }));
        })
        .catch((err) => {
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

  module.exports.getExpenseRecordDetail = function(app) {
    return function(req, res) {
      expenseRecordObject.get(
        require('request-promise'),
        app,
        req.session.authToken,
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
