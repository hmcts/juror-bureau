(() => {
  'use strict';

  const controller = require('./deactivate-la.controller');
  const auth = require('../../../../components/auth');
  const { isBureauUser } = require('../../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/local-authority/:laCode/deactivate',
      'electoral-register.local-authority.deactivate.get',
      auth.verify,
      isBureauUser,
      controller.getDeactivateLa(app)
    );

    app.post(
      '/electoral-register/local-authority/:laCode/deactivate',
      'electoral-register.local-authority.deactivate.post',
      auth.verify,
      isBureauUser,
      controller.postDeactivateLa(app)
    );
  };

})();
