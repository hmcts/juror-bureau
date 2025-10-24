(function() {
  'use strict';

  const auth = require('../../components/auth');
  const controller = require('./summons-management.controller');
  const { checkRouteParam } = require('../../lib/mod-utils');
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
    app.get('/summons-replies/response/:id/:type/process',
      'process-reply.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      processController.checkOwner(app),
      processController.getProcessReply(app));
    app.post('/summons-replies/response/:id/:type/process',
      'process-reply.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      processController.checkOwner(app),
      processController.postProcessReply(app));

    app.get('/summons-replies/response/:id/:type/deferral-dates',
      'process-deferral-dates.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      processController.checkOwner(app),
      controller.getDeferralDates(app));

    app.post('/summons-replies/response/:id/:type/deferral-dates-post',
      'process-deferral-dates.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      processController.checkOwner(app),
      controller.postDeferralDates(app));

    app.get('/summons-replies/response/:id/:type/deferral',
      'process-deferral.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      processController.checkOwner(app),
      controller.getDeferral(app));

    app.post('/summons-replies/response/:id/:type/deferral',
      'process-deferral.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      processController.checkOwner(app),
      controller.postDeferral(app));

    app.get('/summons-replies/response/:id/:type/deferral/letter',
      'process-deferral.letter.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      processController.checkOwner(app),
      controller.getDeferralLetter(app));
    app.post('/summons-replies/response/:id/:type/deferral/letter',
      'process-deferral.letter.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      processController.checkOwner(app),
      controller.postDeferralLetter(app));

    app.get('/summons-replies/response/:id/:type/excusal',
      'process-excusal.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      processController.checkOwner(app),
      controller.getExcusal(app));
    app.post('/summons-replies/response/:id/:type/excusal',
      'process-excusal.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      processController.checkOwner(app),
      controller.postExcusal(app));

    app.get('/summons-replies/response/:id/:type/excusal/:letter/letter',
      'process-excusal.letter.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      checkRouteParam('letter', ['grant', 'refuse']),
      processController.checkOwner(app),
      controller.getExcusalLetter(app));
    app.post('/summons-replies/response/:id/:type/excusal/:letter/letter',
      'process-excusal.letter.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      checkRouteParam('letter', ['grant', 'refuse']),
      processController.checkOwner(app),
      controller.postExcusalLetter(app));

    app.get('/summons-replies/response/:id/:type',
      'response.paper.details.get',
      auth.verify,
      checkRouteParam('type', ['paper']),
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
    app.get('/summons-replies/response/:id/:type/notes/edit',
      'response.notes.edit.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      getEditNotes(app, true));
    app.post('/summons-replies/response/:id/:type/notes/edit',
      'response.notes.edit.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      postEditNotes(app, true));

    app.get('/summons-replies/response/:id/:type/contact-logs/add',
      'response.contact-logs.add.get',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      getAddLogs(app, true));
    app.post('/summons-replies/response/:id/:type/contact-logs/add',
      'response.contact-logs.add.post',
      auth.verify,
      checkRouteParam('type', ['paper', 'digital']),
      postAddLogs(app, true));

    app.get('/summons-replies/response/:id/view-juror-record',
      'response.view-juror-record.get',
      auth.verify,
      controller.getViewJurorRecord(app)
    );
  };

})();
