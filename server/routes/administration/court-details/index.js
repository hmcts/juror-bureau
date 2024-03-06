(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const { isCourtUser } = require('../../../components/auth/user-type');
  const controller = require('./court-details.controller');

  module.exports = function(app) {

    app.get('/administration/court-details/',
      'administration.court-details.get',
      auth.verify,
      isCourtUser,
      controller.getCourtDetails(app),
    );

    app.get('/administration/court-details/:locationCode',
      'administration.court-details.location.get',
      auth.verify,
      isCourtUser,
      controller.getCourtLocationDetails(app),
    );

    app.post('/administration/court-details/:locationCode',
      'administration.court-details.location.post',
      auth.verify,
      isCourtUser,
      controller.postCourtLocationDetails(app),
    );
  };
})();
