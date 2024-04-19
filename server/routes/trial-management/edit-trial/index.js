(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./edit-trial.controller');
  const { isCourtUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {

    app.get('/trial-management/trials/:trialNumber/:locationCode/edit',
      'trial-management.edit-trial.get',
      auth.verify,
      isCourtUser,
      controller.getEditTrial(app),
    );

    app.post('/trial-management/trials/:trialNumber/:locationCode/edit',
      'trial-management.edit-trial.post',
      auth.verify,
      isCourtUser,
      controller.postEditTrial(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/edit/confirm-protected',
      'trial-management.edit-trial-confirm-protected.get',
      auth.verify,
      isCourtUser,
      controller.getEditProtectedTrial(app),
    );

    app.post('/trial-management/trials/:trialNumber/:locationCode/edit/confirm-protected',
      'trial-management.edit-trial-confirm-protected.post',
      auth.verify,
      isCourtUser,
      controller.postEditProtectedTrial(app),
    );

  };
})();


