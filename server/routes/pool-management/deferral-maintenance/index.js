const controller = require('./deferral-maintenance.controller');
const auth = require('../../../components/auth');

module.exports = function (app) {
  app.get('/pool-management/deferral-maintenance',
    'pool-management.deferral-maintenance.get',
    auth.verify,
    controller.index(app));
  app.post('/pool-management/deferral-maintenance',
    'pool-management.deferral-maintenance.post',
    auth.verify,
    controller.getDeferrals(app));

  app.get('/pool-management/deferral-maintenance/location/:locationCode',
    'pool-management.deferral-maintenance.filter.get',
    auth.verify,
    controller.postFilterDeferrals(app));
  app.post('/pool-management/deferral-maintenance/location/:locationCode',
    'pool-management.deferral-maintenance.filter.post',
    auth.verify,
    controller.postFilterDeferrals(app));

  app.get('/pool-management/deferral-maintenance/location/:locationCode/process',
    'pool-management.deferral-maintencance.process.get',
    auth.verify,
    controller.getProcessCheckedDeferrals(app));
  app.post('/pool-management/deferral-maintenance/location/:locationCode/process',
    'pool-management.deferral-maintenance.process.post',
    auth.verify,
    controller.postProcessCheckedDeferrals(app));

  // ajax style route... updates the juror record and returns OK
  app.get('/pool-management/deferral-maintenance/check/:jurorNumber',
    'pool-management.deferral-maintenance.check.get',
    auth.verify,
    controller.getCheckDeferral(app));
};
