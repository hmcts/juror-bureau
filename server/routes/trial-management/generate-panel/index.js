(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./generate-panel.controller');

  module.exports = function(app) {

    app.get('/trial-management/:locationCode/:trialNumber/generate-panel',
      'trial-management.generate-panel.get',
      auth.verify,
      controller.getGeneratePanel(app),
    );

    app.post('/trial-management/:locationCode/:trialNumber/generate-panel',
      'trial-management.generate-panel.post',
      auth.verify,
      controller.postGeneratePanel(app),
    );

    app.get('/trial-management/:locationCode/:trialNumber/generate-panel/select-pools',
      'trial-management.generate-panel.select-pools.get',
      auth.verify,
      controller.getSelectPools(app),
    );

    app.post('/trial-management/:locationCode/:trialNumber/generate-panel/select-pools',
      'trial-management.generate-panel.select-pools.post',
      auth.verify,
      controller.postSelectPools(app),
    );

  };
})();
