(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , checkInOutTimeValidator = require('../../../../config/validation/check-in-out-time')
    , { convertAmPmToLong } = require('../../../../components/filters');


  module.exports.getConfirmAttendance = function(app) {
    return function(req, res) {
      let processUrl
        , cancelUrl
        , checkedIn
        , jurorsNotCheckedIn
        , jurorsNotCheckedOut
        , attendanceDate = req.session.attendanceListDate;

      processUrl = app.namedRoutes.build('juror-management.attendance.confirm-attendance.post');
      cancelUrl = app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate;

      jurorsNotCheckedOut = req.session.dailyAttendanceList.filter(
        attendee => (attendee.checkedIn !== null && attendee.checkedOut === null)
      );

      if (jurorsNotCheckedOut.length) {
        req.session.jurorsNotCheckedOut = jurorsNotCheckedOut;
        return res.redirect(
          app.namedRoutes.build('juror-management.attendance.confirm-attendance.not-checked-out.get')
        );
      }

      // STUBBED
      // Will get jurors eligbile for confirmation from backend
      checkedIn = req.session.dailyAttendanceList.filter(attendee => attendee.checkedIn !== null).length;
      jurorsNotCheckedIn = req.session.dailyAttendanceList.filter(attendee => attendee.checkedIn === null);

      return res.render('juror-management/attendance/confirm-attendance', {
        checkedIn: checkedIn,
        notCheckedIn: jurorsNotCheckedIn,
        attendanceDate,
        processUrl,
        cancelUrl,
      });
    };
  };

  //STUBBED
  // Will make call to backend to confirm jurors' attendance on that day
  module.exports.postConfirmAttendance = function(app) {
    return function(req, res) {
      const attendanceDate = req.session.attendanceListDate;
      const index = req.session.attendanceList.findIndex((obj => obj.date === attendanceDate));

      req.session.attendanceList[index].status = 'Confirmed';

      return res.redirect(app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate);
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
    return function(req, res) {
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
        notCheckedOutJNs.push(juror.jurorNumber);
        let checkInTime = convertAmPmToLong(juror.checkedIn);

        if (checkOutTime <= checkInTime){
          checkOutTooEarly = true;
        }
      });

      if (checkOutTooEarly) {
        let tmpErrors = {checkOutTime: [{
          summary: 'Check out time cannot be earlier than check in time',
          details: 'Check out time cannot be earlier than check in time',
        }]};

        req.session.errors = tmpErrors;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(
          'juror-management.attendance.confirm-attendance.not-checked-out.get'
        ));
      }

      //STUBBED
      // Will make call to backend to add check out times for juror's

      req.session.dailyAttendanceList.forEach((attendee) => {
        if (notCheckedOutJNs.includes(attendee.jurorNumber)) {
          attendee.checkedOut = checkOutTimeHour + ':' + checkOutTimeMinute + checkOutTimePeriod;
        }
      });
      attendanceListSave(app, req, res);
      return res.redirect(app.namedRoutes.build('juror-management.attendance.confirm-attendance.get'));
    };
  };

  // CURRENTLY BEING USED TO MIMIC DATA BEING SAVED TO BACKEND
  // WILL BE UPDATED/REMOVED IN FUTURE
  function attendanceListSave(app, req, res) {
    const date = req.session.attendanceListDate;
    // eslint-disable-next-line max-len
    const index = req.session.attendanceList.findIndex((obj => obj.date === date));

    req.session.attendanceList[index].jurors = req.session.dailyAttendanceList;
    req.session.save();
    return;
  }

})();


