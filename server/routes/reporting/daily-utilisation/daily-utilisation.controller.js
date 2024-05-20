
(() => {
  'use strict';

  module.exports.getUncompletedCheck = (app) => (req, res) => {
    const { filter } = req.params;
    const { fromDate, toDate } = req.query;

    return res.render('reporting/daily-utilisation/uncompleted-jurors', {
      incompleteServiceReportUrl: app.namedRoutes.build('reports.incomplete-service.filter.get'),
      continueUrl: app.namedRoutes.build('reports.daily-utilisation.report.get', {filter})
        + `?fromDate=${fromDate}&toDate=${toDate}`,
      cancelUrl: app.namedRoutes.build('reports.statistics.get'),
    });
  };
})();
