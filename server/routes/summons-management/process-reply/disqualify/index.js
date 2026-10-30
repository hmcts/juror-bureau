(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./process-reply-disqualify.controller');
  const { paperOrDigital } = require('../../../../components/route-parameter-constraints');

  module.exports = function(app) {
    app.get('/summons-replies/response/:id/:type/disqualify',
      'process-disqualify.get',
      paperOrDigital,
      auth.verify,
      controller.getDisqualify(app)
    );

    app.post('/summons-replies/response/:id/:type/disqualify',
      'process-disqualify.post',
      paperOrDigital,
      auth.verify,
      controller.postDisqualify(app)
    );

    app.get('/summons-replies/response/:id/:type/disqualify/letter',
      'process-disqualify.letter.get',
      paperOrDigital,
      auth.verify,
      controller.getDisqualifyLetter(app),
    );

    app.post('/summons-replies/response/:id/:type/disqualify/letter',
      'process-disqualify.letter.post',
      paperOrDigital,
      auth.verify,
      controller.postDisqualifyLetter(app),
    );
  };
})();
