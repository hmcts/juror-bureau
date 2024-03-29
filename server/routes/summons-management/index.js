const auth = require('../../components/auth');
const controller = require('./summons-management.controller');
const processController = require('./process-reply/process-reply.controller');

module.exports = function (app) {

  require('./paper-reply')(app);
  require('./request-info')(app);
  require('./process-reply/disqualify')(app);
  require('./process-reply/reassign-before-process')(app);
  require('./update')(app);

  // express allows us to have optional parameters on a route definition
  // :type? ... in our case we want the type to be just paper or nothing so we use regex to match
  // with this we can identify when a response is paper and post to the correct api endpoint
  app.get('/summons-replies/response/:id/:type(paper|digital)/process',
    'process-reply.get',
    auth.verify,
    processController.getProcessReply(app));
  app.post('/summons-replies/response/:id/:type(paper|digital)/process',
    'process-reply.post',
    auth.verify,
    processController.postProcessReply(app));

  app.get('/summons-replies/response/:id/:type(paper|digital)/deferral-dates',
    'process-deferral-dates.get',
    auth.verify,
    controller.getDeferralDates(app));

  app.post('/summons-replies/response/:id/:type(paper|digital)/deferral-dates-post',
    'process-deferral-dates.post',
    auth.verify,
    controller.postDeferralDates(app));

  app.get('/summons-replies/response/:id/:type(paper|digital)/deferral',
    'process-deferral.get',
    auth.verify,
    controller.getDeferral(app));

  app.post('/summons-replies/response/:id/:type(paper|digital)/deferral',
    'process-deferral.post',
    auth.verify,
    controller.postDeferral(app));

  app.get('/summons-replies/response/:id/:type(paper|digital)/deferral/letter',
    'process-deferral.letter.get',
    auth.verify,
    controller.getDeferralLetter(app));
  app.post('/summons-replies/response/:id/:type(paper|digital)/deferral/letter',
    'process-deferral.letter.post',
    auth.verify,
    controller.postDeferralLetter(app));

  app.get('/summons-replies/response/:id/:type(paper|digital)/excusal',
    'process-excusal.get',
    auth.verify,
    controller.getExcusal(app));
  app.post('/summons-replies/response/:id/:type(paper|digital)/excusal',
    'process-excusal.post',
    auth.verify,
    controller.postExcusal(app));

  app.get('/summons-replies/response/:id/:type(paper|digital)/excusal/:letter(grant|refuse)/letter',
    'process-excusal.letter.get',
    auth.verify,
    controller.getExcusalLetter(app));
  app.post('/summons-replies/response/:id/:type(paper|digital)/excusal/:letter(grant|refuse)/letter',
    'process-excusal.letter.post',
    auth.verify,
    controller.postExcusalLetter(app));

  app.get('/summons-replies/response/:id/:type(paper)',
    'response.paper.details.get',
    auth.verify,
    controller.getPaperResponseDetails(app));

  app.get('/summons-replies/response/:id/check-can-accommodate',
    'response.check-can-accommodate.get',
    auth.verify,
    controller.getCheckCanAccommodate(app));
  app.post('/summons-replies/response/:id/check-can-accomodate',
    'response.check-can-accommodate.post',
    auth.verify,
    controller.postCheckCanAccommodate(app));
};
