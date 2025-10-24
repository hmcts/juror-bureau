(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./reassign-before-process.controller');
  const { checkRouteParam } = require('../../../../lib/mod-utils');

  module.exports = function(app) {
    app.get('/summons-replies/response/:id/:type/process/:action',
      'reassign-before-process.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.getReassignBeforeProcess(app)
    );
    app.post('/summons-replies/response/:id/:type/process/:action',
      'reassign-before-process.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.postReassignBeforeProcess(app)
    );

    app.get('/summons-replies/response/:id/:type/process/:action/reassign',
      'reassign-before-process.available-pools.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.getReassignBeforeProcessPools(app)
    );
    app.post('/summons-replies/response/:id/:type/process/:action/reassign',
      'reassign-before-process.available-pools.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.postReassignBeforeProcessPools(app)
    );

    app.get('/summons-replies/response/:id/:type/process/:action/reassign/select-court',
      'reassign-before-process.select-court.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.getReassignBeforeProcessChangeCourt(app)
    );
    app.post('/summons-replies/response/:id/:type/process/:action/reassign/select-court',
      'reassign-before-process.select-court.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.postReassignBeforeProcessChangeCourt(app)
    );

    app.get('/summons-replies/response/:id/:type/process/reassign/excusal',
      'reassign-before-process.excusal.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.getReassignBeforeProcessExcusal(app)
    );
    app.post('/summons-replies/response/:id/:type/process/reassign/excusal',
      'reassign-before-process.excusal.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      controller.postReassignBeforeProcessExcusal(app)
    );
  };
})();
