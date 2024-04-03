(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./add-panel-member.controller');

  module.exports = function(app) {

    app.get('/trial-management/trials/:trialNumber/:locationCode/add-panel-members',
      'trial-management.add-panel-members.get',
      auth.verify,
      controller.getAddPanelMember(app),
    );
    app.post('/trial-management/trials/:trialNumber/:locationCode/add-panel-members',
      'trial-management.add-panel-members.post',
      auth.verify,
      controller.postAddPanelMember(app),
    );

    app.get('/trial-management/:locationCode/:trialNumber/add-panel-members/select-pools',
      'trial-management.add-panel-members.select-pools.get',
      auth.verify,
      controller.getSelectPools(app),
    );

    app.post('/trial-management/:locationCode/:trialNumber/add-panel-members/select-pools',
      'trial-management.add-panel-members.select-pools.post',
      auth.verify,
      controller.postSelectPools(app),
    );
  };
})();
