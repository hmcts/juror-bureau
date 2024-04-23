(function() {
  'use strict';

  const { isCourtUser } = require('../../components/auth/user-type');

  module.exports.getReports = function() {
    return function(req, res) {

      return res.render(`reporting/${isCourtUser(req, res) ? 'court' : 'bureau'}-reports.njk`);
    };
  };

  module.exports.getStatistics = function() {
    return function(req, res) {

      return res.render('reporting/court-statistics.njk');
    };
  };

})();
