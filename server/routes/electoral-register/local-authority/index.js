(() => {
  'use strict';

  const controller = require('./local-authority.controller');
  const auth = require('../../../components/auth');
  const { isBureauManager } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    require('./change-active-status')(app);
    require('./edit-notes')(app);
    require('./change-email-request-status')(app);

    app.get(
      '/electoral-register/local-authority/:laCode',
      'electoral-register.local-authority.get',
      auth.verify,
      isBureauManager,
      controller.getLocalAuthorityInfo(app)
    );
  };

})();
