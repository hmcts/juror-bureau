(function() {
  'use strict';

  var controller = require('./juror-update.controller')
    , transferController = require('./juror-update.transfer.controller')
    , completeServiceController = require('./../../shared/complete-service/complete-service.controller')
    , failedToAttendController = require('./juror-update.failed-to-attend.controller')
    , auth = require('../../../components/auth/');

  module.exports = function(app) {

    // Juror record update page
    app.get('/juror-management/juror/:jurorNumber/update', 'juror.update.get', auth.verify, controller.index(app));
    app.post('/juror-management/juror/:jurorNumber/update', 'juror.update.post', auth.verify, controller.post(app));

    // Deferral - grant/refuse page
    app.get('/juror-management/juror/:jurorNumber/update/deferral'
      , 'juror.update.deferral.get'
      , auth.verify
      , controller.getDeferral(app));
    app.post('/juror-management/juror/:jurorNumber/update/deferral'
      , 'juror.update.deferral.post'
      , auth.verify
      , controller.postDeferral(app));

    // Transfer - transfer juror to another court
    // -Step 1 - select court and date
    app.get('/juror-management/juror/:jurorNumber/update/transfer/select-court'
      , 'juror.update.transfer.get'
      , auth.verify
      , transferController.getCourtTransfer(app));
    app.post('/juror-management/juror/:jurorNumber/update/transfer/select-court'
      , 'juror.update.transfer.post'
      , auth.verify
      , transferController.postCourtTransfer(app));
    // -Step 2 - confirm court transfer details
    app.get('/juror-management/juror/:jurorNumber/update/transfer/confirm'
      , 'juror.update.transfer_confirm.get'
      , auth.verify
      , transferController.getCourtTransferConfirm(app));
    app.post('/juror-management/juror/:jurorNumber/update/transfer/confirm'
      , 'juror.update.transfer_confirm.post'
      , auth.verify
      , controller.postCourtTransferConfirm(app));

    // Complete Service
    app.get('/juror-management/juror/:jurorNumber/update/complete-service',
      'juror.update.complete-service.get',
      auth.verify,
      completeServiceController.getCompleteServiceConfirm(app));
    app.post('/juror-management/juror/:jurorNumber/update/complete-service',
      'juror.update.complete-service.post',
      auth.verify,
      completeServiceController.postCompleteServiceConfirm(app));

    // Failed to attend JO and SJO
    app.get('/juror-management/juror/:jurorNumber/update/failed-to-attend',
      'juror.update.failed-to-attend.get',
      auth.verify,
      failedToAttendController.getFailedToAttend(app));
    app.post('/juror-management/juror/:jurorNumber/update/failed-to-attend',
      'juror.update.failed-to-attend.post',
      auth.verify,
      failedToAttendController.postFailedToAttend(app));
    app.get('/juror-management/juror/:jurorNumber/update/failed-to-attend/undo',
      'juror.update.failed-to-attend.undo.get',
      auth.verify,
      auth.isSJO,
      failedToAttendController.getUndoFailedToAttend(app));
    app.post('/juror-management/juror/:jurorNumber/update/failed-to-attend/undo',
      'juror.update.failed-to-attend.undo.post',
      auth.verify,
      auth.isSJO,
      failedToAttendController.postUndoFailedToAttend(app));

  };

})();
