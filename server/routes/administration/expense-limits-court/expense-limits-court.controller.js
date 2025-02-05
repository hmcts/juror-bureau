const { replaceAllObjKeys } = require('../../../lib/mod-utils');

(function() {
  'use strict';

  const _ = require('lodash');
  const { courtRatesFromLocation } = require('../../../objects/court-location');
  const { transportRatesDAO } = require('../../../objects/administration');
  const { validate } = require('validate.js');
  const updateExpenseLimits = require('../../../config/validation/update-expense-transport-limits');

  module.exports.getExpenseLimitsCourt = function(app) {
    return async function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.expenseLimitsCourtEtag;

      const locCode = req.session.authentication.locCode;

      try {
        const { response: expenseLimitsTransport, headers } = await transportRatesDAO.get(req, locCode);

        req.session.expenseLimitsCourtEtag = headers.etag;

        replaceAllObjKeys(expenseLimitsTransport, _.camelCase);

        return res.render('administration/expense-limits-court.njk', {
          expenseLimitsTransport,
          processUrl: app.namedRoutes.build('administration.expense-limits-court.post'),
          cancelUrl: app.namedRoutes.build('administration.expense-limits-court.get'),
          tmpBody,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch expense limits for transport', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.postExpenseLimitsCourt = function(app) {
    return async function(req, res) {
      const validatorResult = validate(req.body, updateExpenseLimits());

      const locCode = req.session.authentication.locCode;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('administration.expense-limits-court.get'));
      }

      try {
        await transportRatesDAO.get(req, locCode, req.session.expenseLimitsCourtEtag);

        req.session.errors = {
          expenseRates: [{
            summary: 'Expenses limits for transport were updated by another user',
            details: 'Expenses limits for transport were updated by another user',
          }],
        };

        return res.redirect(app.namedRoutes.build('administration.expense-limits-court.get'));

      } catch (err) {
        if (err.statusCode !== 304) {

          app.logger.crit('Failed to compare etags for when expense limits for transport: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              locCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        }
      }

      delete req.session.expenseLimitsCourtEtag;

      try {
        const body = {
          'publicTransportSoftLimit': req.body.publicTransportDailyLimit,
          'taxiSoftLimit': req.body.taxiDailyLimit,
        };

        await transportRatesDAO.put(req, req.session.authentication.locCode, body);

        return res.redirect(app.namedRoutes.build('administration.expense-limits-court.get'));
      } catch (err) {
        app.logger.crit('Failed to update expense limits for transport', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }

    };
  };

})();
