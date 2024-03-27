(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const {
    standardFilterGet,
    standardFilterPost,
    standardReportGet,
    standardReportPost,
  } = require('./standard-report.controller');

  const standardReportRoutes = (app, key) => {
    app.get(`/reporting/${key}`,
      `${key}.filter.get`,
      auth.verify,
      standardFilterGet(app, key));

    app.post(`/reporting/${key}`,
      `${key}.filter.post`,
      auth.verify,
      standardFilterPost(app, key));

    app.get(`/reporting/${key}/report/:filter`,
      `${key}.report.get`,
      auth.verify,
      standardReportGet(app, key));

    app.post(`/reporting/${key}/report`,
      `${key}.report.post`,
      auth.verify,
      standardReportPost(app, key));
  };

  module.exports = function(app) {
    standardReportRoutes(app, 'next-due');
  };

})();
