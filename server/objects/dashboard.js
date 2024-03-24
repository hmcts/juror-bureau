;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.dashboardTotalsDAO = new DAO('bureau/dashboard/statistics');
})();
