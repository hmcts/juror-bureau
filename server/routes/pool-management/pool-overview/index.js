;(function(){
  'use strict';

  const controller = require('./pool-overview.controller');
  const completeServiceController = require('../../shared/complete-service/complete-service.controller');
  const transferController = require('../../juror-management/update/juror-update.transfer.controller');
  const reassignController = require('../../juror-management/reassign/reassign.controller');
  const postponeController = require('../../juror-management/postpone/postpone.controller');
  const nonAttendanceController = require('../../juror-management/expenses/non-attendance-day/non-attendance-day.controller');
  const auth = require('../../../components/auth');
  const { isCourtUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {

    require('./change-next-due-at-court')(app);
    require('./on-call')(app);

    app.get('/pool-management/pool-overview/:poolNumber',
      'pool-overview.get',
      auth.verify,
      controller.getJurors(app));

    app.post('/pool-management/pool-overview/:poolNumber',
      'pool-overview.filter.post',
      auth.verify,
      controller.postFilterJurors(app));

    app.post('/juror-management/pool-overview/:poolNumber/check',
      'pool-overview.check-uncheck.post',
      auth.verify,
      controller.postCheckJuror(app));

    app.get('/pool-management/pool-overview/:poolNumber/history',
      'pool-overview.history.get',
      auth.verify,
      controller.getHistory(app));

    // Bulk reassign
    app.post('/pool-overview/reassign/:poolNumber',
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

    // Bulk postpone
    app.post('/pool-management/:poolNumber/postpone',
      'pool-overview.postpone.post',
      auth.verify,
      controller.postBulkPostpone(app));
    app.get('/pool-management/postpone-jurors/:poolNumber',
      'pool-management.postpone.get',
      auth.verify,
      postponeController.getPostponeDate(app));

     // Bulk on-call
    app.post('/pool-management/:poolNumber/on-call',
      'pool-overview.on-call.post',
      auth.verify,
      controller.postBulkOnCall(app));

    // Bulk non-attendance
    app.post('/pool-management/:poolNumber/add-non-attendance-day/jurors',
      'pool-overview.add-non-attendance-day.jurors.post',
      auth.verify,
      isCourtUser,
      controller.postBulkNonAttendance(app));
    app.get('/pool-management/:poolNumber/add-non-attendance-day',
      'pool-management.add-non-attendance-day.get',
      auth.verify,
      isCourtUser,
      nonAttendanceController.getNonAttendanceDay(app),
    );
    app.post('/pool-management/:poolNumber/add-non-attendance-day',
      'pool-management.add-non-attendance-day.post',
      auth.verify,
      isCourtUser,
      nonAttendanceController.postBulkNonAttendanceDay(app),
    );
  };

})();
