(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const {
    standardFilterGet,
    standardFilterPost,
    standardReportGet,
    standardReportPost,
  } = require('./standard-report.controller');
  const { reportKeys } = require('./definitions');

  const standardReportRoutes = (app, key) => {
    if (reportKeys(app)[key].search) {
      app.get(`/reporting/${key}`,
        `reports.${key}.filter.get`,
        auth.verify,
        standardFilterGet(app, key));

      app.post(`/reporting/${key}`,
        `reports.${key}.filter.post`,
        auth.verify,
        standardFilterPost(app, key));
    }

    app.get(`/reporting/${key}/report/:filter`,
      `reports.${key}.report.get`,
      auth.verify,
      standardReportGet(app, key));

    app.post(`/reporting/${key}/report`,
      `reports.${key}.report.post`,
      auth.verify,
      standardReportPost(app, key));

    app.get(`/reporting/${key}/report/:filter/print`,
      `reports.${key}.report.print`,
      auth.verify,
      standardReportGet(app, key, true));
  };

  // Add standard report keys to this object, the function will populate them
  module.exports = function(app) {
    standardReportRoutes(app, 'next-due');
    standardReportRoutes(app, 'undelivered');
    standardReportRoutes(app, 'non-responded');

    standardReportRoutes(app, 'postponed-pool');
    standardReportRoutes(app, 'postponed-date');

    require('../incomplete-service')(app);
    standardReportRoutes(app, 'incomplete-service');
  };

})();
