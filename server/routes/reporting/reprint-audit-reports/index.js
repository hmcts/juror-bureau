
(() => {
  'use strict';

  const { getReprintAuditReport, postReprintAuditReport } = require('./reprint-audit-report.controller');
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
  };
})();
