(function() {
  'use strict';

  const controller = require('./juror-police-check.controller');
  const auth = require('../../../components/auth/');

  module.exports = function(app) {
    app.get('/juror-management/juror/:jurorNumber/run-police-check',
      'juror-record.police-check.get',
      auth.verify,
      controller.getRunPoliceCheck(app)
    );
    app.post('/juror-management/juror/:jurorNumber/run-police-check',
      'juror-record.police-check.post',
      auth.verify,
      controller.postRunPoliceCheck(app)
    );
  };
})();
