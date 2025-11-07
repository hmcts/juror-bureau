(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./excusal.controller');
  const { checkRouteParam } = require('../../../lib/mod-utils');

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
      , auth.verify
      , checkRouteParam('letter', ['grant', 'refuse'])
      , controller.getExcusalLetter(app));
    app.post('/juror-management/juror/:jurorNumber/update/excusal/:letter/letter'
      , 'juror.update.excusal.letter.post'
      , auth.verify
      , checkRouteParam('letter', ['grant', 'refuse'])
      , controller.postExcusalLetter(app));
  };
})();
