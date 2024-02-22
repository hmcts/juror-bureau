(function() {
  'use strict';

  const _ = require('lodash');
  const { getJurorStatus } = require('../../lib/mod-utils');
  const dateFilter = require('../../components/filters').dateFilter;
  const { jurorsAttending } = require('../../objects/juror-attendance');

  module.exports.getAttendance = function(app) {
    return async function(req, res) {
      const { status } = req.params;
      const { date, tab } = req.query;
      const dateFormat = 'dddd D MMMM YYYY';
      const tmpErrors = _.cloneDeep(req.session.errors);
      const tmpFields = _.cloneDeep(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      const selectedDate = date ? new Date(date) : new Date();
      const selectedDateString = dateFilter(selectedDate, null, 'YYYY-MM-DD');

      const confirmedTab = tab || 'attended';

      try {
        let { 'juror_appearance_response_data': attendees } = await jurorsAttending.get(
          require('request-promise'),
          app,
          req.session.authToken,
          req.session.authentication.owner,
          selectedDateString,
        );

        attendees = attendees.map((attendee) => {
          attendee['juror_status'] = getJurorStatus(attendee['juror_status']);
          return _.mapKeys(attendee, (__, key) => _.camelCase(key));
        });
        req.session.dailyAttendanceList = typeof attendees !== 'undefined' ? attendees : [];
        req.session.attendanceListDate = selectedDateString;

        const listedJurors = req.session.dailyAttendanceList.filter(attendee => attendee.checkInTime !== null);

        const confirmedJurors = req.session.dailyAttendanceList.filter(
          attendee => (attendee.checkInTime !== null && attendee.checkOutTime !== null)
        );

        const absentJurors = req.session.dailyAttendanceList.filter(
          attendee => (attendee.checkInTime === null && attendee.checkOutTime === null)
        );

        // TODO: maybe this is not necessary anymore???
        const failedCheckIn = req.session.dailyAttendanceList.filter(
          attendee => attendee.checkInTime === 'Fail'
        );
        const failedCheckOut = req.session.dailyAttendanceList.filter(
          attendee => attendee.checkOutTime === 'Fail'
        );
        // TODO: until here

        const attendanceConfirmed = isAttendanceConfirmed(attendees);

        return res.render('juror-management/attendance.njk', {
          nav: 'attendance',
          status: status || 'in-waiting',
          attendanceStatus: attendanceConfirmed ? 'Confirmed' : 'Unconfirmed',
          confirmedTab,
          selectedDate: dateFilter(selectedDate, null, dateFormat),
          yesterday: dateFilter(selectedDate.setDate(selectedDate.getDate() - 1), null, dateFormat),
          yesterdayRaw: dateFilter(selectedDate, null, 'YYYY-MM-DD'),
          listedJurors,
          confirmedJurors,
          absentJurors,
          failedCheckIn,
          failedCheckOut,
          tmpFields,
          errors: {
            message: '',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch jurors attendance list: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            locationCode: req.session.authentication.owner,
            attendanceDate: selectedDateString,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  function isAttendanceConfirmed(attendees) {
    if (!attendees.length) return false;

    return attendees.filter(
      (attendee) => !attendee.noShow && attendee.appStage !== 'APPEARANCE_CONFIRMED'
    ).length === 0;
  }

})();
