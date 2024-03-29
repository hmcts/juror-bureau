const auth = require('../../../../components/auth');
const controller = require('./create-users.controller');
const { isSystemAdministrator } = require('../../../../components/auth/user-type');

module.exports = function (app) {
  app.get('/administration/users/create-user/type',
    'administration.users.create.type.get',
    auth.verify,
    isSystemAdministrator,
    controller.getUserType(app),
  );

  app.post('/administration/users/create-user/type',
    'administration.users.create.type.post',
    auth.verify,
    isSystemAdministrator,
    controller.postUserType(app),
  );

  app.get('/administration/users/create-user/:userType',
    'administration.users.create.details.get',
    auth.verify,
    isSystemAdministrator,
    controller.getUserDetails(app),
  );

  app.post('/administration/users/create-user/:userType',
    'administration.users.create.details.post',
    auth.verify,
    isSystemAdministrator,
    controller.postUserDetails(app),
  );

  app.get('/administration/users/create-user/:userType/confirm',
    'administration.users.create.confirm.get',
    auth.verify,
    isSystemAdministrator,
    controller.getConfirmUserDetails(app),
  );

  app.post('/administration/users/create-user/:userType/confirm',
    'administration.users.create.confirm.post',
    auth.verify,
    isSystemAdministrator,
    controller.postConfirmUserDetails(app),
  );
};
