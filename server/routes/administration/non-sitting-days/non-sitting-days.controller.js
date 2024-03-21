

(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , validator = require('../../../config/validation/add-non-sitting-day')
    , { bankHolidaysDAO, nonSittingDayDAO } = require('../../../objects/administration')
    , { dateFilter } = require('../../../components/filters');

  module.exports.getNonSittingDays = function(app) {
    return async function(req, res) {

      const postUrl = app.namedRoutes.build('administration.non-sitting-days.post');

      try {
        const holidayDates = await bankHolidaysDAO.get(app, req);
        const nonSittingDates = await nonSittingDayDAO.get(app, req, req.session.authentication.owner);

        const holidayDateYears = Object.keys(holidayDates.response);

        return res.render('administration/non-sitting-days.njk', {
          postUrl,
          holidayDates: holidayDates.response,
          nonSittingDates: nonSittingDates,
          holidayDateYears,
        });
      } catch (err) {
        app.logger.crit('Failed to fetch list of holidays', {
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

        app.logger.crit('Failed eo add the non sitting day ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
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
      const postUrl = app.namedRoutes.build('administration.add-non-sitting-days.post');

      delete req.session.errors;
      delete req.session.formFields;

      try {
        return res.render('administration/add-non-sitting-days.njk', {
          cancelUrl,
          postUrl,
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

      validatorResult = validate(req.body, validator());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('administration.add-non-sitting-days.get'));
      };

      const payload = {
        'date': req.body.nonSittingDate !== '' ? dateFilter(req.body.nonSittingDate, null, 'YYYY-MM-DD') : '',
        'description': req.body.decriptionNonSittingDay,
      };

      try {
        await nonSittingDayDAO.post(app, req, req.session.locCode, payload);
        return res.redirect(app.namedRoutes.build('administration.non-sitting-days.get'));

      } catch (err) {
        app.logger.crit('Failed to add non sitting day', {
          userId: req.session.authentication.login,
          jwt: req.session.authToken,
          data: payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
      }

    };
  };

  module.exports.deleteNonSittingDay = function(app) {
    return async function(req, res) {
      const { nonSittingDate } = req.query;

      return res.render('administration/delete-non-sitting-days.njk', {
        nonSittingDate,
      });
    };
  };

  module.exports.postDeleteNonSittingDay = function(app) {
    return async function(req, res) {

      const date = (req.body.nonSittingDate !== '' ? dateFilter(req.body.nonSittingDate, null, 'YYYY-MM-DD') : '');

      try {
        await nonSittingDayDAO.delete(app, req, req.session.locCode, date);
        return res.redirect(app.namedRoutes.build('administration.non-sitting-days.get'));

      } catch (err) {
        app.logger.crit('Failed to delete non sitting day', {
          userId: req.session.authentication.login,
          jwt: req.session.authToken,
          data: date,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
      }
    };
  };

})();
