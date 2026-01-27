(function() {
  'use strict';

  const { dashboardData, allLocalAuthorities } = require('../routes/electoral-register/dummy-data');
  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');

  module.exports.electoralRegisterDashboardDAO = {
    get: (req, payload) => {
      return dashboardData(payload);
    }
  };

  module.exports.localAuthoritiesDAO = {
    get: () => {
      return allLocalAuthorities;
    }
  };

})();
