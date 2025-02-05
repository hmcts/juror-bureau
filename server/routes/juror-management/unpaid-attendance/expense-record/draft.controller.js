(function() {
  'use strict';

  const _ = require('lodash');
  const { getDraftExpensesDAO, submitDraftExpenses } = require('../../../../objects/expense-record');
  const { makeManualError } = require('../../../../lib/mod-utils');

  module.exports.getDraftExpenses = function(app) {
    return function(req, res) {
      const { jurorNumber, locCode, status } = req.params;
      const tmpErrors = _.clone(req.session.errors);
      const bannerMessage = _.clone(req.session.bannerMessage);
      const setExpensesUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
        jurorNumber,
        locCode,
      });
      const submitUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.post', {
        jurorNumber,
        locCode,
        status: 'draft',
      });
      const enterExpensesUrl = app.namedRoutes.build('juror-management.enter-expenses.get', {
        jurorNumber,
        locCode,
      });
      const bankDetailsUrl = app.namedRoutes.build('juror-management.bank-details.get', {
        jurorNumber,
        locCode,
      });
      
      let backLinkUrl;

      delete req.session.errors;
      delete req.session.bannerMessage;

      getDraftExpensesDAO.get(req, jurorNumber, locCode)
        .then(async function({ response: expenseData, headers }) {

          req.session.draftExpensesEtag = headers.etag;

          app.logger.info('Fetched draft expenses for juror: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              expenseData,
            },
          });

          const totalExpenses = req.expensesCount.totalDraft;

          req.session.expensesData = {
            total: totalExpenses,
            dates: expenseData.expenseDetails.reduce((prev, expense) => {
              prev.push(expense.attendanceDate);
              return prev;
            }, []),
          };

          if (req.session.historyStack.length > 1){
            backLinkUrl = req.session.historyStack[req.session.historyStack.length - 2];
          } else {
            backLinkUrl = app.namedRoutes.build('juror-management.unpaid-attendance.get');
          }

          return res.render('juror-management/expense-record/expense-record.njk', {
            backLinkUrl,
            setExpensesUrl,
            submitUrl,
            enterExpensesUrl,
            bankDetailsUrl,
            previewUrl: app.namedRoutes.build('reports.draft-audit.post', {
              jurorNumber: req.params.jurorNumber,
              locCode: req.params.locCode,
            }),
            nav: 'unpaid-attendance',
            status,
            jurorStatus: req.jurorDetails.activePool.status,
            expenseData: expenseData,
            jurorDetails: req.jurorDetails,
            jurorNumber,
            poolNumber: req.jurorDetails.activePool.poolNumber,
            locCode,
            totalExpenses,
            bannerMessage,
            counts: req.expensesCount,
            errors: {
              title: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        })
        .catch(async(err) => {

          app.logger.crit('Failed to fetch draft expense data: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber,
              locCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        });
    };
  };

  module.exports.postDraftExpenses = function(app) {
    return async function(req, res) {
      const { jurorNumber, locCode } = req.params;
      const { action } = req.query;
      const redirectUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
        jurorNumber,
        locCode,
        status: 'draft',
      });

      if (!req.body['checked-expenses']) {
        req.session.errors = {
          checkedExpenses: [{
            summary: 'Select at least one',
            details: 'Select at least one',
          }],
        };

        return res.redirect(redirectUrl);
      }

      if (!Array.isArray(req.body['checked-expenses'])) {
        req.body['checked-expenses'] = [req.body['checked-expenses']];
      }

      if (action === 'ADD_SMARTCARD_SPEND') {
        return res.redirect(app.namedRoutes.build(
          'juror-management.unpaid-attendance.expense-record.add-smartcard-spend.get', {
            jurorNumber,
            locCode,
          }
        ) + `?dates=${req.body['checked-expenses']}`);
      }

      try {
        await getDraftExpensesDAO.get(
          req,
          jurorNumber,
          locCode,
          req.session.draftExpensesEtag
        );

        req.session.errors = {
          checkedExpenses: [{
            summary: 'New draft expenses were added or some have already been approved',
            details: 'New draft expenses were added or some have already been approved',
          }],
        };

        return res.redirect(redirectUrl);

      } catch (err) {
        if (err.statusCode !== 304) {

          app.logger.crit('Failed to compare etags for when submitting draft expenses for approval: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber,
              locCode,
              expenses: req.body['checked-expenses'],
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        }
      }

      submitDraftExpenses.post(
        req,
        locCode,
        jurorNumber,
        req.body['checked-expenses']
      )
        .then(() => {
          req.session.bannerMessage = 'Expenses submitted for approval';

          app.logger.info('Successfully submitted draft expenses for approval: ', {
            auth: req.session.authentication,
            data: {
              jurorNumber,
              locCode,
              dates: req.body['checked-expenses'],
            },
          });

          return res.redirect(redirectUrl);
        })
        .catch((err) => {
          if (err.statusCode === 422) {
            req.session.errors = makeManualError('Submit for approval', err.error.message);

            app.logger.crit('Failed to submit draft expenses for approval: ', {
              auth: req.session.authentication,
              data: {
                jurorNumber,
                locCode,
                dates: req.body['checked-expenses'],
              },
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });

            return res.redirect(redirectUrl);
          }

          app.logger.crit('Failed to submit expenses for approval: ', {
            auth: req.session.authentication,
            data: {
              jurorNumber,
              locCode,
              dates: req.body['checked-expenses'],
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        });
    };
  };

})();
