(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./reassign-panel.controller');
  const { isCourtUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.post('/trial-management/trials/:trialNumber/:locationCode/reassign',
      'trial-management.trials.reassign.post',
      auth.verify,
      isCourtUser,
      controller.postReassignPanel(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/reassign/invalid-jurors',
      'trial-management.trials.reassign.invalid-jurors.get',
      auth.verify,
      isCourtUser,
      controller.getValidateReassignPanel(app),
    );

    app.post('/trial-management/trials/:trialNumber/:locationCode/reassign/invalid-jurors',
      'trial-management.trials.reassign.invalid-jurors.post',
      auth.verify,
      isCourtUser,
      controller.postValidateReassignPanel(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/reassign/select-trial',
      'trial-management.trials.reassign.select-trial.get',
      auth.verify,
      isCourtUser,
      controller.getSelectTrial(app),
    );

    app.post('/trial-management/trials/:trialNumber/:locationCode/reassign/select-trial',
      'trial-management.trials.reassign.select-trial.post',
      auth.verify,
      isCourtUser,
      controller.postSelectTrial(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/reassign/confirm/:newTrialNumber/:newLocationCode',
      'trial-management.trials.reassign.confirm.get',
      auth.verify,
      isCourtUser,
      controller.getConfirmReassignPanel(app),
    );

    app.post('/trial-management/trials/:trialNumber/:locationCode/reassign/confirm/:newTrialNumber/:newLocationCode',
      'trial-management.trials.reassign.confirm.post',
      auth.verify,
      isCourtUser,
      controller.postConfirmReassignPanel(app),
    );
  }

})();