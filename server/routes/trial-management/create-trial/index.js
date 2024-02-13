(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./create-trial.controller');

  module.exports = function(app) {

    app.get('/trial-management/create-trial',
      'trial-management.create-trial.get',
      auth.verify,
      controller.getCreateTrial(app),
    );

    app.post('/trial-management/create-trial',
      'trial-management.create-trial.post',
      auth.verify,
      controller.postCreateTrial(app),
    );

    app.get('/trial-management/create-trial/confirm-protected',
      'trial-management.create-trial-confirm-protected.get',
      auth.verify,
      controller.getCreateProtectedTrial(app),
    );

    app.post('/trial-management/create-trial/confirm-protected',
      'trial-management.create-trial-confirm-protected.post',
      auth.verify,
      controller.postCreateProtectedTrial(app),
    );

  };
})();


