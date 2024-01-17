(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./edit-trial.controller');

  module.exports = function(app) {

    app.get('/trial-management/edit-trial/:trialNumber/:locationCode',
      'trial-management.edit-trial.get',
      auth.verify,
      controller.getEditTrial(app),
    );

    app.post('/trial-management/edit-trial/:trialNumber/:locationCode',
      'trial-management.edit-trial.post',
      auth.verify,
      controller.postEditTrial(app),
    );

  };
})();


