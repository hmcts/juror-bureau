(function() {
  'use strict';

  const auth = require('../../../../components/auth')
  const controller = require('./process-reply-disqualify.controller');
  const { checkRouteParam } = require('../../../../lib/mod-utils');

  module.exports = function(app) {
    app.get('/summons-replies/response/:id/:type/disqualify',
      'process-disqualify.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.getDisqualify(app)
    );

    app.post('/summons-replies/response/:id/:type/disqualify',
      'process-disqualify.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.postDisqualify(app)
    );

    app.get('/summons-replies/response/:id/:type/disqualify/letter',
      'process-disqualify.letter.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.getDisqualifyLetter(app),
    );

    app.post('/summons-replies/response/:id/:type/disqualify/letter',
      'process-disqualify.letter.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.postDisqualifyLetter(app),
    );
  };
})();
