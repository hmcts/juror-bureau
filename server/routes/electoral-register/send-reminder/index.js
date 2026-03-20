(() => {
  'use strict';

  const controller = require('./send-reminder.controller');
  const auth = require('../../../components/auth');
  const { isBureauManager } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/local-authority/:laCode/send-reminder',
      'electoral-register.local-authority.send-reminder.get',
      auth.verify,
      isBureauManager,
      controller.getSendReminder(app)
    );

    app.post(
      '/electoral-register/local-authority/:laCode/send-reminder',
      'electoral-register.local-authority.send-reminder.post',
      auth.verify,
      isBureauManager,
      controller.postSendReminder(app)
    );

    app.get(
      '/electoral-register/send-reminder',
      'electoral-register.send-reminder.get',
      auth.verify,
      isBureauManager,
      controller.getSendReminder(app)
    );

    app.post(
      '/electoral-register/send-reminder',
      'electoral-register.send-reminder.post',
      auth.verify,
      isBureauManager,
      controller.postSendReminder(app)
    );
  };

})();
