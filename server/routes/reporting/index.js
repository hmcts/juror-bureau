const { financialAudit } = require('./audit.controller');

(function() {
  'use strict';

  const auth = require('../../components/auth');
  const { isCourtUser } = require('../../components/auth/user-type');
  const { getReports, getStatistics } = require('./reporting.controller');

  const { generateBulk } = require('./expenses-bulk/expenses-bulk.controller');

  module.exports = function(app) {
    // Inital Report Search Routes - need to be initialised before rest of routes
    require('./postponed-report')(app);
    require('./available-list')(app);
    require('./juror-amendment')(app);
    require('./deferred-list')(app);
    require('./pool-ratio')(app);
    require('./yield-performance')(app);
    require('./all-court-utilisation')(app);
    require('./expense-payments')(app);
    require('./outgoing-sms-messages')(app);
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

    // match bulk first, if it does not match go to single audit
    app.get('/reports/financial-audit/bulk', 'reports.financial-audit.bulk.get', auth.verify, generateBulk(app));
    app.get('/reports/financial-audit/:auditNumber', 'reports.financial-audit.get', auth.verify, financialAudit(app));
  };

})();
