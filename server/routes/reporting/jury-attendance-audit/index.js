const auth = require('../../../components/auth');
const { standardReportGet } = require('../standard-report/standard-report.controller');

module.exports = (app) => {
  app.get(`/reporting/jury-attendance-audit/report/:filter/print`,
    `reports.jury-attendance-audit.report.print`,
    auth.verify,
    standardReportGet(app, 'jury-attendance-audit', true, false),
  );
};
