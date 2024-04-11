(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./juror-record.controller')
    , attendanceTimeController = require('../attendance/change-times/change-times.controller')
    , attendanceDateController = require('../attendance/change-attendance-date/change-attendance-date.controller')
    , nonAttendanceDateController = require('../expenses/non-attendance-day/non-attendance-day.controller')
    , addAttendanceDateController = require('../attendance/add-attendance-date/add-attendance-date.controller')
    , changeJurorAttendanceController = require('../juror-record/change-attendance/change-attendance.controller')
    , expensesController = require('../expenses/expenses.controller');

  module.exports = function(app) {
    app.get('/juror-management/record/:jurorNumber/overview',
      'juror-record.overview.get',
      auth.verify,
      controller.checkResponse(app),
      controller.getOverviewTab(app));

    app.get('/juror-management/record/:jurorNumber/details',
      'juror-record.details.get',
      auth.verify,
      controller.checkResponse(app),
      controller.getDetailsTab(app));

    app.get('/juror-management/record/:jurorNumber/summons',
      'juror-record.summons.get',
      auth.verify,
      controller.checkResponse(app),
      controller.getSummonsTab(app));

    app.get('/juror-management/record/:jurorNumber/expenses',
      'juror-record.expenses.get',
      auth.verify,
      controller.checkResponse(app),
      controller.getExpensesTab(app));
    app.get('/juror-management/record/:jurorNumber/:poolNumber/default-expenses',
      'juror-record.default-expenses.get',
      auth.verify,
      expensesController.getDefaultExpenses(app));
    app.post('/juror-management/record/:jurorNumber/:poolNumber/default-expenses',
      'juror-record.default-expenses.post',
      auth.verify,
      expensesController.postDefaultExpenses(app));

    app.get('/juror-management/record/:jurorNumber/attendance',
      'juror-record.attendance.get',
      auth.verify,
      controller.checkResponse(app),
      controller.getAttendanceTab(app));
    app.get('/juror-management/record/:jurorNumber/change-attendance-date',
      'juror-record.attendance.change-attendance-date.get',
      auth.verify,
      attendanceDateController.getChangeAttendanceDate(app)
    );
    app.post('/juror-management/record/:jurorNumber/change-attendance-date',
      'juror-record.attendance.change-attendance-date.post',
      auth.verify,
      attendanceDateController.postChangeAttendanceDate(app)
    );
    app.get('/juror-management/record/:jurorNumber/add-attendance-date',
      'juror-record.attendance.add-attendance-date.get',
      auth.verify,
      addAttendanceDateController.getAddAttendanceDate(app)
    );
    app.post('/juror-management/record/:jurorNumber/add-attendance-date',
      'juror-record.attendance.add-attendance-date.post',
      auth.verify,
      addAttendanceDateController.postAddAttendanceDate(app)
    );
    app.get('/juror-management/record/:jurorNumber/change-juror-attendance',
      'juror-record.attendance.change-attendance-date-times.get',
      auth.verify,
      changeJurorAttendanceController.getChangeAttendance(app)
    );
    app.post('/juror-management/record/:jurorNumber/change-juror-attendance',
      'juror-record.attendance.change-attendance-date-times.post',
      auth.verify,
      changeJurorAttendanceController.postChangeAttendance(app)
    );
    app.get('/juror-management/record/:jurorNumber/:poolNumber/non-attendance-day',
      'juror-record.attendance.non-attendance-day.get',
      auth.verify,
      nonAttendanceDateController.getNonAttendanceDay(app));
    app.post('/juror-management/record/:jurorNumber/:poolNumber/non-attendance-day',
      'juror-record.attendance.non-attendance-day.post',
      auth.verify,
      nonAttendanceDateController.postNonAttendanceDay(app));
    app.get('/juror-management/record/:jurorNumber/attendance/change-times',
      'juror-record.attendance.change-times.get',
      auth.verify,
      attendanceTimeController.getChangeTimes(app));
    app.post('/juror-management/record/:jurorNumber/attendance/change-times',
      'juror-record.attendance.change-times.post',
      auth.verify,
      attendanceTimeController.postChangeTimes(app));

    app.get('/juror-management/record/:jurorNumber/notes',
      'juror-record.notes.get',
      auth.verify,
      controller.checkResponse(app),
      controller.getNotesTab(app));
    app.get('/juror-management/record/:jurorNumber/notes/edit',
      'juror-record.notes-edit.get',
      auth.verify,
      controller.getEditNotes(app));
    app.post('/juror-management/record/:jurorNumber/notes/edit',
      'juror-record.notes-edit.post',
      auth.verify,
      controller.postEditNotes(app));

    app.get('/juror-management/record/:jurorNumber/contact-log',
      'juror-record.contact-log.get',
      auth.verify,
      controller.getAddLogs(app));
    app.post('/juror-management/record/:jurorNumber/contact-log',
      'juror-record.contact-log.post',
      auth.verify,
      controller.postAddLogs(app));

    require('./confirm-identity')(app);
  };

})();
