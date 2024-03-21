(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const { isCourtManager } = require('../../../components/auth/user-type');
  const controller = require('./room-locations.controller');

  module.exports = function(app) {

    app.get('/administration/room-locations/:locationCode',
      'administration.room-locations.get',
      auth.verify,
      isCourtManager,
      controller.getRoomLocations(app),
    );

    app.get('/administration/room-locations/:locationCode/edit/:id',
      'administration.room-locations.edit.get',
      auth.verify,
      isCourtManager,
      controller.getEditCourtroom(app),
    );

    app.post('/administration/room-locations/:locationCode/edit/:id',
      'administration.room-locations.edit.post',
      auth.verify,
      isCourtManager,
      controller.postEditCourtroom(app),
    );

    app.get('/administration/room-locations/:locationCode/add',
      'administration.room-locations.add.get',
      auth.verify,
      isCourtManager,
      controller.getAddCourtroom(app),
    );

    app.post('/administration/room-locations/:locationCode/add',
      'administration.room-locations.add.post',
      auth.verify,
      isCourtManager,
      controller.postAddCourtroom(app),
    );
  };
})();
