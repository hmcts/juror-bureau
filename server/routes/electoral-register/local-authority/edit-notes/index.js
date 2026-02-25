(() => {
  'use strict';

  const controller = require('./edit-notes.controller');
  const auth = require('../../../../components/auth');
  const { isBureauUser } = require('../../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/local-authority/:laCode/edit-notes',
      'electoral-register.local-authority.edit-notes.get',
      auth.verify,
      isBureauUser,
      controller.getEditNotes(app)
    );

    app.post(
      '/electoral-register/local-authority/:laCode/edit-notes',
      'electoral-register.local-authority.edit-notes.post',
      auth.verify,
      isBureauUser,
      controller.postEditNotes(app)
    );
  };

})();
