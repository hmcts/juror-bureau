(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , changeTimesValidator = require('../../../../config/validation/change-attendance-times').changeAttendanceTimes;

  module.exports.getChangeTimes = function(app) {
    return function(req, res) {
      let processUrl
        , cancelUrl
        , deleteUrl
        , juror
        , attendanceDate
        , tmpErrors = _.clone(req.session.errors)
        , tmpBody = _.clone(req.session.formFields);
      const jn = req.params.jurorNumber;

      delete req.session.errors;
      delete req.session.formFields;

      // STUBBED
      // Juror detials and check in/out time will come from backend
      juror = {
        jurorNumber: jn,
        firstName: 'First0',
        lastName: 'Last0',
        checkedIn: null,
        checkedOut: null,
      };

      attendanceDate = req.query.date ? req.query.date : req.session.attendanceListDate;

      // Check if user navigated from juror record
      if (req.url.includes('record')) {
        processUrl = app.namedRoutes.build(
          'juror-record.attendance.change-times.post',
          {jurorNumber: juror.jurorNumber}
        );
        cancelUrl = app.namedRoutes.build('juror-record.attendance.get', {jurorNumber: juror.jurorNumber}
        );
      } else {
        processUrl = app.namedRoutes.build(
          'juror-management.attendance.change-times.post',
          {jurorNumber: juror.jurorNumber}
        );
        cancelUrl = app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate;
        deleteUrl = app.namedRoutes.build(
          'juror-management.attendance.delete-attendance.get',
          {jurorNumber: juror.jurorNumber}
        );
      }

      const originalCheckInTime =
        juror.checkedIn !== null
          ? extractTimeString(juror.checkedIn)
          : {hour: '', minute: '', period: ''};

      const originalCheckOutTime =
        juror.checkedOut !== null
          ? extractTimeString(juror.checkedOut)
          : {hour: '', minute: '', period: ''};

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
    return function(req, res) {
      let invalidUrl
        , redirectUrl;
      const checkInTimeHour = req.body.checkInTimeHour
        , checkInTimeMinute = req.body.checkInTimeMinute
        , checkInTimePeriod = req.body.checkInTimePeriod
        , checkOutTimeHour = req.body.checkOutTimeHour
        , checkOutTimeMinute = req.body.checkOutTimeMinute
        , checkOutTimePeriod = req.body.checkOutTimePeriod
        , attendanceDate = _.clone(req.session.attendanceDate);

      delete req.session.attendanceDate;

      // Set up links for correct journey flow
      if (req.url.includes('record')) {
        invalidUrl = app.namedRoutes.build(
          'juror-record.attendance.change-times.post',
          {jurorNumber: req.body.jurorNumber}
        );
        redirectUrl = app.namedRoutes.build('juror-record.attendance.get', {jurorNumber: req.body.jurorNumber});
      } else {
        invalidUrl = app.namedRoutes.build(
          'juror-management.attendance.change-times.get',
          {jurorNumber: req.body.jurorNumber}
        ) + '?date=' + attendanceDate;
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

      // TODO - send request to backend to update jurors attendance times on specified day

      res.redirect(redirectUrl);
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



