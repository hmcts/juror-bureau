;(function(){
  'use strict';

  var controller = require('./pool-overview.controller')
    , completeServiceController = require('../../shared/complete-service/complete-service.controller')
    , transferController = require('../../juror-management/update/juror-update.transfer.controller')
    , reassignController = require('../../juror-management/reassign/reassign.controller')
    , auth = require('../../../components/auth');

  module.exports = function(app) {

    require('./change-attendance-date/index')(app);

    app.get('/pool-management/pool-overview/:poolNumber',
      'pool-overview.get',
      auth.verify,
      controller.getJurors(app));

    app.post('/pool-management/pool-overview/:poolNumber',
      'pool-overview.filter.post',
      auth.verify,
      controller.postFilterJurors(app));

    // ajax route to check / uncheck jurors
    app.post('/juror-management/pool-overview/:poolNumber/check',
      'pool-overview.check-uncheck.post',
      auth.verify,
      controller.postCheckJuror(app));

    app.get('/pool-management/pool-overview/:poolNumber/history',
      'pool-overview.history.get',
      auth.verify,
      controller.getHistory(app));

    // Bulk reassign
    app.post('/pool-management/reassign/',
      'pool-overview.reassign.post',
      auth.verify,
      controller.postReassign(app));
    app.get('/pool-management/reassign-jurors/:poolNumber',
      'pool-management.reassign.get',
      auth.verify,
      reassignController.getReassignJuror(app));
    app.post('/pool-management/reassign/:poolNumber',
      'pool-management.reassign.post',
      auth.verify,
      reassignController.postReassignJuror(app));
    app.post('/pool-management/reassign/:poolNumber/confirm',
      'pool-management.reassign.confirm.post',
      auth.verify,
      reassignController.postConfirmReassignJuror(app));

    // Bulk transfer
    app.post('/pool-management/:poolNumber/transfer/',
      'pool-overview.transfer.post',
      auth.verify,
      controller.postTransfer(app));

    app.get('/pool-management/:poolNumber/transfer/select-court',
      'pool-overview.transfer.select-court.get',
      auth.verify,
      transferController.getCourtTransfer(app));
    app.post('/pool-management/:poolNumber/transfer/select-court',
      'pool-overview.transfer.select-court.post',
      auth.verify,
      transferController.postCourtTransfer(app));

    app.get('/pool-management/:poolNumber/transfer/confirm',
      'pool-overview.transfer.confirm.get',
      auth.verify,
      transferController.getCourtTransferConfirm(app));
    app.post('/pool-management/:poolNumber/transfer/confirm',
      'pool-overview.transfer.confirm.post',
      auth.verify,
      controller.postTransferConfirm(app));
    app.post('/pool-management/:poolNumber/transfer/continue',
      'pool-overview.transfer.continue.post',
      auth.verify,
      controller.postTransferContinue(app));

    // Bulk complete service
    app.post('/pool-management/:poolNumber/complete-service',
      'pool-overview.complete-service.post',
      auth.verify,
      controller.postCompleteService(app));
    app.get('/pool-management/:poolNumber/complete-service/continue',
      'pool-overview.complete-service.continue.get',
      auth.verify,
      controller.getCompleteServiceContinue(app));

    app.get('/pool-management/:poolNumber/complete-service/confirm',
      'pool-overview.complete-service.confirm.get',
      auth.verify,
      completeServiceController.getCompleteServiceConfirm(app));
    app.post('/pool-management/:poolNumber/complete-service/confirm',
      'pool-overview.complete-service.confirm.post',
      auth.verify,
      completeServiceController.postCompleteServiceConfirm(app));

  };
})();
