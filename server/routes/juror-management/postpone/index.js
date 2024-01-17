(function() {
  'use strict';

  var auth = require('../../../components/auth')
    , controller = require('./postpone.controller');

  module.exports = function(app) {
    app.get('/juror-management/juror/:jurorNumber/update/postpone-date',
      'juror.update.postpone-date.get',
      auth.verify,
      controller.getPostponeDate(app));
    app.post('/juror-management/juror/:jurorNumber/update/postpone-date',
      'juror.update.postpone-date.post',
      auth.verify,
      controller.postPostponeDate(app));

    app.get('/juror-management/juror/:jurorNumber/available-pools',
      'juror.update.available-pools.get',
      auth.verify,
      controller.getAvailablePools(app));
    app.post('/juror-management/juror/:jurorNumber/available-pools',
      'juror.update.available-pools.post',
      auth.verify,
      controller.postAvailablePools(app));
  };

})();
