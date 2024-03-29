const { isTeamLeader } = require('../../../../components/auth/user-type');

(function() {
  'use strict';

  var auth = require('../../../../components/auth')
    , controller = require('./edit-pool.controller');

  module.exports = function(app) {
    app.get('/pool-management/pool/:poolNumber/edit',
      'pool-management.edit-pool.get',
      auth.verify,
      isTeamLeader,
      controller.index(app));
    app.post('/pool-management/pool/:poolNumber/edit',
      'pool-management.edit-pool.post',
      auth.verify,
      isTeamLeader,
      controller.post(app));
  };

})();
