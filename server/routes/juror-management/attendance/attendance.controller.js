(function() {
  'use strict';

  const _ = require('lodash');
  const { getJurorStatus, padTimeForApi } = require('../../../lib/mod-utils');
  const { convertAmPmToLong, convert12to24, timeArrayToString } = require('../../../components/filters');
  const { jurorsAttending, jurorAttendanceDao } = require('../../../objects/juror-attendance');

  module.exports.postCheckIn = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.body;

      try {
        let attendee = await jurorsAttending.put(
          require('request-promise'),
          app,
          req.session.authToken,
          {
            'juror_number': jurorNumber,
            'location_code': req.session.authentication.owner,
            'attendance_date': req.session.attendanceListDate,
            'check_in_time': padTimeForApi(convert12to24(req.body.time)),
            'appearance_stage': 'CHECKED_IN',
          }
        );

        attendee = _.mapKeys(attendee, (__, key) => _.camelCase(key));
        attendee.jurorStatus = getJurorStatus(attendee.jurorStatus);

        return res.render('juror-management/attendance/unconfirmed/table-row.njk', {
          row: attendee,
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

        return res.render('juror-management/attendance/unconfirmed/table-row.njk', {
          row: attendee,
          error: true,
        });
      }
    };
  };

  module.exports.postCheckOut = function(app) {
    return async function(req, res) {
      const { jurorNumber } = req.body;

      const attendee = req.session.dailyAttendanceList.find(
        (a) => a.jurorNumber === jurorNumber
      );

      if (!attendee) {
        return res.status(404).send();
      }

      const checkInTime = convertAmPmToLong(timeArrayToString(attendee.checkInTime));
      const checkOutTime = convertAmPmToLong(req.body.time);

      if (checkInTime >= checkOutTime) {
        return res.status(400).send('check out earlier than check in');
      }

      try {
        await jurorsAttending.put(
          require('request-promise'),
          app,
          req.session.authToken,
          {
            'juror_number': jurorNumber,
            'location_code': req.session.authentication.owner,
            'attendance_date': req.session.attendanceListDate,
            'check_out_time': padTimeForApi(convert12to24(req.body.time)),
            'appearance_stage': 'CHECKED_OUT',
          }
        );

        attendee.checkOutTime = req.body.time;
        req.session.dailyAttendanceList.forEach((a) => {
          if (a.jurorNumber === jurorNumber) {
            a.checkOutTime = req.body.time;
            a.appStage = 'CHECKED_OUT';
          }
        });

        return res.render('juror-management/attendance/unconfirmed/table-row.njk', {
          row: attendee,
        });
      } catch (err) {
        if (err.statusCode === 404) {
          return res.status(404).send('juror not found');
        }

        const _attendee = {
          jurorNumber: jurorNumber,
          firstName: '-',
          lastName: '-',
          jurorStatus: '-',
          checkOutTime: 'Fail',
          kind: 'checkOut',
        };

        return res.render('juror-management/attendance/unconfirmed/table-row.njk', {
          row: _attendee,
          error: true,
        });
      }
    };
  };

  module.exports.postCheckOutAllJurors = function(app) {
    return async function(req, res) {
      const attendanceDate = req.session.attendanceListDate;

      const attendees = req.session.dailyAttendanceList
        .filter(a => a.checkInTime !== null && a.checkOutTime === null);

      const jurors = attendees.reduce((list, juror) => {
        list.push(juror.jurorNumber);
        return list;
      }, []);

      // TODO: block when check out is earlier than check in
      const latestStartTime = attendees.reduce((time, attendee) => {
        const _time = +convertAmPmToLong(timeArrayToString(attendee.checkInTime));

        return _time >= time ? _time : time;
      }, 0);

      const checkOutTime = convertAmPmToLong(req.body.time);

      if (latestStartTime >= checkOutTime) {
        return res.status(400).send('check out earlier than check in');
      }

      req.session.dailyAttendanceList.forEach((attendee) => {
        if (attendee.checkOutTime !== null) {
          attendee.checkOutTime = req.body.time;
        }
      });

      const payload = {
        commonData: {
          status: 'CHECK_OUT',
          attendanceDate: attendanceDate,
          locationCode: req.session.authentication.owner,
          checkOutTime: padTimeForApi(convert12to24(req.body.time)),
          singleJuror: false,
        },
        juror: jurors,
      };

      try {
        await jurorAttendanceDao.patch(
          app,
          req,
          payload,
        );

        return res.redirect(app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate);
      } catch (err) {
        app.logger.crit('Failed when trying to check all jurors out', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.getCheckOutPanelledJurors = function(app) {
    return function(req, res) {
      const attendanceDate = req.session.attendanceListDate;
      const panelledJurorNo = ['100000000'];
      const time = '5:30pm';

      const panelledJurors = req.session.dailyAttendanceList.filter(
        (juror) => panelledJurorNo.includes(juror.jurorNumber)
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
    return function(req, res) {
      const attendanceDate = req.session.attendanceListDate;
      const panelledJurorNo = JSON.parse(req.body.panelledJurorNo);

      req.session.dailyAttendanceList.forEach((attendee) => {
        if (panelledJurorNo.includes(attendee.jurorNumber)) {
          attendee.checkedOut = req.body.time;
        }
      });

      const date = req.session.attendanceListDate;
      const index = req.session.attendanceList.findIndex((obj => obj.date === date));

      req.session.attendanceList[index].jurors = req.session.dailyAttendanceList;
      req.session.save();

      return res.redirect(app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate);
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

      const payload = {
        commonData: {
          status: 'DELETE',
          attendanceDate: attendanceDate,
          locationCode: req.session.authentication.owner,
          singleJuror: true,
        },
        juror: [jurorNumber],
      };

      try {
        await jurorAttendanceDao.delete(
          app,
          req,
          payload,
        );

        res.redirect(app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate);
      } catch (err) {
        app.logger.crit('Unable to delete the jurors attendance', {
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



