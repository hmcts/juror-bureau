(() => {
  'use strict';

  const controller = require('./mark-email-delivered.controller');
  const auth = require('../../../components/auth');
  const { isBureauManager } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/mark-email-delivered',
      'electoral-register.mark-email-delivered.get',
      auth.verify,
      isBureauManager,
      controller.getMarkEmailDelivered(app)
    );

    app.post(
      '/electoral-register/mark-email-delivered',
      'electoral-register.mark-email-delivered.post',
      auth.verify,
      isBureauManager,
      controller.postMarkEmailDelivered(app)
    );
  };

})();
