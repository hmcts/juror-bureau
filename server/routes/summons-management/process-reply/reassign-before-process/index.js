(function() {
  'use strict';

  var auth = require('../../../../components/auth')
    , controller = require('./reassign-before-process.controller');

  module.exports = function(app) {
    app.get('/summons-replies/response/:id/:type(paper|digital)/process/:action',
      'reassign-before-process.get',
      auth.verify,
      controller.getReassignBeforeProcess(app)
    );
    app.post('/summons-replies/response/:id/:type(paper|digital)/process/:action',
      'reassign-before-process.post',
      auth.verify,
      controller.postReassignBeforeProcess(app)
    );

    app.get('/summons-replies/response/:id/:type(paper|digital)/process/:action/reassign',
      'reassign-before-process.available-pools.get',
      auth.verify,
      controller.getReassignBeforeProcessPools(app)
    );
    app.post('/summons-replies/response/:id/:type(paper|digital)/process/:action/reassign',
      'reassign-before-process.available-pools.post',
      auth.verify,
      controller.postReassignBeforeProcessPools(app)
    );

    app.get('/summons-replies/response/:id/:type(paper|digital)/process/:action/reassign/select-court',
      'reassign-before-process.select-court.get',
      auth.verify,
      controller.getReassignBeforeProcessChangeCourt(app)
    );
    app.post('/summons-replies/response/:id/:type(paper|digital)/process/:action/reassign/select-court',
      'reassign-before-process.select-court.post',
      auth.verify,
      controller.postReassignBeforeProcessChangeCourt(app)
    );

    app.get('/summons-replies/response/:id/:type(paper|digital)/process/reassign/excusal',
      'reassign-before-process.excusal.get',
      auth.verify,
      controller.getReassignBeforeProcessExcusal(app)
    );
    app.post('/summons-replies/response/:id/:type(paper|digital)/process/reassign/excusal',
      'reassign-before-process.excusal.post',
      auth.verify,
      controller.postReassignBeforeProcessExcusal(app)
    );
  };
})();
