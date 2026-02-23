(() => {
  'use strict';

  const controller = require('./activate-la.controller');
  const auth = require('../../../../components/auth');
  const { isBureauUser } = require('../../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/local-authority/:laCode/activate',
      'electoral-register.local-authority.activate.get',
      auth.verify,
      isBureauUser,
      controller.getActivateLa(app)
    );

    app.post(
      '/electoral-register/local-authority/:laCode/activate',
      'electoral-register.local-authority.activate.post',
      auth.verify,
      isBureauUser,
      controller.postActivateLa(app)
    );
  };

})();
