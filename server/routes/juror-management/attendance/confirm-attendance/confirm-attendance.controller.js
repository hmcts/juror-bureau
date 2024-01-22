(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , checkInOutTimeValidator = require('../../../../config/validation/check-in-out-time')
    , { convertAmPmToLong, timeArrayToString, convert12to24 } = require('../../../../components/filters')
    , { jurorAttendanceDao } = require('../../../../objects/juror-attendance');


  module.exports.getConfirmAttendance = function(app) {
    return async function(req, res) {
      let processUrl
        , cancelUrl
        , attendanceDate = req.session.attendanceListDate;

      processUrl = app.namedRoutes.build('juror-management.attendance.confirm-attendance.post');
      cancelUrl = app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate;

      try {
        const body = {
          commonData: {
            tag: 'NOT_CHECKED_OUT',
            attendanceDate,
            locationCode: req.session.authentication.owner,
          },
        };
        const response = await jurorAttendanceDao.get(app, req, body);
        const jurorsNotCheckedOut = response.details;

        if (jurorsNotCheckedOut.length) {
          req.session.jurorsNotCheckedOut = jurorsNotCheckedOut;
          return res.redirect(
            app.namedRoutes.build('juror-management.attendance.confirm-attendance.not-checked-out.get')
          );
        }
      } catch (err) {
        app.logger.crit('Failed to fetch not checked out jurors', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: body,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }

      try {
        const body = {
          commonData: {
            tag: 'CONFIRM_ATTENDANCE',
            attendanceDate,
            locationCode: req.session.authentication.owner,
          },
        };
        const response = await jurorAttendanceDao.get(app, req, body);
        const jurorsNotCheckedIn = response.details;

        return res.render('juror-management/attendance/confirm-attendance', {
          checkedIn: response.summary.checkedIn,
          jurorsNotCheckedIn,
          attendanceDate,
          processUrl,
          cancelUrl,
        });
      } catch (err) {
        app.logger.crit('Failed to fetch jurors marked as not attending / not checked in', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: body,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  // Will make call to backend to confirm jurors' attendance on that day
  module.exports.postConfirmAttendance = function(app) {
    return async function(req, res) {
      const attendanceDate = req.session.attendanceListDate;

      const payload = {
        commonData: {
          status: 'CONFIRM_ATTENDANCE',
          attendanceDate: attendanceDate,
          locationCode: req.session.authentication.owner,
          singleJuror: false,
        },
        jurors: [],
      };

      try {
        await jurorAttendanceDao.patch(app, req, payload);

        return res.redirect(app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate);
      } catch (err) {
        app.logger.crit('Failes to confir the attendance', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.getNotCheckedOut = function(app) {
    return function(req, res) {
      let processUrl
        , cancelUrl
        , tmpErrors = _.clone(req.session.errors)
        , tmpBody = _.clone(req.session.formFields)
        , attendanceDate = req.session.attendanceListDate
        , jurorsNotCheckedOut = req.session.jurorsNotCheckedOut;

      delete req.session.errors;
      delete req.session.formFields;

      processUrl = app.namedRoutes.build('juror-management.attendance.confirm-attendance.not-checked-out.post');
      cancelUrl = app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate;

      const checkOutTime = {
        hour: typeof tmpBody !== 'undefined' ? tmpBody.checkOutTimeHour : '',
        minute: typeof tmpBody !== 'undefined' ? tmpBody.checkOutTimeMinute : '',
        period: typeof tmpBody !== 'undefined' ? tmpBody.checkOutTimePeriod : '',
      };

      return res.render('juror-management/attendance/not-checked-out', {
        notCheckedOut: jurorsNotCheckedOut,
        attendanceDate,
        checkOutTime,
        processUrl,
        cancelUrl,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postNotCheckedOut = function(app) {
    return async function(req, res) {
      let validatorResult
        , jurorsNotCheckedOut = req.session.jurorsNotCheckedOut;
      const checkOutTimeHour = req.body.checkOutTimeHour
        , checkOutTimeMinute = req.body.checkOutTimeMinute
        , checkOutTimePeriod = req.body.checkOutTimePeriod;


      // Check if full time is missing
      validatorResult = validate({checkOutTime: {
        hour: checkOutTimeHour,
        minute: checkOutTimeMinute,
        period: checkOutTimePeriod,
      }}, checkInOutTimeValidator.checkOutTimeEmpty());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(
          'juror-management.attendance.confirm-attendance.not-checked-out.get'
        ));
      }
      // If a time is entered in both fields then validate the seperate inputs
      validatorResult = validate(req.body, checkInOutTimeValidator.checkOutTime());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(
          'juror-management.attendance.confirm-attendance.not-checked-out.get'
        ));
      }

      // Add all not checked out juror numbers to list
      // Ensure that check out time entered is later than all jurors check in times
      const checkOutTime = convertAmPmToLong(checkOutTimeHour + ':' + checkOutTimeMinute + checkOutTimePeriod);

      let checkOutTooEarly = false;
      let notCheckedOutJNs = [];

      jurorsNotCheckedOut.forEach((juror) => {
        notCheckedOutJNs.push(juror.juror_number);
        let checkInTime = convertAmPmToLong(timeArrayToString(juror.check_in_time));

        if (checkOutTime <= checkInTime){
          checkOutTooEarly = true;
        }
      });

      if (checkOutTooEarly) {
        let tmpErrors = {
          checkOutTime: [{
            summary: 'Check out time cannot be earlier than check in time',
            details: 'Check out time cannot be earlier than check in time',
          }],
        };

        req.session.errors = tmpErrors;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(
          'juror-management.attendance.confirm-attendance.not-checked-out.get'
        ));
      }

      const payload = {
        commonData: {
          status: 'CHECK_OUT',
          attendanceDate: req.body.attendanceDate,
          locationCode: req.session.authentication.owner,
          checkOutTime: convert12to24(checkOutTimeHour + ':' + checkOutTimeMinute + checkOutTimePeriod),
          singleJuror: false,
        },
        juror: notCheckedOutJNs,
      };

      try {
        await jurorAttendanceDao.patch(app, req, payload);

        return res.redirect(
          app.namedRoutes.build('juror-management.attendance.confirm-attendance.get')
        );
      } catch (err) {
        app.logger.crit('Failed to checkout the list of jurors', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

})();


