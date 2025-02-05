(function() {
  'use strict';

  const _ = require('lodash')
    , { dateFilter } = require('../../../../components/filters')
    , validate = require('validate.js')
    , { convertTimeToHHMM, makeManualError } = require('../../../../lib/mod-utils')
    , attendanceDateValidator = require('../../../../config/validation/add-attendance')
    , { jurorAddAttendanceDao } = require('../../../../objects/juror-attendance');

  module.exports.getAddAttendanceDate = function(app) {
    return async function(req, res) {

      let tmpErrors = _.clone(req.session.errors)
        , tmpFields = _.clone(req.session.formFields)
        , { jurorNumber, poolNumber } = req.params;
      let cancelUrl = app.namedRoutes.build('juror-record.attendance.get', {
        jurorNumber,
      });
      let postUrl = app.namedRoutes.build('juror-record.attendance.add-attendance-date.post', {
        jurorNumber,
        poolNumber,
      });
      const checkInTime = {
        hour: typeof tmpFields !== 'undefined' ? tmpFields.checkInTimeHour : '',
        minute: typeof tmpFields !== 'undefined' ? tmpFields.checkInTimeMinute : '',
        period: typeof tmpFields !== 'undefined' ? tmpFields.checkInTimePeriod : '',
      };
      const checkOutTime = {
        hour: typeof tmpFields !== 'undefined' ? tmpFields.checkOutTimeHour : '',
        minute: typeof tmpFields !== 'undefined' ? tmpFields.checkOutTimeMinute : '',
        period: typeof tmpFields !== 'undefined' ? tmpFields.checkOutTimePeriod : '',
      };

      delete req.session.errors;
      delete req.session.formFields;

      if (jurorNumber !== req.session.jurorCommonDetails.jurorNumber) {

        app.logger.crit('Juror number does not match cached data', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber: {
              url: jurorNumber,
              cached: req.session.jurorCommonDetails.jurorNumber,
            },
          },
        });

        return res.render('_errors/generic');
      }

      return res.render('juror-management/attendance/add-attendance', {
        cancelUrl,
        postUrl,
        tmpFields,
        checkInTime,
        checkOutTime,
        errors: {
          title: 'There is a problem',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postAddAttendanceDate = (app) => {
    return async function(req, res) {
      const { jurorNumber } = req.params;
      let bannerMessage;

      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }

      delete req.session.bannerMessage;

      const attendanceDateValidation = validate(req.body, attendanceDateValidator.attendanceDay());
      const attendanceTimeValidation = validate(req.body, attendanceDateValidator.attendanceTime());

      const validatorResult = {};

      if (typeof attendanceDateValidation !== 'undefined') {
        validatorResult.attendanceDay = attendanceDateValidation.attendanceDay;
      };

      if (typeof attendanceTimeValidation !== 'undefined') {
        validatorResult.checkInTime = attendanceTimeValidation.checkInTime;
        validatorResult.checkOutTime = attendanceTimeValidation.checkOutTime;
      };

      let errorUrl = app.namedRoutes.build('juror-record.attendance.add-attendance-date.get', {
        jurorNumber,
      });
      let successUrl = app.namedRoutes.build('juror-record.attendance.get', {
        jurorNumber,
        bannerMessage,
      });

      if (Object.keys(validatorResult).length) {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(errorUrl);
      }

      try {
        const payload = {
          'jurorNumber': jurorNumber,
          'poolNumber': req.session.jurorCommonDetails.poolNumber,
          'locationCode': req.session.authentication.locCode,
          'attendanceDate': dateFilter(req.body.attendanceDay, 'DD/MM/YYYY', 'YYYY-MM-DD'),
          'checkInTime': convertTimeToHHMM(req.body.checkInTimeHour,
            req.body.checkInTimeMinute, req.body.checkInTimePeriod),
          'checkOutTime': convertTimeToHHMM(req.body.checkOutTimeHour,
            req.body.checkOutTimeMinute, req.body.checkOutTimePeriod),
        };

        await jurorAddAttendanceDao.post(req, payload);
        req.session.bannerMessage = 'Attendance date added';

        return res.redirect(successUrl);
      } catch (err) {
        app.logger.crit('Failed to add an attendance day for juror', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        if (err.statusCode === 422 && err.error.code === 'INVALID_JUROR_POOL_LOCATION') {
          req.session.errors = makeManualError(
            'invalidData', 
            'This juror belongs to either the primary or satellite court in your area.'
            + ' You must add the attendance for the court location.'
            + ' Please log back in as the correct court to add this attendance'
          )
        } else {
          req.session.errors = makeManualError('invalidData', err.error.message ? err.error.message : 'Could not add attendance date');
        }

        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('juror-record.attendance.add-attendance-date.get', {
          jurorNumber,
        }));
      }

    };
  };

})();



