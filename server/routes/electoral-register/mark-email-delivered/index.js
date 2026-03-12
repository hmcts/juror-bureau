(() => {
  'use strict';

  const controller = require('./mark-email-delivered.controller');
  const auth = require('../../../components/auth');
  const { isBureauUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/mark-email-delivered',
      'electoral-register.mark-email-delivered.get',
      auth.verify,
      isBureauUser,
      controller.getMarkEmailDelivered(app)
    );

    app.post(
      '/electoral-register/mark-email-delivered',
      'electoral-register.mark-email-delivered.post',
      auth.verify,
      isBureauUser,
      controller.postMarkEmailDelivered(app)
    );
  };

})();
