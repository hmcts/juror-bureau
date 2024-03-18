(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./users.controller');
  const { isSystemAdministrator } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    require('./create-users')(app);
    require('./assign-courts')(app);
    require('./edit-user')(app);

    app.get('/administration/users',
      'administration.users.get',
      auth.verify,
      isSystemAdministrator,
      controller.getUsers(app),
    );

    app.post('/administration/users/search',
      'administration.users.search.post',
      auth.verify,
      isSystemAdministrator,
      controller.postSearchUsers(app),
    );

    app.get('/administration/users/:username',
      'administration.users.details.get',
      auth.verify,
      isSystemAdministrator,
      controller.getUserRecord(app),
    );
  };
})();
