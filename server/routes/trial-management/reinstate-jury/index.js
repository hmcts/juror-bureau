(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./reinstate-jury.controller');
  const { isCourtUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get('/trial-management/trials/:trialNumber/:locationCode/reinstate-jury',
      'trial-management.trials.reinstate-jury.get',
      auth.verify,
      isCourtUser,
      controller.getReinstateJury(app),
    );

    app.post('/trial-management/trials/:trialNumber/:locationCode/reinstate-jury',
      'trial-management.trials.reinstate-jury.post',
      auth.verify,
      isCourtUser,
      controller.postReinstateJury(app),
    );
  }

})();