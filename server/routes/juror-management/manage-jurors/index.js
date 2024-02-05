(function() {
  'use strict';

  const controller = require('./manage-jurors.controller');
  const auth = require('../../../components/auth');
  const { isSJOUser, isCourtUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {

    app.get('/juror-management/manage-jurors/pools',
      'juror-management.manage-jurors.pools.get',
      auth.verify,
      isCourtUser,
      controller.getInWaiting(app),
    );

    app.get('/juror-management/manage-jurors/pending-approval',
      'juror-management.manage-jurors.pending-approval.get',
      auth.verify,
      isCourtUser,
      controller.getPendingApproval(app),
    );

    app.get('/juror-management/manage-jurors/approve',
      'juror-management.manage-jurors.approve.get',
      auth.verify,
      isSJOUser,
      controller.getApprove(app),
    );

    app.get('/juror-management/manage-jurors/approve/:jurorNumber',
      'juror-management.manage-jurors.approve.juror.get',
      auth.verify,
      isSJOUser,
      controller.getApproveReject(app),
    );
    app.post('/juror-management/manage-jurors/approve/:jurorNumber',
      'juror-management.manage-jurors.approve.juror.post',
      auth.verify,
      isSJOUser,
      controller.postApproveReject(app),
    );

  };

})();
