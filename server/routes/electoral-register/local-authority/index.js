(() => {
  'use strict';

  const controller = require('./local-authority.controller');
  const auth = require('../../../components/auth');
  const { isBureauUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    require('./change-active-status')(app);
    require('./edit-notes')(app);

    app.get(
      '/electoral-register/local-authority/:laCode',
      'electoral-register.local-authority.get',
      auth.verify,
      isBureauUser,
      controller.getLocalAuthorityInfo(app)
    );
  };

})();
