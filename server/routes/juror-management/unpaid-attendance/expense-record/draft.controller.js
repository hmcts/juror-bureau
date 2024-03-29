const _ = require('lodash');
const { jurorOverviewDAO } = require('../../../../objects/juror-record');
const { getDraftExpensesDAO, submitDraftExpenses } = require('../../../../objects/expense-record');
const { makeManualError } = require('../../../../lib/mod-utils');

module.exports.getDraftExpenses = function (app) {
  return function (req, res) {
    const { jurorNumber, poolNumber, status } = req.params;
    const tmpErrors = _.clone(req.session.errors);
    const bannerMessage = _.clone(req.session.bannerMessage);
    const setExpensesUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
      jurorNumber,
      poolNumber,
    });
    const submitUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.post', {
      jurorNumber,
      poolNumber,
      status: 'draft',
    });
    const enterExpensesUrl = app.namedRoutes.build('juror-management.enter-expenses.get', {
      jurorNumber,
      poolNumber,
    });
    const bankDetailsUrl = app.namedRoutes.build('juror-management.bank-details.get', {
      jurorNumber,
      poolNumber,
    });
    const backLinkUrl = app.namedRoutes.build('juror-management.unpaid-attendance.get');

    delete req.session.errors;
    delete req.session.bannerMessage;

    Promise.all([getDraftExpensesDAO.get(
      app,
      req,
      jurorNumber,
      poolNumber,
    ), jurorOverviewDAO.get(req, jurorNumber, req.session.authentication.locCode)])
      .then(async function ([{ response: expenseData, headers }, jurorOverview]) {

        req.session.draftExpensesEtag = headers.etag;

        app.logger.info('Fetched draft expenses for juror: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            expenseData,
          },
        });

        const totalExpenses = req.expensesCount.total_draft;

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
          bankDetailsUrl,
          nav: 'unpaid-attendance',
          status,
          jurorStatus: jurorOverview.commonDetails.jurorStatus,
          expenseData: expenseData,
          jurorDetails: req.jurorDetails,
          jurorNumber,
          poolNumber,
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
      .catch(async (err) => {

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

module.exports.postDraftExpenses = function (app) {
  return async function (req, res) {
    const { jurorNumber, poolNumber } = req.params;
    const { action } = req.query;
    const redirectUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
      jurorNumber,
      poolNumber,
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
          poolNumber,
        }) + `?dates=${req.body['checked-expenses']}`);
    }

    try {
      await getDraftExpensesDAO.get(
        app,
        req,
        jurorNumber,
        poolNumber,
        req.session.draftExpensesEtag,
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
            poolNumber,
            expenses: req.body['checked-expenses'],
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    }

    submitDraftExpenses.post(
      app,
      req,
      jurorNumber,
      poolNumber,
      req.body['checked-expenses'],
    )
      .then(() => {
        req.session.bannerMessage = 'Expenses submitted for approval';

        return res.redirect(redirectUrl);
      })
      .catch((err) => {
        if (err.statusCode === 422) {
          req.session.errors = makeManualError('Submit for approval', err.error.message);

          app.logger.crit('Failed to submit draft expenses for approval: ', {
            auth: req.session.authentication,
            data: {
              jurorNumber,
              poolNumber,
              dates: req.body['checked-expenses'],
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(redirectUrl);
        }

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
