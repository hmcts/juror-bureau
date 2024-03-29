const { dayTypes } = require('../../lib/mod-utils');
const requestObj = require('../../objects/request-pool');

module.exports = function (app) {
  return function (req, res) {
    const successCB = function (data) {
      req.session.errors = {};
      let redirectUri;

      app.logger.info('Checked the type of day for a given court and attendance date: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          locationCode: req.session.poolDetails.courtCode,
          attendanceDate: req.session.tmpDate,
          dayType: data,
        },
      });

      if (data === dayTypes.HOLIDAY) {
        req.session.errors.invalidDate = {
          title: 'The attendance date is a bank holiday',
          reason: 'You’ve selected an attendance date that’s'
            + ' a UK bank holiday. You can continue or go back and change the date.',
        };
      }

      if (data === dayTypes.WEEKEND) {
        req.session.errors.invalidDate = {
          title: 'The attendance date is a weekend',
          reason: 'You’ve selected an attendance date that’s'
            + ' a Saturday or a Sunday. You can continue or go back and change the date.',
        };
      }

      // set the correct redirect uri depending on where the user comes from
      if (req.session.redirectedFrom === 'request-pool.change-attendance-date.post') {
        redirectUri = 'request-pool.pool-details.get';
      } else if (req.session.redirectedFrom === 'request-pool.pool-details.post') {
        redirectUri = 'request-pool.check-details.get';
      } else if (req.session.redirectedFrom === 'nil-pool.change-attendance-date.post') {
        redirectUri = 'nil-pool.get';
      }

      if (typeof req.session.errors.invalidDate !== 'undefined') {
        // because this function will be used also for nil-pool we should then have this extra check
        if (req.session.redirectedFrom === 'nil-pool.change-attendance-date.post') {
          return res.redirect(app.namedRoutes.build('nil-pool.invalid-date.get'));
        }

        return res.redirect(app.namedRoutes.build('request-pool.invalid-date.get'));
      }

      delete req.session.errors;

      return res.redirect(app.namedRoutes.build(redirectUri));
    };
    const errorCB = function (err) {
      app.logger.crit('Failed to check the type of day for a given court and attendance date: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          locationCode: req.session.poolDetails.courtCode,
          attendanceDate: req.session.tmpDate,
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      // if when checking the type of day from nil-pool.change-attendance-date fails
      // we then redirect back to the nil-pool details
      if (req.session.redirectedFrom === 'nil-pool.change-attendance-date.post') {
        return res.redirect(app.namedRoutes.build('nil-pool.get'));
      }

      return res.redirect(app.namedRoutes.build('request-pool.pool-details.get'));
    };

    requestObj.checkDayType.get(
      require('request-promise'),
      app,
      req.session.authToken,
      req.session.poolDetails.courtCode,
      (typeof req.session.tmpDate !== 'undefined') ? req.session.tmpDate : req.session.poolDetails.attendanceDate,
    )
      .then(successCB)
      .catch(errorCB);
  };
};
