(function() {
  'use strict';

  const auth = require('../../components/auth');
  const controller = require('./summons-management.controller');
  const processController = require('./process-reply/process-reply.controller');
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

    // express allows us to have optional parameters on a route definition
    // :type? ... in our case we want the type to be just paper or nothing so we use regex to match
    // with this we can identify when a response is paper and post to the correct api endpoint
    app.get('/summons-replies/response/:id/:type(paper|digital)/process',
      'process-reply.get',
      auth.verify,
      processController.checkOwner(app),
      processController.getProcessReply(app));
    app.post('/summons-replies/response/:id/:type(paper|digital)/process',
      'process-reply.post',
      auth.verify,
      processController.checkOwner(app),
      processController.postProcessReply(app));

    app.get('/summons-replies/response/:id/:type(paper|digital)/deferral-dates',
      'process-deferral-dates.get',
      auth.verify,
      processController.checkOwner(app),
      controller.getDeferralDates(app));

    app.post('/summons-replies/response/:id/:type(paper|digital)/deferral-dates-post',
      'process-deferral-dates.post',
      auth.verify,
      processController.checkOwner(app),
      controller.postDeferralDates(app));

    app.get('/summons-replies/response/:id/:type(paper|digital)/deferral',
      'process-deferral.get',
      auth.verify,
      processController.checkOwner(app),
      controller.getDeferral(app));

    app.post('/summons-replies/response/:id/:type(paper|digital)/deferral',
      'process-deferral.post',
      auth.verify,
      processController.checkOwner(app),
      controller.postDeferral(app));

    app.get('/summons-replies/response/:id/:type(paper|digital)/deferral/letter',
      'process-deferral.letter.get',
      auth.verify,
      processController.checkOwner(app),
      controller.getDeferralLetter(app));
    app.post('/summons-replies/response/:id/:type(paper|digital)/deferral/letter',
      'process-deferral.letter.post',
      auth.verify,
      processController.checkOwner(app),
      controller.postDeferralLetter(app));

    app.get('/summons-replies/response/:id/:type(paper|digital)/excusal',
      'process-excusal.get',
      auth.verify,
      processController.checkOwner(app),
      controller.getExcusal(app));
    app.post('/summons-replies/response/:id/:type(paper|digital)/excusal',
      'process-excusal.post',
      auth.verify,
      processController.checkOwner(app),
      controller.postExcusal(app));

    app.get('/summons-replies/response/:id/:type(paper|digital)/excusal/:letter(grant|refuse)/letter',
      'process-excusal.letter.get',
      auth.verify,
      processController.checkOwner(app),
      controller.getExcusalLetter(app));
    app.post('/summons-replies/response/:id/:type(paper|digital)/excusal/:letter(grant|refuse)/letter',
      'process-excusal.letter.post',
      auth.verify,
      processController.checkOwner(app),
      controller.postExcusalLetter(app));

    app.get('/summons-replies/response/:id/:type(paper)',
      'response.paper.details.get',
      auth.verify,
      controller.getPaperResponseDetails(app));

    app.get('/summons-replies/response/:id/check-can-accommodate',
      'response.check-can-accommodate.get',
      auth.verify,
      processController.checkOwner(app),
      controller.getCheckCanAccommodate(app));
    app.post('/summons-replies/response/:id/check-can-accomodate',
      'response.check-can-accommodate.post',
      auth.verify,
      processController.checkOwner(app),
      controller.postCheckCanAccommodate(app));

    // notes and logs
    app.get('/summons-replies/response/:id/:type(paper|digital)/notes/edit',
      'response.notes.edit.get',
      auth.verify,
      getEditNotes(app, true));
    app.post('/summons-replies/response/:id/:type(paper|digital)/notes/edit',
      'response.notes.edit.post',
      auth.verify,
      postEditNotes(app, true));

    app.get('/summons-replies/response/:id/:type(paper|digital)/contact-logs/add',
      'response.contact-logs.add.get',
      auth.verify,
      getAddLogs(app, true));
    app.post('/summons-replies/response/:id/:type/contact-logs/add',
      'response.contact-logs.add.post',
      auth.verify,
      postAddLogs(app, true));

    app.get('/summons-replies/response/:id/view-juror-record',
      'response.view-juror-record.get',
      auth.verify,
      controller.getViewJurorRecord(app)
    );
  };

})();
