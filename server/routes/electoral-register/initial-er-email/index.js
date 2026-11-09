(() => {
  'use strict';

  const controller = require('./initial-er-email.controller');
  const auth = require('../../../components/auth');
  const { isBureauManager } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/initial-er-email',
      'electoral-register.initial-er-email.get',
      auth.verify,
      isBureauManager,
      controller.getInitialErEmail(app)
    );

    app.post(
      '/electoral-register/initial-er-email',
      'electoral-register.initial-er-email.post',
      auth.verify,
      isBureauManager,
      controller.postInitialErEmail(app)
    );
  };

})();
