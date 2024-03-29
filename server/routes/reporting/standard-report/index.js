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

  app.get(`/reporting/${key}/report/:filter/print`,
    `${key}.report.print`,
    auth.verify,
    standardReportGet(app, key, true));
};

// Add standard report keys to this object, the function will populate them
module.exports = function (app) {
  standardReportRoutes(app, 'next-due');
  standardReportRoutes(app, 'undelivered');
};
