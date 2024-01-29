/* eslint-disable strict */
'use strict';

const auth = require('../../../components/auth');
const { isCourtUser } = require('../../../components/auth/user-type');
const controller = require('./dismiss-jurors.controller');

module.exports = function(app) {
  app.get('/juror-management/dismiss-jurors/pools',
    'juror-management.dismiss-jurors.pools.get',
    auth.verify,
    isCourtUser,
    controller.getDismissJurorsPools(app));
  app.post('/juror-management/dismiss-jurors/pools',
    'juror-management.dismiss-jurors.pools.post',
    auth.verify,
    controller.postDismissJurorsPools(app));

  app.get('/juror-management/dismiss-jurors/jurors',
    'juror-management.dismiss-jurors.jurors.get',
    auth.verify,
    isCourtUser,
    controller.getJurorsList(app));
  app.post('/juror-management/dismiss-jurors/jurors',
    'juror-management.dismiss-jurors.jurors.post',
    auth.verify,
    isCourtUser,
    controller.postJurorsList(app));

  app.get('/juror-management/dismiss-jurors/complete-service',
    'juror-management.dismiss-jurors.complete-service.get',
    auth.verify,
    isCourtUser,
    controller.getCompleteService(app));
  app.post('/juror-management/dismiss-jurors/complete-service',
    'juror-management.dismiss-jurors.complete-service.post',
    auth.verify,
    isCourtUser,
    controller.postCompleteService(app));

  app.get('/juror-management/dismiss-jurors/check-out',
    'juror-management.dismiss-jurors.check-out.get',
    auth.verify,
    isCourtUser,
    controller.getCheckOutJurors(app));
  app.post('/juror-management/dismiss-jurors/check-out',
    'juror-management.dismiss-jurors.check-out.post',
    auth.verify,
    isCourtUser,
    controller.postCheckOutJurors(app));

  // ajax route to check / uncheck jurors
  app.post('/juror-management/dismiss-jurors/jurors/check',
    'juror-management.dismiss-jurors.check-uncheck.post',
    auth.verify,
    isCourtUser,
    controller.postCheckJuror(app));
};
