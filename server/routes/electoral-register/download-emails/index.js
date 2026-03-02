(() => {
  'use strict';

  const controller = require('./download-emails.controller');
  const auth = require('../../../components/auth');
  const { isBureauUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/download-emails/:status(active|all)',
      'electoral-register.download-emails.get',
      auth.verify,
      isBureauUser,
      controller.getDownloadLaEmails(app)
    );
  };

})();
