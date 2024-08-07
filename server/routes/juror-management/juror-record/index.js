(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./juror-record.controller')
    , attendanceTimeController = require('../attendance/change-times/change-times.controller')
    , attendanceDateController = require('../attendance/change-attendance-date/change-attendance-date.controller')
    , nonAttendanceDateController = require('../expenses/non-attendance-day/non-attendance-day.controller')
    , addAttendanceDateController = require('../attendance/add-attendance-date/add-attendance-date.controller')
    , modifyAttendanceController = require('./modify-attendance/modify-attendance.controller')
    , expensesController = require('../expenses/expenses.controller');

  module.exports = function(app) {
    app.get('/juror-management/record/:jurorNumber/overview',
      'juror-record.overview.get',
      auth.verify,
      controller.getOverviewTab(app));

    app.get('/juror-management/record/:jurorNumber/details',
      'juror-record.details.get',
      auth.verify,
      controller.getDetailsTab(app));

    app.get('/juror-management/record/:jurorNumber/summons',
      'juror-record.summons.get',
      auth.verify,
      controller.getSummonsTab(app));

    app.get('/juror-management/record/:jurorNumber/expenses',
      'juror-record.expenses.get',
      auth.verify,
      controller.getExpensesTab(app));
    app.get('/juror-management/record/:jurorNumber/default-expenses',
      'juror-record.default-expenses.get',
      auth.verify,
      expensesController.getDefaultExpenses(app));
    app.post('/juror-management/record/:jurorNumber/default-expenses',
      'juror-record.default-expenses.post',
      auth.verify,
      expensesController.postDefaultExpenses(app));

    app.get('/juror-management/record/:jurorNumber/attendance',
      'juror-record.attendance.get',
      auth.verify,
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
    app.get('/juror-management/record/:jurorNumber/:poolNumber/modify-juror-attendance',
      'juror-record.attendance.modify-juror-attendance.get',
      auth.verify,
      modifyAttendanceController.getModifyAttendance(app)
    );
    app.get('/juror-management/record/:jurorNumber/:poolNumber/delete-juror-attendance',
      'juror-record.attendance.delete-juror-attendance.get',
      auth.verify,
      modifyAttendanceController.getDeleteAttendance(app)
    );
    app.post('/juror-management/record/:jurorNumber/:poolNumber/modify-juror-attendance',
      'juror-record.attendance.modify-juror-attendance.post',
      auth.verify,
      modifyAttendanceController.postModifyAttendance(app)
    );
    app.get('/juror-management/record/:jurorNumber/:poolNumber/non-attendance-day',
      'juror-record.attendance.non-attendance-day.get',
      auth.verify,
      nonAttendanceDateController.getNonAttendanceDay(app));
    app.post('/juror-management/record/:jurorNumber/:poolNumber/non-attendance-day',
      'juror-record.attendance.non-attendance-day.post',
      auth.verify,
      nonAttendanceDateController.postNonAttendanceDay(app));

    // notes and logs
    app.get('/juror-management/record/:jurorNumber/notes',
      'juror-record.notes.get',
      auth.verify,
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

    app.get('/juror-management/record/:jurorNumber/history',
      'juror-record.history.get',
      auth.verify,
      controller.getHistoryTab(app));

      app.get('/juror-management/record/:jurorNumber/history/print',
      'juror-record.history.print.get',
      auth.verify,
      controller.printHistoryTab(app));


    require('./confirm-identity')(app);
  };

})();
