(() => {
  'use strict';

  const controller = require('./change-active-status.controller');
  const auth = require('../../../../components/auth');
  const { isBureauManager } = require('../../../../components/auth/user-type');
  const { activateOrDeactivate } = require('../../../../components/route-parameter-constraints');

  module.exports = function(app) {
    app.get(
      '/electoral-register/local-authority/:laCode/:status',
      'electoral-register.local-authority.change-active-status.get',
      activateOrDeactivate,
      auth.verify,
      isBureauManager,
      controller.getChangeActiveStatus(app)
    );

    app.post(
      '/electoral-register/local-authority/:laCode/:status',
      'electoral-register.local-authority.change-active-status.post',
      activateOrDeactivate,
      auth.verify,
      isBureauManager,
      controller.postChangeActiveStatus(app)
    );
  };

})();
