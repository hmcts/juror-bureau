const auth = require('../../../components/auth');
const controller = require('./paper-reply.controller');

module.exports = function (app) {
  app.get('/summons-replies/response/:id/submit-paper/index',
    'paper-reply.index.get',
    auth.verify,
    controller.checkForResponse(app),
    controller.getIndex(app));
  app.post('/summons-replies/response/:id/submit-paper/index',
    'paper-reply.index.post',
    auth.verify,
    controller.postIndex(app));

  app.get('/summons-replies/response/:id/submit-paper/eligibility',
    'paper-reply.eligibility.get',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.getEligibility(app));
  app.post('/summons-replies/response/:id/submit-paper/eligibility',
    'paper-reply.eligibility.post',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.postEligibility(app));

  app.get('/summons-replies/response/:id/submit-paper/ineligible-age',
    'paper-reply.ineligible-age.get',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.getIneligibleAge(app));
  app.post('/summons-replies/response/:id/submit-paper/ineligible-age',
    'paper-reply.ineligible-age.post',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.postIneligibleAge(app));

  app.get('/summons-replies/response/:id/submit-paper/reply-types',
    'paper-reply.reply-types.get',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.getReplyTypes(app));
  app.post('/summons-replies/response/:id/submit-paper/reply-types',
    'paper-reply.reply-types.post',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.postReplyTypes(app));

  app.get('/summons-replies/response/:id/submit-paper/cjs-employment',
    'paper-reply.cjs-employment.get',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.getCjsEmployment(app));
  app.post('/summons-replies/response/:id/submit-paper/cjs-employment',
    'paper-reply.cjs-employment.post',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.postCjsEmployment(app));

  app.get('/summons-replies/response/:id/submit-paper/adjustments',
    'paper-reply.adjustments.get',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.getAdjustments(app));
  app.post('/summons-replies/response/:id/submit-paper/adjustments',
    'paper-reply.adjustments.post',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.postAdjustments(app));

  app.get('/summons-replies/response/:id/submit-paper/signature',
    'paper-reply.signature.get',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.getSignature(app));
  app.post('/summons-replies/response/:id/submit-paper/signature',
    'paper-reply.signature.post',
    auth.verify,
    controller.hasStartedRequest(app),
    controller.postSignature(app));

  app.get('/summons-replies/response/:id/submit-paper/process',
    'paper-reply.straight-through.get',
    auth.verify,
    controller.getStraightThrough(app));
  app.post('/summons-replies/response/:id/submit-paper/process',
    'paper-reply.straight-through.post',
    auth.verify,
    controller.postStraightThrough(app));

  app.get('/summons-replies/response/:id/submit-paper/edit-name',
    'paper-reply.edit-name.get',
    auth.verify,
    controller.getEditName(app));
  app.post('/summons-replies/response/:id/submit-paper/edit-name',
    'paper-reply.edit-name.post',
    auth.verify,
    controller.postEditName(app));

  app.get('/summons-replies/response/:id/submit-paper/edit-address',
    'paper-reply.edit-address.get',
    auth.verify,
    controller.getEditAddress(app));
  app.post('/summons-replies/response/:id/submit-paper/edit-address',
    'paper-reply.edit-address.post',
    auth.verify,
    controller.postEditAddress(app));
};
