const auth = require('../../components/auth');
const { getReports } = require('./reporting.controller');

// TODO: these are in for POC and demoing purposes and as a reference for the future
const {
  getSomeReport,
  generateSomeReport,
  generateSomeOtherReport,
} = require('./some-report/some-report.controller');

const { generateBulk } = require('./expenses-bulk/expenses-bulk.controller');

module.exports = function (app) {
  require('./standard-report/index')(app);

  app.get('/reports',
    'reports.get',
    auth.verify,
    getReports(app));

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

};
