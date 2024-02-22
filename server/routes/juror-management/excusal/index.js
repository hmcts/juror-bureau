(function() {
  'use strict';

  const auth = require('../../../components/auth')
    , controller = require('./excusal.controller');

  module.exports = function(app) {
    app.get('/juror-management/juror/:jurorNumber/update/excusal',
      'juror.excusal.get',
      auth.verify,
      controller.index(app));
    app.post('/juror-management/juror/:jurorNumber/update/excusal',
      'juror.excusal.post',
      auth.verify,
      controller.post(app));

    app.get('/juror-management/juror/:jurorNumber/update/excusal/:letter(grant|refuse)/letter'
      , 'juror.update.excusal.letter.get'
      , auth.verify
      , controller.getExcusalLetter(app));
    app.post('/juror-management/juror/:jurorNumber/update/excusal/:letter(grant|refuse)/letter'
      , 'juror.update.excusal.letter.post'
      , auth.verify
      , controller.postExcusalLetter(app));
  };
})();
