
(() => {
  'use strict';

  const {
    getPrepareMonthlyUtilisation,
    postPrepareMonthlyUtilisation,
    getCofirmPrepareMonthlyUtilisation,
    getFilterMonthlyUtilisation,
    postFilterMonthlyUtilisation
  } = require('./monthly-utilisation.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/reporting/monthly-utilisation/prepare',
      'reports.monthly-utilisation.prepare.get',
      auth.verify,
      getPrepareMonthlyUtilisation(app));
    app.post('/reporting/monthly-utilisation/prepare',
      'reports.monthly-utilisation.prepare.post',
      auth.verify,
      postPrepareMonthlyUtilisation(app));
    app.get('/reporting/monthly-utilisation/prepare/confirm/:month',
      'reports.monthly-utilisation.prepare.confirm.get',
      auth.verify,
      getCofirmPrepareMonthlyUtilisation(app));

      app.get('/reporting/monthly-utilisation',
      'reports.monthly-utilisation.filter.get',
      auth.verify,
      getFilterMonthlyUtilisation(app));
    app.post('/reporting/monthly-utilisation',
      'reports.monthly-utilisation.filter.post',
      auth.verify,
      postFilterMonthlyUtilisation(app));
  };
})();
