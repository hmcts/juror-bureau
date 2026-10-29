(() => {
  'use strict';

  const controller = require('./digital-by-default.controller');
  const auth = require('../../components/auth');
  const { isSystemAdministrator } = require('../../components/auth/user-type');

  module.exports = function(app) {

    app.get(
      '/digital-by-default/dashboard',
      'digital-by-default.dashboard.get',
      auth.verify,
      isSystemAdministrator,
      controller.getDashboard(app)
    );

    app.post(
      '/digital-by-default/dashboard',
      'digital-by-default.dashboard.post',
      auth.verify,
      isSystemAdministrator,
      controller.postDashboard(app)
    );

    app.get(
      '/digital-by-default/dashboard/age-demographic.csv',
      'digital-by-default.age-demographic.csv',
      auth.verify,
      isSystemAdministrator,
      controller.downloadAgeDemographicCsv(app)
    );

    app.get(
      '/digital-by-default/dashboard/response-times.csv',
      'digital-by-default.response-time.csv',
      auth.verify,
      isSystemAdministrator,
      controller.downloadResponseTimeCsv(app)
    );

    app.get(
      '/digital-by-default/dashboard/response-rate.csv',
      'digital-by-default.response-rate.csv',
      auth.verify,
      isSystemAdministrator,
      controller.downloadResponseRateCsv(app)
    );

  };

})();
