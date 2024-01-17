(function(){
  'use strict';

  var controller = require('./pool-create-manual.controller')
    , auth = require('../../../components/auth')
    , isCourtUser = require('../../../components/auth/user-type').isCourtUser;

  module.exports = function(app) {
    app.get('/pool-management/pool-create-court-only',
      'court-only-pool.get',
      auth.verify,
      isCourtUser,
      controller.index(app));
    app.post('/pool-management/pool-create-court-only',
      'court-only-pool.post',
      auth.verify,
      isCourtUser,
      controller.postPoolDetails(app));

    app.get('/pool-management/pool-create-court-only/select-court',
      'court-only-pool.select-court.get',
      auth.verify,
      isCourtUser,
      controller.getSelectCourt(app));
    app.post('/pool-management/pool-create-court-only/select-court',
      'court-only-pool.select-court.post',
      auth.verify,
      isCourtUser,
      controller.postSelectCourt(app));

    app.get('/pool-management/pool-create-court-only/check-details',
      'court-only-pool.check-details.get',
      auth.verify,
      isCourtUser,
      controller.getCheckPoolDetails(app));
    app.post('/pool-management/pool-create-court-only/check-details',
      'court-only-pool.check-details.post',
      auth.verify,
      isCourtUser,
      controller.postCheckPoolDetails(app));
  };

})();
