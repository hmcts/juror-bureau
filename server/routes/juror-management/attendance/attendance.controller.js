(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const checkOutAllValidator = require('../../../config/validation/check-out-all-jurors');
  const { getJurorStatus, padTimeForApi, mapCamelToSnake, makeManualError } = require('../../../lib/mod-utils');
  const { convertAmPmToLong, convert12to24, timeArrayToString,
    timeStringToArray } = require('../../../components/filters');
  const { jurorsAttending, jurorAttendanceDao, updateJurorAttendanceDAO } = require('../../../objects/juror-attendance');
  const { runPoliceCheckDAO } = require('../../../objects');
  const { Logger } = require('../../../components/logger');
  const { modifyJurorAttendance } = require('../../../objects');
  const { isCourtUser, isSJOUser, isCourtManager } = require('../../../components/auth/user-type');
  
  const canRecordAttendance = (req) => isCourtUser(req) && !(isSJOUser(req) && !isCourtManager(req));

  module.exports.postCheckIn = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.body;

      const payload = {
        'juror_number': jurorNumber,
        'location_code': req.session.authentication.locCode,
        'attendance_date': req.session.attendanceListDate,
        'check_in_time': padTimeForApi(convert12to24(req.body.time)),
        'appearance_stage': 'CHECKED_IN',
      };

      try {
        let attendee = await jurorsAttending.put(
          req,
          payload,
        );

        attendee = _.mapKeys(attendee, (__, key) => _.camelCase(key));
        attendee.jurorStatus = getJurorStatus(attendee.jurorStatus);

        req.session.dailyAttendanceList.push(attendee);

        Logger.instance.info('Successfully checked in juror', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: { payload, response: attendee },
        });

        return res.render('juror-management/attendance/unconfirmed/table-row.njk', {
          row: attendee,
          canRecordAttendance: canRecordAttendance(req),
        });
      } catch (err) {
        if (err.statusCode === 404) {
          return res.status(404).send('juror not found');
        }

        const attendee = {
          jurorNumber,
          firstName: '-',
          lastName: '-',
          jurorStatus: '-',
          checkInTime: 'Fail',
          kind: 'checkIn',
        };

        Logger.instance.crit('Failed to check in juror', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: { payload },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('juror-management/attendance/unconfirmed/table-row.njk', {
          row: attendee,
          canRecordAttendance: canRecordAttendance(req),
          error: true,
        });
      }
    };
  };

  module.exports.postCheckOut = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.body;

      const attendee = req.session.dailyAttendanceList.find(
        (a) => a.jurorNumber === jurorNumber,
      );

      if (!attendee || !attendee.checkInTime) {
        return res.status(422).send('JUROR_NOT_CHECKED_IN');
      }

      if (attendee.checkOutTime) {
        return res.status(422).send('JUROR_ALREADY_CHECKED_OUT');
      }

      const checkInTime = convertAmPmToLong(timeArrayToString(attendee.checkInTime));
      const checkOutTime = convertAmPmToLong(req.body.time);

      if (checkInTime >= checkOutTime) {
        return res.status(422).send('CHECK_OUT_TIME_BEFORE_CHECK_IN_TIME');
      }

      const payload = {
        'juror_number': jurorNumber,
        'location_code': req.session.authentication.locCode,
        'attendance_date': req.session.attendanceListDate,
        'check_out_time': padTimeForApi(convert12to24(req.body.time)),
        'appearance_stage': 'CHECKED_OUT',
        'juror_in_waiting': true
      };

      try {
        await jurorsAttending.put(
          req,
          payload,
        );

        attendee.checkOutTime = req.body.time;
        req.session.dailyAttendanceList.forEach((a) => {
          if (a.jurorNumber === jurorNumber) {
            a.checkOutTime = timeStringToArray(req.body.time);
            a.appStage = 'CHECKED_OUT';
          }
        });

        Logger.instance.info('Successfully checked out juror', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: { payload },
        });

        return res.render('juror-management/attendance/unconfirmed/table-row.njk', {
          row: attendee,
          canRecordAttendance: canRecordAttendance(req),
        });
      } catch (err) {
        if (err.statusCode === 404) {
          return res.status(404).send('JUROR_NOT_FOUND');
        }

        Logger.instance.crit('Failed to check out juror', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: { payload },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.status(400).send('FAILED_TO_CHECK_OUT');
      }
    };
  };

  module.exports.postCheckOutAllJurors = function(app) {
    return async function(req, res) {
      const attendanceDate = req.session.attendanceListDate;
      const attendees = req.session.dailyAttendanceList
        .filter(a => a.checkInTime !== null && a.checkOutTime === null);

      const jurors = attendees.reduce((list, juror) => {
        if (juror.jurorStatus !== 'Panel' && juror.checkOutTime === null) {
          list.push(juror.jurorNumber);
        }
        return list;
      }, []);

      // TODO: block when check out is earlier than check in
      const latestStartTime = attendees.reduce((time, attendee) => {
        const _time = +convertAmPmToLong(timeArrayToString(attendee.checkInTime));

        return _time >= time ? _time : time;
      }, 0);

      let validatorResult = validate(req.body, checkOutAllValidator.checkOutAllJurors());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate);
      };

      req.body.time = req.body.checkOutTimeHour.concat(':', req.body.checkOutTimeMinute)
        .concat('', req.body.checkOutTimePeriod);

      const checkOutTime = convertAmPmToLong(req.body.time);

      if (latestStartTime >= checkOutTime) {
        req.session.formFields = req.body;
        req.session.errors = makeManualError('checkOutTimeHour', 'Check out time cannot be earlier than check in time')
        return res.redirect(app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate);
      }

      let panelledJurors = [];

      req.session.dailyAttendanceList.forEach((attendee) => {
        if (attendee.checkOutTime !== null) {
          attendee.checkOutTime = req.body.time;
        }
        if (attendee.jurorStatus === 'Panel' && attendee.checkOutTime === null) {
          panelledJurors.push(attendee.jurorNumber);
        }
      });

      const payload = {
        commonData: {
          status: 'CHECK_OUT',
          attendanceDate: attendanceDate,
          locationCode: req.session.authentication.locCode,
          checkOutTime: padTimeForApi(convert12to24(req.body.time)),
          singleJuror: false,
        },
        juror: jurors,
      };

      try {
        await updateJurorAttendanceDAO.patch(
          req,
          payload,
        );

        if (panelledJurors.length > 0) {
          req.session.checkOutPanelled = {
            panelledJurors,
            payload,
            checkOutTime: req.body.time,
          };
          return res.redirect(app.namedRoutes.build('juror-management.check-out-panelled.get'));
        };

        return res.redirect(app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate);
      } catch (err) {
        app.logger.crit('Failed when trying to check all jurors out', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.getCheckOutPanelledJurors = function(app) {
    return function(req, res) {
      const attendanceDate = req.session.attendanceListDate;
      const panelledJurorNo = req.session.checkOutPanelled.panelledJurors;
      const time = req.session.checkOutPanelled.checkOutTime;

      const panelledJurors = req.session.dailyAttendanceList.filter(
        (juror) => panelledJurorNo.includes(juror.jurorNumber),
      );

      return res.render('juror-management/attendance/check-out-panelled.njk', {
        panelledJurors,
        panelledJurorNo: JSON.stringify(panelledJurorNo),
        time,
        processUrl: app.namedRoutes.build('juror-management.check-out-panelled.post'),
        cancelUrl: app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate,
      });
    };
  };

  module.exports.postCheckOutPanelledJurors = function(app) {
    return async function(req, res) {
      const attendanceDate = req.session.attendanceListDate;

      const payload = _.cloneDeep(req.session.checkOutPanelled.payload);

      payload.commonData.status = 'CHECK_OUT_PANELLED';

      try {
        await updateJurorAttendanceDAO.patch(
          req,
          payload,
        );

        return res.redirect(app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate);
      } catch (err) {
        app.logger.crit('Failed when trying to check all panelled jurors out', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: req.session.checkOutPanelled.payload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      };
    };
  };

  module.exports.getDeleteAttendance = function(app) {
    return function(req, res) {
      const { jurorNumber } = req.params;
      const attendanceDate = req.session.attendanceListDate;

      const processUrl = app.namedRoutes.build('juror-management.attendance.delete-attendance.post', {
        jurorNumber,
      });
      const cancelUrl = app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate;

      // TODO: revise this way of getting the juror
      const selectedJuror = req.session.dailyAttendanceList.find(a => a.jurorNumber === jurorNumber);

      return res.render('juror-management/attendance/delete-attendance', {
        selectedJuror,
        attendanceDate,
        processUrl,
        cancelUrl,
      });
    };
  };

  module.exports.postDeleteAttendance = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.params;
      const attendanceDate = req.session.attendanceListDate;

      try {
        const absencePayload = {
          'jurorNumber': jurorNumber,
          'attendanceDate': attendanceDate,
          'modifyAttendanceType': 'ABSENCE',
        };

        await modifyJurorAttendance.patch(req, mapCamelToSnake(absencePayload));

        res.redirect(app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate);
      } catch (err) {
        app.logger.crit('Unable to delete the jurors attendance', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: absencePayload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postRunPoliceCheck = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.params;

      try {
        await runPoliceCheckDAO.patch(req, jurorNumber);

        app.logger.info('Successfully initiated a police check', {
          auth: req.session.authentication,
          data: { jurorNumber },
        });

        return res.send();
      } catch (err) {
        app.logger.crit('Failed to run police check', {
          auth: req.session.authentication,
          data: { jurorNumber },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.status(err.statusCode).send();
      }
    };
  };

})();



