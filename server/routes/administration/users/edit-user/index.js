(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./edit-user.controller');
  const createUserController = require('../create-users/create-users.controller');
  const { isSystemAdministrator, isCourtManager, isBureauManager } = require('../../../../components/auth/user-type');

  const canEditUser = function(req, res, next) {
    if (
      isSystemAdministrator(req, res) || isCourtManager(req, res) || isBureauManager(req, res)
    ) {
      if (typeof next !== 'undefined') {
        return next();
      }
      return true;
    }
    if (typeof next !== 'undefined') {
      return errors(req, res, 403);
    }
    return false;
  };

  module.exports = function(app) {
    app.get('/administration/users/edit-user/:username',
      'administration.users.edit.get',
      auth.verify,
      canEditUser,
      controller.getEditUser(app),
    );

    app.post('/administration/users/edit-user/:username',
      'administration.users.edit.post',
      auth.verify,
      canEditUser,
      controller.postEditUser(app),
    );

    app.get('/administration/users/edit-user/:username/type',
      'administration.users.edit.type.get',
      auth.verify,
      isSystemAdministrator,
      createUserController.getUserType(app),
    );

    app.post('/administration/users/edit-user/:username/type',
      'administration.users.edit.type.post',
      auth.verify,
      isSystemAdministrator,
      createUserController.postUserType(app),
    );

    app.get('/administration/users/edit-user/:username/:userType',
      'administration.users.edit.type.details.get',
      auth.verify,
      isSystemAdministrator,
      createUserController.getUserDetails(app),
    );

    app.post('/administration/users/edit-user/:username/:userType',
      'administration.users.edit.type.details.post',
      auth.verify,
      isSystemAdministrator,
      createUserController.postUserDetails(app),
    );

    app.get('/administration/users/edit-user/:username/:userType/confirm',
      'administration.users.edit.type.confirm.get',
      auth.verify,
      isSystemAdministrator,
      createUserController.getConfirmUserDetails(app),
    );

    app.post('/administration/users/edit-user/:username/:userType/confirm',
      'administration.users.edit.type.confirm.post',
      auth.verify,
      isSystemAdministrator,
      controller.postConfirmEditUserType(app),
    );
  };
})();
