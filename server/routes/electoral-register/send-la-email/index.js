(() => {
  'use strict';

  const controller = require('./send-la-email.controller');
  const auth = require('../../../components/auth');
  const { isBureauManager } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/local-authority/:laCode/send-reminder',
      'electoral-register.local-authority.send-reminder.get',
      auth.verify,
      isBureauManager,
      controller.getSendLaEmail(app, 'reminder')
    );

    app.post(
      '/electoral-register/local-authority/:laCode/send-reminder',
      'electoral-register.local-authority.send-reminder.post',
      auth.verify,
      isBureauManager,
      controller.postSendLaEmail(app, 'reminder')
    );

    app.get(
      '/electoral-register/send-reminder',
      'electoral-register.send-reminder.get',
      auth.verify,
      isBureauManager,
      controller.getSendLaEmail(app, 'reminder')
    );

    app.post(
      '/electoral-register/send-reminder',
      'electoral-register.send-reminder.post',
      auth.verify,
      isBureauManager,
      controller.postSendLaEmail(app, 'reminder')
    );

    app.get(
      '/electoral-register/local-authority/:laCode/initial-email',
      'electoral-register.local-authority.initial-email.get',
      auth.verify,
      isBureauManager,
      controller.getSendLaEmail(app, 'initial')
    );

    app.post(
      '/electoral-register/local-authority/:laCode/initial-email',
      'electoral-register.local-authority.initial-email.post',
      auth.verify,
      isBureauManager,
      controller.postSendLaEmail(app, 'initial')
    );

    app.get(
      '/electoral-register/initial-email',
      'electoral-register.initial-email.get',
      auth.verify,
      isBureauManager,
      controller.getSendLaEmail(app, 'initial')
    );

    app.post(
      '/electoral-register/initial-email',
      'electoral-register.initial-email.post',
      auth.verify,
      isBureauManager,
      controller.postSendLaEmail(app, 'initial')
    );
  };

})();
