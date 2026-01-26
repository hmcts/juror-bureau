(() => {
  'use strict';

  const controller = require('./electoral-register.controller');
  const auth = require('../../components/auth');
  const { isBureauUser } = require('../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register',
      'electoral-register.get',
      auth.verify,
      isBureauUser,
      controller.getDashboard(app)
    );
  };

})();
