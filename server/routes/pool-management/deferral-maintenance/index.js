(function() {
  'use strict';

  const controller = require('./deferral-maintenance.controller');
  const postponeController = require('../../juror-management/postpone/postpone.controller');
  const auth = require('../../../components/auth');
  const { isBureauUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get('/pool-management/deferral-maintenance',
      'pool-management.deferral-maintenance.get',
      auth.verify,
      controller.index(app));
    app.post('/pool-management/deferral-maintenance',
      'pool-management.deferral-maintenance.post',
      auth.verify,
      controller.getDeferrals(app));

    app.post('/pool-management/deferral-maintenance/location/:locationCode/filter',
        'pool-management.deferral-maintenance.filter.search.post',
        auth.verify,
        controller.postFilterSearch(app));

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

    // bulk postpone
    app.post('/pool-management/deferral-maintenance/location/:locationCode/postpone',
      'pool-management.deferral-maintenance.postpone.post',
      auth.verify,
      controller.postPostpone(app));
    app.get('/pool-management/deferral-maintenance/location/:locationCode/postpone/date',
      'pool-management.deferral-maintenance.postpone.date.get',
      auth.verify,
      postponeController.getPostponeDateDeferralMaintenance(app));
    app.post('/pool-management/deferral-maintenance/location/:locationCode/postpone/date',
      'pool-management.deferral-maintenance.postpone.date.post',
      auth.verify,
      postponeController.postPostponeDateDeferralMaintenance(app));
    app.get('/pool-management/deferral-maintenance/location/:locationCode/postpone/pool',
      'pool-management.deferral-maintenance.postpone.pool.get',
      auth.verify,
      postponeController.getAvailablePoolsDeferralMaintenance(app));
    app.post('/pool-management/deferral-maintenance/location/:locationCode/postpone/pool',
      'pool-management.deferral-maintenance.postpone.pool.post',
      auth.verify,
      postponeController.postPostponePoolDeferralMaintenance(app));
    app.get('/pool-management/deferral-maintenance/location/:locationCode/postpone/movement',
      'pool-management.deferral-maintenance.postpone.movement.get',
      auth.verify,
      postponeController.getPostponeMovementDeferralMaintenance(app));
    app.post('/pool-management/deferral-maintenance/location/:locationCode/postpone/movement',
      'pool-management.deferral-maintenance.postpone.movement.post',
      auth.verify,
      postponeController.postPostponeMovementDeferralMaintenance(app));

    // bulk move court
    app.get('/pool-management/deferral-maintenance/location/:locationCode/move-court',
      'pool-management.deferral-maintenance.move-court.select-court.get',
      auth.verify,
      isBureauUser,
      controller.getMoveCourt(app));
    app.post('/pool-management/deferral-maintenance/location/:locationCode/move-court',
      'pool-management.deferral-maintenance.move-court.select-court.post',
      auth.verify,
      isBureauUser,
      controller.postMoveCourt(app));
    app.get('/pool-management/deferral-maintenance/location/:locationCode/move-court/:newLocationCode/select-pool',
      'pool-management.deferral-maintenance.move-court.select-pool.get',
      auth.verify,
      isBureauUser,
      controller.getMoveCourtPools(app));
    app.post('/pool-management/deferral-maintenance/location/:locationCode/move-court/:newLocationCode/select-pool',
      'pool-management.deferral-maintenance.move-court.select-pool.post',
      auth.verify,
      isBureauUser,
      controller.postMoveCourtPools(app));
  };
})();
