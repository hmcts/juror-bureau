(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./add-panel-member.controller');
  const { isCourtUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {

    app.get('/trial-management/trials/:trialNumber/:locationCode/add-panel-members',
      'trial-management.add-panel-members.get',
      auth.verify,
      isCourtUser,
      controller.getAddPanelMember(app),
    );
    app.post('/trial-management/trials/:trialNumber/:locationCode/add-panel-members',
      'trial-management.add-panel-members.post',
      auth.verify,
      isCourtUser,
      controller.postAddPanelMember(app),
    );

    app.get('/trial-management/:locationCode/:trialNumber/add-panel-members/select-pools',
      'trial-management.add-panel-members.select-pools.get',
      auth.verify,
      isCourtUser,
      controller.getSelectPools(app),
    );

    app.post('/trial-management/:locationCode/:trialNumber/add-panel-members/select-pools',
      'trial-management.add-panel-members.select-pools.post',
      auth.verify,
      isCourtUser,
      controller.postSelectPools(app),
    );
  };
})();
