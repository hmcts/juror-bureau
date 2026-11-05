(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./reassign-before-process.controller');
  const { paperOrDigital } = require('../../../../components/route-parameter-constraints');

  module.exports = function(app) {
    app.get('/summons-replies/response/:id/:type/process/:action',
      'reassign-before-process.get',
      paperOrDigital,
      auth.verify,
      controller.getReassignBeforeProcess(app)
    );
    app.post('/summons-replies/response/:id/:type/process/:action',
      'reassign-before-process.post',
      paperOrDigital,
      auth.verify,
      controller.postReassignBeforeProcess(app)
    );

    app.get('/summons-replies/response/:id/:type/process/:action/reassign',
      'reassign-before-process.available-pools.get',
      paperOrDigital,
      auth.verify,
      controller.getReassignBeforeProcessPools(app)
    );
    app.post('/summons-replies/response/:id/:type/process/:action/reassign',
      'reassign-before-process.available-pools.post',
      paperOrDigital,
      auth.verify,
      controller.postReassignBeforeProcessPools(app)
    );

    app.get('/summons-replies/response/:id/:type/process/:action/reassign/select-court',
      'reassign-before-process.select-court.get',
      paperOrDigital,
      auth.verify,
      controller.getReassignBeforeProcessChangeCourt(app)
    );
    app.post('/summons-replies/response/:id/:type/process/:action/reassign/select-court',
      'reassign-before-process.select-court.post',
      paperOrDigital,
      auth.verify,
      controller.postReassignBeforeProcessChangeCourt(app)
    );

    app.get('/summons-replies/response/:id/:type/process/reassign/excusal',
      'reassign-before-process.excusal.get',
      paperOrDigital,
      auth.verify,
      controller.getReassignBeforeProcessExcusal(app)
    );
    app.post('/summons-replies/response/:id/:type/process/reassign/excusal',
      'reassign-before-process.excusal.post',
      paperOrDigital,
      auth.verify,
      controller.postReassignBeforeProcessExcusal(app)
    );
  };
})();
