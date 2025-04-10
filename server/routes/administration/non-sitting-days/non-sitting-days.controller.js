(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , validator = require('../../../config/validation/add-non-sitting-day')
    , { bankHolidaysDAO, nonSittingDayDAO } = require('../../../objects/administration')
    , fetchAllCourts = require('../../../objects/request-pool').fetchAllCourts
    , { dateFilter } = require('../../../components/filters')
    , { makeManualError } = require('../../../lib/mod-utils');

  module.exports.getNonSittingDays = function(app) {
    return async function(req, res) {

      let bannerMessage;

      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }
      delete req.session.bannerMessage;

      const postUrl = app.namedRoutes.build('administration.non-sitting-days.post');

      try {
        const holidayDates = await bankHolidaysDAO.get(req);
        const nonSittingDates = await nonSittingDayDAO.get(req, req.session.authentication.owner);
        const fetchAllAvailableCourts = await fetchAllCourts.get(req);

        const loggedInName = fetchAllAvailableCourts.courts.find(
          ({locationCode}) => locationCode === req.session.authentication.locCode);


        const holidayDateYears = Object.keys(holidayDates);

        return res.render('administration/non-sitting-days.njk', {
          postUrl,
          holidayDates: holidayDates,
          nonSittingDates: nonSittingDates,
          holidayDateYears,
          locationName: loggedInName.locationName,
          bannerMessage,
        });
      } catch (err) {
        app.logger.crit('Failed to fetch list of holidays and non sitting days', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }

    };
  };

  module.exports.postNonSittingDays = function(app) {
    return async function(req, res) {

      try {
        return res.redirect(app.namedRoutes.build('administration.add-non-sitting-days.get'));
      } catch (err) {

        app.logger.crit('Failed to add the non sitting day ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });

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

        return res.render('_errors/generic', { err });
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
        await nonSittingDayDAO.post(req, req.session.authentication.locCode, payload);
        req.session.bannerMessage = 'Non-sitting day added';
        return res.redirect(app.namedRoutes.build('administration.non-sitting-days.get'));

      } catch (err) {
        app.logger.crit('Failed to add non sitting day', {
          userId: req.session.authentication.login,
          jwt: req.session.authToken,
          data: payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        if (err.statusCode === 422 && err.error?.code === 'DAY_ALREADY_EXISTS') {
          req.session.errors = makeManualError('nonSittingDay', `Non-sitting day already exists for ${req.session.authentication.locCode} on ${req.body.nonSittingDate}`);
            req.session.formFields = req.body;
            return res.redirect(app.namedRoutes.build('administration.add-non-sitting-days.get',));
        }
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

      const date = dateFilter(req.body.nonSittingDate, null, 'YYYY-MM-DD');

      try {
        await nonSittingDayDAO.delete(req, req.session.authentication.locCode, date);
        req.session.bannerMessage = 'Non-sitting day deleted';
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
