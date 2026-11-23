(function() {
  'use strict';

  const auth = require('../../components/auth');
  const controller = require('./summons-management.controller');
  const processController = require('./process-reply/process-reply.controller');
  const {
    grantOrRefuse,
    paper,
    paperOrDigital,
  } = require('../../components/route-parameter-constraints');
  const {
    getEditNotes,
    postEditNotes,
    getAddLogs,
    postAddLogs,
  } = require('../juror-management/juror-record/juror-record.controller');

  module.exports = function(app) {

    require('./paper-reply')(app);
    require('./request-info')(app);
    require('./process-reply/disqualify')(app);
    require('./process-reply/reassign-before-process')(app);
    require('./update')(app);
    require('./bulk-undeliverable')(app);

    app.get('/summons-replies/response/:id/:type/process',
      'process-reply.get',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      processController.getProcessReply(app));
    app.post('/summons-replies/response/:id/:type/process',
      'process-reply.post',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      processController.postProcessReply(app));

    app.get('/summons-replies/response/:id/:type/deferral-dates',
      'process-deferral-dates.get',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      controller.getDeferralDates(app));

    app.post('/summons-replies/response/:id/:type/deferral-dates-post',
      'process-deferral-dates.post',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      controller.postDeferralDates(app));

    app.get('/summons-replies/response/:id/:type/deferral',
      'process-deferral.get',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      controller.getDeferral(app));

    app.post('/summons-replies/response/:id/:type/deferral',
      'process-deferral.post',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      controller.postDeferral(app));

    app.get('/summons-replies/response/:id/:type/deferral/ineligible-age/:deferralDate',
      'process-deferral.ineligible-age.get',
      paperOrDigital,
      auth.verify,
      controller.getDeferralIneligibleAge(app));

    app.get('/summons-replies/response/:id/:type/deferral/letter',
      'process-deferral.letter.get',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      controller.getDeferralLetter(app));
    app.post('/summons-replies/response/:id/:type/deferral/letter',
      'process-deferral.letter.post',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      controller.postDeferralLetter(app));

    app.get('/summons-replies/response/:id/:type/excusal',
      'process-excusal.get',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      controller.getExcusal(app));
    app.get('/summons-replies/response/:id/:type/excusal/address',
      'process-excusal.address.get',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      controller.getExcusalAddress(app));
    app.post('/summons-replies/response/:id/:type/excusal',
      'process-excusal.post',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      controller.postExcusal(app));

    app.get('/summons-replies/response/:id/:type/excusal/:letter/letter',
      'process-excusal.letter.get',
      paperOrDigital,
      grantOrRefuse,
      auth.verify,
      processController.checkOwner(app),
      controller.getExcusalLetter(app));
    app.post('/summons-replies/response/:id/:type/excusal/:letter/letter',
      'process-excusal.letter.post',
      paperOrDigital,
      grantOrRefuse,
      auth.verify,
      processController.checkOwner(app),
      controller.postExcusalLetter(app));

    app.get('/summons-replies/response/:id/:type',
      'response.paper.details.get',
      paper,
      auth.verify,
      controller.getPaperResponseDetails(app));

    app.get('/summons-replies/response/:id/:type/check-can-accommodate',
      'response.check-can-accommodate.get',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      controller.getCheckCanAccommodate(app));
    app.post('/summons-replies/response/:id/:type/check-can-accommodate',
      'response.check-can-accommodate.post',
      paperOrDigital,
      auth.verify,
      processController.checkOwner(app),
      controller.postCheckCanAccommodate(app));

    // notes and logs
    app.get('/summons-replies/response/:id/:type/notes/edit',
      'response.notes.edit.get',
      paperOrDigital,
      auth.verify,
      getEditNotes(app, true));
    app.post('/summons-replies/response/:id/:type/notes/edit',
      'response.notes.edit.post',
      paperOrDigital,
      auth.verify,
      postEditNotes(app, true));

    app.get('/summons-replies/response/:id/:type/contact-logs/add',
      'response.contact-logs.add.get',
      paperOrDigital,
      auth.verify,
      getAddLogs(app, true));
    app.post('/summons-replies/response/:id/:type/contact-logs/add',
      'response.contact-logs.add.post',
      paperOrDigital,
      auth.verify,
      postAddLogs(app, true));

    app.get('/summons-replies/response/:id/view-juror-record',
      'response.view-juror-record.get',
      auth.verify,
      controller.getViewJurorRecord(app)
    );
  };

})();
