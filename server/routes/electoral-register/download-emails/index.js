(() => {
  'use strict';

  const controller = require('./download-emails.controller');
  const auth = require('../../../components/auth');
  const { isBureauManager } = require('../../../components/auth/user-type');
  const { activeOrAll } = require('../../../components/route-parameter-constraints');

  module.exports = function(app) {
    app.get(
      '/electoral-register/download-emails/:status',
      'electoral-register.download-emails.get',
      activeOrAll,
      auth.verify,
      isBureauManager,
      controller.getDownloadLaEmails(app)
    );
  };

})();
