const { replaceAllObjKeys } = require('../../../lib/mod-utils');

(function() {
  'use strict';

  const _ = require('lodash');
  const { expenseRatesAndLimitsDAO } = require('../../../objects/administration');
  const { validate } = require('validate.js');
  const updateExpenseRates = require('../../../config/validation/update-expense-rates');

  module.exports.getExpenseLimitsTransport = function(app) {
    return async function(req, res) {
      // const tmpErrors = _.clone(req.session.errors);
      // const tmpBody = _.clone(req.session.formFields);

      // delete req.session.errors;
      // delete req.session.formFields;
      // delete req.session.expenseRatesEtag;

      try {
        // const { response: expenseLimits, headers } = await expenseRatesAndLimitsDAO.get(app, req);

        // replaceAllObjKeys(expenseLimits, _.camelCase);

        // req.session.expenseRatesEtag = headers.etag;

        return res.render('administration/expense-limits-transport.njk', {
          // expenseLimits,
          // processUrl: app.namedRoutes.build('administration.expense-limits.post'),
          // cancelUrl: app.namedRoutes.build('administration.expense-limits.get'),
          // tmpBody,
          // errors: {
          //   title: 'Please check the form',
          //   count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          //   items: tmpErrors,
          // },
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

  module.exports.postExpenseLimitsTransport = function(app) {
    return async function(req, res) {
    
    };
  };

})();
