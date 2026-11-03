(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./excusal.controller');
  const { grantOrRefuse } = require('../../../components/route-parameter-constraints');

  module.exports = function(app) {
    app.get('/juror-management/juror/:jurorNumber/update/excusal',
      'juror.excusal.get',
      auth.verify,
      controller.index(app));
    app.post('/juror-management/juror/:jurorNumber/update/excusal',
      'juror.excusal.post',
      auth.verify,
      controller.post(app));

    app.get('/juror-management/juror/:jurorNumber/update/excusal/:letter/letter'
      , 'juror.update.excusal.letter.get'
      , grantOrRefuse
      , auth.verify
      , controller.getExcusalLetter(app));
    app.post('/juror-management/juror/:jurorNumber/update/excusal/:letter/letter'
      , 'juror.update.excusal.letter.post'
      , grantOrRefuse
      , auth.verify
      , controller.postExcusalLetter(app));
  };
})();
