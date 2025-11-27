(function() {
  'use strict';

  const auth = require('../../../../components/auth')
  const controller = require('./process-reply-disqualify.controller');

  module.exports = function(app) {
    app.get('/summons-replies/response/:id/:type(paper|digital)/disqualify',
      'process-disqualify.get',
      auth.verify,
      controller.getDisqualify(app)
    );

    app.post('/summons-replies/response/:id/:type(paper|digital)/disqualify',
      'process-disqualify.post',
      auth.verify,
      controller.postDisqualify(app)
    );

    app.get('/summons-replies/response/:id/:type(paper|digital)/disqualify/letter',
      'process-disqualify.letter.get',
      auth.verify,
      controller.getDisqualifyLetter(app),
    );

    app.post('/summons-replies/response/:id/:type(paper|digital)/disqualify/letter',
      'process-disqualify.letter.post',
      auth.verify,
      controller.postDisqualifyLetter(app),
    );
  };
})();
