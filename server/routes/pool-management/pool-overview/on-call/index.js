;(function(){
  'use strict';

  const controller = require('./on-call.controller');
  const auth = require('../../../../components/auth');

  module.exports = function(app) {

    app.get('/pool-management/:poolNumber/on-call/validate',
      'pool-management.on-call.validate.get',
      auth.verify,
      controller.getValidateOnCallJurors(app)
    );

    app.post('/pool-management/:poolNumber/on-call/validate',
      'pool-management.on-call.validate.post',
      auth.verify,
      controller.postValidateOnCallJurors(app)
    );

    app.get('/pool-management/:poolNumber/on-call/confirm',
      'pool-management.on-call.confirm.get',
      auth.verify,
      controller.getConfirmOnCallJurors(app)
    );

    app.post('/pool-management/:poolNumber/on-call/confirm',
      'pool-management.on-call.confirm.post',
      auth.verify,
      controller.postConfirmOnCallJurors(app)
    );
  }
})();
