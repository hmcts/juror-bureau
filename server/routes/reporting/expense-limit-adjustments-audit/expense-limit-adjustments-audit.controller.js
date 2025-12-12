(function() {
  'use strict';

  module.exports.getExpenseLimitAdjustmentAuditRedirect = (app) => (req, res) => {
    const {locCode, transportType} = req.params;

    req.session.reportCourts = [locCode];

    return res.redirect(app.namedRoutes.build('reports.expense-limit-adjustments-audit.report.get', {filter: transportType}));
};

})();
