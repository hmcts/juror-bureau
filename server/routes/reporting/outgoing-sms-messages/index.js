(() => {
  'use strict';

  const { getAttendanceDates, postAttendanceDates, getDashboardExportRedirect } = require('./outgoing-sms-messages.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/reporting/outgoing-sms-messages/dates',
      'reports.outgoing-sms-messages.filter.dates.get',
      auth.verify,
      getAttendanceDates(app));
    app.post('/reporting/outgoing-sms-messages/dates',
      'reports.outgoing-sms-messages.filter.dates.post',
      auth.verify,
      postAttendanceDates(app));

    app.get('/management-dashboard/outgoing-sms-messages/export',
      'management-dashboard.outgoing-sms-messages.report.export',
      auth.verify,
      getDashboardExportRedirect(app));
  };
})();
