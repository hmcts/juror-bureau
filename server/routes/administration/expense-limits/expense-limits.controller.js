const { replaceAllObjKeys } = require('../../../lib/mod-utils');

(function() {
  'use strict';

  const _ = require('lodash');
  const { expenseRatesAndLimitsDAO } = require('../../../objects/administration');
  const { validate } = require('validate.js');
  const updateExpenseRates = require('../../../config/validation/update-expense-rates');

  module.exports.getExpenseLimits = function(app) {
    return async function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.expenseRatesEtag;

      try {
        const { response: expenseLimits, headers } = await expenseRatesAndLimitsDAO.get(req);

        req.session.expenseRatesEtag = headers.etag;

        replaceAllObjKeys(expenseLimits, _.camelCase);

        return res.render('administration/expense-limits.njk', {
          expenseLimits,
          processUrl: app.namedRoutes.build('administration.expense-limits.post'),
          cancelUrl: app.namedRoutes.build('administration.expense-limits.get'),
          tmpBody,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch expense rates and limits', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.postExpenseLimits = function(app) {
    return async function(req, res) {
      const validatorResult = validate(req.body, updateExpenseRates());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('administration.expense-limits.get'));
      }

      try {
        await expenseRatesAndLimitsDAO.get(req, req.session.expenseRatesEtag);

        req.session.errors = {
          expenseRates: [{
            summary: 'Expenses limits and rates were updated by another user',
            details: 'Expenses limits and rates were updated by another user',
          }],
        };

        return res.redirect(app.namedRoutes.build('administration.expense-limits.get'));

      } catch (err) {
        if (err.statusCode !== 304) {

          app.logger.crit('Failed to compare etags for when updating expense limits and rates: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              expenses: checkedJurors,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        }
      }

      delete req.session.expenseRatesEtag;

      try {
        const body = {
          'carMileageRatePerMile0Passengers': req.body.carMileageRatePerMile0Passengers,
          'carMileageRatePerMile1Passengers': req.body.carMileageRatePerMile1Passengers,
          'carMileageRatePerMile2OrMorePassengers': req.body.carMileageRatePerMile2OrMorePassengers,
          'motorcycleMileageRatePerMile0Passengers': req.body.motorcycleMileageRatePerMile0Passengers,
          'motorcycleMileageRatePerMile1Passengers': req.body.motorcycleMileageRatePerMile1Passengers,
          'bikeRate': req.body.bikeRate,
          'limitFinancialLossHalfDay': req.body.limitFinancialLossHalfDay,
          'limitFinancialLossFullDay': req.body.limitFinancialLossFullDay,
          'limitFinancialLossHalfDayLongTrial': req.body.limitFinancialLossHalfDayLongTrial,
          'limitFinancialLossFullDayLongTrial': req.body.limitFinancialLossFullDayLongTrial,
          'subsistenceRateStandard': req.body.subsistenceRateStandard,
          'subsistenceRateLongDay': req.body.subsistenceRateLongDay,
        };

        await expenseRatesAndLimitsDAO.put(req, body);

        return res.redirect(app.namedRoutes.build('administration.expense-limits.get'));
      } catch (err) {
        app.logger.crit('Failed to update expense rates and limits', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

})();
