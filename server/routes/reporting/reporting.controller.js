(function() {
  'use strict';

  const { isCourtUser } = require('../../components/auth/user-type');

  module.exports.getReports = function(app) {
    return function(req, res) {
      delete req.session.preReportRoute;
      return res.render(`reporting/${isCourtUser(req, res) ? 'court' : 'bureau'}-reports.njk`);
    };
  };

  module.exports.getStatistics = function(app) {
    return function(req, res) {
      delete req.session.preReportRoute;
      return res.render('reporting/court-statistics.njk');
    };
  };

})();
