(() => {
  'use strict';

  const controller = require('./change-active-status.controller');
  const auth = require('../../../../components/auth');
  const { isBureauUser } = require('../../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/local-authority/:laCode/:status(activate|deactivate)',
      'electoral-register.local-authority.change-active-status.get',
      auth.verify,
      isBureauUser,
      controller.getChangeActiveStatus(app)
    );

    app.post(
      '/electoral-register/local-authority/:laCode/:status(activate|deactivate)',
      'electoral-register.local-authority.change-active-status.post',
      auth.verify,
      isBureauUser,
      controller.postChangeActiveStatus(app)
    );
  };

})();
