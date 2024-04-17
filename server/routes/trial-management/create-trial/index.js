(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./create-trial.controller');
  const { isCourtUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {

    app.get('/trial-management/create-trial',
      'trial-management.create-trial.get',
      auth.verify,
      isCourtUser,
      controller.getCreateTrial(app),
    );

    app.post('/trial-management/create-trial',
      'trial-management.create-trial.post',
      auth.verify,
      isCourtUser,
      controller.postCreateTrial(app),
    );

    app.get('/trial-management/create-trial/confirm-protected',
      'trial-management.create-trial-confirm-protected.get',
      auth.verify,
      isCourtUser,
      controller.getCreateProtectedTrial(app),
    );

    app.post('/trial-management/create-trial/confirm-protected',
      'trial-management.create-trial-confirm-protected.post',
      auth.verify,
      isCourtUser,
      controller.postCreateProtectedTrial(app),
    );

  };
})();


