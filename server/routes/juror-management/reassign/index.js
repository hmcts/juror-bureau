(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./reassign.controller');
  const jurorUpdateController = require('../update/juror-update.controller');

  module.exports = function(app) {
    app.get('/juror-management/juror/:jurorNumber/update/reassign',
      'juror-management.reassign.get',
      auth.verify,
      controller.getReassignJuror(app));
    app.post('/juror-management/juror/:jurorNumber/update/reassign',
      'juror-management.reassign.post',
      auth.verify,
      controller.postReassignJuror(app));
    app.post('/juror-management/juror/:jurorNumber/update/reassign/confirm',
      'juror-management.reassign.confirm.post',
      auth.verify,
      controller.postConfirmReassignJuror(app));
    app.get('/juror-management/juror/:jurorNumber/update/reassign/ineligible-age/:newDate',
      'juror-management.reassign.ineligible-age.get',
      auth.verify,
      jurorUpdateController.getIneligibleAge(app));

    app.get('/juror-management/juror/:jurorNumber/update/reassign/select-court',
      'juror-management.reassign.select-court.get',
      auth.verify,
      controller.getChangeCourt(app));
    app.post('/juror-management/juror/:jurorNumber/update/reassign/select-court',
      'juror-management.reassign.select-court.post',
      auth.verify,
      controller.postChangeCourt(app));

    app.get('/pool-management/:poolNumber/select-court',
      'pool-management.reassign.select-court.get',
      auth.verify,
      controller.getChangeCourt(app));

    app.post('/pool-management/:poolNumber/select-court',
      'pool-management.reassign.select-court.post',
      auth.verify,
      controller.postChangeCourt(app));
  };

})();
