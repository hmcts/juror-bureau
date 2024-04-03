(function() {
  'use strict';

  const auth = require('../../components/auth');
  const sendController = require('./send-messages.controller');
  const exportController = require('./export-contacts-controller');
  const { isCourtUser } = require('../../components/auth/user-type');

  module.exports = function(app) {
    app.get('/messaging/send',
      'messaging.send.get',
      auth.verify,
      isCourtUser,
      sendController.getMessages(app),
    );

    app.get('/messaging/send/:message',
      'messaging.send.template.get',
      auth.verify,
      isCourtUser,
      sendController.getMessageTemplate(app),
    );

    app.post('/messaging/send/:message',
      'messaging.send.template.post',
      auth.verify,
      isCourtUser,
      sendController.postMessageTemplate(app),
    );

    app.get('/messaging/send/:message/find-jurors',
      'messaging.send.find-jurors.get',
      auth.verify,
      isCourtUser,
      sendController.getFindJurors(app),
    );

    app.post('/messaging/send/:message/find-jurors',
      'messaging.send.find-jurors.post',
      auth.verify,
      isCourtUser,
      sendController.postFindJurors(app),
    );

    app.get('/messaging/send/:message/select-trial',
      'messaging.send.select-trial.get',
      auth.verify,
      isCourtUser,
      sendController.getSelectTrial(app),
    );

    app.post('/messaging/send/:message/select-trial/filter',
      'messaging.send.select-trial.filter.post',
      auth.verify,
      isCourtUser,
      sendController.postFilterTrial(app),
    );

    app.post('/messaging/send/:message/select-trial',
      'messaging.send.select-trial.post',
      auth.verify,
      isCourtUser,
      sendController.postSelectTrial(app),
    );

    app.get('/messaging/send/:message/select-jurors',
      'messaging.send.select-jurors.get',
      auth.verify,
      isCourtUser,
      sendController.getSelectJurors(app),
    );

    app.post('/messaging/send/:message/select-jurors',
      'messaging.send.select-jurors.post',
      auth.verify,
      isCourtUser,
      sendController.postSelectJurors(app),
    );

    //Route to filter to send filter jurors request
    app.post('/messaging/send/:message/select-jurors/filter',
      'messaging.send.select-jurors.filter.post',
      auth.verify,
      isCourtUser,
      sendController.postFilterJurors(app),
    );

    app.get('/messaging/send/:message/confirmation',
      'messaging.send.confirmation.get',
      auth.verify,
      isCourtUser,
      sendController.getMessageConfirmation(app),
    );

    app.post('/messaging/send/:message/confirmation',
      'messaging.send.confirmation.post',
      auth.verify,
      isCourtUser,
      sendController.postMessageConfirmation(app),
    );

    // ajax route to check / uncheck jurors
    app.post('/messaging/send/select-jurors/check',
      'messaging.send.select-jurors.check.post',
      auth.verify,
      isCourtUser,
      sendController.postCheckJuror(app),
    );

    // ajax route to change notification method for juror
    app.post('/messaging/send/select-jurors/method',
      'messaging.send.select-jurors.method.post',
      auth.verify,
      isCourtUser,
      sendController.postChangeMethod(app),
    );

    // export contact details routes
    app.get('/messaging/export-contact-details',
      'messaging.export-contacts.get',
      auth.verify,
      exportController.getExportContacts(app),
    );

    app.post('/messaging/export-contact-details',
      'messaging.export-contacts.post',
      auth.verify,
      exportController.postExportContacts(app),
    );

    app.get('/messaging/export-contact-details/jurors',
      'messaging.export-contacts.jurors.get',
      auth.verify,
      exportController.getJurorsList(app),
    );

    app.post('/messaging/export-contact-details/jurors',
      'messaging.export-contacts.jurors.post',
      auth.verify,
      exportController.postJurorsList(app),
    );

    app.get('/messaging/export-contact-details/details-to-export',
      'messaging.export-contacts.details-to-export.get',
      auth.verify,
      exportController.getSelectDetailsToExport(app),
    );

    app.post('/messaging/export-contact-details/details-to-export',
      'messaging.export-contacts.details-to-export.post',
      auth.verify,
      exportController.postSelectDetailsToExport(app),
    );

    app.post('/messaging/export-contact-details/jurors/check',
      'messaging.export-contacts.jurors.check.post',
      auth.verify,
      exportController.postCheckJuror(app),
    );
  };
})();
