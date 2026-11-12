(function() {
  'use strict';

  const auth = require('../../../components/auth')
  const controller = require('./request-info.controller')
  const { isBureauUser } = require('../../../components/auth/user-type');
  const { paperOrDigital } = require('../../../components/route-parameter-constraints');

  module.exports = function(app) {
    app.get('/summons-replies/response/:id/request-info/:type',
      'request-info.by-post.get',
      paperOrDigital,
      auth.verify,
      isBureauUser,
      controller.getRequestInfo(app));
    app.post('/summons-replies/response/:id/request-info/:type',
      'request-info.by-post.post',
      paperOrDigital,
      auth.verify,
      isBureauUser,
      controller.postRequestInfo(app));

    app.get('/summons-replies/response/:id/request-info/letter/:type',
      'request-info.by-post.letter.get',
      paperOrDigital,
      auth.verify,
      isBureauUser,
      controller.getRequestInfoLetter(app));
    app.post('/summons-replies/response/:id/request-info/letter/:type',
      'request-info.by-post.letter.post',
      paperOrDigital,
      auth.verify,
      isBureauUser,
      controller.postRequestInfoLetter(app));
  }

})();
