
(() => {
  'use strict';

  const { getReprintAuditReport, postReprintAuditReport, getReportPrint } = require('./reprint-audit-report.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/reporting/reprint-audit-report',
      'reports.reprint-audit-report.filter.get',
      auth.verify,
      getReprintAuditReport(app));
    app.post('/reporting/reprint-audit-report',
      'reports.reprint-audit-report.filter.post',
      auth.verify,
      postReprintAuditReport(app));
    app.get('/reporting/reprint-audit-report/:reportKey/:auditNumber/print',
      'reports.reprint-audit-report.print.get',
      auth.verify,
      getReportPrint(app));
  };
})();
