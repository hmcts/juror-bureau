(function() {
  'use strict';

  const _ = require('lodash');
  const { getJurorStatus, setPreviousWorkingDay } = require('../../lib/mod-utils');
  const dateFilter = require('../../components/filters').dateFilter;
  const { jurorsAttending, poolAttedanceAuditDAO, unconfirmedJurorAttendancesDAO } = require('../../objects/juror-attendance');
  const moment = require('moment');
  const { isSJOUser, isCourtManager, isCourtUser } = require('../../components/auth/user-type');

  module.exports.isAttendanceConfirmed = async function(app, req, locCode, attendanceDate) {
      return isAttendanceConfirmedByAttendances(await getAppearances(app,req, locCode, attendanceDate));
  }

  async function getAppearances(app, req, locCode, attendanceDate) {
    const group = 'IN_WAITING';
    let { 'juror_appearance_response_data': attendees } = await jurorsAttending.get(
      req,
      locCode,
      attendanceDate,
      group
    );
    attendees = attendees.map((attendee) => {
        attendee['juror_status'] = getJurorStatus(attendee['juror_status']);
        return _.mapKeys(attendee, (__, key) => _.camelCase(key));
    });

    return typeof attendees !== 'undefined' ? attendees : [];
  }

  module.exports.getAttendance = function(app) {
    return async function(req, res) {
      const canRecordAttendance = isCourtUser(req) && !(isSJOUser(req) && !isCourtManager(req));

      const { status } = req.params;
      const { date, tab } = req.query;
      const dateFormat = 'dddd D MMMM YYYY';
      const tmpErrors = _.cloneDeep(req.session.errors);
      const tmpFields = _.cloneDeep(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      const selectedDate = date ? new Date(date) : new Date();

      const attedancesLockedDate = moment().subtract(7,'d');

      if (!canRecordAttendance && !moment(selectedDate).isBefore(attedancesLockedDate)) {
        const redirectDate = attedancesLockedDate.format('yyyy-MM-DD');
        return res.redirect(app.namedRoutes.build('juror-management.attendance.get', {
          status: 'in-waiting'
        }) + `?date=${redirectDate}`)
      }

      const selectedDateString = dateFilter(selectedDate, null, 'YYYY-MM-DD');

      const confirmedTab = tab || 'attended';

      try {
        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const previousWorkingDay = setPreviousWorkingDay(new Date(selectedDate));
        const previousWorkingDayIsConfirmed = isAttendanceConfirmedByAttendances(await getAppearances(app, req, req.session.authentication.locCode, dateFilter(previousWorkingDay, null, 'YYYY-MM-DD')));

        const attendees = await getAppearances(app,req, req.session.authentication.locCode, selectedDateString);
        req.session.dailyAttendanceList = attendees;
        req.session.attendanceListDate = selectedDateString;

        const listedJurors = req.session.dailyAttendanceList.filter(attendee => attendee.checkInTime !== null);

        const confirmedJurors = req.session.dailyAttendanceList.filter(
          attendee => (attendee.checkInTime !== null || attendee.checkOutTime !== null)
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

        const attendanceConfirmed = moment(selectedDate).isBefore(attedancesLockedDate);

        req.session.preReportRoute = app.namedRoutes.build('juror-management.attendance.get', {
          status: 'in-waiting'
        }) + `?date=${selectedDateString}`;

        let poolAttendaceAuditNumbers = [];
        try {
          poolAttendaceAuditNumbers = await poolAttedanceAuditDAO.get(req, selectedDateString);
        } catch (err) {
          app.logger.crit('Failed to fetch jurors attendance list: ', {
            auth: req.session.authentication,
            data: {
              date: selectedDateString,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
  
          return res.render('_errors/generic', { err });
        }

        let unconfirmedJurors = [];
        if (attendanceConfirmed && isSJOUser(req, res)) {
          try {
            unconfirmedJurors = await unconfirmedJurorAttendancesDAO.get(req, req.session.authentication.locCode, selectedDateString);
          } catch (err) {
            app.logger.crit('Failed to fetch list of unconfirmed attendances', {
              auth: req.session.authentication,
              data: {
                locCode: req.session.authentication.locCode,
                date: selectedDateString,
              },
              error: typeof err.error !== 'undefined' ? err.error : err.toString(),
            });
          }
        }

        return res.render('juror-management/attendance.njk', {
          nav: 'attendance',
          status: status,
          attendanceStatus: attendanceConfirmed ? 'Confirmed' : 'Unconfirmed',
          confirmedTab,
          selectedDate: dateFilter(selectedDate, null, dateFormat),
          yesterday: dateFilter(yesterday, null, dateFormat),
          yesterdayRaw: dateFilter(yesterday, null, 'YYYY-MM-DD'),
          previousWorkingDay: dateFilter(previousWorkingDay, null, dateFormat),
          previousWorkingDayIsConfirmed: previousWorkingDayIsConfirmed,
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
          reportUrls: {
            personsAttendingSummary: app.namedRoutes.build('reports.persons-attending-summary.report.get', {
              filter: selectedDateString,
            }),
            personsAttendingDetail: app.namedRoutes.build('reports.persons-attending-detail.report.get', {
              filter: selectedDateString,
            }),
          },
          poolAttendaceAuditNumbers,
          unconfirmedAttendancesUrl:  unconfirmedJurors.length > 0
            ? app.namedRoutes.build('juror-management.attendance.unconfirmed-attendances.get') + `?date=${selectedDateString}`
            : null,
          canRecordAttendance,
          attendanceDatePickerMax: dateFilter(new Date(), null, 'DD/MM/YYYY'),
          attendanceDatePickerValue: dateFilter(selectedDate, null, 'DD/MM/YYYY'),
        });
      } catch (err) {
        app.logger.crit('Failed to fetch jurors attendance list: ', {
          auth: req.session.authentication,
          data: {
            locationCode: req.session.authentication.owner,
            attendanceDate: selectedDateString,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  function isAttendanceConfirmedByAttendances(attendees) {
    if (!attendees.length) return false;

    return attendees.filter(attendee => attendee.appearanceConfirmed).length > 0;
  }

})();
