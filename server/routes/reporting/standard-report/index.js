(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const {
    standardFilterGet,
    standardFilterPost,
    standardReportGet,
    standardReportPost,
  } = require('./standard-report.controller');
  const { reportKeys } = require('./definitions');

  const standardReportRoutes = (app, key) => {
    if (reportKeys(app)[key].search) {
      app.get(`/reporting/${key}`,
        `reports.${key}.filter.get`,
        auth.verify,
        standardFilterGet(app, key));

      app.post(`/reporting/${key}`,
        `reports.${key}.filter.post`,
        auth.verify,
        standardFilterPost(app, key));
    }

    app.post(`/reporting/${key}/report`,
      `reports.${key}.report.post`,
      auth.verify,
      standardReportPost(app, key));

    if (!reportKeys(app)[key].exportOnly) {
      app.get(`/reporting/${key}/report/:filter`,
        `reports.${key}.report.get`,
        auth.verify,
        standardReportGet(app, key));

      app.get(`/reporting/${key}/report/:filter/print`,
        `reports.${key}.report.print`,
        auth.verify,
        standardReportGet(app, key, true, false));
    }

    if (reportKeys(app)[key].exportLabel || reportKeys(app)[key].exportOnly) {
      app.get(`/reporting/${key}/report/:filter/export`,
        `reports.${key}.report.export`,
        auth.verify,
        standardReportGet(app, key, false, true));
    }
  };

  // Add standard report keys to this object, the function will populate them
  module.exports = function(app) {
    standardReportRoutes(app, 'amendment-juror');
    standardReportRoutes(app, 'amendment-date');
    standardReportRoutes(app, 'amendment-pool');
    standardReportRoutes(app, 'next-due');
    standardReportRoutes(app, 'undelivered');
    standardReportRoutes(app, 'non-responded');
    standardReportRoutes(app, 'on-call');
    standardReportRoutes(app, 'postponed-pool');
    standardReportRoutes(app, 'postponed-date');
    require('../incomplete-service')(app);
    standardReportRoutes(app, 'incomplete-service');
    standardReportRoutes(app, 'current-pool-status');
    standardReportRoutes(app, 'panel-summary');
    standardReportRoutes(app, 'bulk-print-audit');
    standardReportRoutes(app, 'panel-detail');
    standardReportRoutes(app, 'jury-list');
    standardReportRoutes(app, 'pool-status');
    standardReportRoutes(app, 'manual-juror-report');
    standardReportRoutes(app, 'voir-dire');
    standardReportRoutes(app, 'pool-analysis');
    // require('../pool-status')(app);
    standardReportRoutes(app, 'reasonable-adjustments');
    require('../persons-attending')(app);
    standardReportRoutes(app, 'persons-attending-summary');
    standardReportRoutes(app, 'persons-attending-detail');
    require('../daily-utilisation')(app);
    standardReportRoutes(app, 'daily-utilisation');
    standardReportRoutes(app, 'daily-utilisation-jurors');
    standardReportRoutes(app, 'unconfirmed-attendance');
    standardReportRoutes(app, 'panel-members-status');
    require('../monthly-utilisation')(app);
    standardReportRoutes(app, 'prepare-monthly-utilisation');
    standardReportRoutes(app, 'view-monthly-utilisation');
    standardReportRoutes(app, 'jury-expenditure-high-level');
    standardReportRoutes(app, 'jury-expenditure-mid-level');
    standardReportRoutes(app, 'jury-expenditure-low-level');
    standardReportRoutes(app, 'absences');
    standardReportRoutes(app, 'summoned-responded');
    standardReportRoutes(app, 'trial-statistics');
    standardReportRoutes(app, 'trial-attendance');
    standardReportRoutes(app, 'jury-cost-bill');
    standardReportRoutes(app, 'available-list-pool');
    standardReportRoutes(app, 'available-list-date');
    standardReportRoutes(app, 'payment-status-report');
    standardReportRoutes(app, 'unpaid-attendance');
    standardReportRoutes(app, 'unpaid-attendance-detailed');
    standardReportRoutes(app, 'deferred-list-date');
    standardReportRoutes(app, 'deferred-list-court');
    require('../ballot-cards')(app);
    standardReportRoutes(app, 'excused-disqualified');
    standardReportRoutes(app, 'electronic-police-check');
    standardReportRoutes(app, 'pool-statistics');
    standardReportRoutes(app, 'attendance-data');
    require('../jury-attendance-audit')(app);
    standardReportRoutes(app, 'pool-ratio');
    standardReportRoutes(app, 'pool-attendance-audit');
    standardReportRoutes(app, 'pool-selection');
    standardReportRoutes(app, 'completion-of-service');
    require('../reprint-audit-reports')(app);

    standardReportRoutes(app, 'jury-summoning-monitor-pool');
    standardReportRoutes(app, 'jury-summoning-monitor-court');
    require('../jury-summoning-monitor')(app);
    standardReportRoutes(app, 'yield-performance');
  };

})();
