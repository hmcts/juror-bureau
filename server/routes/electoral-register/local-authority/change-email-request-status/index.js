(() => {
  'use strict';

  const controller = require('./change-email-request-status.controller');
  const auth = require('../../../../components/auth');
  const { isBureauManager } = require('../../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/local-authority/:laCode/change-email-request-status',
      'electoral-register.local-authority.change-email-request-status.get',
      auth.verify,
      isBureauManager,
      controller.getChangeEmailRequestStatus(app)
    );

    app.post(
      '/electoral-register/local-authority/:laCode/change-email-request-status',
      'electoral-register.local-authority.change-email-request-status.post',
      auth.verify,
      isBureauManager,
      controller.postChangeEmailRequestStatus(app)
    );
  };

})();
