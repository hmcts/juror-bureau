(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , changeTimesValidator = require('../../../../config/validation/change-attendance-times').changeAttendanceTimes
    , { jurorAttendanceDao } = require('../../../../objects/juror-attendance')
    , { convert12to24, convert24to12, timeArrayToString } = require('../../../../components/filters');

  module.exports.getChangeTimes = function(app) {
    return function(req, res) {
      const { jurorNumber } = req.params;
      let processUrl
        , cancelUrl
        , deleteUrl
        , attendanceDate
        , tmpErrors = _.clone(req.session.errors)
        , tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      const juror = req.session.dailyAttendanceList.find(attendee => attendee.jurorNumber === jurorNumber);

      if (!juror) {
        app.logger.crit('Failed to find a juror with that juror number', {
          userId: req.session.authentication.login,
          jwt: req.session.authToken,
          error: 'The juror number in the url does not match the juror selected to change the times',
        });

        return res.render('_errors/generic');
      }

      attendanceDate = req.query.date ? req.query.date : req.session.attendanceListDate;

      // Check if user navigated from juror record
      if (req.url.includes('record')) {
        processUrl = app.namedRoutes.build('juror-record.attendance.change-times.post', {
          jurorNumber: juror.jurorNumber,
        });
        cancelUrl = app.namedRoutes.build('juror-record.attendance.get', {
          jurorNumber: juror.jurorNumber,
        });
      } else {
        processUrl = app.namedRoutes.build('juror-management.attendance.change-times.post', {
          jurorNumber: juror.jurorNumber,
        });
        cancelUrl = app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate;
        deleteUrl = app.namedRoutes.build('juror-management.attendance.delete-attendance.get', {
          jurorNumber: juror.jurorNumber,
        });
      }

      const originalCheckInTime =
        juror.checkInTime !== null
          ? extractTimeString(convert24to12(timeArrayToString(juror.checkInTime)))
          : { hour: '', minute: '', period: '' };

      const originalCheckOutTime =
        juror.checkOutTime !== null
          ? extractTimeString(convert24to12(timeArrayToString(juror.checkOutTime)))
          : { hour: '', minute: '', period: '' };

      const checkInTime = {
        hour: typeof tmpBody !== 'undefined' ? tmpBody.checkInTimeHour : originalCheckInTime.hour,
        minute: typeof tmpBody !== 'undefined' ? tmpBody.checkInTimeMinute : originalCheckInTime.minute,
        period: typeof tmpBody !== 'undefined' ? tmpBody.checkInTimePeriod : originalCheckInTime.period,
      };
      const checkOutTime = {
        hour: typeof tmpBody !== 'undefined' ? tmpBody.checkOutTimeHour : originalCheckOutTime.hour,
        minute: typeof tmpBody !== 'undefined' ? tmpBody.checkOutTimeMinute : originalCheckOutTime.minute,
        period: typeof tmpBody !== 'undefined' ? tmpBody.checkOutTimePeriod : originalCheckOutTime.period,
      };

      req.session.attendanceDate = attendanceDate;

      return res.render('juror-management/attendance/change-times', {
        selectedJuror: juror,
        attendanceDate: attendanceDate,
        processUrl,
        cancelUrl,
        deleteUrl,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        checkInTime,
        checkOutTime,
      });
    };
  };

  module.exports.postChangeTimes = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.params;
      const checkInTimeHour = req.body.checkInTimeHour
        , checkInTimeMinute = req.body.checkInTimeMinute
        , checkInTimePeriod = req.body.checkInTimePeriod
        , checkOutTimeHour = req.body.checkOutTimeHour
        , checkOutTimeMinute = req.body.checkOutTimeMinute
        , checkOutTimePeriod = req.body.checkOutTimePeriod
        , attendanceDate = _.clone(req.session.attendanceDate);
      let invalidUrl, redirectUrl;

      delete req.session.attendanceDate;

      // Set up links for correct journey flow
      if (req.url.includes('record')) {
        invalidUrl = app.namedRoutes.build('juror-record.attendance.change-times.post', {
          jurorNumber,
        });
        redirectUrl = app.namedRoutes.build('juror-record.attendance.get', {
          jurorNumber,
        });
      } else {
        invalidUrl = app.namedRoutes.build('juror-management.attendance.change-times.get', {
          jurorNumber,
        }) + '?date=' + attendanceDate;
        redirectUrl = app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate;
      }

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
        },
      }, changeTimesValidator());

      let completeValidatorResult = {};

      if (typeof validatorResult !== 'undefined') {
        // Validator returns nested result therefore is resturctured
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
        return res.redirect(invalidUrl);
      }

      const promiseArray = [];
      const payload = {
        commonData: {
          status: 'CHECK_IN', // default property
          attendanceDate,
          locationCode: req.session.authentication.owner,
          singleJuror: true,
        },
        juror: [],
      };
      let checkInTime, checkOutTime,
        checkInPayload = {}, checkOutPayload = {}; // initiated to be iterated even if not set

      if (checkInTimeHour && checkInTimeMinute && checkInTimePeriod) {
        checkInPayload = _.cloneDeep(payload);

        checkInTime = convert12to24(checkInTimeHour + ':' + checkInTimeMinute + checkInTimePeriod);

        checkInPayload.commonData.checkInTime = checkInTime;
        checkInPayload.juror.push(jurorNumber);

        promiseArray.push(jurorAttendanceDao.patch(
          app,
          req,
          checkInPayload,
        ));
      }
      if (checkOutTimeHour && checkOutTimeMinute && checkOutTimePeriod) {
        checkOutPayload = _.cloneDeep(payload);

        checkOutTime = convert12to24(checkOutTimeHour + ':' + checkOutTimeMinute + checkOutTimePeriod);

        checkOutPayload.commonData.status = 'CHECK_OUT';
        checkOutPayload.commonData.checkOutTime = checkOutTime;
        checkOutPayload.juror.push(jurorNumber);

        promiseArray.push(jurorAttendanceDao.patch(
          app,
          req,
          checkOutPayload,
        ));
      }

      try {
        await Promise.all(promiseArray);
        return res.redirect(redirectUrl);
      } catch (err) {
        app.logger.crit('Unable to update the juror attendance times', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            ...checkInPayload,
            ...checkOutPayload,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  function extractTimeString(timeString) {
    const timeObj = {
      hour: timeString.match(/\d+/g)[0],
      minute: timeString.match(/\d+/g)[1],
      period: timeString.match(/(am|pm)/g)[0],
    };

    return timeObj;
  }


})();



