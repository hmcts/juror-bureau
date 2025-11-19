const errors = require('../../components/errors');

(function() {
  'use strict';

  const { isCourtUser, isBureauUser, isSystemAdministrator, isSuperUser } = require('../../components/auth/user-type');

  module.exports.getReports = function(app) {
    return function(req, res) {
      delete req.session.preReportRoute;

      let reportTemplate;
      if (isCourtUser(req, res)) {
        reportTemplate = 'reporting/court-reports.njk';
      } else if (isBureauUser(req, res)) {
        reportTemplate = 'reporting/bureau-reports.njk';
      } else if (isSystemAdministrator(req, res) && isSuperUser(req, res)) {
        reportTemplate = 'reporting/super-user-reports.njk';
      }

      if (reportTemplate) {
        return res.render(reportTemplate);
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
