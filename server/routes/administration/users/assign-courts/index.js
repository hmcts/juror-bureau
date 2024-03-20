(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./assign-courts');
  const { isSystemAdministrator } = require('../../../../components/auth/user-type');

  module.exports = function(app) {
    app.get('/administration/users/edit/:username/assign',
      'administration.users.assign-courts.get',
      auth.verify,
      isSystemAdministrator,
      controller.getAssignCourts(app),
    );

    app.post('/administration/users/edit/:username/assign/filter',
      'administration.users.assign-courts.filter',
      auth.verify,
      isSystemAdministrator,
      controller.postFilterCourts(app),
    );

    app.get('/administration/users/edit/:username/assign/filter/clear',
      'administration.users.assign-courts.clear-filter',
      auth.verify,
      isSystemAdministrator,
      controller.getClearFilter(app),
    );

    app.post('/administration/users/edit/:username/assign',
      'administration.users.assign-courts.post',
      auth.verify,
      isSystemAdministrator,
      controller.postAssignCourts(app),
    );

    app.get('/administration/users/edit/:username/remove/:locCode',
      'administration.users.remove-court.get',
      auth.verify,
      isSystemAdministrator,
      controller.getRemoveCourt(app),
    );

    app.post('/administration/users/edit/:username/remove',
      'administration.users.remove-court.post',
      auth.verify,
      isSystemAdministrator,
      controller.postRemoveCourt(app),
    );
  };
})();
