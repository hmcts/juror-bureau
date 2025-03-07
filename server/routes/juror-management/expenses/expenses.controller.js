(function() {
  'use strict';

  const _ = require('lodash')
    , modUtils = require('../../../lib/mod-utils')
    , validate = require('validate.js')
    , { defaultExpensesDAO } = require('../../../objects/expenses')
    , defaultExpensesValidator = require('../../../config/validation/default-expenses');

  module.exports.getDefaultExpenses = (app) => {
    return async function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      const tmpBody = _.cloneDeep(req.session.tmpBody);
      const { jurorNumber } = req.params;

      let processUrl = app.namedRoutes.build('juror-record.default-expenses.post', { jurorNumber });
      let cancelUrl = app.namedRoutes.build('juror-record.expenses.get', { jurorNumber });

      if (req.url.includes('expense-record')) {
        const { locCode } = req.params;

        processUrl = app.namedRoutes.build('juror-management.default-expenses.post', {
          jurorNumber,
          locCode,
        });
        cancelUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber,
          locCode,
          status: 'draft',
        });
      }

      delete req.session.errors;
      delete req.session.tmpBody;

      try {
        const data = await defaultExpensesDAO.get(req, req.session.authentication.locCode, jurorNumber);
        const defaultExpenses = modUtils.replaceAllObjKeys(_.cloneDeep(data), _.camelCase);

        defaultExpenses['travelTime-hour'] = defaultExpenses.travelTime
          ? defaultExpenses.travelTime.split(':')[0] : '';
        defaultExpenses['travelTime-minute'] = defaultExpenses.travelTime
          ? defaultExpenses.travelTime.split(':')[1] : '';
        defaultExpenses.financialLoss = defaultExpenses.financialLoss
          ? defaultExpenses.financialLoss.toString() : '';
        defaultExpenses.amountSpent = defaultExpenses.amountSpent
          ? defaultExpenses.amountSpent.toString() : '';
        defaultExpenses.mileage = defaultExpenses.mileage
          ? defaultExpenses.mileage.toString() : '';
        defaultExpenses.claimingSubsistenceAllowance = defaultExpenses.claimingSubsistenceAllowance
          ? 'true' : 'false';

        return res.render('expenses/default-expenses.njk', {
          jurorNumber: jurorNumber,
          defaultExpenses,
          processUrl,
          cancelUrl,
          tmpBody,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch jurors default expenses', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postDefaultExpenses = (app) => {
    return async function(req, res) {
      const { jurorNumber } = req.params;
      let validationErrorUrl = app.namedRoutes.build('juror-record.default-expenses.get', { jurorNumber });
      let redirectUrl = app.namedRoutes.build('juror-record.expenses.get', { jurorNumber });

      if (req.url.includes('expense-record')) {
        const { locCode } = req.params;

        validationErrorUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
          jurorNumber,
          locCode,
        });
        redirectUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
          jurorNumber,
          locCode,
          status: 'draft',
        });
      }

      req.body.travelTime = {
        hour: req.body['travelTime-hour'],
        minute: req.body['travelTime-minute'],
      };
      const validatorResult = validate(req.body, defaultExpensesValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.tmpBody = req.body;
        req.session.errors = validatorResult;

        return res.redirect(validationErrorUrl);
      }

      try {
        req.body.travelTime = req.body['travelTime-hour'] ? [parseInt(req.body['travelTime-hour'])] : [0];
        if (req.body['travelTime-minute']) {
          req.body.travelTime.push(parseInt(req.body['travelTime-minute']));
        } else {
          req.body.travelTime.push(0);
        }
        delete req.body['travelTime-hour'];
        delete req.body['travelTime-minute'];
        delete req.body._csrf;

        await defaultExpensesDAO.post(req, req.session.authentication.locCode, jurorNumber, req.body);

        return res.redirect(redirectUrl);
      } catch (err) {
        app.logger.crit('Failed to set default expenses', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      };
    };

  };

})();
