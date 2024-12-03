/* eslint-disable strict */
'use strict';

const auth = require('../../../components/auth');
const { isCourtUser } = require('../../../components/auth/user-type');
const controller = require('./dismiss-jurors.controller');

module.exports = function(app) {
  app.get('/pool-management/dismiss-jurors/pools',
    'pool-management.dismiss-jurors.pools.get',
    auth.verify,
    isCourtUser,
    controller.getDismissJurorsPools(app));
  app.post('/pool-management/dismiss-jurors/pools',
    'pool-management.dismiss-jurors.pools.post',
    auth.verify,
    controller.postDismissJurorsPools(app));

  app.get('/pool-management/dismiss-jurors/jurors',
    'pool-management.dismiss-jurors.jurors.get',
    auth.verify,
    isCourtUser,
    controller.getJurorsList(app));
  app.post('/pool-management/dismiss-jurors/jurors',
    'pool-management.dismiss-jurors.jurors.post',
    auth.verify,
    isCourtUser,
    controller.postJurorsList(app));

  app.get('/pool-management/dismiss-jurors/dismiss-complete-service',
    'pool-management.dismiss-jurors.complete-service.get',
    auth.verify,
    isCourtUser,
    controller.getCompleteService(app));
  app.post('/pool-management/dismiss-jurors/dismiss-complete-service',
    'pool-management.dismiss-jurors.complete-service.post',
    auth.verify,
    isCourtUser,
    controller.postCompleteService(app));

  app.get('/pool-management/dismiss-jurors/check-out',
    'pool-management.dismiss-jurors.check-out.get',
    auth.verify,
    isCourtUser,
    controller.getCheckOutJurors(app));
  app.post('/pool-management/dismiss-jurors/check-out',
    'pool-management.dismiss-jurors.check-out.post',
    auth.verify,
    isCourtUser,
    controller.postCheckOutJurors(app));

  // ajax route to check / uncheck jurors
  app.post('/pool-management/dismiss-jurors/jurors/check',
    'pool-management.dismiss-jurors.check-uncheck.post',
    auth.verify,
    isCourtUser,
    controller.postCheckJuror(app));

  // ajax route to check / uncheck pools
  app.post('/pool-management/dismiss-jurors/pools/check',
    'pool-management.dismiss-jurors.pools.check-uncheck.post',
    auth.verify,
    isCourtUser,
    controller.postCheckPool(app));

};
