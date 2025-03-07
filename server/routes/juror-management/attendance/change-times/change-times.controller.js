(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , changeTimesValidator = require('../../../../config/validation/change-attendance-times').changeAttendanceTimes
    , { jurorAttendanceDao, updateJurorAttendanceDAO } = require('../../../../objects/juror-attendance')
    , { convert12to24, convert24to12, timeArrayToString } = require('../../../../components/filters')
    , { replaceAllObjKeys, makeManualError } = require('../../../../lib/mod-utils');

  module.exports.getChangeTimes = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.params;
      let processUrl;
      let cancelUrl;
      let deleteUrl;
      let attendanceDate;
      let tmpErrors = _.clone(req.session.errors);
      let tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      try {
        attendanceDate = req.query.date ? req.query.date : req.session.attendanceListDate;

        const body = {
          commonData: {
            tag: 'JUROR_NUMBER',
            attendanceDate,
            locationCode: req.session.authentication.locCode,
            singleJuror: true,
          },
          juror: [jurorNumber],
        };

        const data = await jurorAttendanceDao.post(req, body);
        const juror = replaceAllObjKeys(data.details[0], _.camelCase);

        if (!juror) {
          app.logger.crit('Failed to find a juror with that juror number', {
            userId: req.session.authentication.login,
            jwt: req.session.authToken,
            error: 'The juror number in the url does not match the juror selected to change the times',
          });

          return res.render('_errors/generic');
        }

        // Check if user navigated from juror record
        if (req.url.includes('record')) {
          processUrl = app.namedRoutes.build('juror-record.attendance.change-times.post', {
            jurorNumber: juror.jurorNumber,
          });
          cancelUrl = app.namedRoutes.build('juror-record.attendance.get', {
            jurorNumber: juror.jurorNumber,
          });
          req.session.jurorNameChangeAttendance = juror.firstName + ' ' + juror.lastName;
        } else if (req.url.includes('attendance/unconfirmed-attendances')) {
          processUrl = app.namedRoutes.build('juror-management.attendance.unconfirmed-attendances.update.post', {
            jurorNumber: juror.jurorNumber,
          }) + '?date=' + attendanceDate;
          cancelUrl = app.namedRoutes.build('juror-management.attendance.unconfirmed-attendances.get') + '?date=' + attendanceDate;
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
          caption: req.url.includes('attendance/unconfirmed-attendances') ? 'Unconfirmed Attendance' : 'Attendance',
          submitButtonText: req.url.includes('attendance/unconfirmed-attendances') ? 'Confirm attendance' : 'Save changes'
        });
      } catch (err) {
        app.logger.crit('Failed to fetch attendance records for given day and juror number', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }

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

      const payload = {
        commonData: {
          status: '',
          attendanceDate,
          locationCode: req.session.authentication.locCode,
          singleJuror: true,
        },
        juror: [jurorNumber],
      };
      let checkInTime, checkOutTime;
      let status;

      if (checkInTimeHour && checkInTimeMinute && checkInTimePeriod) {
        checkInTime = convert12to24(checkInTimeHour + ':' + checkInTimeMinute + checkInTimePeriod);
        payload.commonData.checkInTime = checkInTime;
        status = 'CHECK_IN';
      }
      if (checkOutTimeHour && checkOutTimeMinute && checkOutTimePeriod) {
        checkOutTime = convert12to24(checkOutTimeHour + ':' + checkOutTimeMinute + checkOutTimePeriod);
        payload.commonData.checkOutTime = checkOutTime;
        status = status === 'CHECK_IN' ? 'CHECK_IN_AND_OUT' : 'CHECK_OUT';
      }
      payload.commonData.status = status;

      try {
        await updateJurorAttendanceDAO.patch(
          req,
          payload,
        );

        app.logger.info('Updated juror\'s attendance times', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            ...payload,
          },
        });

        return res.redirect(redirectUrl);
      } catch (err) {
        app.logger.crit('Unable to update the juror attendance times', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            ...payload,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        if (err.statusCode === 422 && err.error.code === 'CANNOT_UPDATE_CONFIRMED_ATTENDANCE') {
          req.session.errors = makeManualError('invalidAttendance', 'You cannot update a confirmed attendance, please make any changes to this attendance from the juror record');
          req.session.formFields = req.body;
          return res.redirect(invalidUrl);
        }

        return res.render('_errors/generic', { err });
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



