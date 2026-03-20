(() => {
  'use strict';

  const controller = require('./edit-notes.controller');
  const auth = require('../../../../components/auth');
  const { isBureauManager } = require('../../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/local-authority/:laCode/edit-notes',
      'electoral-register.local-authority.edit-notes.get',
      auth.verify,
      isBureauManager,
      controller.getEditNotes(app)
    );

    app.post(
      '/electoral-register/local-authority/:laCode/edit-notes',
      'electoral-register.local-authority.edit-notes.post',
      auth.verify,
      isBureauManager,
      controller.postEditNotes(app)
    );
  };

})();
