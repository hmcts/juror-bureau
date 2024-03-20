

(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , validator = require('../../../config/validation/add-non-sitting-day')
    , { bankHolidaysDAO } = require('../../../objects/administration');

  module.exports.getNonSittingDays = function(app) {
    return async function(req, res) {

      const postUrl = app.namedRoutes.build('administration.non-sitting-days.post');

      try {
        const response = await bankHolidaysDAO.get(app, req);

        return res.render('administration/non-sitting-days.njk', {
          postUrl,
        });
      } catch (err) {
        app.logger.crit('Failed to fetch Non sitting days', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.postNonSittingDays = function(app) {
    return async function(req, res) {

      try {
        return res.redirect(app.namedRoutes.build('administration.add-non-sitting-days.get'));
      } catch (err) {

        app.logger.crit('Failed ', {
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

  module.exports.getAddNonSittingDay = function(app) {
    return async function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const formFields = _.clone(req.session.formFields);

      const cancelUrl = app.namedRoutes.build('administration.add-non-sitting-days.get');

      delete req.session.errors;
      delete req.session.formFields;

      try {
        return res.render('administration/add-non-sitting-days.njk', {
          cancelUrl,
          errors: {
            title: 'There is a problem',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
          formFields,
        });
      } catch (err) {
        app.logger.crit('Failed ', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.postAddNonSittingDay = function(app) {
    return async function(req, res) {
      var validatorResult;

      validatorResult = validate(req.body, validator.validateDate());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('administration.add-non-sitting-days.get', {

        }));
      };

    };
  };

})();
