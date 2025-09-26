(function() {
  'use strict';

  const _ = require('lodash');
  const { dateFilter, convert12to24 } = require('../../../../components/filters');
  const { validate } = require('validate.js');
  const { changeAttendanceTimes } = require('../../../../config/validation/change-attendance-times');
  const { unconfirmedJurorAttendancesDAO, confirmJurorAttendanceDAO } = require('../../../../objects');
  const { makeManualError } = require('../../../../lib/mod-utils');

  module.exports.getUnconfirmedAttendances = function(app) {
    return async function(req, res) {
      const { date } = req.query;
      const selectedDate = date ? new Date(date) : new Date();
      const locCode = req.session.authentication.locCode;

      let bannerMessage;
      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }
      delete req.session.bannerMessage;

      try {
        const unconfirmedJurors = await unconfirmedJurorAttendancesDAO.get(req, locCode, date);
      
        return res.render('juror-management/attendance/unconfirmed-attendances', {
          
          date: date || dateFilter(new Date(), null, 'yyyy-MM-DD'),
          selectedDate: dateFilter(selectedDate, null, 'dddd D MMMM YYYY'),
          unconfirmedJurors,
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('juror-management.attendance.get') + `${date ? `?date=${date}` : ''}`,
          },
          bannerMessage
        });
      } catch (err) {
        app.logger.crit('Failed to fetch list of unconfirmed attendances court details', {
          auth: req.session.authentication,
          data: {
            locCode,
            date,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postUpdateAttendance = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.params;
      const { date } = req.query;
      const checkInTimeHour = req.body.checkInTimeHour;
      const checkInTimeMinute = req.body.checkInTimeMinute;
      const checkInTimePeriod = req.body.checkInTimePeriod;
      const checkOutTimeHour = req.body.checkOutTimeHour;
      const checkOutTimeMinute = req.body.checkOutTimeMinute;
      const checkOutTimePeriod = req.body.checkOutTimePeriod;

      let validatorResult = validate({
        checkInTime: {
          hour: checkInTimeHour,
          minute: checkInTimeMinute,
          period: checkInTimePeriod,
        },
        checkOutTime: {
          hour: checkOutTimeHour,
          minute: checkOutTimeMinute,
          period: checkOutTimePeriod,
          isMandatory: true,
        },
      }, changeAttendanceTimes());

      let completeValidatorResult = {};

      if (typeof validatorResult !== 'undefined') {
        if (typeof validatorResult.checkInTime !== 'undefined') {
          completeValidatorResult = validatorResult.checkInTime[0];
        }

        if (typeof validatorResult.checkOutTime !== 'undefined') {
          completeValidatorResult = Object.assign(completeValidatorResult, validatorResult.checkOutTime[0]);
        }
      }

      if (!_.isEmpty(completeValidatorResult)) {
        req.session.errors = completeValidatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('juror-management.attendance.unconfirmed-attendances.update.get', { jurorNumber }) + `${date ? `?date=${date}` : ''}`);
      }

      const payload = {
        "juror_number": jurorNumber,
        "attendanceDate": date,
        "locationCode": req.session.authentication.locCode,
        "checkInTime": convert12to24(checkInTimeHour + ':' + checkInTimeMinute + checkInTimePeriod),
        "checkOutTime": convert12to24(checkOutTimeHour + ':' + checkOutTimeMinute + checkOutTimePeriod)
      }

      try {
        await confirmJurorAttendanceDAO.patch(req, payload)

        req.session.bannerMessage = `Attendance confirmed for juror <a href='${app.namedRoutes.build('juror-record.overview.get', { jurorNumber })}' class='govuk-link'>${jurorNumber}</a>`;

        return res.redirect(app.namedRoutes.build('juror-management.attendance.unconfirmed-attendances.get') + `${date ? `?date=${date}` : ''}`);
      } catch (err) {
        app.logger.crit('Failed to confirm juror\'s attendance', {
          auth: req.session.authentication,
          data: payload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        if (err.statusCode === 422 && err.error.statusCode === 'code=INVALID_JUROR_STATUS') {
          req.session.errors = makeManualError('status', err.error.message);
          req.session.formFields = req.body;
          return res.redirect(app.namedRoutes.build('juror-management.attendance.unconfirmed-attendances.update.get', { jurorNumber }) + `${date ? `?date=${date}` : ''}`);
        }

        return res.render('_errors/generic', { err });
      }
    };
  };

})();