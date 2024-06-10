const { financialAudit } = require('./audit.controller');

(function() {
  'use strict';

  const auth = require('../../components/auth');
  const { isCourtUser } = require('../../components/auth/user-type');
  const { getReports, getStatistics } = require('./reporting.controller');

  // TODO: these are in for POC and demoing purposes and as a reference for the future
  const {
    getSomeReport,
    generateSomeReport,
    generateSomeOtherReport,
  } = require('./some-report/some-report.controller');

  const { generateBulk } = require('./expenses-bulk/expenses-bulk.controller');

  module.exports = function(app) {
    // Inital Report Search Routes - need to be initialised before rest of routes
    require('./postponed-report')(app);
    require('./available-list')(app);
    require('./juror-amendment')(app);
    require('./deferred-list')(app);
    require('./pool-ratio')(app);
    require('./yield-performance')(app);
    require('./standard-report/index')(app);

    app.get('/reports',
      'reports.reports.get',
      auth.verify,
      getReports(app));

    app.get('/statistics',
      'reports.statistics.get',
      auth.verify,
      isCourtUser,
      getStatistics(app));

    app.get('/reporting/some-report',
      'some-report.get',
      auth.verify,
      getSomeReport(app));
    app.get('/reporting/some-report/some-report.pdf',
      'some-report.generate.get',
      auth.verify,
      generateSomeReport(app));
    app.get('/reporting/some-report/some-other-report.pdf',
      'some-other-report.generate.get',
      auth.verify,
      generateSomeOtherReport(app));

    app.get('/reporting/expenses-bulk/expenses-bulk.pdf',
      'expenses-bulk.generate.get',
      generateBulk(app));

    app.get('/reports/financial-audit/:auditNumber',
      'reports.financial-audit.get',
      auth.verify,
      financialAudit(app));
  };

})();
