(function() {
  'use strict';

  var auth = require('../../../../components/auth')
    , controller = require('./process-reply-disqualify.controller');

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
  }
})();
