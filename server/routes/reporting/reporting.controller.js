(function() {
  'use strict';

  const { isCourtUser, isBureauUser, isSystemAdministrator, isSuperUser } = require('../../components/auth/user-type');
  const errors = require('../../components/errors');

  module.exports.getReports = function(app) {
    return function(req, res) {
      delete req.session.preReportRoute;

      if (isCourtUser(req, res)) {
        return res.render('reporting/court-reports.njk');
      } else if (isBureauUser(req, res)) {
        return res.render('reporting/bureau-reports.njk');
      } else if (isSystemAdministrator(req, res) && isSuperUser(req, res)) {
        return res.render('reporting/super-user-reports.njk');
      }

      return errors(req, res, 404);
    };
  };

  module.exports.getStatistics = function(app) {
    return function(req, res) {
      delete req.session.preReportRoute;
      return res.render('reporting/court-statistics.njk');
    };
  };

})();
