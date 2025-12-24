(() => {
  'use strict';

  const controller = require('./management-dashboard.controller')
  const auth = require('../../components/auth');

  module.exports = (app) => {
    app.get(
      '/management-dashboard',
      'management-dashboard.get',
      auth.verify,
      controller.getManagementDashboard(app)
    );
  };

})();
