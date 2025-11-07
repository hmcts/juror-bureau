(function() {
  'use strict';

  const auth = require('../../../components/auth')
  const controller = require('./request-info.controller')
  const isBureauUser = require('../../../components/auth/user-type').isBureauUser;
  const { checkRouteParam } = require('../../../lib/mod-utils');

  module.exports = function(app) {
    app.get('/summons-replies/response/:id/request-info/:type',
      'request-info.by-post.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      isBureauUser,
      controller.getRequestInfo(app));
    app.post('/summons-replies/response/:id/request-info/:type',
      'request-info.by-post.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      isBureauUser,
      controller.postRequestInfo(app));

    app.get('/summons-replies/response/:id/request-info/letter/:type',
      'request-info.by-post.letter.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      isBureauUser,
      controller.getRequestInfoLetter(app));
    app.post('/summons-replies/response/:id/request-info/letter/:type',
      'request-info.by-post.letter.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      isBureauUser,
      controller.postRequestInfoLetter(app));
  }

})();
