(() => {
  'use strict';

  const {
    exportReport,
    getAttendanceDates,
    getCourtScope,
    getReport,
    getSelectedCourts,
    postAttendanceDates,
    postCourtScope,
    postSelectedCourts,
    printReport,
  } = require('./sitting-days.controller.js');
  const auth = require('../../../components/auth');
  const { isSuperUser } = require('../../../components/auth/user-type.js');

  module.exports = function (app) {
    app.get('/reporting/sitting-days/select-courts',
      'reports.sitting-days.filter.courts.get',
      auth.verify,
      isSuperUser,
      getCourtScope(app));
    app.post('/reporting/sitting-days/select-courts',
      'reports.sitting-days.filter.courts.post',
      auth.verify,
      isSuperUser,
      postCourtScope(app));
    app.get('/reporting/sitting-days/dates',
      'reports.sitting-days.filter.dates.get',
      auth.verify,
      isSuperUser,
      getAttendanceDates(app));
    app.post('/reporting/sitting-days/dates',
      'reports.sitting-days.filter.dates.post',
      auth.verify,
      isSuperUser,
      postAttendanceDates(app));
    app.get('/reporting/sitting-days/courts',
      'reports.sitting-days.filter.selected-courts.get',
      auth.verify,
      isSuperUser,
      getSelectedCourts(app));
    app.post('/reporting/sitting-days/courts',
      'reports.sitting-days.filter.selected-courts.post',
      auth.verify,
      isSuperUser,
      postSelectedCourts(app));
    app.get('/reporting/sitting-days/report',
      'reports.sitting-days.report.get',
      auth.verify,
      isSuperUser,
      getReport(app));
    app.get('/reporting/sitting-days/report/export',
      'reports.sitting-days.report.export',
      auth.verify,
      isSuperUser,
      exportReport(app));
    app.get('/reporting/sitting-days/report/print',
      'reports.sitting-days.report.print',
      auth.verify,
      isSuperUser,
      printReport(app));
  };
})();
