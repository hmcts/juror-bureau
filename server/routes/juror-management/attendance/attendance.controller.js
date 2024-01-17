(function() {
  'use strict';

  const _ = require('lodash');
  const { getJurorStatus, padTimeForApi } = require('../../../lib/mod-utils');
  const { convertAmPmToLong, convert12to24 } = require('../../../components/filters');
  const { jurorsAttending } = require('../../../objects/juror-attendance');

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
          jurorNumber: jurorNumber,
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

      const attendee = req.session.dailyAttendanceList.find(a => a.jurorNumber === req.body.jurorNumber);

      if (!attendee) {
        return res.status(404).send('juror not found');
      }

      const checkInTime = convertAmPmToLong(attendee.checkedIn);
      const checkOutTime = convertAmPmToLong(req.body.time);

      if (checkInTime >= checkOutTime) {
        attendee.checkedOut = null;
        return res.status(400).send('check out earlier than check in');
      }

      req.session.dailyAttendanceList.forEach((juror) => {
        if (juror.jurorNumber === req.body.jurorNumber) {
          juror.checkedOut = req.body.time;
        }
      });

      try {
        // TODO: send an api request then respond with the result...
        await apiMock(req.body.jurorNumber);

        attendanceListSave(app, req, res);
        return res.render('juror-management/attendance/unconfirmed/table-row.njk', {
          row: attendee,
        });
      } catch (error) {
        attendee.checkedOut = 'Fail';
        // TODO: this will render a different table row with an api error
        attendanceListSave(app, req, res);
        return res.render('juror-management/attendance/unconfirmed/table-row.njk', {
          row: {
            ...attendee,
            checkedOut: 'Fail',
            kind: 'checkOut',
          },
          error: true,
        });
      }
    };
  };

  module.exports.postCheckOutAllJurors = function(app) {
    return async function(req, res) {

      const attendees = req.session.dailyAttendanceList.filter(a => a.checkedIn !== null);

      const latestStartTime = attendees.reduce(
        (max, juror) => convertAmPmToLong(juror.checkedIn) > max
          ? convertAmPmToLong(juror.checkedIn)
          : max, convertAmPmToLong(attendees[0].checkedIn)
      );
      const checkOutTime = convertAmPmToLong(req.body.time);

      if (latestStartTime >= checkOutTime) {
        return res.status(400).send('check out earlier than check in');
      }

      req.session.dailyAttendanceList.forEach((attendee) => {
        if (attendee.checkedIn !== null) {
          attendee.checkedOut = req.body.time;
        }
      });

      new Promise((resolve, reject) => {
        attendees.forEach(async(attendee, index, array) => {
          try {
            await apiMock(attendee.jurorNumber);
            if (index === array.length - 1) resolve();
          } catch (error) {
            let objIndex = req.session.dailyAttendanceList.findIndex((obj => obj.jurorNumber === attendee.jurorNumber));

            req.session.dailyAttendanceList[objIndex].checkedOut = 'Fail';
            if (index === array.length - 1) resolve();
          }
        });
      }).then(() => {
        const listedJurors = req.session.dailyAttendanceList.filter(attendee => attendee.checkedIn !== null);

        attendanceListSave(app, req, res);
        return res.render('juror-management/attendance/unconfirmed/table-rows.njk', {
          listedJurors,
        });
      });
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
      let processUrl
        , cancelUrl
        , selectedJuror;

      const jn = req.params.jurorNumber;
      const attendanceDate = req.session.attendanceListDate;

      processUrl = app.namedRoutes.build('juror-management.attendance.delete-attendance.post'
        , {jurorNumber: req.params.jurorNumber});
      cancelUrl = app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate;

      //STUBBED
      // Will get jurors details from backend
      selectedJuror = req.session.dailyAttendanceList.find(a => a.jurorNumber === jn);

      return res.render('juror-management/attendance/delete-attendance', {
        selectedJuror,
        attendanceDate,
        processUrl,
        cancelUrl,
      });
    };
  };

  module.exports.postDeleteAttendance = function(app) {
    return function(req, res) {
      const attendanceDate = req.session.attendanceListDate;

      //STUBBED
      // Will make call to backend to delete jurors attendance on that day
      req.session.dailyAttendanceList.forEach((attendee) => {
        if (attendee.jurorNumber === req.body.jurorNumber) {
          attendee.checkedIn = null;
          attendee.checkedOut = null;
        }
      });
      attendanceListSave(app, req, res);

      res.redirect(app.namedRoutes.build('juror-management.attendance.get') + '?date=' + attendanceDate);
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

  // TODO: To be replaced by an api call
  function apiMock(jn) {
    const failingJn = ['100000004', '100000005'];

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (failingJn.includes(jn)) {
          return reject(new Error('some error...'));
        }

        resolve();
      }, 300);
    });
  }

})();



