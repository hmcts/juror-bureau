const { replaceAllObjKeys } = require('../../../lib/mod-utils');

(function() {
  'use strict';

  const _ = require('lodash');

  module.exports.getNonSittingDays = function(app) {
    return async function(req, res) {

      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.expenseRatesEtag;

      try {

        return res.render('administration/non-sitting-days.njk', {

        });
      } catch (err) {
        app.logger.crit('Failed to fetch Courts and Bureau', {
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

      try {
        return res.redirect(app.namedRoutes.build('administration.expense-limits.get'));
      } catch (err) {

        app.logger.crit('Failed to compare etags for when updating expense limits and rates: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {

          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');

      }

    };
  };

})();
